import Redis, { RedisOptions } from 'ioredis';
import { config } from './index';

const isTls = config.redis.url.startsWith('rediss://');

export const getRedisOptions = (): RedisOptions => ({
  maxRetriesPerRequest: null,
  keepAlive: 10000,
  ...(isTls && {
    tls: {
      rejectUnauthorized: false,
    },
  }),
});

// Single shared Redis connection for general utilities (locks, rate limits, health checks)
export const redisConnection = new Redis(config.redis.url, getRedisOptions());

// Helper to create dedicated Redis instances for BullMQ Queue, Worker, QueueEvents
export const createDedicatedRedisConnection = () => {
  return new Redis(config.redis.url, getRedisOptions());
};

export const getSanitizedRedisHost = (): string => {
  try {
    const parsed = new URL(config.redis.url);
    return `${parsed.protocol}//${parsed.hostname}:${parsed.port || (parsed.protocol === 'rediss:' ? '6379' : '6379')}`;
  } catch {
    return 'redis-host';
  }
};

redisConnection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});
