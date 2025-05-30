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
import path from 'path';
import {setupBullBoard} from './bull/bull-setup';
import {MySequence} from './sequence';
import {QueueService} from './services/queue.service';
import {ShopifyService} from './services/shopify.service';
export {ApplicationConfig};


export class EuroinnovaApiApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

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

    // inicializando monitor de colas de trabajo
    this.setupQueues()



  }

  async setupQueues() {
    const queueService = await this.get('services.QueueService') as QueueService;
    const bullRouter = await setupBullBoard(queueService);

    // Montaje directo sin necesidad de crear una nueva app Express
    this.mountExpressRouter('/admin/queues', bullRouter);

    console.log(`Queue Monitor is running at /admin/queues`);
  }
  // async setupQueues() {
  //   const queueService = await this.get('services.QueueService') as QueueService;
  //   const bullRouter = await setupBullBoard(queueService);

  //   const expressApp = express();
  //   expressApp.use('/admin/queues', bullRouter);

  //   this.mountExpressRouter('/', expressApp);
  //   console.log(`Queue Monitor is running at /admin/queues`);
  //   // this.mount('/admin/queues', bullRouter);
  // }
}
