// src/config/queue.config.ts
import 'dotenv/config';
console.log('REDIS_HOST', process.env.REDIS_HOST)
export const queueConfig = {
  redis: {
    // host: 'localhost',
    // port: 6379


    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379'),
    password: process.env.REDIS_PASSWORD ?? undefined,
    username: process.env.REDIS_USERNAME ?? undefined,
    tls: {}

  },
  limiter: {
    max: parseInt(process.env.QUEUE_LIMIT_MAX ?? '100'),
    duration: parseInt(process.env.QUEUE_LIMIT_DURATION ?? '5000'),
  },
};
