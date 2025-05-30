// // src/components/bull-board.component.ts
// import {createBullBoard} from '@bull-board/api';
// import {BullAdapter} from '@bull-board/api/bullAdapter';
// import {ExpressAdapter} from '@bull-board/express';
// import {Component, CoreBindings, inject, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
// import {Request, Response, RestApplication, RestServer} from '@loopback/rest';
// import {NextFunction} from 'express';
// import {QueueService} from '../services/queue.service';

// @lifeCycleObserver()
// export class BullBoardComponent implements Component, LifeCycleObserver {
//   constructor(
//     @inject(CoreBindings.APPLICATION_INSTANCE) private app: RestApplication,
//     @inject('services.QueueService') private queueService: QueueService,
//   ) { }

//   async start() {
//     await this.setupBullBoard();
//   }

//   private async setupBullBoard() {
//     const restServer = await this.getRestServer();

//     const serverAdapter = new ExpressAdapter();
//     serverAdapter.setBasePath('/admin/queues');

//     createBullBoard({
//       queues: [new BullAdapter(this.queueService.productSyncQueue)],
//       serverAdapter,
//     });

//     // Configurar el handler con tipos correctos
//     restServer.expressMiddleware('bull-board',
//       (req: Request, res: Response, next: NextFunction) => {
//         if (this.checkAuth(req, res)) {
//           return serverAdapter.getRouter()(req, res, next);
//         }
//         return next();
//       },
//       {
//         mountPath: '/admin/queues',
//       }
//     );
//   }

//   private async getRestServer(): Promise<RestServer> {
//     try {
//       return await this.app.getServer(RestServer);
//     } catch (error) {
//       throw new Error(
//         'RestServer not found. Make sure your application extends RestApplication'
//       );
//     }
//   }

//   private checkAuth(req: Request, res: Response): boolean {
//     if (process.env.NODE_ENV !== 'production') return true;

//     const auth = {
//       login: process.env.QUEUE_DASHBOARD_USER ?? 'admin',
//       password: process.env.QUEUE_DASHBOARD_PASSWORD ?? 'secret'
//     };

//     const header = req.headers.authorization ?? '';
//     const [login, password] = Buffer.from(header.split(' ')[1] || '', 'base64')
//       .toString()
//       .split(':');

//     if (login === auth.login && password === auth.password) return true;

//     res
//       .status(401)
//       .setHeader('WWW-Authenticate', 'Basic realm="401"')
//       .send('Authentication required');
//     return false;
//   }
// }
