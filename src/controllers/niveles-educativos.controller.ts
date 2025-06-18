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
import {NivelesEducativosRepository} from '../repositories';
import {MerchantCredentialsService} from '../services/merchant-credentials.service';
import {NivelesEducativosInterface, ShopifyService, SyncResults} from '../services/shopify.service';
import {GeneralController} from './general.controller';

export class NivelesEducativosController {
  constructor(
    @repository(NivelesEducativosRepository)
    public nivelesEducativosRepository: NivelesEducativosRepository,
    @inject('services.ShopifyService')
    public shopifyService: ShopifyService,
    @inject('controllers.GeneralController')
    public generalController: GeneralController,
    @inject('services.MerchantCredentialsService')
    private merchantCredentials: MerchantCredentialsService,
  ) { }



  @post('/niveles-educativos/sync-to-shopify/{merchant_id}')
  async syncronizeNivelesEducativos(
    @param.path.number('merchant_id') merchantId: number,
    @requestBody() dataIN: any
  ): Promise<{
    syncedData: NivelesEducativosInterface[];
    syncResult: SyncResults;
  }> {
    try {

      // -------- BLOCK ajustes de credenciales ----------------
      // 1. Obtener credenciales del merchant
      const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);

      // 2. Configurar el servicio Shopify con estas credenciales
      this.shopifyService.setCredentials(credentials);

      // 3. pasar credenciales al sercio general para la actualizacion de colecciones etc.
      this.generalController.setShopifyServiceCredentials(credentials);
      //--------- END BLOCK -----------------------------------

      // 1. Obtener datos de forma eficiente (await faltante en la versión original)
      const data = await this.nivelesEducativosRepository.find();
      const nivEducData = data.map(f => ({id_nivel_educativo: f.id, nombre: f.nombre, logo: f.logo})) as NivelesEducativosInterface[];

      // creando Collecciones en caso de que no existan
      const niveles2collections = data.map(fc => fc.nombre) as string[];
      niveles2collections.push('NIVELES EDUCATIVOS');
      for (const element of niveles2collections) {
        await this.generalController.findOrCreateCollection(element);
      }

      // 2. Validar que hay datos antes de continuar
      if (!nivEducData || nivEducData.length === 0) {
        throw new Error('No se encontraron NivelesEducativos para sincronizar');
      }

      // 3. Sincronizar con Shopify
      const syncResult = await this.shopifyService.syncronizeNivelesEducativos(nivEducData, this.nivelesEducativosRepository, merchantId);

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


  /*
    @post('/niveles-educativos')
    @response(200, {
      description: 'NivelesEducativos model instance',
      content: {'application/json': {schema: getModelSchemaRef(NivelesEducativos)}},
    })
    async create(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(NivelesEducativos, {
              title: 'NewNivelesEducativos',
              exclude: ['id'],
            }),
          },
        },
      })
      nivelesEducativos: Omit<NivelesEducativos, 'id'>,
    ): Promise<NivelesEducativos> {
      return this.nivelesEducativosRepository.create(nivelesEducativos);
    }

    @get('/niveles-educativos/count')
    @response(200, {
      description: 'NivelesEducativos model count',
      content: {'application/json': {schema: CountSchema}},
    })
    async count(
      @param.where(NivelesEducativos) where?: Where<NivelesEducativos>,
    ): Promise<Count> {
      return this.nivelesEducativosRepository.count(where);
    }

    @get('/niveles-educativos')
    @response(200, {
      description: 'Array of NivelesEducativos model instances',
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: getModelSchemaRef(NivelesEducativos, {includeRelations: true}),
          },
        },
      },
    })
    async find(
      @param.filter(NivelesEducativos) filter?: Filter<NivelesEducativos>,
    ): Promise<NivelesEducativos[]> {
      return this.nivelesEducativosRepository.find(filter);
    }

    @patch('/niveles-educativos')
    @response(200, {
      description: 'NivelesEducativos PATCH success count',
      content: {'application/json': {schema: CountSchema}},
    })
    async updateAll(
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(NivelesEducativos, {partial: true}),
          },
        },
      })
      nivelesEducativos: NivelesEducativos,
      @param.where(NivelesEducativos) where?: Where<NivelesEducativos>,
    ): Promise<Count> {
      return this.nivelesEducativosRepository.updateAll(nivelesEducativos, where);
    }

    @get('/niveles-educativos/{id}')
    @response(200, {
      description: 'NivelesEducativos model instance',
      content: {
        'application/json': {
          schema: getModelSchemaRef(NivelesEducativos, {includeRelations: true}),
        },
      },
    })
    async findById(
      @param.path.number('id') id: number,
      @param.filter(NivelesEducativos, {exclude: 'where'}) filter?: FilterExcludingWhere<NivelesEducativos>
    ): Promise<NivelesEducativos> {
      return this.nivelesEducativosRepository.findById(id, filter);
    }

    @patch('/niveles-educativos/{id}')
    @response(204, {
      description: 'NivelesEducativos PATCH success',
    })
    async updateById(
      @param.path.number('id') id: number,
      @requestBody({
        content: {
          'application/json': {
            schema: getModelSchemaRef(NivelesEducativos, {partial: true}),
          },
        },
      })
      nivelesEducativos: NivelesEducativos,
    ): Promise<void> {
      await this.nivelesEducativosRepository.updateById(id, nivelesEducativos);
    }

    @put('/niveles-educativos/{id}')
    @response(204, {
      description: 'NivelesEducativos PUT success',
    })
    async replaceById(
      @param.path.number('id') id: number,
      @requestBody() nivelesEducativos: NivelesEducativos,
    ): Promise<void> {
      await this.nivelesEducativosRepository.replaceById(id, nivelesEducativos);
    }

    @del('/niveles-educativos/{id}')
    @response(204, {
      description: 'NivelesEducativos DELETE success',
    })
    async deleteById(@param.path.number('id') id: number): Promise<void> {
      await this.nivelesEducativosRepository.deleteById(id);
    }
      */
}
