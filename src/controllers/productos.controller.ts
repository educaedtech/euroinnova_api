/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import {inject} from '@loopback/core';
import {
  repository
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
  post,
  response
} from '@loopback/rest';
import {Productos, ProductosWithRelations} from '../models';
import {ProductosRepository} from '../repositories';
import {Metafield, ProductData, ShopifyService} from '../services/shopify.service';

// seccion para sincronizacion en lotes (jobs)
import {requestBody} from '@loopback/rest';
import {QueueService} from '../services/queue.service';

//  interfaz para el request body
interface SyncBatchRequest {
  batchSize?: number;
  productIds?: number[]; // Opcional: para sincronizar productos específicos
}

export class ProductosController {
  constructor(
    @repository(ProductosRepository)
    public productosRepository: ProductosRepository,
    @inject('services.ShopifyService')
    public shopifyService: ShopifyService,
  ) { }

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
    const productos: Productos[] = [];

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
      console.log('desarrollar paginacion para el envio de colas y acceso a datos');
      // productos = (await this.productosRepository.find()).slice(10);
    }

    // Transformar productos al formato de Shopify
    const shopifyProducts: ProductData[] = productos.map(producto => {
      return this.mapToShopifyFormat(producto, producto.unidadId)
    }

    );

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
  }*/



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
    // console.log('Producto', shopifyProduct)
    // 3. Sincronizar con Shopify
    const result = await this.shopifyService.createShopifyProduct(shopifyProduct);

    //  4. Actualizar el producto con el ID de Shopify

    const error = await this.updateUnidadesData(result, id);
    // let error = {};
    // try {
    //   const updSyncroData = result.imagen;
    //   await this.productosRepository.execute(`UPDATE unidades SET shopify_id=?, syncro_data=? WHERE id=?;`, [result.shopifyId, JSON.stringify(updSyncroData), id]);
    // } catch (errorMsg) {
    //   error = errorMsg;
    //   console.log('Error', error)
    // }


    return {...result, error};
  }


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
    const url = producto?.extraData.syncro_data?.url ?? null;

    // console.log(url)
    // console.log(producto.imagenWeb);
    // console.log(producto.extraData)
    return {
      title: producto.titulo ?? '',
      description: producto.descripcion,
      vendor: 'Euroinnova',
      productType: 'Curso',
      // status: producto?.publicado ? 'active' : 'draft',
      // variants: [{
      price: producto.precio ?? 0,
      sku: producto.codigo ?? '',
      // inventory_management: 'shopify',
      // }],
      locations_data: [],
      metafields: this.getShopifyMetafields(producto, id),
      imagenWeb: url !== producto.imagenWeb ? producto.imagenWeb : undefined,
      tituloComercial: producto.tituloComercial ?? undefined,
      handle: producto.url,
      seo: producto.descripcionSeo ? {
        description: producto.descripcionSeo ?? undefined
      } : undefined,
      // syncro_data: {url: producto?.syncro_data.url ?? '', idShopi: producto?.syncro_data.idShopi ?? ''}
    };
  }

  /**
   * Genera los metacampos específicos para Shopify
   */
  private getShopifyMetafields(producto: Productos, id: number): Metafield[] {

    try {

      const idiomas = [...new Set([producto.extraData?.idioma_shopify ?? null, producto.extraData.idiomas_relacionados ? producto.extraData.idiomas_relacionados : null].filter(Boolean).flat())];
      // console.log(idiomas)
      return [
        {
          namespace: 'custom',
          key: 'coleccion_shopify',
          value: producto.extraData.colecciones_shopify ?? "",
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


}
