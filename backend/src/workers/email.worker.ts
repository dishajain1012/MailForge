import { Worker, Job, DelayedError } from 'bullmq';
import { createRedisConnection } from '../config/redis';
import { EMAIL_QUEUE_NAME, EmailJobPayload } from '../queues/email.queue';
import { logger } from '../utils/logger';
import { config } from '../config';
import { prisma } from '../config/db';
import { sendEmailService } from '../services/mailer.service';
import { enforceGlobalMinimumDelay } from '../utils/delay';
import { claimHourlyRateLimit } from '../utils/rateLimit';
import { sendRateLimitNotification } from '../services/slack.service';

export const createEmailWorker = () => {
  const worker = new Worker<EmailJobPayload>(
    EMAIL_QUEUE_NAME,
    async (job: Job<EmailJobPayload>) => {
      const { emailJobId } = job.data;
      
      logger.info(`[Worker] Processing email job ${job.id} for EmailJob ${emailJobId}`);

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

      // 2. Retrieve the claimed EmailJob from PostgreSQL
      const emailJob = await prisma.emailJob.findUnique({
        where: { id: emailJobId },
        include: { campaign: true } // Need campaign for custom hourly limit
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
          
          // Trigger Slack Notification securely and atomically (non-blocking)
          sendRateLimitNotification(
            emailJob.userId, 
            emailJob.campaign?.hourlyLimit && emailJob.campaign.hourlyLimit > 0 
              ? emailJob.campaign.hourlyLimit 
              : config.maxEmailsPerHour
          ).catch(e => logger.error(`[Worker] Slack notification failed: ${e.message}`));

          // Preserve database state and schedule for next hour
          await prisma.emailJob.update({
            where: { id: emailJobId },
            data: {
              status: 'SCHEDULED',
              scheduledAt: new Date(rateLimit.nextAvailableTimestamp),
              attempts: { decrement: 1 } // Revert attempt count since it didn't fail, it was just delayed
            }
          });

          // Tell BullMQ to move this active job back into the delayed set
          const delayMs = Math.max(0, rateLimit.nextAvailableTimestamp - Date.now());
          await job.moveToDelayed(Date.now() + delayMs, job.token);
          throw new DelayedError();
        }

        // 4. Enforce global minimum delay before sending
        await enforceGlobalMinimumDelay();

        // 5. Send through Ethereal
        const mailResult = await sendEmailService({
          to: emailJob.recipient,
          subject: emailJob.subject,
          html: emailJob.body,
        });

        // 5. Mark database record as sent
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: 'COMPLETED',
            sentAt: new Date(),
            errorMessage: null
          }
        });

        return { 
          success: true, 
          messageId: mailResult.messageId, 
          previewUrl: mailResult.previewUrl 
        };
      } catch (error: any) {
        // Handle sending failure
        const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 1);
        
        await prisma.emailJob.update({
          where: { id: emailJobId },
          data: {
            status: isLastAttempt ? 'FAILED' : 'SCHEDULED',
            failedAt: isLastAttempt ? new Date() : null,
            errorMessage: error.message
          }
        });

        // Throwing the error ensures BullMQ handles the backoff/retry correctly
        throw error;
      }
    },
    { 
      connection: createRedisConnection(),
      concurrency: config.workerConcurrency || 5
    }
  );

  worker.on('completed', (job, result) => {
    logger.info(`[Worker] Job ${job.id} completed successfully. Result: ${JSON.stringify(result)}`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
};
