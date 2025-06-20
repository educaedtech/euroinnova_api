/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
// src/services/queue.service.ts
import {BindingScope} from '@loopback/context';
import {injectable, lifeCycleObserver, LifeCycleObserver} from '@loopback/core';
import {Job, Queue} from 'bull';
import fetch from 'node-fetch';
import {queueConfig} from '../config/queue.config';
import {ShopifyCredentials} from './merchant-credentials.service';
import {ProductData} from './shopify.service';
import Bull = require('bull')

@injectable({scope: BindingScope.SINGLETON})
@lifeCycleObserver('queue')
export class QueueService implements LifeCycleObserver {
  public productSyncQueue: Queue;
  // public cronJobQueue: Queue;

  constructor(
    // @inject('services.LoggerService')
    // private logger: LoggerService
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
  async addProductBatchToSync(batch: {unidadId: number, merchantId: number}[] /*ProductData[]*/, credenciales: ShopifyCredentials): Promise<void> {

    this.productSyncQueue.add('sync-product', {
      batch, // Enviamos el array completo
      batchId: `batch-${Date.now()}`,
      credenciales
    }, {
      attempts: 3,
      backoff: {type: 'fixed', delay: 5000}
    });
  }

  async proccessProdHttp(merchantId: number, productId: number) {
    try {
      console.log('🔄 [proccessProdHttp] Iniciando solicitud HTTP...', {merchantId, productId});

      const baseUrl = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${process.env.ADMIN_USER}:${process.env.ADMIN_PASSWORD}@${process.env.API_BASE_URL}`;
      const endpoint = `/productos/syncronize/${merchantId}/${productId}`;
      const url = `${baseUrl}${endpoint}`;

      console.log('🔗 URL:', url.replace(/:([^\/]+)@/, ':*****@')); // Oculta la contraseña en logs

      const response = await fetch(url, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('📡 [proccessProdHttp] Respuesta recibida. Status:', response.status);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'No se pudo leer el cuerpo del error');
        throw new Error(`HTTP ${response.status} - ${errorBody}`);
      }

      const data = await response.json();
      console.log('✅ [proccessProdHttp] Respuesta exitosa:', JSON.stringify(data, null, 2));

      return data;
    } catch (error) {
      console.error('❌ [proccessProdHttp] Error:', error.message);
      throw error; // Propaga el error para que Bull lo reintente
    }
  }

  private async setupQueueProcessor() {

    await this.productSyncQueue.process('sync-product', queueConfig.workerOptions.concurrency, async (job: Job) => {
      try {
        console.log('Entro', Math.random())
        const {batch, batchId/*, credenciales*/} = job.data;

        // this.shopifyService.setCredentials(credenciales);
        const results = [];

        for (const product of batch) {
          // await new Promise(resolve => setTimeout(resolve, 100));

          const {unidadId, merchantId} = product;
          // console.log(unidadId, merchantId)
          // const result = await this.shopifyService.createShopifyProduct(product);
          const result = await this.proccessProdHttp(merchantId, unidadId);

          // actualziando tabla unidades
          // const error = {};

          results.push(result/*{
            productSku: product.sku,
            shopifyId: result.shopifyId,
            variantId: result.variantId,
            success: result.success,
            error
          }*/);
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
