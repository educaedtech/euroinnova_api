/* eslint-disable @typescript-eslint/prefer-for-of */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import {inject, injectable} from '@loopback/core';
import {
  repository
} from '@loopback/repository';
import {
  param,
  post
} from '@loopback/rest';
import {Productos} from '../models';
import {ProductosRepository} from '../repositories';
import {Metafield, ProductData, ShopifyService} from '../services/shopify.service';

// seccion para sincronizacion en lotes (jobs)
import {requestBody} from '@loopback/rest';
import {LoggerService} from '../services/logger.service';
import {MerchantCredentialsService} from '../services/merchant-credentials.service';
import {QueueService} from '../services/queue.service';

//  interfaz para el request body
interface SyncBatchRequest {
  batchSize?: number;
  productIds?: number[]; // Opcional: para sincronizar productos específicos
  limit?: number;// Optional: cantidad de productos a sincronizar
  merchant?: number;// Optional: mercado de productos a sincronizar
  hours?: number;
}

interface ProductoRelacionado {
  title: string;
  ids_relacionados: number[];
  cantidad_duplicados: number;
}

@injectable()
export class ProductosController {
  constructor(
    @repository(ProductosRepository)
    public productosRepository: ProductosRepository,
    @inject('services.LoggerService')
    private logger: LoggerService,
    @inject('services.ShopifyService')
    public shopifyService: ShopifyService,
    @inject('services.MerchantCredentialsService')
    private merchantCredentials: MerchantCredentialsService,
  ) { }

  //sincronizando 1 producto en 1 mercado
  @post('/productos/relations-idiomas/{merchant_id}')
  async productRelationsIdiomasMerchant(
    @param.path.number('merchant_id') merchantId: number,
    @requestBody({
      description: 'Actualización de las relaciones entre productos por idiomas',
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              // hours: {type: 'number', default: 72, nullable: true}
            },
          },
        },
      },
    }) options?: SyncBatchRequest,
    // @inject('services.QueueService') queueService?: QueueService,
  ): Promise<{
    TotalOperations: number;
    success: boolean;
    errors: any[]
  }> {

    const data = await this.productosRepository.execute(`SELECT
                              title,
                              JSON_ARRAYAGG(productos.unidad_id) AS ids_relacionados,
                              COUNT(*) AS cantidad_duplicados
                          FROM
                              productos
                            JOIN unidades_merchants
                              ON
                                productos.unidad_id = unidades_merchants.unidad_id
                              AND
                                merchant_id=?
                              AND
                              title IS NOT NULL
                          GROUP BY
                              title
                          HAVING
                              COUNT(*) >= 1
                          ORDER BY
                              title;`, [merchantId]) as ProductoRelacionado[];

    // console.log(JSON.stringify(data));
    const inserts = this.generarInsertsRelaciones(data);

    // Mostrar los resultados en la consola
    // console.log(inserts.join('\n'));
    const errors = [];
    try {
      for (const sqlIns of inserts) {
        await this.productosRepository.execute(sqlIns);
      }
    } catch (error) {
      console.error(error);
      errors.push(error);
    }

    return {
      TotalOperations: inserts.length,
      success: true,
      errors: errors
    };
  }



  generarInsertsRelaciones(datos: ProductoRelacionado[]): string[] {
    const inserts: string[] = [];

    datos.forEach((item: ProductoRelacionado) => {
      const ids = item.ids_relacionados;

      // Generar todas las combinaciones posibles (incluyendo relación consigo mismo)
      for (let i = 0; i < ids.length; i++) {
        for (let j = 0; j < ids.length; j++) {
          inserts.push(
            `INSERT INTO unidades_unidades_relacionadas (unidad_id, unidad_relacionada_id,tipo_relacion_id) VALUES (${ids[i]}, ${ids[j]},1);`
          );
        }
      }
    });

    return inserts;
  }



  //sincronizando 1 producto en 1 mercado
  @post('/productos/syncronize/{merchant_id}/{product_id}')
  async syncProdOnMerchant(
    @param.path.number('merchant_id') merchantId: number,
    @param.path.number('product_id') productId: number,
    @requestBody({
      description: 'Opciones para la sincronización de un producto por merchant',
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              // hours: {type: 'number', default: 72, nullable: true}
            },
          },
        },
      },
    }) options?: SyncBatchRequest,
    // @inject('services.QueueService') queueService?: QueueService,
  ): Promise<{
    sku: string;
    success: boolean;
    shopifyId: string;
    variantId: string;
    inventoryItemId: string;
    imagen?: object;
  }> {
    // -------- BLOCK ajustes de credenciales ----------------
    // 1. Obtener credenciales del merchant
    const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);

    // 2. Configurar el servicio Shopify con estas credenciales
    await this.shopifyService.setCredentials(credentials);
    //--------- END BLOCK -----------------------------------

    const product = await this.productosRepository.findByIdMine(productId, null, {merchantId});
    const shopifyProduct = {...this.mapToShopifyFormat(product, product.unidadId), merchantId: merchantId};
    // console.log(shopifyProduct);

    const result = await this.shopifyService.createShopifyProduct(shopifyProduct);

    return result;
  }

  @post('/productos/cants-prods-2-sync/{merchant_id}')
  async cantsProds2Sync(
    @param.path.number('merchant_id') merchantId: number,
    @requestBody({
      description: 'Opciones para la sincronización por lotes y MERCHANTS',
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              hours: {type: 'number', default: 72, nullable: true}
            },
          },
        },
      },
    }) options?: SyncBatchRequest,
    // @inject('services.QueueService') queueService?: QueueService,
  ): Promise<{
    totalProducts: number;
    activos: number;
    inactivos: number;
  }> {
    // -------- BLOCK ajustes de credenciales ----------------
    // 1. Obtener credenciales del merchant
    const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);

    // 2. Configurar el servicio Shopify con estas credenciales
    await this.shopifyService.setCredentials(credentials);
    //--------- END BLOCK -----------------------------------

    //------ BLOCK  ------------
    const hours = options?.hours ?? 72;
    const pageSize = 200; // Productos a cargar por consulta
    const offset = 0;

    // 1. Cargar una página de productos
    const {total, actives, inactives} = await this.productosRepository.findModfiedByHoursRange(
      merchantId ?? 1,
      {
        limit: pageSize,
        offset,
        hours: hours
      }
    );

    return {
      totalProducts: total,
      activos: actives,
      inactivos: inactives
    }
  }


  @post('/productos/sync-to-shopify/{merchant_id}')
  async syncronizeProducts2Merchants(
    @param.path.number('merchant_id') merchantId: number,
    @requestBody({
      description: 'Opciones para la sincronización por lotes y MERCHANTS',
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              batchSize: {type: 'number', default: 100},
              limit: {type: 'number', default: 1, nullable: true},
              hours: {type: 'number', default: 72, nullable: true}
            },
          },
        },
      },
    }) options?: SyncBatchRequest,
    @inject('services.QueueService') queueService?: QueueService,
  ): Promise<{
    totalProducts: number;
    batchesCreated: number;
    message: string;
  }> {
    // -------- BLOCK ajustes de credenciales ----------------
    // 1. Obtener credenciales del merchant
    const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);

    // 2. Configurar el servicio Shopify con estas credenciales
    await this.shopifyService.setCredentials(credentials);
    //--------- END BLOCK -----------------------------------

    //------ BLOCK generar BATCHES DE PRODUCTOS A SYNCRONIZAR ------------

    const batchSize = options?.batchSize ?? 100;
    const hours = options?.hours ?? 72;
    const pageSize = 200; // Productos a cargar por consulta
    let offset = 0;
    let totalProcessed = 0;
    let totalBatches = 0;

    // Procesamiento paginado para todos los productos
    let hasMore = true;

    while (hasMore) {
      // 1. Cargar una página de productos
      const {products: productos, total, inactives} = await this.productosRepository.findByMerchantWithPagination(
        merchantId ?? 1,
        {
          limit: pageSize,
          offset,
          hours: hours
        }
      );
      // console.log(productos.length)
      // console.log('Inactives', inactives)
      for (const inactiveId of inactives) {
        try {
          this.logger.log(`ℹ️ Changing status to DRAFT for (${inactiveId})`);
          await this.shopifyService.updateProductStatus(inactiveId, "draft", {});
        } catch (error) {
          this.logger.error(`⛔ Error changing status to DRAFT on ${inactiveId}`);
        }

        // console.log('DOIT DRAFT', doitDraft);
      }

      console.log('📅 Total products to procces', total)

      if (productos.length === 0) {
        hasMore = false;
        break;
      }

      // 2. Transformar y procesar en lotes pequeños
      // const shopifyProducts = productos.map(p => ({...this.mapToShopifyFormat(p, p.unidadId), merchantId: merchantId}));
      console.log('📌 IDs:', JSON.stringify(productos.map(p => p.unidadId)));
      const batches = this.createBatches(productos/*shopifyProducts*/, batchSize);
      // 3. Enviar a la cola
      if (queueService) {

        for (const batch of batches) {
          await queueService.addProductBatchToSync(batch, credentials);
          totalBatches++;
        }
      }

      totalProcessed += productos.length;
      offset += pageSize;

      // Liberar memoria
      console.log(`🧹 liberando memoria`)
      await new Promise(resolve => setImmediate(resolve));
      console.log(`⌛ delay para (total: ${total}, offet: ${offset}, batch:${totalBatches}, totalProcessed: ${totalProcessed})`)
      await new Promise(resolve => setTimeout(resolve, 100));
    }


    return {
      totalProducts: totalProcessed,
      batchesCreated: totalBatches,
      message: `🎇 Sincronización masiva iniciada. ${totalProcessed} productos en ${totalBatches} lotes de ${batchSize}.`,
    };

    //--------------------------------------------------------------------

  }


  //---------- BLOCK sincro ENDPOINTS-------------------------------------------
  /*

  @post('/productos/find-prod-not-in-shopify')
  async findProdNotInShopify(
    @requestBody({
      description: 'Opciones para la sincronización por lotes',
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              batchSize: {type: 'number', default: 100},
              limit: {type: 'number', default: 1, nullable: true, },
              merchant: {type: 'number', default: 1, nullable: true, },
            },
          },
        },
      },
    }) options?: SyncBatchRequest,
    @inject('services.QueueService') queueService?: QueueService,
  ): Promise<{
    totalProducts: number;
    batchesCreated: number;
    message: string;
  }> {
    const batchSize = options?.batchSize ?? 100;
    const pageSize = 200; // Productos a cargar por consulta
    let offset = 0;
    let totalProcessed = 0;
    let totalBatches = 0;


    // Procesamiento paginado para todos los productos
    let hasMore = true;

    while (hasMore) {
      // 1. Cargar una página de productos
      const {products: productos, total} = await this.productosRepository.findByMerchantWithoutSYNC(
        options?.merchant ?? 1,
        {
          limit: pageSize,
          offset,
        }
      );

      // console.log('Total Of Products', total)

      if (productos.length === 0) {
        hasMore = false;
        break;
      }

      // 2. Transformar y procesar en lotes pequeños
      const shopifyProducts = productos.map(p => this.mapToShopifyFormat(p, p.unidadId));
      const batches = this.createBatches(shopifyProducts, batchSize);

      // 3. Enviar a la cola
      if (queueService) {
        for (const batch of batches) {
          await queueService.addProductBatchToSync(batch);
          totalBatches++;
        }
      }

      totalProcessed += productos.length;
      offset += pageSize;

      // Liberar memoria
      console.log(`liberando memoria`)
      await new Promise(resolve => setImmediate(resolve));
      console.log(`delay para (total: ${total}, offet: ${offset}, batch:${totalBatches}, totalProcessed: ${totalProcessed})`)
      await new Promise(resolve => setTimeout(resolve, 100));
    }


    return {
      totalProducts: totalProcessed,
      batchesCreated: totalBatches,
      message: `Sincronización masiva iniciada. ${totalProcessed} productos en ${totalBatches} lotes de ${batchSize}.`,
    };
  }

  //--------------------------------------------------
  @post('/productos/sync-batch-to-shopify-new')
  async syncBatchToShopifyNEW(
    @requestBody({
      description: 'Opciones para la sincronización por lotes',
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              batchSize: {type: 'number', default: 100},
              productIds: {
                type: 'array',
                items: {type: 'number'},
                nullable: true,
              },
              limit: {type: 'number', default: 1, nullable: true, },
              merchant: {type: 'number', default: 1, nullable: true, },
            },
          },
        },
      },
    }) options?: SyncBatchRequest,
    @inject('services.QueueService') queueService?: QueueService,
  ): Promise<{
    totalProducts: number;
    batchesCreated: number;
    message: string;
  }> {
    const batchSize = options?.batchSize ?? 100;
    const pageSize = 200; // Productos a cargar por consulta
    let offset = 0;
    let totalProcessed = 0;
    let totalBatches = 0;

    // Si hay IDs específicos, procesarlos primero
    if (options?.productIds?.length) {
      const productos = [];
      for (const prodId of options.productIds) {
        try {
          const product = await this.productosRepository.findByIdMine(prodId);
          if (product) productos.push(product);
        } catch (error) {
          console.log(`🔥 Omitiendo ID:${prodId}, ERROR: ${error.toString()}`);
        }
      }

      const shopifyProducts = productos.map(p => this.mapToShopifyFormat(p, p.unidadId));
      const batches = this.createBatches(shopifyProducts, batchSize);

      if (queueService) {
        for (const batch of batches) {
          await queueService.addProductBatchToSync(batch);
          totalBatches++;
        }
      }

      totalProcessed = productos.length;
    } else {
      // Procesamiento paginado para todos los productos
      let hasMore = true;

      while (hasMore) {
        // 1. Cargar una página de productos
        const {products: productos, total} = await this.productosRepository.findByMerchantWithPagination(
          options?.merchant ?? 1,
          {
            limit: pageSize,
            offset,
            // where: {activo: 1} // Filtro opcional
          }
        );

        // console.log('Total Of Products', total)

        if (productos.length === 0) {
          hasMore = false;
          break;
        }

        // 2. Transformar y procesar en lotes pequeños
        const shopifyProducts = productos.map(p => this.mapToShopifyFormat(p, p.unidadId));
        const batches = this.createBatches(shopifyProducts, batchSize);

        // 3. Enviar a la cola
        if (queueService) {
          for (const batch of batches) {
            await queueService.addProductBatchToSync(batch);
            totalBatches++;
          }
        }

        totalProcessed += productos.length;
        offset += pageSize;

        // Liberar memoria
        console.log(`liberando memoria`)
        await new Promise(resolve => setImmediate(resolve));
        console.log(`delay para (total: ${total}, offet: ${offset}, batch:${totalBatches}, totalProcessed: ${totalProcessed})`)
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return {
      totalProducts: totalProcessed,
      batchesCreated: totalBatches,
      message: `Sincronización masiva iniciada. ${totalProcessed} productos en ${totalBatches} lotes de ${batchSize}.`,
    };
  }


  //--------------------------------------------------

  // endpoint para sincronizacion en lotes
  @post('/productos/sync-batch-to-shopify', {
    responses: {
      '200': {
        description: 'Inicia la sincronización masiva de productos con Shopify',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                totalProducts: {type: 'number'},
                batchesCreated: {type: 'number'},
                message: {type: 'string'},
              },
            },
          },
        },
      },
    },
  })
  async syncBatchToShopify(
    @requestBody({
      description: 'Opciones para la sincronización por lotes',
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              batchSize: {type: 'number', default: 100},
              productIds: {
                type: 'array',
                items: {type: 'number'},
                nullable: true,
              },
              limit: {type: 'number', default: 1, nullable: true, },
              merchant: {type: 'number', default: 1, nullable: true, },
            },
          },
        },
      },
    })
    options?: SyncBatchRequest,
    @inject('services.QueueService')
    queueService?: QueueService,
  ): Promise<{
    totalProducts: number;
    batchesCreated: number;
    message: string;
  }> {
    const batchSize = options?.batchSize ?? 100;

    // Obtener todos los productos o los específicos si se proporcionan IDs
    let productos: Productos[] = [];

    // console.log(options);

    if (options?.productIds && options.productIds.length > 0) {

      for (const prodId of options.productIds) {
        try {
          const product = await this.productosRepository.findByIdMine(prodId);
          if (product)
            productos.push(product);
        } catch (error) {
          console.log(`🔥 Omitiendo ID:${prodId}, ERROR: ${error.toString()}`)
        }

      }

    } else {

      productos = await this.productosRepository.findByMerchant(options?.merchant ?? 1, {
        //where: {activo: 1},
        limit: options?.limit ?? 10
      });
    }

    // Transformar productos al formato de Shopify
    const shopifyProducts: ProductData[] = productos.map(producto => {
      return this.mapToShopifyFormat(producto, producto.unidadId)
    });

    // console.log(JSON.stringify(shopifyProducts))

    // Procesar en lotes
    const batches: ProductData[][] = [];
    for (let i = 0; i < shopifyProducts.length; i += batchSize) {
      batches.push(shopifyProducts.slice(i, i + batchSize));
    }

    // Añadir lotes a la cola
    if (queueService) {
      for (const batch of batches) {
        await queueService.addProductBatchToSync(batch);
      }

    } else {
      throw new Error('QueueService no está disponible');
    }

    return {
      totalProducts: shopifyProducts.length,
      batchesCreated: batches.length,
      message: `Sincronización masiva iniciada. ${shopifyProducts.length} productos en ${batches.length} lotes de ${batchSize}.`,
    };
  }

  @get('/productos/{id}')
  @response(200, {
    description: 'Productos model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Productos, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number
  ): Promise<ProductosWithRelations> {
    const d = await this.productosRepository.findByIdMine(id);
    return d;
  }

  @post('/productos/{id}/sync-to-shopify', {
    responses: {
      '200': {
        description: 'Sincronizar producto con Shopify',
        content: {'application/json': {schema: {'x-ts-type': 'Object'}}},
      },
    },
  })
  async syncToShopify(
    @param.path.number('id') id: number,
  ): Promise<object> {
    // 1. Obtener el producto de tu base de datos
    const producto = await this.productosRepository.findByIdMine(id);



    // 2. Transformar a formato Shopify
    const shopifyProduct = this.mapToShopifyFormat(producto, id);
    console.log('Producto', shopifyProduct)
    // 3. Sincronizar con Shopify
    const result = await this.shopifyService.createShopifyProduct(shopifyProduct);

    //  4. Actualizar el producto con el ID de Shopify

    const error = {};//await this.updateUnidadesData(result, id);



    return {...result, error};
  }
  */

  //------END BLOCK ------------------------------------------------------------


  //--------- BLOCK endpoints CRUD ---------------------------------------------
  /*

  @post('/productos')
  @response(200, {
    description: 'Productos model instance',
    content: {'application/json': {schema: getModelSchemaRef(Productos)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Productos, {
            title: 'NewProductos',
            exclude: ['unidad_id'],
          }),
        },
      },
    })
    productos: Omit<Productos, 'unidad_id'>,
  ): Promise<Productos> {
    return this.productosRepository.create(productos);
  }

  @get('/productos/count')
  @response(200, {
    description: 'Productos model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Productos) where?: Where<Productos>,
  ): Promise<Count> {
    return this.productosRepository.count(where);
  }

  @get('/productos')
  @response(200, {
    description: 'Array of Productos model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Productos, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Productos) filter?: Filter<Productos>,
  ): Promise<Productos[]> {
    return this.productosRepository.find(filter);
  }

  @patch('/productos')
  @response(200, {
    description: 'Productos PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Productos, {partial: true}),
        },
      },
    })
    productos: Productos,
    @param.where(Productos) where?: Where<Productos>,
  ): Promise<Count> {
    return this.productosRepository.updateAll(productos, where);
  }

  @patch('/productos/{id}')
  @response(204, {
    description: 'Productos PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Productos, {partial: true}),
        },
      },
    })
    productos: Productos,
  ): Promise<void> {
    await this.productosRepository.updateById(id, productos);
  }

  @put('/productos/{id}')
  @response(204, {
    description: 'Productos PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() productos: Productos,
  ): Promise<void> {
    await this.productosRepository.replaceById(id, productos);
  }

  @del('/productos/{id}')
  @response(204, {
    description: 'Productos DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.productosRepository.deleteById(id);
  }
    */

  //--------- END BLOCK --------------------------------------------------------


  //---BLOCK funciones auxiliares ----------------------------------------------

  /**
   * Función auxiliar para crear lotes
   */
  private createBatches(products: {unidadId: number, merchantId: number}[] /*ProductData[]*/, batchSize: number): /*ProductData[]*/ {unidadId: number, merchantId: number}[][] {
    const batches: /*ProductData[]*/{unidadId: number, merchantId: number}[][] = [];
    for (let i = 0; i < products.length; i += batchSize) {
      batches.push(products.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * actualiza el id de shopify y los datos de imagen sincronizadada en la tabla de unidades
   * @param result
   * @param id
   * @returns
   */
  public async updateUnidadesData(result: any, id: number): Promise<any> {
    //  4. Actualizar el producto con el ID de Shopify
    let error = {};
    try {
      const updSyncroData = result.imagen;
      if (result.imagen !== undefined)
        await this.productosRepository.execute(`UPDATE unidades SET shopify_id=?, syncro_data=? WHERE id=?;`, [result.shopifyId, JSON.stringify(updSyncroData), id]);
      else
        await this.productosRepository.execute(`UPDATE unidades SET shopify_id=? WHERE id=?;`, [result.shopifyId, id]);


    } catch (errorMsg) {
      error = errorMsg;
      console.error('Error', error);
    }
    return error;
  }

  /**
   * Mapea el modelo Productos al formato esperado por Shopify
   */
  private mapToShopifyFormat(producto: Productos, id: number): ProductData {

    return {
      title: producto.titulo ?? '',
      description: producto.descripcion,
      vendor: producto?.extraData?.inst_educ_propietaria ?? '',
      productType: producto?.extraData?.product_type ?? 'Curso',
      // status: producto?.publicado ? 'active' : 'draft',
      // variants: [{
      price: producto.precio ?? 0,
      sku: producto.codigo ?? '',
      // inventory_management: 'shopify',
      // }],
      locations_data: [],
      metafields: this.getShopifyMetafields(producto, id),
      imagenWeb: producto.imagenWeb ?? undefined,// url !== producto.imagenWeb ? producto.imagenWeb : undefined,
      tituloComercial: producto.tituloComercial ?? undefined,
      handle: producto.url,
      seo: producto.descripcionSeo ? {
        description: producto.descripcionSeo ?? undefined
      } : undefined,
      syncro_data: producto?.extraData.syncro_data ?? undefined,
      shopifyId: producto?.extraData?.shopify_id,
      unidadId: id
    };
  }

  /**
   * Genera los metacampos específicos para Shopify
   */
  private getShopifyMetafields(producto: Productos, id: number): Metafield[] {

    try {
      // console.log('IEP', producto.extraData?.inst_educ_propietaria)
      const collec = `${producto.extraData.colecciones_shopify} ${producto.extraData.colecciones_shopify && producto.extraData?.inst_educ_propietaria && ','} ${producto.extraData?.inst_educ_propietaria}`
      // console.log('COLLECT', collec);


      const idiomas = [...new Set([producto.extraData?.idioma_shopify ?? null, producto.extraData.idiomas_relacionados ? producto.extraData.idiomas_relacionados : null].filter(Boolean).flat())];

      return [
        {
          namespace: 'custom',
          key: 'codigo_scorm',
          value: producto.extraData.cod_scorm ?? "",
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'institucion_educativa_propietaria',
          value: producto.extraData.inst_educ_propietaria ?? "",
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'subfamilia',
          value: producto.extraData.subfamilia ?? "",
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'familia',
          value: producto.extraData.familia ?? "",
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'mylxp_url',
          value: producto.extraData.url_mylxp ?? "",
          type: 'url'
        },
        {
          namespace: 'custom',
          key: 'plataforma_online_url',
          value: producto.extraData.plat_online_url ?? "",
          type: 'url'
        },
        {
          namespace: 'custom',
          key: 'plataforma_online_nombre',
          value: producto.extraData.plat_online_name ?? "",
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'collection_shopify',
          value: collec,
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'escuela',
          value: producto.extraData.escuela_shopify ?? "",
          type: 'metaobject_reference'
        },
        {
          namespace: 'custom',
          key: 'creditos_universitarios',
          value: producto.extraData.creditos_productos_shopify ? JSON.stringify(producto.extraData.creditos_productos_shopify) : "",
          type: 'list.metaobject_reference'
        },
        {
          namespace: 'custom',
          key: 'creditos',
          value: producto.extraData.creditos ? producto.extraData.creditos.toString() : "",
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'nivel_educativo',
          value: producto.extraData.nivel_educativo_shopify ? JSON.stringify([producto.extraData.nivel_educativo_shopify]) : "",
          type: 'list.metaobject_reference'
        },
        {
          namespace: 'custom',
          key: 'area',
          value: producto.extraData.area_shopify ? JSON.stringify([producto.extraData.area_shopify]) : "",
          type: 'list.metaobject_reference'
        },
        {
          namespace: 'custom',
          key: 'facultad',
          value: producto.extraData.facultad_shopify ? JSON.stringify([producto.extraData.facultad_shopify]) : "",
          type: 'list.metaobject_reference'
        },
        {
          namespace: 'custom',
          key: 'idiomas_curso',
          value: producto.extraData.idioma_shopify ? JSON.stringify(idiomas) : "",
          type: 'list.metaobject_reference'
        },
        {
          namespace: 'custom',
          key: 'nombre_idioma_producto',
          value: producto.extraData?.idioma_nombre ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'instituciones_educativas_en_producto',
          value: JSON.stringify(producto.institucionesEducativasIds),
          type: 'list.metaobject_reference'
        },
        {
          namespace: 'custom',
          key: 'para_que_te_prepara',
          value: producto.paraQueTePrepara ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'descripcion_metodologia',
          value: producto.descripcionMetodologia ?? '',
          type: 'multi_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'temario',
          value: producto.temario ?? '',
          type: 'multi_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'titulo_temario',
          value: producto.temarioTitulo ?? '',
          type: 'multi_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'certificado_digital',
          value: producto.certificadoDigital ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'becas_financiacion',
          value: producto.becasFinanciacion ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'baremable_oposiciones',
          value: producto.baremableOposiciones ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'a_quien_va_dirigido',
          value: producto.aQuienVaDirigido ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'convocatoria',
          value: producto.convocatoria ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'competencias_academicas',
          value: producto.competenciasAcademicas ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'objetivos',
          value: producto.objetivos ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'salidas_profesionales',
          value: producto.salidasLaborales ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'competencias_academicas',
          value: producto.competenciasAcademicas ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'requisitos',
          value: producto.requisitos ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'url_video',
          value: producto.urlReferenciaVideo?.toString() ?? '',
          type: 'url'
        },
        {
          namespace: 'custom',
          key: 'caracter_oficial_value',
          value: producto.caracterOficial ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'titulacion',
          value: producto.titulacion ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'convalidaciones',
          value: producto.convalidaciones ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'id_curso',
          value: id?.toString() ?? '',
          type: 'number_integer'
        },
        {
          namespace: 'custom',
          key: 'duracion',
          value: producto.duracion?.toString() ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'unidad_tiempo',
          value: producto.extraData.unidad_tiempo ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'modalidad',
          value: producto.extraData.modalidad ?? '',
          type: 'single_line_text_field'
        },
        {
          namespace: 'custom',
          key: 'diplomas_certificados',
          value: producto.extraData.url_imagenes_diplomas ? JSON.stringify(producto.extraData.url_imagenes_diplomas) : '',
          type: 'list.url'
        },
        {
          namespace: 'custom',
          key: 'logos_certificados',
          value: producto.extraData.url_imagenes_logos ? JSON.stringify(producto.extraData.url_imagenes_logos) : '',
          type: 'list.url'
        },
        {
          namespace: 'custom',
          key: 'productos_relacionados_por_idiomas',
          value: producto.extraData.productos_relacionados_idioma ? JSON.stringify(producto.extraData.productos_relacionados_idioma) : '',
          type: 'list.product_reference'
        },
      ];

    } catch (error) {
      console.log('ERROR DETECTED ON METAFIELDS ', error);
      return [];
    }

  }


  //--------- END BLOCK --------------------------------------------------------


}
