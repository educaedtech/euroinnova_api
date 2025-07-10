/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import {BindingScope, inject, injectable} from '@loopback/core';
import fetch from 'node-fetch';
import {AreasRepository, CreditosProductosRepository, EscuelasRepository, FacultadesRepository, IdiomasRepository, InstitucionesEducativasRepository, NivelesEducativosRepository, ProductosRepository} from '../repositories';
import {LoggerService} from './logger.service';
import {ShopifyCredentials} from './merchant-credentials.service';

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
  merchantId?: number;
  shopifyId?: string;
  unidadId: number;
}
export interface GenInterface {
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

@injectable({tags: {key: 'services.ShopifyService'}, scope: BindingScope.SINGLETON})
export class ShopifyService {

  private credentials: ShopifyCredentials;
  public config: ShopifyConfig = {storeUrl: '', accessToken: '', apiVersion: ''};

  public publications = [];
  async setCredentials(credentials: ShopifyCredentials) {
    this.credentials = credentials;
    this.config.storeUrl = this.credentials.url;
    this.config.accessToken = this.credentials.token;
    this.config.apiVersion = this.credentials.apiVersion;

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

    this.publications = channelsResponse.data.publications.edges.map((edge: {
      node: {
        id: any;
      };
    }) => ({
      "publicationId": edge.node.id, // ID del canal
      "publishDate": new Date().toISOString()
    }))

  }

  constructor(
    @inject('repositories.ProductosRepository')
    private productosRepo: ProductosRepository,
    @inject('services.LoggerService')
    private logger: LoggerService,
  ) {

    console.log('📝 LogStream available:', !!this.logger.logStream);
    console.log('🔢 ShopifyService using LoggerService instance #:',
      (this.logger as any).instanceId);

  }

  //funciona para verificar si el producto requiere actualizacion o no
  private async productNeedsUpdate(existingProduct: any, newData: any): Promise<boolean> {

    if (existingProduct.title !== newData.title) return true;
    if (existingProduct.descriptionHtml !== (newData.descriptionHtml ?? 'Descripción del producto')) return true;
    if (existingProduct.productType !== (newData.productType ?? 'Curso')) return true;
    if (existingProduct.vendor !== (newData.vendor ?? 'Euroinnova')) return true;
    // Comparar variante
    const variant = existingProduct.variants.edges[0].node;
    if (parseFloat(variant.price) !== parseFloat(newData.price)) return true;
    if (variant.sku !== newData.sku) return true;

    // Comparar metafields
    const existingMetafields = existingProduct.metafields.edges.map((e: any) => e.node);
    const newMetafields = newData.metafields ?? [];

    if (existingMetafields.length !== newMetafields.length) return true;

    for (const newMeta of newMetafields) {
      const existingMeta = existingMetafields.find((m: any) =>
        m.namespace === newMeta.namespace && m.key === newMeta.key);

      if (!existingMeta || existingMeta.value !== newMeta.value || existingMeta.type !== (newMeta.type ?? 'string')) {
        return true;
      }
    }

    return false;
  }


  async createShopifyProduct(product: ProductData): Promise<{
    sku: string;
    success: boolean;
    shopifyId: string;
    variantId: string;
    inventoryItemId: string;
    imagen?: object;
  }> {
    try {
      const {merchantId, shopifyId, unidadId} = product;

      let gid = shopifyId ?? undefined;
      let prdl = null;

      this.logger.log(`➡️  Buscando -> Shopify ID-Curso:${unidadId}, sku:${product.sku}`);
      let existingMetafields = [];
      try {
        // buscamos el producto en shopify para determinar si ya existe via SKU
        const searchQueryBySKU = `query GetProductBySku {
            products(first: 1, query: "sku:${product.sku}") {
              edges {
                node {
                  id
                  seo {
                    description
                  }
                  media(first:1){
                    nodes{
                        id
                        preview{
                            image{
                                url
                                altText
                            }
                        }
                    }
                  }
                  title
                  descriptionHtml
                  productType
                  vendor
                  tags
                  variants(first: 1) {
                    edges {
                      node {
                        price
                        sku
                      }
                    }
                  }
                  metafields(first: 250) {
                    edges {
                      node {
                        namespace
                        key
                        value
                        type
                      }
                    }
                  }
                }
              }
            }
          }`;
        const searchResponse = await this.makeShopifyRequest(searchQueryBySKU, {});
        // console.log('searchResponse', searchResponse.data.products.edges)
        prdl = searchResponse.data.products.edges[0]?.node ?? null;
        // console.log(prdl);
        gid = prdl?.id ?? undefined;

        //tomando todos los datos de los metafields actuales en caso de existir
        existingMetafields = prdl?.metafields.edges.map((edge: any) => edge.node) || [];

      } catch (error) {
        this.logger.error(`🔥ERROR searching prod: ${product.sku} : ` + error?.message);
        gid = undefined;
      }

      // Convertir a Map para facilitar el merge
      const metafieldsMap = new Map();
      existingMetafields.forEach((mf: any) => {
        metafieldsMap.set(`${mf.namespace}:${mf.key}`, mf);
      });

      // Reemplazar o agregar los nuevos que tienes
      product?.metafields?.forEach((mf: any) => {
        metafieldsMap.set(`${mf.namespace}:${mf.key}`, mf);
      });

      // Convertir el resultado final a array
      const mergedMetafields = Array.from(metafieldsMap.values());

      // Ajustando metafields
      product.metafields = mergedMetafields;

      const productInput = {
        id: gid,
        status: 'ACTIVE',
        title: product.tituloComercial ? this.escapeGraphQLString(product.tituloComercial) : this.escapeGraphQLString(product.title),
        handle: shopifyId ? undefined : product.handle,
        descriptionHtml: `<p>${this.escapeHtml(product.description ?? 'Descripción del producto')}</p>`,
        productType: product.productType ?? 'Curso',
        vendor: product.vendor ?? 'Euroinnova',
        productOptions: [],
        variants: [],
        seo: product.seo ?? undefined,
        tags: product.metafields.find(mt => mt.key === "collection_shopify")?.value ?? '',
        metafields: product.metafields ? product?.metafields?.filter(m => m.value !== '').map(meta => {
          let processedValue = meta.value;

          // Eliminar saltos de línea y múltiples espacios
          if (meta.type === 'single_line_text_field') {
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


      let needsUpd = true;
      if (gid !== undefined) {
        needsUpd = await this.productNeedsUpdate(prdl, {...productInput, price: product.price, sku: product.sku});
        console.log('NEEDS UPD', gid, needsUpd)
      }


      if (needsUpd || 1 == 1) {

        this.logger.log(`👉 Operation in curse for ${unidadId} (${gid ? '✏️  Updating' : '📝 Cretaing'})`);

        // create|update product
        const createQuery = `
        mutation productSet($input:ProductSetInput!) {
          productSet(input: $input) {
            product {
              id
              title
              seo {
               description
              }
              media(first: 100) {
                nodes {
                  id
                  alt
                  mediaContentType
                  status
                }
              }
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
        const variables = {
          input: productInput
        };

        let createResponse = await this.makeShopifyRequest(createQuery, variables);

        //validando errores en el proceso de creacion|actualzacion de producto
        if (
          createResponse.errors ||
          createResponse.data.productSet.userErrors.length > 0
        ) {
          console.error('', JSON.stringify(createResponse));
          const errors =
            createResponse.errors || createResponse.data.productSet.userErrors;
          const e1 = `⛔ Failed to create Shopify product ${unidadId}`;
          const e2 = `🔥 product ${unidadId}: ${errors.map((e: {message: unknown;}) => e.message).join(', ')}`;

          // manejar el error de handle repetido
          const handleErrorDetected = errors.filter((e: {field: string | string[];}) => e.field.includes("handle")).length > 0;
          if (handleErrorDetected) {
            this.logger.log(`👉 Handle repeated for ${unidadId} =>⚙️ Proccesing ...`);
            const newProd = await this.makeVersioningOfProduct(productInput, createQuery);
            createResponse = newProd.response;
            console.log('NewProdHandle', newProd);


            if (newProd.success === false) {
              this.logger.error(e1)
              this.logger.error(e2)
              return {
                sku: product.sku,
                success: false,
                shopifyId: e1,
                variantId: e2,
                inventoryItemId: '',
                imagen: undefined,
              };
            }

          }
          //-----------------------------------------



        }

        if (!createResponse.data?.productSet?.product) {
          const errorMsg = 'Invalid response structure from Shopify';
          this.logger.error(errorMsg);
          return {
            sku: product.sku,
            success: false,
            shopifyId: errorMsg,
            variantId: JSON.stringify(createResponse),
            inventoryItemId: '',
            imagen: undefined,
          };
        }

        // obteniendo el producto creado | actualizado
        const newProduct = createResponse.data.productSet.product;

        const medias = newProduct?.media?.nodes ?? [];

        //imagenes que hay que remover de shopify para dejar exclusivamente la actual del producto
        const mediaImg2remove = medias.filter((m: {id: string | undefined;}) => m.id !== product.syncro_data?.idShopi) ?? [];
        if (mediaImg2remove.length > 0)
          await this.removeFiles(mediaImg2remove);


        const inMedia = medias.some((m: {id: string | undefined;}) => m.id === product.syncro_data?.idShopi);
        // console.log('INMedia', inMedia)
        const variant = newProduct.variants.edges[0].node;

        //si tiene imagen subirla shopify y asignarsela al producto
        let imgWeb = undefined;
        let nDataImg = undefined;

        let synD = null;
        // console.log('ImgWeb', product.imagenWeb);
        // console.log('SyncroData', product?.syncro_data);
        if (!inMedia) {

          this.logger.log(`↗️  Subiendo imagen de producto ${unidadId}`);
          imgWeb = await this.uploadImageToShopify(product?.imagenWeb ?? '', newProduct.id, product.syncro_data);

          if (imgWeb?.data?.productCreateMedia?.media[0]?.id) {
            nDataImg = {url: product.imagenWeb, idShopi: imgWeb?.data?.productCreateMedia?.media[0]?.id};
          }
          synD = nDataImg?.url !== undefined ? JSON.stringify(nDataImg) : null;
        }

        //  Actualizar el producto, syncro_data (unidades) con el ID de Shopify
        try {
          if (synD) {
            await this.productosRepo.execute(`INSERT INTO references_data_unidad
                                                (unidad_id,merchant_id,shopify_id, syncro_data)
                                              VALUES
                                                (?,?,?,?)
                                              ON DUPLICATE KEY UPDATE
                                                shopify_id=VALUES(shopify_id),
                                                syncro_data = VALUES(syncro_data);`, [unidadId, merchantId, newProduct.id, synD]);
          }
          else {
            await this.productosRepo.execute(`INSERT INTO references_data_unidad
                                                (unidad_id,merchant_id,shopify_id)
                                              VALUES
                                                (?,?,?)
                                              ON DUPLICATE KEY UPDATE
                                                shopify_id=VALUES(shopify_id);`, [unidadId, merchantId, newProduct.id]);
          }

        } catch (errorMsg) {
          this.logger.error(`🔥 ERROR on table: reference_data_unidad (${unidadId}): ` + errorMsg?.message);
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
        try {
          const pubChannels = await this.publishProd(newProduct.id, this.publications);
          if (!pubChannels.success)
            this.logger.log(`⛔ Producto ID: ${unidadId}: Error on publisProd: ` + pubChannels?.errors?.map(e => e?.message).join('/'));
        } catch (error) {
          this.logger.log(`⛔ Producto ID: ${unidadId}: Error on publisProd: ` + error?.message);
        }

        this.logger.log(`✅ Producto ID: ${unidadId}, sku:${product.sku} (SUCCESFULY PROCCES)`);

        return {
          sku: product.sku,
          success: true,
          shopifyId: newProduct.id,
          variantId: variant.id,
          inventoryItemId: variant.inventoryItem.id,
          imagen: nDataImg
        };

      }
      else {
        this.logger.error(`✅ Product SKU: ${product.sku}: : does not require an UPDATE`);
        return {
          sku: product.sku,
          success: false,
          shopifyId: `ℹ️ Product SKU: ${product.sku}: does not require an UPDATE`,
          variantId: ``,
          inventoryItemId: '',
          imagen: undefined,
        };
      }
    } catch (error) {
      this.logger.error(`🔥 Error on create/update Product SKU: ${product.sku}: ` + error?.message);
      return {
        sku: product.sku,
        success: false,
        shopifyId: '🔥 Failed to create/update Shopify product',
        variantId: `🪲 ${error.message}`,
        inventoryItemId: '',
        imagen: undefined,
      };
    }
  }

  private async removeFiles(files: any) {
    const ids = files.map((m: {id: any;}) => m.id)
    this.logger.log('🧨 Removing files: ' + JSON.stringify(ids))
    const query = `mutation DeleteFiles {
        fileDelete(fileIds: `+ JSON.stringify(ids) + `) {
          deletedFileIds
          userErrors {
            field
            message
            code
          }
        }
      }`;

    const dR = await this.makeShopifyRequest(query, {});
    // console.log('Files2Remove', files);
    // console.log(JSON.stringify(dR));
    return dR;
  }


  private async makeVersioningOfProduct(data: any, createQuery = '') {
    const {handle} = data;
    //buscando productos con el mismo handle
    const query = `{
              products(first: 250, query: "handle:`+ handle + `"){
                nodes{
                    id
                    title
                    handle
                    status
                  }
                }
              } `;

    try {
      const prodSameHandle = await this.makeShopifyRequest(query, {});
      const mut = `mutation UpdateProductHandleStatus($product: ProductUpdateInput!) {
                  productUpdate(product: $product) {
                    product {
                      id
                      title
                      handle
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }`;

      for (const prd of prodSameHandle.data.products.nodes) {
        const nQ = {
          product: {
            id: prd.id,
            status: "DRAFT",
            handle: handle + `-` + Date.now().toString()
          }
        };
        const updH = await this.makeShopifyRequest(mut, nQ);
        console.log(updH);
      }
    } catch (error) {
      console.log('ERR', error);
      return {success: false};
    }


    try {
      const nProd = await this.makeShopifyRequest(createQuery, {input: data});
      return {success: true, response: nProd};
    } catch (error) {
      return {success: false};
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
      this.logger.log(`Image don't need upload`);
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
  async syncronizeCredits(creditos: GenInterface[], repo: CreditosProductosRepository, merchantId: number = 1): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
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

            if (!needsUpdate && 1 !== 1) {
              results.skipped++;
            }
            else {
              // 5. Actualizar si hay cambios
              const updateMutation = `
                mutation MetaobjectUpdate($id: ID!, $capabilities:MetaobjectCapabilityDataInput!,$fields: [MetaobjectFieldInput!]!) {
                  metaobjectUpdate(id: $id, metaobject: {fields: $fields,capabilities:$capabilities}) {
                    metaobject {
                      capabilities {
                            publishable {
                            status
                            }
                            onlineStore {
                            templateSuffix
                            }
                        }
                        fields {
                            key
                            value
                        }

                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

              const vars2Upd = {
                id: existing.id,
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              };
              const updateResponse = await this.makeShopifyRequest(updateMutation, vars2Upd);

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
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }

            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;
            results.created++;
          }

          // ----- BLOCK insertar referencia en BD -------
          try {
            await repo.execute(`INSERT INTO references_data (
                                  referenceable_id,
                                  referenceable_type,
                                  merchant_id,
                                  shopify_id
                              ) VALUES (?,'creditos_productos',?,?)
                               ON DUPLICATE KEY UPDATE
                                shopify_id=VALUES(shopify_id)`, [idInstDB, merchantId, shopifyIdUpdate]);
          } catch (error) {
            console.log('🔥 ERROR: ', error.message)
          }
          //------ END BLOCK ------------------------------

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
  async syncronizeEscuelas(areasOnDB: EscuelasInterface[], repo: EscuelasRepository, merchantId: number = 1): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
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
            let needsUpdate = fields.some(newField => {
              const existingField = existing.fields.find((f: any) => f.key === newField.key);
              return !existingField || existingField.value !== newField.value;
            });
            needsUpdate = true;

            if (!needsUpdate && 1 !== 1) {
              results.skipped++;
            }
            else {
              // 5. Actualizar si hay cambios
              const updateMutation = `
                mutation MetaobjectUpdate($id: ID!, $capabilities:MetaobjectCapabilityDataInput!,$fields: [MetaobjectFieldInput!]!) {
                  metaobjectUpdate(id: $id, metaobject: {fields: $fields,capabilities:$capabilities}) {
                    metaobject {
                      capabilities {
                            publishable {
                            status
                            }
                            onlineStore {
                            templateSuffix
                            }
                        }
                        fields {
                            key
                            value
                        }

                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

              const vars2Upd = {
                id: existing.id,
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              };
              const updateResponse = await this.makeShopifyRequest(updateMutation, vars2Upd);

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
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }

            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;

            results.created++;
          }

          // ----- BLOCK insertar referencia en BD -------
          try {
            await repo.execute(`INSERT INTO references_data (
                                  referenceable_id,
                                  referenceable_type,
                                  merchant_id,
                                  shopify_id
                              ) VALUES (?,'escuelas',?,?)
                               ON DUPLICATE KEY UPDATE
                               shopify_id=VALUES(shopify_id)`, [idInstDB, merchantId, shopifyIdUpdate]);
          } catch (error) {
            console.log('🔥 ERROR: ', error.message)
          }
          //------ END BLOCK ------------------------------

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
  async syncronizeAreas(areasOnDB: AreasInterface[], repo: AreasRepository, merchantId: number = 1): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
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

          // console.log(JSON.stringify(fields));
          const existing = existingMetaobjectsMap.get(area.id_area.toString());

          let shopifyIdUpdate = null;
          if (existing) {

            shopifyIdUpdate = existing.id;
            // 4. Verificar si realmente necesita actualización
            const needsUpdate = fields.some(newField => {
              const existingField = existing.fields.find((f: any) => f.key === newField.key);
              return !existingField || existingField.value !== newField.value;
            });

            if (!needsUpdate && 1 !== 1) {
              results.skipped++;
            }
            else {
              // 5. Actualizar si hay cambios
              const updateMutation = `
                mutation MetaobjectUpdate($id: ID!, $capabilities:MetaobjectCapabilityDataInput!,$fields: [MetaobjectFieldInput!]!) {
                  metaobjectUpdate(id: $id, metaobject: {fields: $fields,capabilities:$capabilities}) {
                    metaobject {
                      capabilities {
                            publishable {
                            status
                            }
                            onlineStore {
                            templateSuffix
                            }
                        }
                        fields {
                            key
                            value
                        }

                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

              const vars2Upd = {
                id: existing.id,
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              };
              const updateResponse = await this.makeShopifyRequest(updateMutation, vars2Upd);

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
                type: "area",
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }

            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;

            results.created++;
          }
          // ----- BLOCK insertar referencia en BD -------
          try {
            await repo.execute(`INSERT INTO references_data (
                                  referenceable_id,
                                  referenceable_type,
                                  merchant_id,
                                  shopify_id
                              ) VALUES (?,'areas',?,?)
                               ON DUPLICATE KEY UPDATE
                                shopify_id=VALUES(shopify_id)`, [idInstDB, merchantId, shopifyIdUpdate]);
          } catch (error) {
            console.log('🔥 ERROR: ', error.message)
          }
          //------ END BLOCK ------------------------------


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
  async syncronizeFacultades(facultadesData: FacultadesInterface[], repo: FacultadesRepository, merchantId: number = 1): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
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
            {key: "facultad_logo_url", value: fac.logo ?? ""}
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

            if (!needsUpdate && 1 !== 1) {
              results.skipped++;
            }
            else {
              // 5. Actualizar si hay cambios
              const updateMutation = `
                mutation MetaobjectUpdate($id: ID!, $capabilities:MetaobjectCapabilityDataInput!,$fields: [MetaobjectFieldInput!]!) {
                  metaobjectUpdate(id: $id, metaobject: {fields: $fields,capabilities:$capabilities}) {
                    metaobject {
                      capabilities {
                            publishable {
                            status
                            }
                            onlineStore {
                            templateSuffix
                            }
                        }
                        fields {
                            key
                            value
                        }

                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

              const vars2Upd = {
                id: existing.id,
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              };
              const updateResponse = await this.makeShopifyRequest(updateMutation, vars2Upd);

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
                type: "facultad",
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }

            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;

            results.created++;
          }

          // ----- BLOCK insertar referencia en BD -------
          try {
            await repo.execute(`INSERT INTO references_data (
                                  referenceable_id,
                                  referenceable_type,
                                  merchant_id,
                                  shopify_id
                              ) VALUES (?,'facultades',?,?)
                               ON DUPLICATE KEY UPDATE
                                shopify_id=VALUES(shopify_id)`, [idInstDB, merchantId, shopifyIdUpdate]);
          } catch (error) {
            console.log('🔥 ERROR: ', error.message)
          }
          //------ END BLOCK ------------------------------


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
  async syncronizeInstitucionesEducativas(institutionsData: InstitucionesEducativasInterface[], repo: InstitucionesEducativasRepository, merchantId: number = 1): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
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

            if (!needsUpdate && 1 !== 1) {
              results.skipped++;
              continue;
            }

            // 5. Actualizar si hay cambios
            const updateMutation = `
                mutation MetaobjectUpdate($id: ID!, $capabilities:MetaobjectCapabilityDataInput!,$fields: [MetaobjectFieldInput!]!) {
                  metaobjectUpdate(id: $id, metaobject: {fields: $fields,capabilities:$capabilities}) {
                    metaobject {
                      capabilities {
                            publishable {
                            status
                            }
                            onlineStore {
                            templateSuffix
                            }
                        }
                        fields {
                            key
                            value
                        }

                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

            const vars2Upd = {
              id: existing.id,
              capabilities: {
                publishable: {status: "ACTIVE"}
              },
              fields: fields
            };
            const updateResponse = await this.makeShopifyRequest(updateMutation, vars2Upd);

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
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }
            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;


            results.created++;
          }

          // ----- BLOCK insertar referencia en BD -------
          try {
            await repo.execute(`INSERT INTO references_data (
                                  referenceable_id,
                                  referenceable_type,
                                  merchant_id,
                                  shopify_id
                              ) VALUES (?,'instituciones_educativas',?,?)
                               ON DUPLICATE KEY UPDATE
                                shopify_id=VALUES(shopify_id)`, [idInstDB, merchantId, shopifyIdUpdate]);
          } catch (error) {
            console.log('🔥 ERROR: ', error.message)
          }
          //------ END BLOCK ------------------------------

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
  async syncronizeNivelesEducativos(nivelesEduData: NivelesEducativosInterface[], repo: NivelesEducativosRepository, merchantId: number = 1): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
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

            if (!needsUpdate && 1 !== 1) {
              results.skipped++;
            }
            else {
              // 5. Actualizar si hay cambios
              const updateMutation = `
                mutation MetaobjectUpdate($id: ID!, $capabilities:MetaobjectCapabilityDataInput!,$fields: [MetaobjectFieldInput!]!) {
                  metaobjectUpdate(id: $id, metaobject: {fields: $fields,capabilities:$capabilities}) {
                    metaobject {
                      capabilities {
                            publishable {
                            status
                            }
                            onlineStore {
                            templateSuffix
                            }
                        }
                        fields {
                            key
                            value
                        }

                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

              const vars2Upd = {
                id: existing.id,
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              };
              const updateResponse = await this.makeShopifyRequest(updateMutation, vars2Upd);

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
                type: "nivel_educativo",
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              }
            });

            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }
            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;


            results.created++;
          }

          // ----- BLOCK insertar referencia en BD -------
          try {
            await repo.execute(`INSERT INTO references_data (
                                  referenceable_id,
                                  referenceable_type,
                                  merchant_id,
                                  shopify_id
                              ) VALUES (?,'niveles_educativos',?,?)
                                ON DUPLICATE KEY UPDATE
                                shopify_id=VALUES(shopify_id)`, [idInstDB, merchantId, shopifyIdUpdate]);
          } catch (error) {
            console.log('🔥 ERROR: ', error.message)
          }
          //------ END BLOCK ------------------------------

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
  async syncronizeIdiomas(idioomasEduData: IdiomasInterface[], repo: IdiomasRepository, merchantId: number = 1): Promise<{created: number; updated: number; skipped: number; errors: any[]}> {
    const results: SyncResults = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    try {
      // 1. Obtener TODOS los metaobjects existentes de una sola vez
      const existingResponse = await this.makeShopifyRequest(this.allExistingQuery, {
        type: "idiomas_del_curso"
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

      // 3. Procesar cada institucion
      for (const idio of idioomasEduData) {

        console.log('ALNG: ', idio.idioma)

        try {

          const idInstDB = idio.id_idioma;

          const fields = [
            {key: "id_idioma", value: `${idio.id_idioma}`},
            {key: "idioma", value: `${idio.idioma}`},
            {key: "prefijo_idioma", value: idio.prefijo_idioma ?? ""}
          ];

          const existing = existingMetaobjectsMap.get(idio.id_idioma.toString());
          // console.log('Existing', existing)
          let shopifyIdUpdate = null; //est para actualizar el valor del id shopify en la tabla de instituciones ediucativas
          if (existing) {
            console.log('UPDATING')
            shopifyIdUpdate = existing.id;
            // 4. Verificar si realmente necesita actualización
            const needsUpdate = fields.some(newField => {
              const existingField = existing.fields.find((f: any) => f.key === newField.key);
              return !existingField || existingField.value !== newField.value;
            });

            if (!needsUpdate && 1 !== 1) {
              results.skipped++;
            }
            else {
              // 5. Actualizar si hay cambios
              const updateMutation = `
                mutation MetaobjectUpdate($id: ID!, $capabilities:MetaobjectCapabilityDataInput!,$fields: [MetaobjectFieldInput!]!) {
                  metaobjectUpdate(id: $id, metaobject: {fields: $fields,capabilities:$capabilities}) {
                    metaobject {
                      capabilities {
                            publishable {
                            status
                            }
                            onlineStore {
                            templateSuffix
                            }
                        }
                        fields {
                            key
                            value
                        }

                    }
                    userErrors {
                      field
                      message
                      code
                    }
                  }
                }
              `;

              const vars2Upd = {
                id: existing.id,
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              };
              const updateResponse = await this.makeShopifyRequest(updateMutation, vars2Upd);

              if (updateResponse?.data?.metaobjectUpdate?.userErrors?.length > 0) {

                throw new Error(JSON.stringify(updateResponse.data.metaobjectUpdate.userErrors));
              }

              results.updated++;
            }
          } else {
            console.log('CREATING')
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
                capabilities: {
                  publishable: {status: "ACTIVE"}
                },
                fields: fields
              }
            });

            console.log(createResponse)
            if (createResponse?.data?.metaobjectCreate?.userErrors?.length > 0) {
              throw new Error(JSON.stringify(createResponse.data.metaobjectCreate.userErrors));
            }
            shopifyIdUpdate = createResponse?.data?.metaobjectCreate?.metaobject?.id;


            results.created++;
          }

          // ----- BLOCK insertar referencia en BD -------
          try {
            await repo.execute(`INSERT INTO references_data (
                                  referenceable_id,
                                  referenceable_type,
                                  merchant_id,
                                  shopify_id
                              ) VALUES (?,'idiomas',?,?)
                               ON DUPLICATE KEY UPDATE
                               shopify_id=VALUES(shopify_id)`, [idInstDB, merchantId, shopifyIdUpdate]);
          } catch (error) {
            console.log('🔥 ERROR: ', error.message)
          }
          //------ END BLOCK ------------------------------

          // Pequeña pausa para evitar rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.errors.push({
            creditId: idio.id_idioma,
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


  // Actualizar producto con nuevo precio
  async updateProductStatus(id: string, status: string, variables?: object) {
    try {

      const query = `mutation ActivateProduct {
                  productSet(
                    synchronous: true,
                    input: {
                      id: "${id}",
                      status: ${status === "active" ? "ACTIVE" : "DRAFT"},
                    }
                  ) {
                    product {
                      id
                      title
                      status
                    }
                    userErrors {
                      field
                      message
                    }
                  }
                }`;
      const createResponse2 = await this.makeShopifyRequest(
        query,
        (variables = {})
      );
      return createResponse2;
    } catch (error) {
      return error;
    }
  };


  // Actualizar cantidad de alumnos han comprado el producto
  async updateProductStudentsCount(id: string) {
    try {

      const query = `{
                product(id:"gid://shopify/Product/${id}"){
                    title
                    no_alumnos:metafield(namespace:"custom",key:"numero_de_alumnos"){
                        value
                    }
                }
            }`;
      const variables = {};
      const createResponse2 = await this.makeShopifyRequest(
        query, variables
      );
      // console.log(JSON.stringify(createResponse2))
      let cantActual = createResponse2?.data?.product?.no_alumnos?.value ?? 0;
      cantActual++;

      const queryUpd = `mutation UpdateProductWithMetafields($product: ProductUpdateInput!) {
        productUpdate(product: $product) {
          userErrors {
            field
            message
          }
          product {
            id
            title
            handle
            metafields(first: 10) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                  type
                }
              }
            }
          }
        }
      }`;

      const vars2 = {
        "product": {
          "id": `gid://shopify/Product/${id}`,
          "metafields": [
            {
              "key": "numero_de_alumnos", "namespace": "custom", "value": `${cantActual}`,
              "type": "number_integer"
            }]
        }
      };



      const createResponse3 = await this.makeShopifyRequest(
        queryUpd, vars2
      );

      console.log(JSON.stringify(createResponse3))
    } catch (error) {
      return error;
    }
  };

}
