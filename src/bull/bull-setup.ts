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


