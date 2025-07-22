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
import fetch from 'node-fetch';
import {LoggerService} from '../services/logger.service';
import {MerchantCredentialsService} from '../services/merchant-credentials.service';
import {QueueService} from '../services/queue.service';


// type ProductItem = {
//   id: string;
//   handle: string;
//   sku: string;
// };

// type GroupedDuplicate = {
//   sku: string;
//   products: ProductItem[];
// };
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



  //verificando productos con sku vacios
  @post('/productos/verificando-shopify-vs-db/{merchant_id}')
  async productEmptySKU(
    @param.path.number('merchant_id') merchantId: number,
    @requestBody({
      description: 'Verificando productos entre shopify y la base de datos',
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
  ): Promise<
    {
      ProductosEnShopify: number;
      ProductosActivosEnBD: number;
      pasarADraft: number;
      pasarAActive: number;
      success: Boolean;
      errors: any[]
    }> {

    // -------- BLOCK ajustes de credenciales ----------------
    // 1. Obtener credenciales del merchant
    const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);

    // 2. Configurar el servicio Shopify con estas credenciales
    await this.shopifyService.setCredentials(credentials);
    //--------- END BLOCK -----------------------------------

    const productos = await this.shopifyService.getAllShopifyProductsRepeated();
    console.log('Productos en Shopify', productos.length);

    const qDB = `SELECT u.id,p.codigo as sku, p.url as handle, p.precio, um.activo FROM productos p JOIN unidades u JOIN unidades_merchants um ON um.unidad_id =u.id AND u.id=p.unidad_id AND um.merchant_id =?`;
    let cursosRelacionados = await this.productosRepository.execute(qDB, [merchantId]);
    cursosRelacionados = Array.isArray(cursosRelacionados) ? cursosRelacionados : [];
    console.log('Productos Activos en BD', cursosRelacionados.length)

    console.log(cursosRelacionados[0])
    // const dbByIdUnidad = cursosRelacionados.map((c: {id: any;}) => c.id.toString());
    const dbByIdUnidad = new Set(cursosRelacionados.map((c: {id: {toString: () => any;};}) => c.id.toString()));
    // Índices de referencia rápida por SKU
    const dbBySku = new Map<string, any>();
    if (Array.isArray(cursosRelacionados)) {
      for (const curso of cursosRelacionados) {
        if (curso.sku && curso.sku.trim() !== '') {
          dbBySku.set(curso.sku.trim(), curso);
        }
      }
    }
    // // Paso 1: obtener IDs del segundo array
    // const cursosRelacionadosIds = new Set(cursosRelacionados.map((c: {id: any;}) => c.id.toString()));

    // Paso 2: clasificar
    const debenEstarEnDraft = [];
    const debenActivarse = [];
    const emptySKUProducts = []; //buscando los productos con SKU vacios
    const priceEmptyProducts = []; //buscando los productos con precio vacio
    const priceCeroProducts = []; //buscando los producntos con precio 0
    const deleteProducts = []; //buscando los productos que deben ser eliminados (proque estan en shopify, pero no existen en la BD)


    const idCursosInShopify = [];
    for (const producto of productos) {
      const {idCurso, handle, status, id, sku, price} = producto;

      idCursosInShopify.push(idCurso);

      if ((sku === '' || sku === null || sku === undefined) && (status === 'ACTIVE'))
        emptySKUProducts.push({idCurso, id, status, price}); //agregando los productos con SKU vacios

      if (price === '' || price === null || price === undefined)
        priceEmptyProducts.push({idCurso, id, status, price}); //agregando los productos con precio vacio

      const priceValue = parseFloat(price);
      if (!isNaN(priceValue) && priceValue === 0) {
        priceCeroProducts.push({idCurso, id, status, price});//agregando los productos con precio vacio
      }

      if (idCurso !== '12312' && !dbByIdUnidad.has(idCurso)) {
        deleteProducts.push({idCurso, id, status, sku, handle});
      }

    }

    console.log('emptySKUProducts', emptySKUProducts.slice(0, 3), emptySKUProducts.length)
    //pasando a draft todos los productos que tienen SKU vacio (son aquellos que han sido versionados antes)
    for (const prodShop of emptySKUProducts) {
      await this.shopifyService.updateProductStatus(prodShop.id, 'DRAFT')
    }

    console.log(idCursosInShopify.slice(0, 3), idCursosInShopify.length);
    // console.log(dbByIdUnidad.slice(0, 3), dbByIdUnidad.length)
    console.log('deleteProducts', deleteProducts.slice(0, 3), deleteProducts.length)

    // for (const prd of deleteProducts) {
    //   const del = await this.shopifyService.deleteShopifyProduct(prd.id);
    //   if (del.data.productDelete.userErrors.length === 0)
    //     this.logger.log(`⛔ Product ${prd.id} removed`);
    //   else
    //     this.logger.error(`🧨 Errors on (${prd.id}): ${JSON.stringify(del.data.productDelete.userErrors)}`);
    // }

    // console.log('priceEmptyProducts', priceEmptyProducts.slice(0, 3), priceEmptyProducts.length)
    // console.log('priceCeroProducts', priceCeroProducts.slice(0, 3), priceCeroProducts.length)


    const resultados = this.analizarCambiosProductos(productos, Array.isArray(cursosRelacionados) ? cursosRelacionados : []);
    this.mostrarEstadisticasCambios(resultados);

    // creando los productos que esten en base de datos y no en shopify
    const createProducts = resultados.filter(p => p.operation === 'create');
    for (const element of createProducts) {
      await this.proccessProdHttp(merchantId, element.idCurso);
    }

    // actualizando los productos que esten en base de datos y no coincida el shopify
    const updateProducts = resultados.filter(p => p.operation === 'statusChange');

    for (const element of updateProducts) {
      await this.proccessProdHttp(merchantId, element.idCurso);
    }

    return {
      ProductosEnShopify: productos.length,
      ProductosActivosEnBD: cursosRelacionados.length,
      pasarADraft: debenEstarEnDraft.length,
      pasarAActive: debenActivarse.length,
      success: true,
      errors: []
    };
  }


  //function para mostrar estaidsticas del procesmaiento
  private mostrarEstadisticasCambios(resultados: any[]) {
    const stats = {
      create: 0,
      update: 0,
      statusChange: 0,
      delete: 0,
      none: 0,
    };

    for (const r of resultados) {
      const operation = r.operation as keyof typeof stats;
      if (Object.prototype.hasOwnProperty.call(stats, operation)) {
        stats[operation]++;
      }
    }

    console.log('\n📊 Estadísticas de cambios:');
    console.log(`  ➕ Crear:         ${stats.create}`);
    console.log(`  ➕ Crear (Sample):         ${JSON.stringify(resultados.filter(r => r.operation === 'create')[0])}`);
    console.log(`  🔄 Actualizar:    ${stats.update}`);
    console.log(`  🔄 Actualizar (Sample):    ${JSON.stringify(resultados.filter(r => r.operation === 'update')[0])}`);
    console.log(`  ⚠️ Cambiar estado: ${stats.statusChange}`);
    console.log(`  ⚠️ Cambiar estado (Sample): ${JSON.stringify(resultados.filter(r => r.operation === 'statusChange').slice(0, 3))}`);
    console.log(`  ❌ Eliminar:       ${stats.delete}`);
    console.log(`  ❌ Eliminar (Sample):       ${JSON.stringify(resultados.filter(r => r.operation === 'delete')[0])}`);
    console.log(`  ✅ Sin cambios:    ${stats.none}`);
  }

  /**
 * Compara productos de base de datos contra Shopify.
 *
 * @param productosShopify - Array de productos obtenidos desde Shopify.
 * @param productosBD - Array de productos obtenidos desde la base de datos.
 * @returns Array de objetos que indica qué acción tomar con cada producto.
 */
  private analizarCambiosProductos(productosShopify: any[] = [], productosBD: any[] = []) {
    const resultado = [];

    const productosByIdCurso = new Map<string, any>();

    for (const prodShopify of productosShopify) {
      if (prodShopify.idCurso && prodShopify.sku !== null) {
        productosByIdCurso.set(prodShopify.idCurso.toString(), prodShopify);
      }
    }

    for (const prodBD of productosBD) {
      const idCurso = prodBD.id.toString();
      const prodShopify = productosByIdCurso.get(idCurso);

      if (!prodShopify) {
        // No existe en Shopify => crear
        resultado.push({
          idCurso,
          sku: prodBD.codigo,
          price: prodBD.precio,
          handle: null,
          status: prodBD.activo === 1 ? 'ACTIVE' : 'DRAFT',
          operation: 'create',
        });
        continue;
      }

      const cambios: string[] = [];

      // if (idCurso === '17690')
      //   console.log(prodShopify);

      if (prodBD.sku !== prodShopify.sku && prodShopify.sku !== null) cambios.push('sku');
      if (parseFloat(prodBD.precio) !== parseFloat(prodShopify.price) && prodShopify.sku !== null) cambios.push('price');
      if ((prodShopify.status === 'ACTIVE' ? 1 : 0) !== prodBD.activo) cambios.push('status');

      const operacion =
        cambios.includes('sku') || cambios.includes('price')
          ? 'update'
          : cambios.includes('status')
            ? 'statusChange'
            : 'none';

      resultado.push({
        idCurso,
        idShopify: prodShopify.id,
        sku: prodBD.codigo,
        price: prodBD.precio,
        status: prodBD.activo === 1 ? 'ACTIVE' : 'DRAFT',
        handle: prodShopify.handle,
        operation: operacion,
      });
    }

    // Productos en Shopify que no existen en BD => delete
    for (const prodShopify of productosShopify) {
      const idCurso = prodShopify.idCurso?.toString();
      if (!idCurso || !productosBD.find(p => p.id.toString() === idCurso)) {
        resultado.push({
          idCurso: idCurso || null,
          idShopify: prodShopify.id,
          sku: prodShopify.sku,
          price: prodShopify.price,
          handle: prodShopify.handle,
          operation: 'delete',
        });
      }
    }

    return resultado;
  }


  async proccessProdHttp(merchantId: number, productId: number) {
    try {
      console.log('🔄 [proccessProdHttp] Iniciando solicitud HTTP...', {merchantId, productId});

      const baseUrl = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${process.env.ADMIN_USER}:${process.env.ADMIN_PASSWORD}@${process.env.API_BASE_URL}`;
      const endpoint = `/productos/syncronize/${merchantId}/${productId}`;
      const url = `${baseUrl}${endpoint}`;

      console.log('🔗 URL:', url.replace(/:([^\/]+)@/, ':*****@')); // Oculta la contraseña en logs

      const response = await fetch(url, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('📡 [proccessProdHttp] Respuesta recibida. Status:', response.status);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'No se pudo leer el cuerpo del error');
        throw new Error(`HTTP ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      console.log('✅ [proccessProdHttp] Respuesta exitosa:', JSON.stringify(data, null, 2));

      return data;
    } catch (error) {
      console.error('❌ [proccessProdHttp] Error:', error.message);
      throw error; // Propaga el error para que Bull lo reintente
    }
  }


  /*
    //verificando existencia de productos en base de datos (pasando a DRAFT aquellos que fueron eliminados en BD anteriormente)
    @post('/productos/verificando-existencias/{merchant_id}')
    async productExistencyVerified(
      @param.path.number('merchant_id') merchantId: number,
      @requestBody({
        description: 'Verificando existencia de productos',
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
    ): Promise<
      {
        ProductosEnShopify: number;
        ProductosActivosEnBD: number;
        pasarADraft: number;
        pasarAActive: number;
        success: Boolean;
        errors: any[]
      }> {

      // -------- BLOCK ajustes de credenciales ----------------
      // 1. Obtener credenciales del merchant
      const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);

      // 2. Configurar el servicio Shopify con estas credenciales
      await this.shopifyService.setCredentials(credentials);
      //--------- END BLOCK -----------------------------------

      const productos = await this.shopifyService.getAllShopifyProductsRepeated();
      console.log('Productos en Shopify', productos.length);

      const qDB = `SELECT u.id FROM productos p JOIN unidades u JOIN unidades_merchants um ON um.unidad_id =u.id AND u.id=p.unidad_id AND u.activo=1 AND um.merchant_id =?`;
      const cursosRelacionados = await this.productosRepository.execute(qDB, [merchantId]);
      console.log('Productos Activos en BD', cursosRelacionados.length)


      // Paso 1: obtener IDs del segundo array
      const cursosRelacionadosIds = new Set(cursosRelacionados.map((c: {id: any;}) => c.id.toString()));

      // Paso 2: clasificar
      const debenEstarEnDraft = [];
      const debenActivarse = [];
      const draftProccess = [];
      const activeProccess = [];

      if (cursosRelacionados.length > 0)
        for (const producto of productos) {
          const {idCurso, status, id} = producto;

          if (!cursosRelacionadosIds.has(idCurso) && status === "ACTIVE") {
            // No está en cursosRelacionados ⇒ debe estar en DRAFT
            debenEstarEnDraft.push(idCurso);
            draftProccess.push(id);
          } else if (status === 'DRAFT') {
            // Está en cursosRelacionados pero está en DRAFT ⇒ debe activarse
            debenActivarse.push(idCurso);
            activeProccess.push(id);
          }
        }

      console.log('Deben estar en DRAFT:', debenEstarEnDraft.length, draftProccess[0]);
      console.log('Deben activarse:', debenActivarse.length, activeProccess[0]);

      // for (const id2Draft of draftProccess) {
      //   const rDraft = await this.shopifyService.updateProductStatus(id2Draft, 'draft');
      //   this.logger.log(`🧨 Pass to DRAFT ${id2Draft}, status: ${JSON.stringify(rDraft.data.productSet.userErrors)}`);
      // }
      // for (const id2active of activeProccess) {
      //   const rActive = await this.shopifyService.updateProductStatus(id2active, 'active');
      //   this.logger.log(`✅ Pass to ACTIVE ${id2active}, status: ${JSON.stringify(rActive.data.productSet.userErrors)}`);
      // }


      return {
        ProductosEnShopify: productos.length,
        ProductosActivosEnBD: cursosRelacionados.length,
        pasarADraft: debenEstarEnDraft.length,
        pasarAActive: debenActivarse.length,
        success: true,
        errors: []
      };
    }



    //verificando productos duplicados
    @post('/productos/verificando-duplicidades/{merchant_id}')
    async productDuplicados(
      @param.path.number('merchant_id') merchantId: number,
      @requestBody({
        description: 'Verificando productos duplicados',
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

      // -------- BLOCK ajustes de credenciales ----------------
      // 1. Obtener credenciales del merchant
      const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);

      // 2. Configurar el servicio Shopify con estas credenciales
      await this.shopifyService.setCredentials(credentials);
      //--------- END BLOCK -----------------------------------

      const items = await this.shopifyService.getAllShopifyProductsRepeated();
      console.log(items[0])

      //------------------------------------------------------------------------
      // 1. Agrupar por SKU
      const skuMap: Record<string, ProductItem[]> = {};

      for (const item of items) {
        if (!item.sku) continue; // opcional: ignorar si no hay SKU
        if (!skuMap[item.sku]) {
          skuMap[item.sku] = [];
        }
        skuMap[item.sku].push(item);
      }

      // 2. Filtrar SKUs duplicados
      const duplicatedSkus: GroupedDuplicate[] = Object.entries(skuMap)
        .filter(([_, products]) => products.length > 1)
        .map(([sku, products]) => ({
          sku,
          products,
        }));


      // console.log(duplicatedSkus[0])

      //---------------------------------------------------------
      const ddddd = duplicatedSkus.slice(0, 100);
      // const logFilePath = path.join(__dirname, 'deleted_ids.log');
      for (const dup of ddddd) {
        this.logger.log(`Verificando ${dup.sku}`);

        // SELECT unidad_id,url FROM productos WHERE codigo = "151929-2408"
        const dRes = await this.productosRepository.execute("SELECT unidad_id,LOWER(url) as url FROM productos WHERE codigo = ?", [dup.sku]);

        const d = dRes[0];
        const ids2delete = dup.products?.filter((pd: {handle: any;}) => pd.handle !== d?.url).map(m => m.id);

        // Guarda en log solo si hay IDs para eliminar
        if (ids2delete && ids2delete.length > 0) {

          for (const id of ids2delete) {
            const del = await this.shopifyService.deleteShopifyProduct(id);
            if (del.data.productDelete.userErrors.length === 0)
              this.logger.log(`⛔ Product ${id} removed`);
            else
              this.logger.error(`🧨 Errors on (${id}): ${JSON.stringify(del.data.productDelete.userErrors)}`);
          }

          // fs.appendFileSync(logFilePath, JSON.stringify(logEntry) + '\n', 'utf8');
        }

      }

      return {
        TotalOperations: duplicatedSkus.length,
        success: true,
        errors: []
      };
    }

    */


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

    const removingRelations = await this.productosRepository.execute(`TRUNCATE TABLE unidades_unidades_relacionadas ;`, []);
    console.log('ℹ️ Cleaning Table: unidades_unidades_relacionadas', removingRelations.info);
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
                              COUNT(*) > 1
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
          if (ids[i] !== ids[j])
            inserts.push(
              `INSERT INTO unidades_unidades_relacionadas
              (unidad_id, unidad_relacionada_id,tipo_relacion_id)
             VALUES (${ids[i]}, ${ids[j]},1)
             ON
             DUPLICATE KEY UPDATE unidad_relacionada_id = VALUES(unidad_relacionada_id);`
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
      status: producto?.extraData?.activo === 1 ? 'ACTIVE' : 'DRAFT',
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
      seo: {
        description: producto.metaDescripcion !== null ? producto.metaDescripcion : ' '
      },
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
      // console.log('IEP', producto.extraData)
      const collec = `${producto.extraData.colecciones_shopify} ${(producto.extraData.colecciones_shopify && producto.extraData?.inst_educ_propietaria !== null) ? ',' : ''} ${producto.extraData?.inst_educ_propietaria !== null ? producto.extraData?.inst_educ_propietaria : ''}`
      // console.log('ℹ️ COLLECTIONS', collec);


      const idiomas = [...new Set([producto.extraData?.idioma_shopify ?? null, producto.extraData.idiomas_relacionados ? producto.extraData.idiomas_relacionados : null].filter(Boolean).flat())];

      return [
        {
          namespace: 'custom',
          key: 'pdf_temario',
          value: producto?.extraData?.pdf_temario ?? "",
          type: 'url'
        },
        {
          namespace: 'custom',
          key: 'descripcion_seo',
          value: producto?.extraData?.descripcion_seo ?? '',
          type: 'single_line_text_field'
        },
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
        // {
        //   namespace: 'custom',
        //   key: 'escuela',
        //   value: producto.extraData.escuela_shopify ?? "",
        //   type: 'metaobject_reference'
        // },
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
          value: (producto.temario ?? '').slice(0, 65536),
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
          value: (producto.urlReferenciaVideo?.toString() ?? '').trim(),
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
          value: producto?.convalidaciones ?? '',
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
        // {
        //   namespace: 'custom',
        //   key: 'productos_relacionados_por_idiomas',
        //   value: producto.extraData.productos_relacionados_idioma ? JSON.stringify(producto.extraData.productos_relacionados_idioma) : '',
        //   type: 'list.product_reference'
        // },
      ];

    } catch (error) {
      console.log('ERROR DETECTED ON METAFIELDS ', error);
      return [];
    }

  }


  //--------- END BLOCK --------------------------------------------------------


}
