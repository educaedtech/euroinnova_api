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
import {FacultadesRepository} from '../repositories';
import {MerchantCredentialsService} from '../services/merchant-credentials.service';
import {FacultadesInterface, ShopifyService, SyncResults} from '../services/shopify.service';
import {GeneralController} from './general.controller';

export class FacultadesController {
  constructor(
    @repository(FacultadesRepository)
    public facultadesRepository: FacultadesRepository,
    @inject('services.ShopifyService')
    public shopifyService: ShopifyService,
    @inject('controllers.GeneralController')
    public generalController: GeneralController,
    @inject('services.MerchantCredentialsService')
    private merchantCredentials: MerchantCredentialsService,
  ) { }


  @post('/facultades/sync-to-shopify/{merchant_id}')
  async syncronizeFacultades(
    @param.path.number('merchant_id') merchantId: number,
    @requestBody() dataIN: any
  ): Promise<{
    syncedData: FacultadesInterface[];
    syncResult: SyncResults;
  }> {
    try {

      // -------- BLOCK ajustes de credenciales ----------------
      // 1. Obtener credenciales del merchant
      const credentials = await this.merchantCredentials.getShopifyCredentials(merchantId);

      // 2. Configurar el servicio Shopify con estas credenciales
      await this.shopifyService.setCredentials(credentials);

      // 2. pasar credenciales al sercio general para la actualizacion de colecciones etc.
      await this.generalController.setShopifyServiceCredentials(credentials);
      //--------- END BLOCK -----------------------------------

      // 1. Obtener datos de forma eficiente (await faltante en la versión original)
      const data = await this.facultadesRepository.find();// as FacultadesInterface[];

      const facultadesData = data.map(f => ({id_facultad: f.id, nombre: f.nombre, logo: f.logo})) as FacultadesInterface[];

      // creando Collecciones en caso de que no existan
      const facs2collections = data.map(fc => fc.nombre) as string[];
      facs2collections.push('FACULTADES');
      for (const element of facs2collections) {
        await this.generalController.findOrCreateCollection(element);
      }

      // 2. Validar que hay datos antes de continuar
      if (!facultadesData || facultadesData.length === 0) {
        throw new Error('No se encontraron facultades para sincronizar');
      }

      // 3. Sincronizar con Shopify
      const syncResult = await this.shopifyService.syncronizeFacultades(facultadesData, this.facultadesRepository, merchantId);


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

  @post('/facultades')
  @response(200, {
    description: 'Facultades model instance',
    content: {'application/json': {schema: getModelSchemaRef(Facultades)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Facultades, {
            title: 'NewFacultades',
            exclude: ['id'],
          }),
        },
      },
    })
    facultades: Omit<Facultades, 'id'>,
  ): Promise<Facultades> {
    return this.facultadesRepository.create(facultades);
  }

  @get('/facultades/count')
  @response(200, {
    description: 'Facultades model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Facultades) where?: Where<Facultades>,
  ): Promise<Count> {
    return this.facultadesRepository.count(where);
  }

  @get('/facultades')
  @response(200, {
    description: 'Array of Facultades model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Facultades, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Facultades) filter?: Filter<Facultades>,
  ): Promise<Facultades[]> {
    return this.facultadesRepository.find(filter);
  }

  @patch('/facultades')
  @response(200, {
    description: 'Facultades PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Facultades, {partial: true}),
        },
      },
    })
    facultades: Facultades,
    @param.where(Facultades) where?: Where<Facultades>,
  ): Promise<Count> {
    return this.facultadesRepository.updateAll(facultades, where);
  }

  @get('/facultades/{id}')
  @response(200, {
    description: 'Facultades model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Facultades, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Facultades, {exclude: 'where'}) filter?: FilterExcludingWhere<Facultades>
  ): Promise<Facultades> {
    return this.facultadesRepository.findById(id, filter);
  }

  @patch('/facultades/{id}')
  @response(204, {
    description: 'Facultades PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Facultades, {partial: true}),
        },
      },
    })
    facultades: Facultades,
  ): Promise<void> {
    await this.facultadesRepository.updateById(id, facultades);
  }

  @put('/facultades/{id}')
  @response(204, {
    description: 'Facultades PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() facultades: Facultades,
  ): Promise<void> {
    await this.facultadesRepository.replaceById(id, facultades);
  }

  @del('/facultades/{id}')
  @response(204, {
    description: 'Facultades DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.facultadesRepository.deleteById(id);
  }
    */
}
