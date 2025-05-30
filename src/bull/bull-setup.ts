/* eslint-disable @typescript-eslint/no-misused-promises */
// require('dotenv').config();
import {createBullBoard} from '@bull-board/api';
import {BullAdapter} from '@bull-board/api/bullAdapter';
import {ExpressAdapter} from '@bull-board/express';
import {Queue} from 'bull';
// import {queueConfig} from '../config/queue.config';

import {QueueService} from '../services/queue.service';

// Elimina la creación de syncQueue aquí (se moverá al QueueService)
let queues: Queue[] = [];

export async function setupBullBoard(queueService: QueueService) {
  // Obtiene las colas del QueueService
  queues = [queueService.productSyncQueue];

  const serverAdapter = new ExpressAdapter();

  createBullBoard({
    queues: queues.map(q => new BullAdapter(q)),
    serverAdapter,
    options: {
      uiConfig: {
        boardTitle: 'Euroinnova-Shopify JOBS-Monitor ',
      },
    },
  });

  serverAdapter.setBasePath('/admin/queues');

  // Configura limpieza y listeners para todas las colas
  queues.forEach(queue => {
    setInterval(async () => {
      await queue.clean(5000, 'completed');
      await queue.clean(5000, 'failed');
    }, 1800000);

    queue
      .on('error', error => console.error('Error en cola:', error))
      .on('completed', job => console.log(`✅ Job ${job.id} completado`))
      .on('failed', (job, err) => console.error(`❌ Job ${job.id} fallado`, err));
  });

  return serverAdapter.getRouter();
}

/*
const syncQueue = new Queue('Inventory Sync', {
  redis: queueConfig.redis,
  settings: {
    lockDuration: 300000,
    stalledInterval: 30000,
    maxStalledCount: 3,
    retryProcessDelay: 1000,
    backoffStrategies: {
      exponential: attemptsMade => Math.min(attemptsMade * 3000, 30000),
    },
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {type: 'exponential'},
    removeOnComplete: 50,
    removeOnFail: 200,
    timeout: 120000,
  },
});

const redisClient = syncQueue.client;

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: [new BullAdapter(syncQueue)],
  serverAdapter,
  options: {
    uiConfig: {
      boardTitle: 'Monitor de Sincronización Euroinnova-Shopify',
      // refreshInterval: 5000,
    },
  },
});
serverAdapter.setBasePath('/admin/queues');

setInterval(async () => {
  await syncQueue.clean(5000, 'completed');
  await syncQueue.clean(5000, 'failed');
}, 1800000);

syncQueue
  .on('error', error => {
    console.error('🔥Error en la cola:', error);
  })
  .on('completed', job => {
    console.log(`✅ Job ${job.id} completado - ${job.data.sku || 'batch'}`);
  })
  .on('failed', (job, err) => {
    console.error(`❌ Job ${job.id} fallado - ${err.message}`);
  })
  .on('stalled', job => {
    console.warn(`⚠️ Job ${job.id} estancado - reintentando`);
  });



export const bullBoardRouter = serverAdapter.getRouter();
export {redisClient, syncQueue};
*/
