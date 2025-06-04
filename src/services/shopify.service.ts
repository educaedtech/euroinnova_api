/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import {inject, injectable} from '@loopback/core';
import {HttpErrors} from '@loopback/rest';
import fetch from 'node-fetch';
import {AreasRepository, CreditosProductosRepository, EscuelasRepository, FacultadesRepository, IdiomasRepository, InstitucionesEducativasRepository, NivelesEducativosRepository, ProductosRepository} from '../repositories';

// Interfaces para los tipos
interface ShopifyConfig {
  storeUrl: string;
  apiVersion: string;
  accessToken: string;
}

interface LocationData {
  location_id: string;
  quantity: number;
}

export interface Metafield {
  namespace: string;
  key: string;
  value: string;
  type?: string;
}

export interface ProductData {
  title: string;
  description?: string;
  productType?: string;
  vendor?: string;
  price: number;
  sku: string;
  locations_data?: LocationData[];
  metafields?: Metafield[];
  imagenWeb?: string;
  tituloComercial?: string;
  handle?: string;
  seo?: {
    description?: string;
  },
  syncro_data?: {url: string, idShopi: string};
  status?: string;
}

export interface CreditsInterface {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string;
}

interface SyncError {
  creditId: number;
  error: string;
}

export interface SyncResults {
  created: number;
  updated: number;
  skipped: number;
  errors: SyncError[];
}


export interface AreasInterface {
  id_area: number;
  titulo: string;
}

export interface FacultadesInterface {
  id_facultad: number;
  nombre: string;
  logo?: string;
}

export interface EscuelasInterface {
  id_escuela: number;
  nombre: string;
  logo?: string;
}

export interface InstitucionesEducativasInterface {
  id_institucion_educativa: number;
  nombre: string;
  logo?: string;
}

export interface NivelesEducativosInterface {
  id_nivel_educativo: number;
  nombre: string;
  logo?: string;
  shopify_id?: string;
}

export interface IdiomasInterface {
  id_idioma: number;
  idioma: string;
  prefijo_idioma?: string,
  shopify_id?: string;
}
@injectable({tags: {key: 'services.ShopifyService'}})
export class ShopifyService {
  constructor(
    @inject('config.shopify')
    private config: ShopifyConfig,
    @inject('repositories.ProductosRepository')
    private productosRepo: ProductosRepository,
  ) { }

  async createShopifyProduct(product: ProductData): Promise<{
    sku: string;
    success: boolean;
    shopifyId: string;
    variantId: string;
    inventoryItemId: string;
    imagen?: object;
  }> {
    try {


      const channelsQuery = `{
            publications(first: 10) {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }`;

      const channelsResponse = await this.makeShopifyRequest(channelsQuery, {});

      const publications = channelsResponse.data.publications.edges.map((edge: {node: {id: any;};}) => ({
        "publicationId": edge.node.id, // ID del canal
        "publishDate": new Date().toISOString()// Opcional
      }))

      // buscamos el producto en shopify para determinar si ya existe via SKU
      const searchQuery = `query GetProductBySku {
        products(first: 1, query: "sku:${product.sku}") {
          edges {
            node {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    id
                    sku
                  }
                }
              }
            }
          }
        }
      }`;

      const searchResponse = await this.makeShopifyRequest(searchQuery, {});
      // console.log(searchResponse);
      let gid = undefined;
      try {
        gid = searchResponse.data.products.edges[0].node.id;
      } catch (error) {
        gid = undefined
      }

      const productInput = {
        id: gid,
        title: product.tituloComercial ? this.escapeGraphQLString(product.tituloComercial) : this.escapeGraphQLString(product.title),
        handle: product.handle,
        descriptionHtml: `<p>${this.escapeHtml(product.description ?? 'Descripción del producto')}</p>`,
        productType: product.productType ?? 'Curso',
        vendor: product.vendor ?? 'Euroinnova',
        productOptions: [],
        variants: [],
        seo: product.seo,
        // productPublications: publications,
        metafields: product.metafields ? product.metafields.filter(m => m.value !== '').map(meta => {
          let processedValue = meta.value;

          if (meta.type === 'single_line_text_field') {
            // Eliminar saltos de línea y múltiples espacios
            processedValue = meta.value.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
          }

          return {
            namespace: meta.namespace,
            key: meta.key,
            value: processedValue,
            type: meta.type
          };
        }) : []
      };

      const createQuery = `
        mutation productSet($input:ProductSetInput!) {
          productSet(input: $input) {
            product {
              id
              title
              variants(first: 1) {
                edges {
                  node {
                    id
                    sku
                    price
                    inventoryQuantity
                    inventoryItem {
                      id
                    }
                  }
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      // Cuando hagas la petición:
      const variables = {
        input: productInput
      };

      console.log(Math.random())

      const createResponse = await this.makeShopifyRequest(createQuery, variables);

      if (
        createResponse.errors ||
        createResponse.data.productSet.userErrors.length > 0
      ) {
        console.error(JSON.stringify(createResponse));
        const errors =
          createResponse.errors || createResponse.data.productSet.userErrors;
        throw new Error(errors.map((e: {message: unknown;}) => e.message).join(', '));
      }

      const newProduct = createResponse.data.productSet.product;
      const variant = newProduct.variants.edges[0].node;

      //si tiene imagen subirla shopify y asignarsela al producto
      let imgWeb = undefined;
      let nDataImg = undefined;
      console.log('imagenWeb', product.imagenWeb)
      if (product.imagenWeb !== undefined) {
        console.log('paso')
        imgWeb = await this.uploadImageToShopify(product.imagenWeb, newProduct.id, product.syncro_data);

        if (imgWeb?.data?.productCreateMedia?.media[0]?.id) {
          nDataImg = {url: product.imagenWeb, idShopi: imgWeb?.data?.productCreateMedia?.media[0]?.id};
        }

        console.log('work', imgWeb, nDataImg)
        //  4. Actualizar el producto,syncro_data (unidades) con el ID de Shopify
        const idCurso = parseInt(product.metafields?.find(f => f.key === 'id_curso')?.value ?? '-1')
        console.log('idCurso', idCurso);
        let error = {};
        try {

          if (nDataImg?.url !== undefined)
            await this.productosRepo.execute(`UPDATE unidades SET shopify_id=?, syncro_data=? WHERE id=?;`, [newProduct.id, JSON.stringify(nDataImg), idCurso]);
          else
            await this.productosRepo.execute(`UPDATE unidades SET shopify_id=? WHERE id=?;`, [newProduct.id, idCurso]);

        } catch (errorMsg) {
          error = errorMsg;
          console.error('Error', error);
        }

      }

      // 2. Actualizar variante con SKU y precio
      const updateVariantQuery = `mutation UpdateProductVariants {
        productVariantsBulkUpdate(
          productId: "${newProduct.id}",
          variants: [
            {
              id: "${variant.id}",
              price: "${product.price}",
              inventoryItem: { sku: "${product.sku}", tracked: true },
              inventoryPolicy: CONTINUE
            }
          ]
        ) {
          productVariants {
            id
            sku
            price
          }
          userErrors {
            field
            message
          }
        }
      }`;

      await this.makeShopifyRequest(updateVariantQuery, {});

      // making public on channels
      await this.publishProd(gid, publications);


      return {
        sku: product.sku,
        success: true,
        shopifyId: newProduct.id,
        variantId: variant.id,
        inventoryItemId: variant.inventoryItem.id,
        imagen: nDataImg
      };
    } catch (error) {
      console.error('Error in createShopifyProduct:', error);
      throw new HttpErrors.InternalServerError(
        `Failed to create Shopify product: ${error.message}`,
      );
    }
  }

  private async activateInventoryLocations(
    inventoryItemId: string,
    locationsData: LocationData[],
  ): Promise<any> {
    const query = `mutation inventoryBulkToggleActivation($inventoryItemId: ID!, $inventoryItemUpdates: [InventoryBulkToggleActivationInput!]!) {
      inventoryBulkToggleActivation(inventoryItemId: $inventoryItemId, inventoryItemUpdates: $inventoryItemUpdates) {
        inventoryItem {
          id
        }
        userErrors {
          field
          message
          code
        }
      }
    }`;

    const variables = {
      inventoryItemId,
      inventoryItemUpdates: locationsData.map(loc => ({
        activate: true,
        locationId: loc.location_id,
      })),
    };

    return this.makeShopifyRequest(query, variables);
  }

  private async adjustInventoryQuantities(
    inventoryItemId: string,
    locationsData: LocationData[],
  ): Promise<any> {
    const query = `mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
      inventoryAdjustQuantities(input: $input) {
        userErrors {
          field
          message
        }
      }
    }`;

    const variables = {
      input: {
        reason: 'correction',
        name: 'available',
        changes: locationsData.map(loc => ({
          delta: loc.quantity,
          inventoryItemId,
          locationId: loc.location_id,
        })),
      },
    };

    return this.makeShopifyRequest(query, variables);
  }

  private async addProductMetafields(
    productId: string,
    metafields: Metafield[],
  ): Promise<any[]> {
    const operations = metafields.map(meta => {
      return `mutation {
        metafieldsSet(metafields: [
          {
            ownerId: "${productId}",
            namespace: "${meta.namespace}",
            key: "${meta.key}",
            value: "${this.escapeGraphQLString(meta.value)}",
            type: "${meta.type ?? 'string'}"
          }
        ]) {
          userErrors {
            field
            message
          }
        }
      }`;
    });

    return Promise.all(operations.map(op => this.makeShopifyRequest(op)));
  }

  private escapeGraphQLString(str?: string): string {
    return str?.replace(/"/g, '\\"').replace(/\n/g, '\\n') ?? '';
  }

  private escapeHtml(str?: string): string {
    return str?.replace(/</g, '&lt;').replace(/>/g, '&gt;') ?? '';
  }

  public async makeShopifyRequest(
    query: string,
    variables: object = {},
  ): Promise<any> {
    const url = `https://${this.config.storeUrl}/admin/api/${this.config.apiVersion}/graphql.json`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': this.config.accessToken,
      },
      body: JSON.stringify({query, variables}),
    };

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  private async uploadImageToShopify(imageUrl: string, productId: string, syncro_data?: {url: string, idShopi: string}): Promise<any> {

    if (syncro_data?.url === imageUrl) {
      return {msg: "upload image don't needed"}
    }
    const mutation = `mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
        productCreateMedia(productId: $productId, media: $media) {
          media {
            id
            preview {
              image {
                url
              }
            }
          }
          mediaUserErrors {
            code
            field
            message
          }
        }
      }`;

    const variables = {
      productId: `${productId}`,
      media: [{
        mediaContentType: "IMAGE",
        originalSource: `${imageUrl}`
      }]
    };
    const uplData = await this.makeShopifyRequest(mutation, variables);
    return uplData;
  }


  //Obtener TODOS los metaobjects existentes de una sola vez
  allExistingQuery = `
          query GetAllCreditMetaobjects($type: String!) {
            metaobjects(type: $type, first: 250) {
              edges {
                node {
                  id
                  fields {
                    key
                    value
                  }
                }
              }
            }
          }
        `;



  //para la seccion de creditos
  async syncronizeCredits(creditos: CreditsInterface[], repo: CreditosProductosRepository): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
    const results: SyncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    try {
      // 1. Obtener TODOS los metaobjects existentes de una sola vez
      const existingResponse = await this.makeShopifyRequest(this.allExistingQuery, {
        type: "creditos_universitarios"
      });

      // 2. Mapear los existentes por su id_credito para búsqueda rápida
      const existingMetaobjectsMap = new Map<string, {id: string, fields: any[]}>();

      existingResponse?.data?.metaobjects?.edges?.forEach((edge: any) => {
        const idField = edge.node.fields.find((f: any) => f.key === "id_credito");
        if (idField) {
          existingMetaobjectsMap.set(idField.value, {
            id: edge.node.id,
            fields: edge.node.fields
          });
        }
      });

      // console.log('existingResponse', existingMetaobjectsMap)
      // 3. Procesar cada crédito
      for (const credit of creditos) {
        try {
          const idInstDB = credit.id;

          const fields = [
            {key: "id_credito", value: `${credit.id}`},
            {key: "titulo", value: `${credit.nombre}`},
            {key: "codigo", value: `${credit.codigo}`},
            {key: "description", value: `${credit.descripcion}`}
          ];

          const existing = existingMetaobjectsMap.get(credit.id.toString());
          let shopifyIdUpdate = null;
          if (existing) {
            shopifyIdUpdate = existing.id;
            // 4. Verificar si realmente necesita actualización
            const needsUpdate = fields.some(newField => {
              const existingField = existing.fields.find((f: any) => f.key === newField.key);
              return !existingField || existingField.value !== newField.value;
            });

            if (!needsUpdate) {
              results.skipped++;
            }
            else {

              // 5. Actualizar si hay cambios
              const updateMutation = `
                mutation MetaobjectUpdate($id: ID!, $fields: [MetaobjectFieldInput!]!) {
                  metaobjectUpdate(id: $id, metaobject: {fields: $fields}) {
                    metaobject {
                      id
                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

              const updateResponse = await this.makeShopifyRequest(updateMutation, {
                id: existing.id,
                fields: fields
              });

              if (updateResponse?.data?.metaobjectUpdate?.userErrors?.length > 0) {
                throw new Error(JSON.stringify(updateResponse.data.metaobjectUpdate.userErrors));
              }

              results.updated++;
            }
          } else {
            // 6. Crear nuevo si no existe
            const createMutation = `
                mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
                  metaobjectCreate(metaobject: $metaobject) {
                    metaobject {
                      id
                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

            const createResponse = await this.makeShopifyRequest(createMutation, {
              metaobject: {
                type: "creditos_universitarios",
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }

            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;
            results.created++;
          }

          await repo.execute(`UPDATE creditos_productos SET shopify_id=? WHERE id=?;`, [shopifyIdUpdate, idInstDB]);

          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.errors.push({
            creditId: credit.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    } catch (error) {
      results.errors.push({
        creditId: -1,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  //para la seccion de escuelas
  async syncronizeEscuelas(areasOnDB: EscuelasInterface[], repo: EscuelasRepository): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
    const results: SyncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    try {
      // 1. Obtener TODOS los metaobjects existentes de una sola vez
      const existingResponse = await this.makeShopifyRequest(this.allExistingQuery, {
        type: "escuelas"
      });

      // console.log('exist', existingResponse.data.metaobjects.edges[0]);

      // 2. Mapear los existentes por su id_credito para búsqueda rápida
      const existingMetaobjectsMap = new Map<string, {id: string, fields: any[]}>();

      existingResponse?.data?.metaobjects?.edges?.forEach((edge: any) => {
        const idField = edge.node.fields.find((f: any) => f.key === "id_escuela");
        if (idField) {
          existingMetaobjectsMap.set(idField.value, {
            id: edge.node.id,
            fields: edge.node.fields
          });
        }
      });

      // console.log('existingResponse', existingMetaobjectsMap)

      // 3. Procesar cada area
      for (const escuela of areasOnDB) {
        try {

          const idInstDB = escuela.id_escuela;

          const fields = [
            {key: "id_escuela", value: `${escuela.id_escuela}`},
            {key: "nombre", value: `${escuela.nombre}`},
            {key: "logo", value: `${escuela.logo}`}
          ];

          const existing = existingMetaobjectsMap.get(escuela.id_escuela.toString());

          let shopifyIdUpdate = null;
          if (existing) {

            shopifyIdUpdate = existing.id;
            // 4. Verificar si realmente necesita actualización
            const needsUpdate = fields.some(newField => {
              const existingField = existing.fields.find((f: any) => f.key === newField.key);
              return !existingField || existingField.value !== newField.value;
            });

            if (!needsUpdate) {
              results.skipped++;
            }
            else {

              // 5. Actualizar si hay cambios
              const updateMutation = `
                mutation MetaobjectUpdate($id: ID!, $fields: [MetaobjectFieldInput!]!) {
                  metaobjectUpdate(id: $id, metaobject: {fields: $fields}) {
                    metaobject {
                      id
                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

              const updateResponse = await this.makeShopifyRequest(updateMutation, {
                id: existing.id,
                fields: fields
              });

              if (updateResponse?.data?.metaobjectUpdate?.userErrors?.length > 0) {
                throw new Error(JSON.stringify(updateResponse.data.metaobjectUpdate.userErrors));
              }

              results.updated++;
            }

          } else {
            // 6. Crear nueva area si no existe
            const createMutation = `
                mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
                  metaobjectCreate(metaobject: $metaobject) {
                    metaobject {
                      id
                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

            const createResponse = await this.makeShopifyRequest(createMutation, {
              metaobject: {
                type: "escuelas",
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }

            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;

            results.created++;
          }

          await repo.execute(`UPDATE escuelas SET shopify_id=? WHERE id=?;`, [shopifyIdUpdate, idInstDB]);

          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('EROR', error)
          results.errors.push({
            creditId: escuela.id_escuela,
            error: error instanceof Error ? error.message : String(error)
          });
        }




      }




    } catch (error) {
      results.errors.push({
        creditId: -1,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  //para la seccion de creditos
  async syncronizeAreas(areasOnDB: AreasInterface[], repo: AreasRepository): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
    const results: SyncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    try {
      // 1. Obtener TODOS los metaobjects existentes de una sola vez
      const existingResponse = await this.makeShopifyRequest(this.allExistingQuery, {
        type: "area"
      });

      // console.log('exist', existingResponse.data.metaobjects.edges[0]);

      // 2. Mapear los existentes por su id_credito para búsqueda rápida
      const existingMetaobjectsMap = new Map<string, {id: string, fields: any[]}>();

      existingResponse?.data?.metaobjects?.edges?.forEach((edge: any) => {
        const idField = edge.node.fields.find((f: any) => f.key === "id_area");
        if (idField) {
          existingMetaobjectsMap.set(idField.value, {
            id: edge.node.id,
            fields: edge.node.fields
          });
        }
      });



      // 3. Procesar cada area
      for (const area of areasOnDB) {
        try {

          const idInstDB = area.id_area;

          const fields = [
            {key: "id_area", value: `${area.id_area}`},
            {key: "titulo", value: `${area.titulo}`}
          ];

          const existing = existingMetaobjectsMap.get(area.id_area.toString());

          let shopifyIdUpdate = null;
          if (existing) {

            shopifyIdUpdate = existing.id;
            // 4. Verificar si realmente necesita actualización
            const needsUpdate = fields.some(newField => {
              const existingField = existing.fields.find((f: any) => f.key === newField.key);
              return !existingField || existingField.value !== newField.value;
            });

            if (!needsUpdate) {
              results.skipped++;
            }
            else {

              // 5. Actualizar si hay cambios
              const updateMutation = `
                mutation MetaobjectUpdate($id: ID!, $fields: [MetaobjectFieldInput!]!) {
                  metaobjectUpdate(id: $id, metaobject: {fields: $fields}) {
                    metaobject {
                      id
                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

              const updateResponse = await this.makeShopifyRequest(updateMutation, {
                id: existing.id,
                fields: fields
              });

              if (updateResponse?.data?.metaobjectUpdate?.userErrors?.length > 0) {
                throw new Error(JSON.stringify(updateResponse.data.metaobjectUpdate.userErrors));
              }

              results.updated++;
            }

          } else {
            // console.log('No Entro');
            // 6. Crear nueva area si no existe
            const createMutation = `
                mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
                  metaobjectCreate(metaobject: $metaobject) {
                    metaobject {
                      id
                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

            const createResponse = await this.makeShopifyRequest(createMutation, {
              metaobject: {
                type: "area",
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }

            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;

            results.created++;
          }

          await repo.execute(`UPDATE areas SET shopify_id=? WHERE id=?;`, [shopifyIdUpdate, idInstDB]);

          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('EROR', error)
          results.errors.push({
            creditId: area.id_area,
            error: error instanceof Error ? error.message : String(error)
          });
        }




      }




    } catch (error) {
      results.errors.push({
        creditId: -1,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }


  //para la seccion de facultades
  async syncronizeFacultades(facultadesData: FacultadesInterface[], repo: FacultadesRepository): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
    const results: SyncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    try {
      // 1. Obtener TODOS los metaobjects existentes de una sola vez
      const existingResponse = await this.makeShopifyRequest(this.allExistingQuery, {
        type: "facultad"
      });

      // 2. Mapear los existentes por su id_facultad para búsqueda rápida
      const existingMetaobjectsMap = new Map<string, {id: string, fields: any[]}>();

      existingResponse?.data?.metaobjects?.edges?.forEach((edge: any) => {
        const idField = edge.node.fields.find((f: any) => f.key === "id_facultad");
        if (idField) {
          existingMetaobjectsMap.set(idField.value, {
            id: edge.node.id,
            fields: edge.node.fields
          });
        }
      });

      // console.log('existingResponse', JSON.stringify(existingMetaobjectsMap))

      // 3. Procesar cada facultad
      for (const fac of facultadesData) {

        const idInstDB = fac.id_facultad;

        try {
          const fields = [
            {key: "id_facultad", value: `${fac.id_facultad}`},
            {key: "nombre", value: `${fac.nombre}`},
            {key: "facultad_logo", value: fac.logo ?? ""}
          ];


          const existing = existingMetaobjectsMap.get(fac.id_facultad.toString());

          let shopifyIdUpdate = null; //est para actualizar el valor del id shopify en la tabla de instituciones ediucativas
          if (existing) {
            shopifyIdUpdate = existing.id;
            // 4. Verificar si realmente necesita actualización
            const needsUpdate = fields.some(newField => {
              const existingField = existing.fields.find((f: any) => f.key === newField.key);
              return !existingField || existingField.value !== newField.value;
            });

            if (!needsUpdate) {
              results.skipped++;
              continue;
            }

            // 5. Actualizar si hay cambios
            const updateMutation = `
                   mutation MetaobjectUpdate($id: ID!, $fields: [MetaobjectFieldInput!]!) {
                     metaobjectUpdate(id: $id, metaobject: {fields: $fields}) {
                       metaobject {
                         id
                       }
                       userErrors {
                         field
                         message
                         code
                       }
                     }
                   }
                 `;

            const updateResponse = await this.makeShopifyRequest(updateMutation, {
              id: existing.id,
              fields: fields
            });

            if (updateResponse?.data?.metaobjectUpdate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(updateResponse.data.metaobjectUpdate.userErrors));
            }

            results.updated++;
          } else {
            // 6. Crear nuevo si no existe
            const createMutation = `
                   mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
                     metaobjectCreate(metaobject: $metaobject) {
                       metaobject {
                         id
                       }
                       userErrors {
                         field
                         message
                         code
                       }
                     }
                   }
                 `;

            const createResponse = await this.makeShopifyRequest(createMutation, {
              metaobject: {
                type: "facultad",
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }

            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;

            results.created++;
          }
          // console.log(`UPDATE facultades SET shopify_id=? WHERE id=?;`, shopifyIdUpdate, idInstDB)
          await repo.execute(`UPDATE facultades SET shopify_id=? WHERE id=?;`, [shopifyIdUpdate, idInstDB]);


          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.errors.push({
            creditId: fac.id_facultad,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }



    } catch (error) {
      results.errors.push({
        creditId: -1,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  //para la seccion de Instituciones educativas
  async syncronizeInstitucionesEducativas(institutionsData: InstitucionesEducativasInterface[], repo: InstitucionesEducativasRepository): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
    const results: SyncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    try {
      // 1. Obtener TODOS los metaobjects existentes de una sola vez
      const existingResponse = await this.makeShopifyRequest(this.allExistingQuery, {
        type: "instituciones_educativas" //rectificar cuando tenga conexion
      });

      // 2. Mapear los existentes por su id_institucion_educativa para búsqueda rápida
      const existingMetaobjectsMap = new Map<string, {id: string, fields: any[]}>();

      existingResponse?.data?.metaobjects?.edges?.forEach((edge: any) => {
        const idField = edge.node.fields.find((f: any) => f.key === "id_institucion_educativa");
        if (idField) {
          existingMetaobjectsMap.set(idField.value, {
            id: edge.node.id,
            fields: edge.node.fields
          });
        }
      });

      // console.log('existingResponse', JSON.stringify(existingMetaobjectsMap))

      // 3. Procesar cada institucion
      for (const fac of institutionsData) {
        try {

          const idInstDB = fac.id_institucion_educativa;

          const fields = [
            {key: "id_institucion_educativa", value: `${fac.id_institucion_educativa}`},
            {key: "nombre", value: `${fac.nombre}`},
            {key: "logo_url", value: fac.logo ?? ""}
          ];


          const existing = existingMetaobjectsMap.get(fac.id_institucion_educativa.toString());
          // console.log('Existing', existing)
          let shopifyIdUpdate = null; //est para actualizar el valor del id shopify en la tabla de instituciones ediucativas
          if (existing) {
            shopifyIdUpdate = existing.id;
            // 4. Verificar si realmente necesita actualización
            const needsUpdate = fields.some(newField => {
              const existingField = existing.fields.find((f: any) => f.key === newField.key);
              return !existingField || existingField.value !== newField.value;
            });

            if (!needsUpdate) {
              results.skipped++;
              continue;
            }

            // 5. Actualizar si hay cambios
            const updateMutation = `
                   mutation MetaobjectUpdate($id: ID!, $fields: [MetaobjectFieldInput!]!) {
                     metaobjectUpdate(id: $id, metaobject: {fields: $fields}) {
                       metaobject {
                         id
                       }
                       userErrors {
                         field
                         message
                         code
                       }
                     }
                   }
                 `;

            const updateResponse = await this.makeShopifyRequest(updateMutation, {
              id: existing.id,
              fields: fields
            });

            if (updateResponse?.data?.metaobjectUpdate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(updateResponse.data.metaobjectUpdate.userErrors));
            }

            results.updated++;
          } else {
            // 6. Crear nuevo si no existe
            const createMutation = `
                   mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
                     metaobjectCreate(metaobject: $metaobject) {
                       metaobject {
                         id
                       }
                       userErrors {
                         field
                         message
                         code
                       }
                     }
                   }
                 `;

            const createResponse = await this.makeShopifyRequest(createMutation, {
              metaobject: {
                type: "instituciones_educativas",
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }
            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;


            results.created++;
          }

          await repo.execute(`UPDATE instituciones_educativas SET shopify_id=? WHERE id=?;`, [shopifyIdUpdate, idInstDB]);

          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.errors.push({
            creditId: fac.id_institucion_educativa,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }



    } catch (error) {
      results.errors.push({
        creditId: -1,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }




  //para la seccion de NIveles Educativos
  async syncronizeNivelesEducativos(nivelesEduData: NivelesEducativosInterface[], repo: NivelesEducativosRepository): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
    const results: SyncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    try {
      // 1. Obtener TODOS los metaobjects existentes de una sola vez
      const existingResponse = await this.makeShopifyRequest(this.allExistingQuery, {
        type: "nivel_educativo" //rectificar cuando tenga conexion
      });

      // 2. Mapear los existentes por su id_institucion_educativa para búsqueda rápida
      const existingMetaobjectsMap = new Map<string, {id: string, fields: any[]}>();

      existingResponse?.data?.metaobjects?.edges?.forEach((edge: any) => {
        const idField = edge.node.fields.find((f: any) => f.key === "id_nivel_educativo");
        if (idField) {
          existingMetaobjectsMap.set(idField.value, {
            id: edge.node.id,
            fields: edge.node.fields
          });
        }
      });

      // console.log('existingResponse', JSON.stringify(existingMetaobjectsMap))

      // 3. Procesar cada institucion
      for (const fac of nivelesEduData) {
        try {

          const idInstDB = fac.id_nivel_educativo;

          const fields = [
            {key: "id_nivel_educativo", value: `${fac.id_nivel_educativo}`},
            {key: "titulo", value: `${fac.nombre}`},
            {key: "logo", value: fac.logo ?? ""}
          ];


          const existing = existingMetaobjectsMap.get(fac.id_nivel_educativo.toString());
          // console.log('Existing', existing)
          let shopifyIdUpdate = null; //est para actualizar el valor del id shopify en la tabla de instituciones ediucativas
          if (existing) {
            shopifyIdUpdate = existing.id;
            // 4. Verificar si realmente necesita actualización
            const needsUpdate = fields.some(newField => {
              const existingField = existing.fields.find((f: any) => f.key === newField.key);
              return !existingField || existingField.value !== newField.value;
            });

            if (!needsUpdate) {
              results.skipped++;
              continue;
            }

            // 5. Actualizar si hay cambios
            const updateMutation = `
                   mutation MetaobjectUpdate($id: ID!, $fields: [MetaobjectFieldInput!]!) {
                     metaobjectUpdate(id: $id, metaobject: {fields: $fields}) {
                       metaobject {
                         id
                       }
                       userErrors {
                         field
                         message
                         code
                       }
                     }
                   }
                 `;

            const updateResponse = await this.makeShopifyRequest(updateMutation, {
              id: existing.id,
              fields: fields
            });

            if (updateResponse?.data?.metaobjectUpdate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(updateResponse.data.metaobjectUpdate.userErrors));
            }

            results.updated++;
          } else {
            // 6. Crear nuevo si no existe
            const createMutation = `
                   mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
                     metaobjectCreate(metaobject: $metaobject) {
                       metaobject {
                         id
                       }
                       userErrors {
                         field
                         message
                         code
                       }
                     }
                   }
                 `;

            const createResponse = await this.makeShopifyRequest(createMutation, {
              metaobject: {
                type: "nivel_educativo",
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }
            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;


            results.created++;
          }

          await repo.execute(`UPDATE niveles_educativos SET shopify_id=? WHERE id=?;`, [shopifyIdUpdate, idInstDB]);

          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.errors.push({
            creditId: fac.id_nivel_educativo,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }



    } catch (error) {
      results.errors.push({
        creditId: -1,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }


  //para la seccion de Idiomas
  async syncronizeIdiomas(idioomasEduData: IdiomasInterface[], repo: IdiomasRepository): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
    const results: SyncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    try {
      // 1. Obtener TODOS los metaobjects existentes de una sola vez
      const existingResponse = await this.makeShopifyRequest(this.allExistingQuery, {
        type: "idiomas_curso"
      });

      // 2. Mapear los existentes por su id_institucion_educativa para búsqueda rápida
      const existingMetaobjectsMap = new Map<string, {id: string, fields: any[]}>();

      existingResponse?.data?.metaobjects?.edges?.forEach((edge: any) => {
        const idField = edge.node.fields.find((f: any) => f.key === "id_idioma");
        if (idField) {
          existingMetaobjectsMap.set(idField.value, {
            id: edge.node.id,
            fields: edge.node.fields
          });
        }
      });

      // console.log('existingResponse', JSON.stringify(existingMetaobjectsMap))

      // 3. Procesar cada institucion
      for (const fac of idioomasEduData) {
        try {

          const idInstDB = fac.id_idioma;

          const fields = [
            {key: "id_idioma", value: `${fac.id_idioma}`},
            {key: "idioma", value: `${fac.idioma}`},
            {key: "prefijo_idioma", value: fac.prefijo_idioma ?? ""}
          ];


          const existing = existingMetaobjectsMap.get(fac.id_idioma.toString());
          // console.log('Existing', existing)
          let shopifyIdUpdate = null; //est para actualizar el valor del id shopify en la tabla de instituciones ediucativas
          if (existing) {
            shopifyIdUpdate = existing.id;
            // 4. Verificar si realmente necesita actualización
            const needsUpdate = fields.some(newField => {
              const existingField = existing.fields.find((f: any) => f.key === newField.key);
              return !existingField || existingField.value !== newField.value;
            });

            if (!needsUpdate) {
              results.skipped++;
              continue;
            }

            // 5. Actualizar si hay cambios
            const updateMutation = `
                   mutation MetaobjectUpdate($id: ID!, $fields: [MetaobjectFieldInput!]!) {
                     metaobjectUpdate(id: $id, metaobject: {fields: $fields}) {
                       metaobject {
                         id
                       }
                       userErrors {
                         field
                         message
                         code
                       }
                     }
                   }
                 `;

            const updateResponse = await this.makeShopifyRequest(updateMutation, {
              id: existing.id,
              fields: fields
            });

            if (updateResponse?.data?.metaobjectUpdate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(updateResponse.data.metaobjectUpdate.userErrors));
            }

            results.updated++;
          } else {
            // 6. Crear nuevo si no existe
            const createMutation = `
                   mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
                     metaobjectCreate(metaobject: $metaobject) {
                       metaobject {
                         id
                       }
                       userErrors {
                         field
                         message
                         code
                       }
                     }
                   }
                 `;

            const createResponse = await this.makeShopifyRequest(createMutation, {
              metaobject: {
                type: "idiomas_del_curso",
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }
            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;


            results.created++;
          }

          await repo.execute(`UPDATE idiomas SET shopify_id=? WHERE id=?;`, [shopifyIdUpdate, idInstDB]);

          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.errors.push({
            creditId: fac.id_idioma,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }



    } catch (error) {
      results.errors.push({
        creditId: -1,
        error: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }


  // publicar producto
  async publishProd(idProd: any, channels: any): Promise<{success: boolean; errors: any[]}> {
    const results: any = {
      success: false,
      errors: []
    };
    try {

      const query = `mutation productPublish($input: ProductPublishInput!) {
                productPublish(input: $input) {
                  product {
                    id
                  }
                  productPublications {
                    channel{
                        name
                    }
                    isPublished
                  }
                  shop {
                    name
                  }
                  userErrors {
                    field
                    message
                  }
                }
              }`;
      const variables = {
        "input": {
          "id": idProd,
          "productPublications": channels
        }
      };


      const createResponse = await this.makeShopifyRequest(query, variables);

      if (
        createResponse?.errors ||
        createResponse?.data.productPublish.userErrors.length > 0
      ) {
        const errors =
          createResponse?.errors || createResponse?.data.productPublish.userErrors;

        results.errors = errors;
        throw new Error(errors.map((e: {message: unknown;}) => e.message).join(', '));
      } else {
        results.success = true;
      }

      return results;

    } catch (error) {
      results.errors.push({
        creditId: idProd,
        error: error instanceof Error ? error.message : String(error)
      });

      return results;
    }


  }

}
