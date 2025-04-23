/* eslint-disable @typescript-eslint/naming-convention */
import {inject} from '@loopback/core';
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

export class ProductosController {
  constructor(
    @repository(ProductosRepository)
    public productosRepository: ProductosRepository,
    @inject('services.ShopifyService')
    public shopifyService: ShopifyService,
  ) { }

  /*
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
  ): Promise<Productos> {
    return this.productosRepository.findById(id);
  }

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
    const producto = await this.productosRepository.findById(id);

    // 2. Transformar a formato Shopify
    const shopifyProduct = this.mapToShopifyFormat(producto);

    // 3. Sincronizar con Shopify
    const result = await this.shopifyService.createShopifyProduct(shopifyProduct);

    // // 4. Actualizar el producto con los IDs de Shopify si es necesario
    // if (result.success) {
    //   await this.productosRepository.updateById(id, {
    //     shopifyId: result.shopifyId,
    //     shopifyVariantId: result.variantId,
    //     updatedAt: new Date(),
    //   });
    // }

    return result;
  }

  /**
   * Mapea el modelo Productos al formato esperado por Shopify
   */
  private mapToShopifyFormat(producto: Productos): ProductData {
    return {
      title: producto.titulo ?? '',
      description: producto.descripcion,
      vendor: 'Euroinnova',
      productType: 'Curso',
      // status: producto.publicado ? 'active' : 'draft',
      // variants: [{
      price: producto.precio ?? 0,
      sku: producto.codigo ?? '',
      // inventory_management: 'shopify',
      // }],
      locations_data: [],
      metafields: this.getShopifyMetafields(producto),
      imagenWeb: producto.imagenWeb ?? undefined,
      tituloComercial: producto.tituloComercial ?? undefined,
      handle: producto.url,
      seo: producto.descripcionSeo ? {
        description: producto.descripcionSeo ?? undefined
      } : undefined
    };
  }

  /**
   * Genera los metacampos específicos para Shopify
   */
  private getShopifyMetafields(producto: Productos): Metafield[] {
    return [
      {
        namespace: 'custom',
        key: 'para_que_te_prepara',
        value: producto.paraQueTePrepara ?? '',
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
        key: 'video_name',
        value: producto.urlReferenciaVideo ?? '',
        type: 'single_line_text_field'
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


    ];
  }


}
