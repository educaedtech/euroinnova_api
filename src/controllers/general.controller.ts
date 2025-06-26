/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {inject} from '@loopback/core';
import {get, param, post, requestBody, response} from '@loopback/rest';
import fetch from 'node-fetch';
import {MerchantCredentialsService, ShopifyCredentials} from '../services/merchant-credentials.service';
import {ShopifyService} from '../services/shopify.service';

interface Collection {
  id: string;
  title: string;
}

interface Product {
  id: string;
  tags: string;
}

interface ProductInput {
  id: string;
  tags?: string[];
}

interface ShopifyResponse<T> {
  data: T;
  errors?: Array<{field: string; message: string}>;
}

interface ProductCollectionsResponse {
  product: {
    collections: {
      nodes: Collection[];
    };
    collectionsMeta: {
      value: string;
    };
  };
}

export class GeneralController {

  constructor(
    @inject('services.ShopifyService')
    public shopifyService: ShopifyService,
    @inject('services.MerchantCredentialsService')
    private merchantCredentials: MerchantCredentialsService,
  ) { }

  //ajustando credenciales del merchant al que se accede
  setShopifyServiceCredentials = async (credentials: ShopifyCredentials) => {
    await this.shopifyService.setCredentials(credentials);
  }

  /**
   * Endpoint para recibir el webhook y gestionar colecciones de productos
   */
  @post('/general/product-count/{merchant_id}')
  @response(200, {
    description: 'Set Product Student Count',
    content: {
      'application/json': {
        schema: {
          type: 'json',
        },
      },
    },
  })
  async productStudentCount(
    @param.path.number('merchant_id') merchantId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object'
          },
        },
      },
    })
    order: any,
  ): Promise<{message: string, orderProc: any}> {
    try {

      // console.log('ORDER', JSON.stringify(order));

      const {line_items} = order;
      const credenciales = await this.merchantCredentials.getShopifyCredentials(merchantId);
      await this.shopifyService.setCredentials(credenciales);

      for (const item of line_items) {
        const {product_id} = item;

        await this.shopifyService.updateProductStudentsCount(product_id);

      }

      return {message: `ℹ️ Order processed.`, orderProc: order};
    } catch (error) {
      console.error('🔥 Error processing:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  @get('/general/api/ip-info')
  @response(200, {
    description: 'Get IP Address',
    content: {
      'application/json': {
        schema: {},
      },
    },
  })
  async getIPData() {
    try {
      const url = 'https://ipinfo.io/json';

      try {
        const response2 = await fetch(url, {
          method: 'GET',
        });

        let dres = null;
        const contentType = response2.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          dres = await response2.json(); // Parsear como JSON
        } else {
          dres = await response2.text(); // Parsear como texto
        }

        return {
          success: true,
          message: 'INFO server',
          result: dres,
        };
      } catch (error) {
        console.error('ERROR geting INFO:', error);

        return {
          success: false,
          message: 'ERROR sending Warranty',
          result: error,
        };
      }
    } catch (error) {
      console.error('Error procesando el envío de correo:', error.message);
    }

    return {
      success: true,
      message: 'testing mail send',
    };
  }


  /**
   * Endpoint para recibir el webhook y gestionar colecciones de productos
   */
  @post('/general/product-collections/{merchant_id}')
  @response(200, {
    description: 'Set Product Collections',
    content: {
      'application/json': {
        schema: {
          type: 'json',
        },
      },
    },
  })
  async productCollections(
    @param.path.number('merchant_id') merchantId: number,
    @requestBody({
      content: {
        'application/json': {
          schema: {
            type: 'object'
          },
        },
      },
    })
    product: Product,
  ): Promise<{message: string}> {
    try {
      const productId = product.id;

      // Obtener metadatos y colecciones del producto
      const {metaTitles, collectionTitles} = await this.getProductCollectionsData(productId, merchantId);

      // Determinar colecciones a modificar
      const {collectionsToRemove, collectionsToAdd} = this.determineCollectionsToUpdate(
        metaTitles,
        collectionTitles,
      );

      // Procesar cambios en las colecciones
      await this.processCollectionChanges(productId, collectionsToRemove, collectionsToAdd);

      // // Actualizar tags si es necesario
      // await this.updateProductTagsIfNeeded(productId, arrTags, metaTitles);

      return {message: `ℹ️ Product processed ${productId}.`};
    } catch (error) {
      console.error('🔥 Error processing:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  // Métodos auxiliares

  private parseTags(tagsString: string): string[] {
    return tagsString
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
  }

  private async getProductCollectionsData(productId: string, merchantId: number): Promise<{
    metaTitles: string[];
    collectionTitles: Collection[];
  }> {

    // -------- BLOCK ajustes de credenciales ----------------
    // 1. Obtener credenciales del merchant
    const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);

    // 2. Configurar el servicio Shopify con estas credenciales
    await this.shopifyService.setCredentials(credentials);
    //--------- END BLOCK -----------------------------------


    const query = `query ProductMetafield($namespace: String!, $key: String!, $ownerId: ID!) {
      product(id: $ownerId) {
        collections(first: 250) {
          nodes {
            id
            title
          }
        }
        collectionsMeta: metafield(namespace: $namespace, key: $key) {
          value
        }
      }
    }`;

    const variables = {
      namespace: 'custom',
      key: 'collection_shopify',
      ownerId: `gid://shopify/Product/${productId}`,
    };

    const response1 = await this.shopifyService.makeShopifyRequest(query, variables);
    const data: ShopifyResponse<ProductCollectionsResponse> = response1;

    if (!data.data?.product) {
      throw new Error('No se pudo obtener la información del producto');
    }

    const metaTitles = this.parseTags(data.data.product.collectionsMeta?.value ?? '');
    const collectionTitles = data.data.product.collections.nodes;

    return {metaTitles, collectionTitles};
  }

  private determineCollectionsToUpdate(
    metaTitles: string[],
    collectionTitles: Collection[],
  ): {
    collectionsToRemove: Collection[];
    collectionsToAdd: string[];
  } {
    const collectionsToRemove = collectionTitles.filter(
      col => !metaTitles.includes(col.title),
    );

    const collectionsToAdd = metaTitles.filter(
      title => !collectionTitles.map(t => t.title).includes(title),
    );

    return {collectionsToRemove, collectionsToAdd};
  }

  public async processCollectionChanges(
    productId: string,
    collectionsToRemove: Collection[],
    collectionsToAdd: string[],
  ): Promise<void> {

    // if (collectionsToRemove.length > 0)
    //   await this.removeProdFromCollections(productId, collectionsToRemove);

    if (collectionsToAdd.length > 0)
      for (const collectionName of collectionsToAdd) {
        console.log('- procesando colección: ', collectionName);
        await this.addProductToCollection(productId, collectionName);
        setTimeout(() => {
          console.log('just wait 100 ms')
        }, 100);
      }
  }

  private async updateProductTagsIfNeeded(
    productId: string,
    currentTags: string[],
    metaTitles: string[],
  ): Promise<void> {
    const arrayUnido = [...new Set([...currentTags, ...metaTitles])];

    if (JSON.stringify([...currentTags].sort()) !== JSON.stringify([...metaTitles].sort())) {
      await this.updateProductTags(productId, arrayUnido);
    } else {
      console.log('Las TAGS ya se encuentran actualizadas');
    }
  }

  private async updateProductTags(
    productId: string,
    tags: string[] = [],
  ): Promise<{success: boolean; product?: any; message?: string}> {
    try {
      const query = `mutation ProductUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            title
            tags
          }
          userErrors {
            field
            message
          }
        }
      }`;

      const variables = {
        input: {
          id: `gid://shopify/Product/${productId}`,
          tags,
        } as ProductInput,
      };

      const response2 = await this.shopifyService.makeShopifyRequest(query, variables);
      const data: ShopifyResponse<{
        productUpdate: {
          product: any;
          userErrors: Array<{field: string; message: string}>;
        };
      }> = response2;

      if (data.data?.productUpdate.userErrors.length > 0) {
        console.log(
          `Updating tags on(${productId}) ERROR: ${JSON.stringify(
            data.data.productUpdate.userErrors,
          )}`,
        );
        return {
          success: false,
          message: JSON.stringify(data.data.productUpdate.userErrors),
        };
      }

      console.log(`Updating tags on(${productId}) Success`);
      return {success: true, product: data.data?.productUpdate.product};
    } catch (error) {
      console.error(
        `Error al actualizar los tags del producto ${productId}`,
        error instanceof Error ? error.message : String(error),
      );
      return {
        success: false,
        message: `Error al actualizar los tags del producto ${productId}`,
      };
    }
  }

  private async removeProdFromCollections(
    productId: string,
    collectionsToRemove: Collection[],
  ): Promise<void> {
    for (const collection of collectionsToRemove) {
      try {
        const query = `mutation RemoveProductFromCollections($id: ID!, $productIds: [ID!]!) {
          collectionRemoveProducts(id: $id, productIds: $productIds) {
            job {
              id
              done
            }
            userErrors {
              field
              message
            }
          }
        }`;

        const variables = {
          id: collection.id,
          productIds: [`gid://shopify/Product/${productId}`],
        };

        const response3 = await this.shopifyService.makeShopifyRequest(query, variables);
        const data: ShopifyResponse<{
          collectionRemoveProducts: {
            job: {id: string; done: boolean};
            userErrors: Array<{field: string; message: string}>;
          };
        }> = response3;

        if (data.data?.collectionRemoveProducts.userErrors.length > 0) {
          console.log(
            `Removing (${collection.title}) ERROR: ${JSON.stringify(
              data.data.collectionRemoveProducts.userErrors,
            )}`,
          );
        } else {
          console.log(`Removing (${collection.title}) Success`);
        }
      } catch (error) {
        console.error(
          `Error al eliminar el producto ${productId} de la colección ${collection.title}:`,
          error instanceof Error ? error.message : String(error),
        );
      }
    }
  }

  private async addProductToCollection(
    productId: string,
    collectionName: string,
  ): Promise<void> {
    try {
      // Buscar o crear la colección
      const collection = await this.findOrCreateCollection(collectionName);

      // Agregar producto a la colección
      const query = `mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
        collectionAddProducts(id: $id, productIds: $productIds) {
          collection {
            id
            title
            products(first: 10) {
              nodes {
                id
                title
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`;

      const variables = {
        id: collection?.id,
        productIds: [`gid://shopify/Product/${productId}`],
      };

      const response4 = await this.shopifyService.makeShopifyRequest(query, variables);
      const data: ShopifyResponse<{
        collectionAddProducts: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          collection: any;
          userErrors: Array<{field: string; message: string}>;
        };
      }> = response4;

      if (data.data?.collectionAddProducts.userErrors.length > 0) {
        console.log('🔥 Error', data.data.collectionAddProducts.userErrors);
      } else {
        console.log(
          `✅ Producto ${productId} agregado a la colección (${collection?.title})`,
        );
      }
    } catch (error) {
      console.error(
        `Error al agregar producto ${productId} a colección (${collectionName}):`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  public async findOrCreateCollection(collectionName: string): Promise<Collection | null> {
    // console.log(`ℹ️ search or create collection [ ${collectionName} ]`);
    // Buscar la colección por nombre
    const query = `query GetCollection($query: String!) {
       collections(first: 1, query: $query) {
         nodes {
           id
           handle
           title
           updatedAt
           descriptionHtml
           sortOrder
           templateSuffix
         }
       }
     }`;

    const variables = {
      query: `title:${collectionName}`,
    };

    // console.log(this.shopifyService.config);

    const response5 = await this.shopifyService.makeShopifyRequest(query, variables);
    const data: ShopifyResponse<{
      collections: {nodes: Collection[]};
    }> = response5;

    if (data.data?.collections.nodes.length > 0) {
      // retorna la coleccion porque ya existe
      console.log(`ℹ️  Collection (EXIST) => ${collectionName}`)
      return data.data.collections.nodes[0];
    }

    // Crear la colección si no existe
    const createQuery = `mutation createCollection($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection {
          id
          title
        }
        userErrors {
          message
          field
        }
      }
    }`;

    const createVariables = {
      input: {
        title: collectionName,
        publications: [
          {channelHandle: 'online_store'},
          {channelHandle: 'pos'},
          {channelHandle: 'shop-72'},
        ],
      },
    };

    const createResponse = await this.shopifyService.makeShopifyRequest(
      createQuery,
      createVariables,
    );

    const createData: ShopifyResponse<{
      collectionCreate: {
        collection: Collection;
        userErrors: Array<{field: string; message: string}>;
      };
    }> = createResponse;

    if (createData.data?.collectionCreate.userErrors.length > 0) {
      throw new Error(
        JSON.stringify(createData.data.collectionCreate.userErrors),
      );
    }

    console.log(`✅ Collection (CREATED) => ${collectionName}`)
    return createData.data?.collectionCreate.collection ?? null;
  }

}


