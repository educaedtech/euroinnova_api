/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
import {BootMixin} from '@loopback/boot';
import {ApplicationConfig, BindingScope} from '@loopback/core';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication, RestServer} from '@loopback/rest';
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
export {ApplicationConfig};

import {CronService} from './services/cronjob.service';
import {LoggerService} from './services/logger.service';
import {ShopifyService} from './services/shopify.service';
import {LogWebSocketServer} from './websocket/logs.websocket.server';

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

  private loggerInstance: LoggerService;

  constructor(options: ApplicationConfig = {}) {
    super(options);

    this.getIPData();

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

    this.bind('services.LoggerService').toClass(LoggerService).inScope(BindingScope.SINGLETON);

    // Configuración explícita como SINGLETON
    this.bind('services.ShopifyService')
      .toClass(ShopifyService)
      .inScope(BindingScope.SINGLETON)
      .tag('shopify'); // Tag para referencia

    this.bind('services.QueueService')
      .toClass(QueueService)
      .inScope(BindingScope.SINGLETON)
      .apply((binding) => {
        // Forzar que use la misma instancia
        binding.tag('shopify-user');
      });
    this.service(CronService);


    // this.lifeCycleObserver(QueueService);
    // this.lifeCycleObserver(CronService);

    // 2. Configura el WebSocket
    this.bind('ws.server').toClass(LogWebSocketServer);
    this.bind('websocket.enabled').to(true);

    // 4. Maneja el evento started
    this.on('started', async () => {
      if (this.isWebSocketEnabled()) {
        try {
          const restServer = await this.getServer(RestServer);
          const httpServer = (restServer as any).httpServer?.server;

          if (!httpServer) {
            throw new Error('HTTP server not available');
          }

          // Obtiene la instancia SINGLETON del LoggerService
          const logger = await this.get<LoggerService>('services.LoggerService');

          // Inicializa WebSocket con la misma instancia
          new LogWebSocketServer(logger, httpServer);
          logger.log('WebSocket server for logs started at /ws-logs');
        } catch (error) {
          console.error('Failed to start WebSocket server:', error);
        }
      }
    });


    this.dataSource(EuroProductosDataSource);
    this.repository(ProductosRepository);
    // inicializando monitor de colas de trabajo
    this.setupQueues()




  }

  // Añade estos métodos auxiliares
  isWebSocketEnabled(): boolean {
    return this.getSync<boolean>('websocket.enabled');
  }

  // Modifica el método startWebSocketServer:
  private async startWebSocketServer(): Promise<void> {
    try {
      const logger = await this.get<LoggerService>('services.LoggerService');
      const restServer = await this.getServer(RestServer);


      // Accede al httpServer interno
      const httpServer = (restServer as any).httpServer?.server;
      if (!httpServer) {
        throw new Error('HTTP server not available');
      }

      new LogWebSocketServer(logger, httpServer);
      logger.log('WebSocket server for logs started at /ws-logs');
    } catch (error) {
      console.error('Failed to start WebSocket server:', error);
      throw error;
    }
  }

  //--------------------------------------------------------------

  async setupQueues() {
    const queueService = await this.get('services.QueueService') as QueueService;
    const cronService = await this.get('services.CronService') as CronService;
    const bullRouter = await setupBullBoard(queueService, cronService);

    this.mountExpressRouter('/admin/queues', bullRouter);
    console.log(`Queue Monitor is running at /admin/queues`);
  }

  async getIPData() {
    console.log('Entro al getIP')
    const url = 'https://ipinfo.io/json';

    try {
      const response2 = await fetch(url, {
        method: 'GET',
      });
      console.log('IP Respo', response2)

      let dres = null;
      const contentType = response2.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        dres = await response2.json(); // Parsear como JSON
      } else {
        dres = await response2.text(); // Parsear como texto
      }

      console.log(`ℹ️  Running on IP: ${dres.ip}`);

    } catch (error) {
      console.error('🔥ERROR geting IP INFO:', error);
    }

  }

}
