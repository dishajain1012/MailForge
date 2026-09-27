import Redis from 'ioredis';
import { config } from './index';

export const createRedisConnection = () => {
  return new Redis(config.redis.url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

export const redisConnection = createRedisConnection();

redisConnection.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});
