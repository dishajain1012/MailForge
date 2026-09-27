import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { createEmailWorker } from './workers/email.worker';

const startServer = async () => {
  try {
    const workerEnabled = process.env.WORKER_ENABLED !== 'false';
    if (workerEnabled) {
      createEmailWorker();
      logger.info('BullMQ Email Worker enabled for this process');
    } else {
      logger.info('BullMQ Email Worker disabled for this process (WORKER_ENABLED=false)');
    }

    app.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
      logger.info(`Health check available at http://localhost:${config.port}/api/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
