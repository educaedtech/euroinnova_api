/* eslint-disable @typescript-eslint/no-floating-promises */
import {LifeCycleObserver} from '@loopback/core';
import Bull, {Job, Queue} from 'bull';
import cron from 'node-cron';
import fetch from 'node-fetch';
import {queueConfig} from '../config/queue.config';

export class CronService implements LifeCycleObserver {
  public cronJobQueue: Queue;
  constructor(
  ) {


    this.cronJobQueue = new Bull('cron-jobs', {
      redis: queueConfig.redis,
      limiter: queueConfig.limiter,
      settings: {
        drainDelay: 100,
        lockDuration: 300000, // 5 minutos para procesar un job
        stalledInterval: 30000, // Verificar jobs estancados cada 30 segundos
        maxStalledCount: 3, // Reintentar jobs estancados máximo 3 veces
        retryProcessDelay: 1000, // Reduce delay entre reintentos de procesamiento
        backoffStrategies: {
          exponential: (attemptsMade: number) => Math.min(attemptsMade * 3000, 30000), // Backoff exponencial hasta 30 segundos
        }
      }
    });

    this.setupQueueListeners();
    this.setupCronJobs();
    this.setupQueueProcessor();
  }


  private setupCronJobs() {
    cron.schedule(`${process.env.CRON_JOB_SHEDULE ?? '*/30 * * * *'}`, () => {
      console.log('🏃 Ejecutando cron job...');
      this.cronJobQueue.add('cron-jobs', {
        type: 'scheduled',
        time: new Date().toISOString()
      }, {
        jobId: `cron-${Date.now()}`, // ID único
        removeOnComplete: 20,       // Eliminar al completar
        removeOnFail: 5,            // Eliminar si falla
        // Evita jobs duplicados
        preventParsingData: true
      }).then(() => console.log('➕ Job añadido a la cola'))
        .catch(err => console.error('⛔ Error añadiendo job:', err));;
    });
  }

  async start(): Promise<void> {
    await Promise.all([this.cronJobQueue.isReady()]); console.log('⏲️ Cron jobs inicializados');
  }

  async stop(): Promise<void> {
    await this.cronJobQueue.close();
    console.log('⛔ QueueService stopped');
  }

  private setupQueueListeners() {

    //----------------------------------------------
    this.cronJobQueue.on('completed', (job: Job) => {
      console.log(`✅ Job ${job.id} completed`);
    });

    this.cronJobQueue.on('failed', (job: Job, error: Error) => {
      console.error(`⛔ Job ${job.id} failed`, error);
    });

    this.cronJobQueue.on('uncaughtException', (error) => {
      console.error('❓ Uncaught Exception:', error);
    });
    this.cronJobQueue.on('unhandledRejection', (error) => {
      console.error('❓ Unhandled Rejection:', error);
    });

    this.cronJobQueue
      .on('ready', () => console.log('⭐ CronJobQueue conectada a Redis'))
      .on('error', (err) => console.error('⛔ Error en CronJobQueue:', err));

  }

  private async setupQueueProcessor() {

    this.cronJobQueue.process('cron-jobs', 1, async (job: Job) => {
      try {
        // 1. Configura URL y autenticación
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const baseUrl = `${protocol}://${process.env.API_BASE_URL}`;
        const endpoint = '/productos/cants-prods-2-sync/2';
        const url = `${baseUrl}${endpoint}`;

        // 2. Validar y preparar el cuerpo (body)
        const hours = parseInt(process.env.CRON_HOURS_SYNC ?? '1');
        if (isNaN(hours)) throw new Error('CRON_HOURS_SYNC debe ser un número');

        // 3. Configurar headers con autenticación básica
        const auth = Buffer.from(`${process.env.ADMIN_USER}:${process.env.ADMIN_PASSWORD}`).toString('base64');
        const headers = {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };

        // 4. Hacer la petición
        const response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({hours}),
        });

        // 5. Manejar errores HTTP
        if (!response.ok) {
          const errorBody = await response.text().catch(() => 'No se pudo leer el cuerpo del error');
          console.error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
          return {success: false, status: response.status, error: errorBody};
        }

        // 6. Validar y parsear la respuesta
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          const text = await response.text();
          console.error('La respuesta no es JSON:', text);
          return {success: false, error: 'Respuesta no JSON'};
        }

        const data = await response.json();
        console.log('✅ Cron job ejecutado exitosamente:', new Date().toISOString());
        return {success: true, data};

      } catch (error) {
        console.error('🔥 Error en cron job:', error instanceof Error ? error.message : error);
        throw error;
      }
    });


  }



}
