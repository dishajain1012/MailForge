import { createEmailWorker } from './workers/email.worker';
import { logger } from './utils/logger';

const startWorker = async () => {
  try {
    logger.info('[Worker Process] Starting dedicated BullMQ Email Worker...');
    const worker = createEmailWorker();
    logger.info('[Worker Process] BullMQ Email Worker is running and waiting for jobs.');

    const gracefulShutdown = async (signal: string) => {
      logger.info(`[Worker Process] Received ${signal}. Shutting down worker...`);
      await worker.close();
      process.exit(0);
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    logger.error('[Worker Process] Failed to start worker:', error);
    process.exit(1);
  }
};

startWorker();
