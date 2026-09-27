import { Queue } from 'bullmq';
import { createDedicatedRedisConnection, getSanitizedRedisHost } from '../config/redis';

export const EMAIL_QUEUE_NAME = 'email-queue';

console.log(`[Queue Setup] Initializing producer queue: "${EMAIL_QUEUE_NAME}" connected to Redis at ${getSanitizedRedisHost()}`);

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: createDedicatedRedisConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
});

export interface EmailJobPayload {
  emailJobId: string;
  recipient: string;
  subject: string;
  body: string;
}
