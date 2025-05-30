/* eslint-disable @typescript-eslint/naming-convention */
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
import {InstitucionesEducativas} from '../models';
import {InstitucionesEducativasRepository} from '../repositories';
import {InstitucionesEducativasInterface, ShopifyService, SyncResults} from '../services/shopify.service';

export class InstitucionesEducativasController {
  constructor(
    @repository(InstitucionesEducativasRepository)
    public institucionesEducativasRepository: InstitucionesEducativasRepository,
    @inject('services.ShopifyService')
    public shopifyService: ShopifyService,
  ) { }

  @get('/instituciones-educativas/sync-to-shopify')
  @response(200, {
    description: 'Sincronize Array of Instituciones Educaivas',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(InstitucionesEducativas, {includeRelations: true}),
        },
      },
    },
  })
  async syncronizeInstitucionesEducativas(): Promise<{
    syncedData: InstitucionesEducativasInterface[];
    syncResult: SyncResults;
  }> {
    try {
      // 1. Obtener datos de forma eficiente (await faltante en la versión original)
      const data = await this.institucionesEducativasRepository.find();
      const institutionsData = data.map(f => ({id_institucion_educativa: f.id, nombre: f.nombre, logo: f.logo})) as InstitucionesEducativasInterface[];
      // console.log(facultadesData)

      // 2. Validar que hay datos antes de continuar
      if (!institutionsData || institutionsData.length === 0) {
        throw new Error('No se encontraron facultades para sincronizar');
      }

      // 3. Sincronizar con Shopify
      const syncResult = await this.shopifyService.syncronizeInstitucionesEducativas(institutionsData, this.institucionesEducativasRepository);

      // 4. Logging más informativo
      // console.log('Sincronización completada:', syncResult);

      // 5. Retornar estructura tipada con ambos conjuntos de datos
      return {
        syncedData: [],// creditosData,
        syncResult: syncResult
      };

    } catch (error) {
      // 6. Manejo centralizado de errores
      console.error('Error en syncronizeCredits:', error instanceof Error ? error.message : 'Error desconocido');
      throw error; // Re-lanzar para manejo superior
    }
  }

  @post('/instituciones-educativas')
  @response(200, {
    description: 'InstitucionesEducativas model instance',
    content: {'application/json': {schema: getModelSchemaRef(InstitucionesEducativas)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InstitucionesEducativas, {
            title: 'NewInstitucionesEducativas',
            exclude: ['id'],
          }),
        },
      },
    })
    institucionesEducativas: Omit<InstitucionesEducativas, 'id'>,
  ): Promise<InstitucionesEducativas> {
    return this.institucionesEducativasRepository.create(institucionesEducativas);
  }

  @get('/instituciones-educativas/count')
  @response(200, {
    description: 'InstitucionesEducativas model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(InstitucionesEducativas) where?: Where<InstitucionesEducativas>,
  ): Promise<Count> {
    return this.institucionesEducativasRepository.count(where);
  }

  @get('/instituciones-educativas')
  @response(200, {
    description: 'Array of InstitucionesEducativas model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(InstitucionesEducativas, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(InstitucionesEducativas) filter?: Filter<InstitucionesEducativas>,
  ): Promise<InstitucionesEducativas[]> {
    return this.institucionesEducativasRepository.find(filter);
  }

  @patch('/instituciones-educativas')
  @response(200, {
    description: 'InstitucionesEducativas PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InstitucionesEducativas, {partial: true}),
        },
      },
    })
    institucionesEducativas: InstitucionesEducativas,
    @param.where(InstitucionesEducativas) where?: Where<InstitucionesEducativas>,
  ): Promise<Count> {
    return this.institucionesEducativasRepository.updateAll(institucionesEducativas, where);
  }

  @get('/instituciones-educativas/{id}')
  @response(200, {
    description: 'InstitucionesEducativas model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(InstitucionesEducativas, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(InstitucionesEducativas, {exclude: 'where'}) filter?: FilterExcludingWhere<InstitucionesEducativas>
  ): Promise<InstitucionesEducativas> {
    return this.institucionesEducativasRepository.findById(id, filter);
  }

  @patch('/instituciones-educativas/{id}')
  @response(204, {
    description: 'InstitucionesEducativas PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(InstitucionesEducativas, {partial: true}),
        },
      },
    })
    institucionesEducativas: InstitucionesEducativas,
  ): Promise<void> {
    await this.institucionesEducativasRepository.updateById(id, institucionesEducativas);
  }

  @put('/instituciones-educativas/{id}')
  @response(204, {
    description: 'InstitucionesEducativas PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() institucionesEducativas: InstitucionesEducativas,
  ): Promise<void> {
    await this.institucionesEducativasRepository.replaceById(id, institucionesEducativas);
  }

  @del('/instituciones-educativas/{id}')
  @response(204, {
    description: 'InstitucionesEducativas DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.institucionesEducativasRepository.deleteById(id);
  }
}
