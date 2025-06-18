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
import {EscuelasRepository} from '../repositories';
import {MerchantCredentialsService} from '../services/merchant-credentials.service';
import {EscuelasInterface, GenInterface, ShopifyService, SyncResults} from '../services/shopify.service';

export class EscuelasController {
  constructor(
    @repository(EscuelasRepository)
    public escuelasRepository: EscuelasRepository,
    @inject('services.ShopifyService')
    public shopifyService: ShopifyService,
    @inject('services.MerchantCredentialsService')
    private merchantCredentials: MerchantCredentialsService,
  ) { }


  @post('/escuelas/sync-to-shopify/{merchant_id}')
  async syncronizeEscuelas(
    @param.path.number('merchant_id') merchantId: number,
    @requestBody() dataIN: any
  ): Promise<{
    syncedData: GenInterface[];
    syncResult: SyncResults;
  }> {
    try {
      // -------- BLOCK ajustes de credenciales ----------------
      // 1. Obtener credenciales del merchant
      const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);

      // 2. Configurar el servicio Shopify con estas credenciales
      this.shopifyService.setCredentials(credentials);
      //--------- END BLOCK -----------------------------------

      // 1. Obtener datos de forma eficiente (await faltante en la versión original)
      const escuelasData = await this.escuelasRepository.find();// as any[];//CreditsInterface[];
      const normalizeData = escuelasData.map(escuela => ({id_escuela: escuela.id, nombre: escuela.nombre, logo: escuela.logo})) as EscuelasInterface[];
      // console.log('escuelasData', normalizeData)
      // 2. Validar que hay datos antes de continuar
      if (!normalizeData || normalizeData.length === 0) {
        throw new Error('No se encontraron areas para sincronizar');
      }

      // 3. Sincronizar con Shopify
      const syncResult = await this.shopifyService.syncronizeEscuelas(normalizeData, this.escuelasRepository, merchantId);

      // 5. Retornar estructura tipada con ambos conjuntos de datos
      return {
        syncedData: [],// creditosData,
        syncResult
      };

    } catch (error) {
      // 6. Manejo centralizado de errores
      console.error('Error en syncronizeEscuelas:', error instanceof Error ? error.message : 'Error desconocido');
      throw error; // Re-lanzar para manejo superior
    }
  }

  /*
    @post('/escuelas')
    @response(200, {
      description: 'Escuelas model instance',
      content: {'application/json': {schema: getModelSchemaRef(Escuelas)}},
    })
    async create(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Escuelas, {
              title: 'NewEscuelas',
              exclude: ['id'],
            }),
          },
        },
      })
      escuelas: Omit<Escuelas, 'id'>,
    ): Promise<Escuelas> {
      return this.escuelasRepository.create(escuelas);
    }

    @get('/escuelas/count')
    @response(200, {
      description: 'Escuelas model count',
      content: {'application/json': {schema: CountSchema}},
    })
    async count(
      @param.where(Escuelas) where?: Where<Escuelas>,
    ): Promise<Count> {
      return this.escuelasRepository.count(where);
    }

    @get('/escuelas')
    @response(200, {
      description: 'Array of Escuelas model instances',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Escuelas, {includeRelations: true}),
          },
        },
      },
    })
    async find(
      @param.filter(Escuelas) filter?: Filter<Escuelas>,
    ): Promise<Escuelas[]> {
      return this.escuelasRepository.find(filter);
    }

    @patch('/escuelas')
    @response(200, {
      description: 'Escuelas PATCH success count',
      content: {'application/json': {schema: CountSchema}},
    })
    async updateAll(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Escuelas, {partial: true}),
          },
        },
      })
      escuelas: Escuelas,
      @param.where(Escuelas) where?: Where<Escuelas>,
    ): Promise<Count> {
      return this.escuelasRepository.updateAll(escuelas, where);
    }

    @get('/escuelas/{id}')
    @response(200, {
      description: 'Escuelas model instance',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Escuelas, {includeRelations: true}),
        },
      },
    })
    async findById(
      @param.path.number('id') id: number,
      @param.filter(Escuelas, {exclude: 'where'}) filter?: FilterExcludingWhere<Escuelas>
    ): Promise<Escuelas> {
      return this.escuelasRepository.findById(id, filter);
    }

    @patch('/escuelas/{id}')
    @response(204, {
      description: 'Escuelas PATCH success',
    })
    async updateById(
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Escuelas, {partial: true}),
          },
        },
      })
      escuelas: Escuelas,
    ): Promise<void> {
      await this.escuelasRepository.updateById(id, escuelas);
    }

    @put('/escuelas/{id}')
    @response(204, {
      description: 'Escuelas PUT success',
    })
    async replaceById(
      @param.path.number('id') id: number,
      @requestBody() escuelas: Escuelas,
    ): Promise<void> {
      await this.escuelasRepository.replaceById(id, escuelas);
    }

    @del('/escuelas/{id}')
    @response(204, {
      description: 'Escuelas DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
      await this.escuelasRepository.deleteById(id);
    }
      */
}
