import { prisma } from '../config/db';
import { redisConnection } from '../config/redis';

export const getHealthStatus = async () => {
  let dbHealthy = false;
  let redisHealthy = false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch (err) {
    dbHealthy = false;
  }

  try {
    const ping = await redisConnection.ping();
    redisHealthy = ping === 'PONG';
  } catch (err) {
    redisHealthy = false;
  }

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      server: 'UP',
      database: dbHealthy ? 'UP' : 'DOWN (Check Docker / PostgreSQL connection)',
      redis: redisHealthy ? 'UP' : 'DOWN (Check Docker / Redis connection)',
    },
    environment: process.env.NODE_ENV || 'development',
  };
};
