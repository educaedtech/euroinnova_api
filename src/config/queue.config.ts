// src/config/queue.config.ts
console.log(process.env.REDIS_HOST)
export const queueConfig = {
  redis: {
    host: 'localhost',
    port: 6379
    // redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
    // host: 'oregon-keyvalue.render.com',//process.env.REDIS_HOST ?? 'localhost',
    // port: 6379,//parseInt(process.env.REDIS_PORT ?? '6379'),
    // password: 'eRwcpsGD3MP2Nak9JoEX8NPS0Qw9B98B',//rocess.env.REDIS_PASSWORD ?? undefined,
    // username: 'red-d0sahnvdiees73a7b2s0',//process.env.REDIS_USERNAME ?? undefined,
    // tls: {}
  },
  limiter: {
    max: parseInt(process.env.QUEUE_LIMIT_MAX ?? '100'),
    duration: parseInt(process.env.QUEUE_LIMIT_DURATION ?? '5000'),
  },
};
