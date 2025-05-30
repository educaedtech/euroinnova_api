// src/config/queue.config.ts
export const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379'),
    password: process.env.REDIS_PASSWORD ?? undefined,
  },
  limiter: {
    max: parseInt(process.env.QUEUE_LIMIT_MAX ?? '100'),
    duration: parseInt(process.env.QUEUE_LIMIT_DURATION ?? '5000'),
  },
};
