/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import {inject} from '@loopback/core';
import {
  repository
} from '@loopback/repository';
import {
  param,
  post,
  requestBody
} from '@loopback/rest';
import {IdiomasRepository} from '../repositories';
import {MerchantCredentialsService} from '../services/merchant-credentials.service';
import {IdiomasInterface, ShopifyService, SyncResults} from '../services/shopify.service';

export class IdiomasController {
  constructor(
    @repository(IdiomasRepository)
    public idiomasRepository: IdiomasRepository,
    @inject('services.ShopifyService')
    public shopifyService: ShopifyService,
    @inject('services.MerchantCredentialsService')
    private merchantCredentials: MerchantCredentialsService,
  ) { }

  @post('/idiomas/sync-to-shopify/{merchant_id}')
  async syncronizeIdiomas(
    @param.path.number('merchant_id') merchantId: number,
    @requestBody() dataIN: any
  ): Promise<{
    syncedData: IdiomasInterface[];
    syncResult: SyncResults;
  }> {
    try {

      // -------- BLOCK ajustes de credenciales ----------------
      // 1. Obtener credenciales del merchant
      const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);

      // 2. Configurar el servicio Shopify con estas credenciales
      await this.shopifyService.setCredentials(credentials);
      //--------- END BLOCK -----------------------------------

      // 1. Obtener datos de forma eficiente (await faltante en la versión original)
      const data = await this.idiomasRepository.find();
      const idiomaData = data.map(f => ({id_idioma: f.id, idioma: f.nombre, prefijo_idioma: f.iso})) as IdiomasInterface[];
      // console.log(facultadesData)

      // 2. Validar que hay datos antes de continuar
      if (!idiomaData || idiomaData.length === 0) {
        throw new Error('No se encontraron Idiomas para sincronizar');
      }

      // 3. Sincronizar con Shopify
      const syncResult = await this.shopifyService.syncronizeIdiomas(idiomaData, this.idiomasRepository, merchantId);

      // 5. Retornar estructura tipada con ambos conjuntos de datos
      return {
        syncedData: [],// creditosData,
        syncResult: syncResult
      };

    } catch (error) {
      // 6. Manejo centralizado de errores
      console.error('Error en syncronizeIdiomas:', error instanceof Error ? error.message : 'Error desconocido');
      throw error; // Re-lanzar para manejo superior
    }
  }

  /*
  @post('/idiomas')
  @response(200, {
    description: 'Idiomas model instance',
    content: {'application/json': {schema: getModelSchemaRef(Idiomas)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Idiomas, {
            title: 'NewIdiomas',
            exclude: ['id'],
          }),
        },
      },
    })
    idiomas: Omit<Idiomas, 'id'>,
  ): Promise<Idiomas> {
    return this.idiomasRepository.create(idiomas);
  }

  @get('/idiomas/count')
  @response(200, {
    description: 'Idiomas model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Idiomas) where?: Where<Idiomas>,
  ): Promise<Count> {
    return this.idiomasRepository.count(where);
  }

  @get('/idiomas')
  @response(200, {
    description: 'Array of Idiomas model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Idiomas, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Idiomas) filter?: Filter<Idiomas>,
  ): Promise<Idiomas[]> {
    return this.idiomasRepository.find(filter);
  }

  @patch('/idiomas')
  @response(200, {
    description: 'Idiomas PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Idiomas, {partial: true}),
        },
      },
    })
    idiomas: Idiomas,
    @param.where(Idiomas) where?: Where<Idiomas>,
  ): Promise<Count> {
    return this.idiomasRepository.updateAll(idiomas, where);
  }

  @get('/idiomas/{id}')
  @response(200, {
    description: 'Idiomas model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Idiomas, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Idiomas, {exclude: 'where'}) filter?: FilterExcludingWhere<Idiomas>
  ): Promise<Idiomas> {
    return this.idiomasRepository.findById(id, filter);
  }

  @patch('/idiomas/{id}')
  @response(204, {
    description: 'Idiomas PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Idiomas, {partial: true}),
        },
      },
    })
    idiomas: Idiomas,
  ): Promise<void> {
    await this.idiomasRepository.updateById(id, idiomas);
  }

  @put('/idiomas/{id}')
  @response(204, {
    description: 'Idiomas PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() idiomas: Idiomas,
  ): Promise<void> {
    await this.idiomasRepository.replaceById(id, idiomas);
  }

  @del('/idiomas/{id}')
  @response(204, {
    description: 'Idiomas DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.idiomasRepository.deleteById(id);
  }
    */
}
