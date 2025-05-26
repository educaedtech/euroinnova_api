import {inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  requestBody,
  response,
} from '@loopback/rest';
import {CreditosProductos} from '../models';
import {CreditosProductosRepository} from '../repositories';
import {CreditsInterface, ShopifyService, SyncResults} from '../services/shopify.service';

export class CreditosController {
  constructor(
    @repository(CreditosProductosRepository)
    public creditosProductosRepository: CreditosProductosRepository,
    @inject('services.ShopifyService')
    public shopifyService: ShopifyService,
  ) { }


  @get('/creditos/sync-to-shopify')
  @response(200, {
    description: 'Sincronize Array of CreditosProductos',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CreditosProductos, {includeRelations: true}),
        },
      },
    },
  })
  async syncronizeCredits(): Promise<{
    syncedData: CreditsInterface[];
    syncResult: SyncResults;
  }> {
    try {
      // 1. Obtener datos de forma eficiente (await faltante en la versión original)
      const creditosData = await this.creditosProductosRepository.find() as CreditsInterface[];

      // 2. Validar que hay datos antes de continuar
      if (!creditosData || creditosData.length === 0) {
        throw new Error('No se encontraron créditos para sincronizar');
      }

      // 3. Sincronizar con Shopify
      const syncResult = await this.shopifyService.syncronizeCredits(creditosData, this.creditosProductosRepository);

      // 4. Logging más informativo
      console.log('Sincronización completada:', syncResult);

      // 5. Retornar estructura tipada con ambos conjuntos de datos
      return {
        syncedData: [],// creditosData,
        syncResult
      };

    } catch (error) {
      // 6. Manejo centralizado de errores
      console.error('Error en syncronizeCredits:', error instanceof Error ? error.message : 'Error desconocido');
      throw error; // Re-lanzar para manejo superior
    }
  }


  @post('/creditos-productos')
  @response(200, {
    description: 'CreditosProductos model instance',
    content: {'application/json': {schema: getModelSchemaRef(CreditosProductos)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreditosProductos, {
            title: 'NewCreditosProductos',
            exclude: ['id'],
          }),
        },
      },
    })
    creditosProductos: Omit<CreditosProductos, 'id'>,
  ): Promise<CreditosProductos> {
    return this.creditosProductosRepository.create(creditosProductos);
  }

  @get('/creditos-productos/count')
  @response(200, {
    description: 'CreditosProductos model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(CreditosProductos) where?: Where<CreditosProductos>,
  ): Promise<Count> {
    return this.creditosProductosRepository.count(where);
  }

  @get('/creditos-productos')
  @response(200, {
    description: 'Array of CreditosProductos model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CreditosProductos, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(CreditosProductos) filter?: Filter<CreditosProductos>,
  ): Promise<CreditosProductos[]> {
    return this.creditosProductosRepository.find(filter);
  }

  @patch('/creditos-productos')
  @response(200, {
    description: 'CreditosProductos PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreditosProductos, {partial: true}),
        },
      },
    })
    creditosProductos: CreditosProductos,
    @param.where(CreditosProductos) where?: Where<CreditosProductos>,
  ): Promise<Count> {
    return this.creditosProductosRepository.updateAll(creditosProductos, where);
  }

  @get('/creditos-productos/{id}')
  @response(200, {
    description: 'CreditosProductos model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(CreditosProductos, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(CreditosProductos, {exclude: 'where'}) filter?: FilterExcludingWhere<CreditosProductos>
  ): Promise<CreditosProductos> {
    return this.creditosProductosRepository.findById(id, filter);
  }

  @patch('/creditos-productos/{id}')
  @response(204, {
    description: 'CreditosProductos PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CreditosProductos, {partial: true}),
        },
      },
    })
    creditosProductos: CreditosProductos,
  ): Promise<void> {
    await this.creditosProductosRepository.updateById(id, creditosProductos);
  }

  @put('/creditos-productos/{id}')
  @response(204, {
    description: 'CreditosProductos PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() creditosProductos: CreditosProductos,
  ): Promise<void> {
    await this.creditosProductosRepository.replaceById(id, creditosProductos);
  }

  @del('/creditos-productos/{id}')
  @response(204, {
    description: 'CreditosProductos DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.creditosProductosRepository.deleteById(id);
  }
}
