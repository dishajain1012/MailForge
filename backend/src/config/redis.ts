import Redis from 'ioredis';
import { config } from './index';

export const redisConnection = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redisConnection.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});
