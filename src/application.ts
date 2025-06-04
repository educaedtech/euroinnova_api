/* eslint-disable @typescript-eslint/no-floating-promises */
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {ServiceMixin} from '@loopback/service-proxy';
import fetch from 'node-fetch';
import path from 'path';
import {setupBullBoard} from './bull/bull-setup';
import {EuroProductosDataSource} from './datasources';
import {basicAuthMiddleware} from './middlewares/auth.middleware';
import {ProductosRepository} from './repositories';
import {MySequence} from './sequence';
import {QueueService} from './services/queue.service';
import {ShopifyService} from './services/shopify.service';
export {ApplicationConfig};

// // ---------- ADD IMPORTS AUTH (cuando se cree la tabla user o se conozca de donde vaos a hacer el login)-------------
// import {AuthenticationComponent} from '@loopback/authentication';
// import {
//   JWTAuthenticationComponent,
//   UserServiceBindings
// } from '@loopback/authentication-jwt';
// import {EuroProductosDataSource} from './datasources';
// //------------------------------------

export class EuroinnovaApiApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Middleware global (se ejecuta antes de todas las rutas)
    this.middleware(basicAuthMiddleware);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };



    // Configuración de Shopify
    this.bind('config.shopify').to({
      storeUrl: process.env.SHOPIFY_STORE_URL,
      apiVersion: process.env.SHOPIFY_API_VERSION ?? '2025-01',
      accessToken: process.env.SHOPIFY_ACCESS_TOKEN,
    });

    // Registrar el servicio
    this.service(ShopifyService);
    this.service(QueueService)

    this.dataSource(EuroProductosDataSource);
    this.repository(ProductosRepository);
    // inicializando monitor de colas de trabajo
    this.setupQueues()

    this.getIPData();
  }

  async setupQueues() {
    const queueService = await this.get('services.QueueService') as QueueService;
    const bullRouter = await setupBullBoard(queueService);

    this.mountExpressRouter('/admin/queues', bullRouter);
    console.log(`Queue Monitor is running at /admin/queues`);
  }

  async getIPData() {
    try {
      const url = 'https://ipinfo.io/json';

      try {
        const response2 = await fetch(url, {
          method: 'GET',
        });

        let dres = null;
        const contentType = response2.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          dres = await response2.json(); // Parsear como JSON
        } else {
          dres = await response2.text(); // Parsear como texto
        }

        console.log(dres);

      } catch (error) {
        console.error('ERROR geting IP INFO:', error);
      }
    } catch (error) {
      console.error('Error procesando el envío de correo:', error.message);
    }
  }

}
