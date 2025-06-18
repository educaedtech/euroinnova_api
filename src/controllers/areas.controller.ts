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
import {AreasRepository} from '../repositories';
import {MerchantCredentialsService} from '../services/merchant-credentials.service';
import {AreasInterface, GenInterface, ShopifyService, SyncResults} from '../services/shopify.service';
import {GeneralController} from './general.controller';

export class AreasController {
  constructor(
    @repository(AreasRepository)
    public areasRepository: AreasRepository,
    @inject('services.ShopifyService')
    public shopifyService: ShopifyService,
    @inject('controllers.GeneralController')
    public generalController: GeneralController,
    @inject('services.MerchantCredentialsService')
    private merchantCredentials: MerchantCredentialsService,
  ) { }


  @post('/areas/sync-to-shopify/{merchant_id}')
  async syncronizeAreas(
    @param.path.number('merchant_id') merchantId: number,
    @requestBody() data: any
  ): Promise<{
    syncedData: GenInterface[];
    syncResult: SyncResults;
  }> {

    try {

      // -------- BLOCK ajustes de credenciales ----------------
      // 1. Obtener credenciales del merchant
      const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);
      console.log(credentials);

      // 2. Configurar el servicio Shopify con estas credenciales
      this.shopifyService.setCredentials(credentials);

      // 2. pasar credenciales al sercio general para la actualizacion de colecciones etc.
      this.generalController.setShopifyServiceCredentials(credentials);
      //--------- END BLOCK -----------------------------------


      // 1. Obtener datos de forma eficiente (await faltante en la versión original)
      const areasData = await this.areasRepository.find();// as any[];
      const normalizeData = areasData.map(area => ({id_area: area.id, titulo: area.nombre})) as AreasInterface[];
      const area2collections = areasData.map(ac => ac.nombre) as string[];
      // console.log('areasData', normalizeData)
      // 2. Validar que hay datos antes de continuar
      if (!normalizeData || normalizeData.length === 0) {
        throw new Error('No se encontraron areas para sincronizar');
      }

      // creando Collecciones en caso de que no existan
      area2collections.push('AREAS')
      for (const element of area2collections) {
        await this.generalController.findOrCreateCollection(element);
      }

      // 3. Sincronizar con Shopify
      const syncResult = await this.shopifyService.syncronizeAreas(normalizeData, this.areasRepository, merchantId);

      // // 4. Logging más informativo
      // console.log('Sincronización completada:', syncResult);

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

  /*
    @post('/areas')
    @response(200, {
      description: 'Areas model instance',
      content: {'application/json': {schema: getModelSchemaRef(Areas)}},
    })
    async create(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Areas, {
              title: 'NewAreas',
              exclude: ['id'],
            }),
          },
        },
      })
      areas: Omit<Areas, 'id'>,
    ): Promise<Areas> {
      return this.areasRepository.create(areas);
    }

    @get('/areas/count')
    @response(200, {
      description: 'Areas model count',
      content: {'application/json': {schema: CountSchema}},
    })
    async count(
      @param.where(Areas) where?: Where<Areas>,
    ): Promise<Count> {
      return this.areasRepository.count(where);
    }

    @get('/areas')
    @response(200, {
      description: 'Array of Areas model instances',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(Areas, {includeRelations: true}),
          },
        },
      },
    })
    async find(
      @param.filter(Areas) filter?: Filter<Areas>,
    ): Promise<Areas[]> {
      return this.areasRepository.find(filter);
    }

    @patch('/areas')
    @response(200, {
      description: 'Areas PATCH success count',
      content: {'application/json': {schema: CountSchema}},
    })
    async updateAll(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Areas, {partial: true}),
          },
        },
      })
      areas: Areas,
      @param.where(Areas) where?: Where<Areas>,
    ): Promise<Count> {
      return this.areasRepository.updateAll(areas, where);
    }

    @get('/areas/{id}')
    @response(200, {
      description: 'Areas model instance',
      content: {
        'application/json': {
          schema: getModelSchemaRef(Areas, {includeRelations: true}),
        },
      },
    })
    async findById(
      @param.path.number('id') id: number,
      @param.filter(Areas, {exclude: 'where'}) filter?: FilterExcludingWhere<Areas>
    ): Promise<Areas> {
      return this.areasRepository.findById(id, filter);
    }

    @patch('/areas/{id}')
    @response(204, {
      description: 'Areas PATCH success',
    })
    async updateById(
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(Areas, {partial: true}),
          },
        },
      })
      areas: Areas,
    ): Promise<void> {
      await this.areasRepository.updateById(id, areas);
    }

    @put('/areas/{id}')
    @response(204, {
      description: 'Areas PUT success',
    })
    async replaceById(
      @param.path.number('id') id: number,
      @requestBody() areas: Areas,
    ): Promise<void> {
      await this.areasRepository.replaceById(id, areas);
    }

    @del('/areas/{id}')
    @response(204, {
      description: 'Areas DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
      await this.areasRepository.deleteById(id);
    }


  */


}
