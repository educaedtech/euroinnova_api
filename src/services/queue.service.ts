/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
// src/services/queue.service.ts
import {BindingScope, inject} from '@loopback/context';
import {injectable, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {Job, Queue} from 'bull';
import {queueConfig} from '../config/queue.config';
import {ShopifyCredentials} from './merchant-credentials.service';
import {ProductData, ShopifyService} from './shopify.service';
import Bull = require('bull')

@injectable({scope: BindingScope.SINGLETON})
@lifeCycleObserver('queue')
export class QueueService implements LifeCycleObserver {
  public productSyncQueue: Queue;
  // public cronJobQueue: Queue;

  constructor(
    @inject('services.ShopifyService')
    private shopifyService: ShopifyService
  ) {

    this.productSyncQueue = new Bull('product-sync', {
      redis: queueConfig.redis,
      limiter: queueConfig.limiter,
      settings: {
        drainDelay: 100,
        lockDuration: 300000, // 5 minutos para procesar un job
        stalledInterval: 30000, // Verificar jobs estancados cada 30 segundos
        maxStalledCount: 3, // Reintentar jobs estancados máximo 3 veces
        retryProcessDelay: 1000, // Reduce delay entre reintentos de procesamiento
        backoffStrategies: {
          exponential: (attemptsMade) => Math.min(attemptsMade * 3000, 30000), // Backoff exponencial hasta 30 segundos
        }
      }
    });

    this.setupQueueListeners();
    // this.setupCronJobs();
    this.setupQueueProcessor();

  }

  // Métodos requeridos por LifeCycleObserver
  async start(): Promise<void> {
    // Lógica de inicio si es necesaria
    console.log('QueueService started');

    // Verificar que las colas estén listas
    await Promise.all([
      this.productSyncQueue.isReady(),
      // this.cronJobQueue.isReady()
    ]);

    // console.log('⏲️ Cron jobs inicializados');

  }

  async stop(): Promise<void> {
    await this.productSyncQueue.close();
    console.log('⛔ QueueService stopped');
  }

  private setupQueueListeners() {
    this.productSyncQueue.on('completed', (job: Job) => {
      console.log(`Job ${job.id} completed`);
    });

    this.productSyncQueue.on('failed', (job: Job, error: Error) => {
      console.error(`Job ${job.id} failed`, error);
    });

    this.productSyncQueue.on('uncaughtException', (error) => {
      console.error('❓ Uncaught Exception:', error);
    });
    this.productSyncQueue.on('unhandledRejection', (error) => {
      console.error('❓ Unhandled Rejection:', error);
    });

  }

  async addProductsToSync(products: ProductData[]): Promise<void> {
    const jobs = products.map(product => ({
      name: 'sync-product',
      data: {product},
      opts: {attempts: 3, backoff: {type: 'fixed', delay: 5000}},
    }));

    await this.productSyncQueue.addBulk(jobs);
  }

  async getQueueStatus() {
    return {
      waiting: await this.productSyncQueue.getWaitingCount(),
      active: await this.productSyncQueue.getActiveCount(),
      completed: await this.productSyncQueue.getCompletedCount(),
      failed: await this.productSyncQueue.getFailedCount(),
      delayed: await this.productSyncQueue.getDelayedCount(),
    };
  }

  //-------new methods--------
  async addProductBatchToSync(batch: ProductData[], credenciales: ShopifyCredentials): Promise<void> {

    await this.productSyncQueue.add('sync-product', {
      batch, // Enviamos el array completo
      batchId: `batch-${Date.now()}`,
      credenciales
    }, {
      attempts: 3,
      backoff: {type: 'fixed', delay: 5000}
    });
  }

  private async setupQueueProcessor() {


    this.productSyncQueue.process('sync-product', queueConfig.workerOptions.concurrency, async (job: Job) => {
      try {
        const {batch, batchId, credenciales} = job.data;

        this.shopifyService.setCredentials(credenciales);
        const results = [];

        for (const product of batch) {
          // await new Promise(resolve => setTimeout(resolve, 100));

          const result = await this.shopifyService.createShopifyProduct(product);

          // actualziando tabla unidades
          const error = {};

          results.push({
            productSku: product.sku,
            shopifyId: result.shopifyId,
            variantId: result.variantId,
            success: result.success,
            error
          });
        }

        return {
          batchId,
          success: true,
          processedItems: batch.length,
          results
        };
      } catch (error) {
        console.error(`Error processing batch: ${error.message}`);
        throw error;
      }
    });
  }

}
