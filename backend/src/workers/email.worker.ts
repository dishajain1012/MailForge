import { Worker, Job, QueueEvents, DelayedError } from 'bullmq';
import { createDedicatedRedisConnection, getSanitizedRedisHost } from '../config/redis';
import { EMAIL_QUEUE_NAME, EmailJobPayload } from '../queues/email.queue';
import { logger } from '../utils/logger';
import { config } from '../config';
import { prisma } from '../config/db';
import { sendEmailService } from '../services/mailer.service';
import { enforceGlobalMinimumDelay } from '../utils/delay';
import { claimHourlyRateLimit } from '../utils/rateLimit';
import { sendRateLimitNotification } from '../services/slack.service';

export const createEmailWorker = () => {
  logger.info(`[Worker Setup] Initializing BullMQ Email Worker for queue "${EMAIL_QUEUE_NAME}" on Redis at ${getSanitizedRedisHost()}`);

  const queueEvents = new QueueEvents(EMAIL_QUEUE_NAME, {
    connection: createDedicatedRedisConnection(),
  });

  queueEvents.on('delayed', ({ jobId, delay }) => {
    logger.info(`[QueueEvents] job waiting/delayed: Job ${jobId} delayed for ${delay}ms`);
  });

  queueEvents.on('waiting', ({ jobId }) => {
    logger.info(`[QueueEvents] job waiting: Job ${jobId} is ready to process`);
  });

  queueEvents.on('active', ({ jobId }) => {
    logger.info(`[QueueEvents] job active: Job ${jobId} started processing`);
  });

  queueEvents.on('completed', ({ jobId }) => {
    logger.info(`[QueueEvents] job completed: Job ${jobId} finished processing`);
  });

  queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error(`[QueueEvents] job failed: Job ${jobId} failed with reason: ${failedReason}`);
  });

  const worker = new Worker<EmailJobPayload>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobPayload>) => {
      const { emailJobId } = job.data;
      
      logger.info(`[Worker] processor entered with job.id: ${job.id}`);
      logger.info(`[Worker] processor entered with job.name: ${job.name}`);
      logger.info(`[Worker] processor entered with job.data: ${JSON.stringify(job.data)}`);

      // 1. Claim the job atomically (Idempotency guarantee)
      const claimResult = await prisma.emailJob.updateMany({
        where: { 
          id: emailJobId,
          status: {
            in: ['SCHEDULED', 'FAILED']
          }
        },
        data: {
          status: 'PROCESSING',
          attempts: { increment: 1 }
        }
      });

      if (claimResult.count === 0) {
        logger.warn(`[Worker] EmailJob ${emailJobId} could not be claimed. It may be already COMPLETED, PROCESSING, or missing. Skipping.`);
        return { success: true, reason: 'Already claimed or completed' };
      }

      logger.info(`[Worker] DB claim succeeded for EmailJob ${emailJobId}`);

      // 2. Retrieve the claimed EmailJob from PostgreSQL
      const emailJob = await prisma.emailJob.findUnique({
        where: { id: emailJobId },
        include: { campaign: true }
      });

      if (!emailJob) {
        logger.error(`[Worker] EmailJob ${emailJobId} not found after claiming.`);
        return { success: false, reason: 'Job disappeared' };
      }

      try {
        // 3. Hourly Rate Limit Check
        const rateLimit = await claimHourlyRateLimit(emailJob.userId, emailJob.campaign?.hourlyLimit);

        if (!rateLimit.allowed && rateLimit.nextAvailableTimestamp) {
          logger.warn(`[Worker] Hourly limit reached for User ${emailJob.userId}. Rescheduling job ${job.id} to ${new Date(rateLimit.nextAvailableTimestamp).toISOString()}`);
          
          sendRateLimitNotification(
            emailJob.userId, 
            emailJob.campaign?.hourlyLimit && emailJob.campaign.hourlyLimit > 0 
              ? emailJob.campaign.hourlyLimit 
              : config.maxEmailsPerHour
          ).catch(e => logger.error(`[Worker] Slack notification failed: ${e.message}`));

          await prisma.emailJob.update({
            where: { id: emailJobId },
            data: {
              status: 'SCHEDULED',
              scheduledAt: new Date(rateLimit.nextAvailableTimestamp),
              attempts: { decrement: 1 }
            }
          });

          const delayMs = Math.max(0, rateLimit.nextAvailableTimestamp - Date.now());
          await job.moveToDelayed(Date.now() + delayMs, job.token);
          logger.info(`[Worker] Job ${job.id} moved back to delayed set for ${delayMs}ms`);
          throw new DelayedError();
        }

        // 4. Enforce global minimum delay before sending
        await enforceGlobalMinimumDelay();

        // 5. Send through Ethereal
        logger.info(`[Worker] email send started for EmailJob ${emailJobId}`);
        const mailResult = await sendEmailService({
          to: emailJob.recipient,
          subject: emailJob.subject,
          html: emailJob.body,
        });
        logger.info(`[Worker] email send succeeded for EmailJob ${emailJobId}`);

        // 6. Mark database record as sent
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: 'COMPLETED',
            sentAt: new Date(),
            errorMessage: null
          }
        });
        logger.info(`[Worker] DB status SENT for EmailJob ${emailJobId}`);

        logger.info(`[Worker] processor finished for job.id: ${job.id}`);
        return { 
          success: true, 
          messageId: mailResult.messageId, 
          previewUrl: mailResult.previewUrl 
        };
      } catch (error: any) {
        if (error instanceof DelayedError) {
          throw error;
        }

        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 1);
        
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: isLastAttempt ? 'FAILED' : 'SCHEDULED',
            failedAt: isLastAttempt ? new Date() : null,
            errorMessage: error.message
          }
        });

        logger.error(`[Worker] Error during email processing for EmailJob ${emailJobId}:`, error.message);
        throw error;
      }
    },
    { 
      connection: createDedicatedRedisConnection(),
      concurrency: config.workerConcurrency || 5
    }
  );

  worker.on('ready', () => {
    logger.info('[Worker] Worker ready: BullMQ Email Worker connected and ready to process jobs');
  });

  worker.on('active', (job) => {
    logger.info(`[Worker] Worker active: Processing job ${job.id}`);
  });

  worker.on('completed', (job, result) => {
    logger.info(`[Worker] Worker completed: Job ${job.id} completed successfully. Result: ${JSON.stringify(result)}`);
  });

  worker.on('failed', (job, err) => {
    if (err instanceof DelayedError || err?.name === 'DelayedError') {
      logger.info(`[Worker] Job ${job?.id} moved to delayed for rate limiting.`);
    } else {
      logger.error(`[Worker] Worker failed: Job ${job?.id} failed:`, err.message);
    }
  });

  worker.on('error', (err) => {
    logger.error('[Worker] Worker error:', err.message);
  });

  logger.info('[Worker] Worker started');
  return worker;
};
