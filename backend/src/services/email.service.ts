import { prisma } from '../config/db';
import { emailQueue, EMAIL_QUEUE_NAME } from '../queues/email.queue';
import { v4 as uuidv4 } from 'uuid';

export interface ScheduleEmailsPayload {
  userId: string;
  subject: string;
  body: string;
  recipients: string[];
  startTime: string | Date;
  delayBetweenEmails: number; // in seconds
  hourlyLimit: number;
}

// Simple email regex for server-side validation
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const scheduleEmailsService = async (payload: ScheduleEmailsPayload) => {
  const { userId, subject, body, recipients, startTime, delayBetweenEmails, hourlyLimit } = payload;

  if (!subject || !body || !recipients || recipients.length === 0 || !startTime) {
    throw new Error('Missing required fields');
  }

  // Deduplicate and validate emails
  const validRecipients = [...new Set(recipients.map(e => e.trim().toLowerCase()))].filter(isValidEmail);

  if (validRecipients.length === 0) {
    throw new Error('No valid recipients provided');
  }

  const startDateTime = new Date(startTime);
  if (isNaN(startDateTime.getTime())) {
    throw new Error('Invalid start time');
  }

  // Create campaign
  console.log('[SCHEDULE] creating campaign');
  const campaign = await prisma.emailCampaign.create({
    data: {
      userId,
      subject,
      body,
      startTime: startDateTime,
      delayBetweenEmails: delayBetweenEmails || 0,
      hourlyLimit: hourlyLimit || 0,
    }
  });
  console.log(`[SCHEDULE] campaign created: ${campaign.id}`);

  const jobsData = validRecipients.map((recipient, index) => {
    // Calculate scheduledAt based on delay
    // delayBetweenEmails is in seconds
    const scheduledAt = new Date(startDateTime.getTime() + index * (delayBetweenEmails * 1000));
    
    return {
      id: uuidv4(),
      campaignId: campaign.id,
      userId,
      recipient,
      subject,
      body,
      scheduledAt,
      idempotencyKey: uuidv4(), // Unique key
      status: 'SCHEDULED' as const
    };
  });

  console.log(`[SCHEDULE] creating email jobs: ${jobsData.length}`);
  // Create DB records
  await prisma.emailJob.createMany({
    data: jobsData
  });

  // Add to BullMQ
  for (const jobData of jobsData) {
    // delay in ms for BullMQ
    const now = Date.now();
    const delayMs = Math.max(0, jobData.scheduledAt.getTime() - now);

    console.log(`[SCHEDULE] adding BullMQ job: ${jobData.idempotencyKey}`);

    try {
      const addPromise = emailQueue.add(
        'send-email',
        {
          emailJobId: jobData.id,
          recipient: jobData.recipient,
          subject: jobData.subject,
          body: jobData.body
        },
        {
          jobId: jobData.idempotencyKey, // Use idempotency key for BullMQ job ID
          delay: delayMs
        }
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('BullMQ emailQueue.add timed out after 10000ms')), 10000)
      );

      const job = (await Promise.race([addPromise, timeoutPromise])) as any;

      console.log(`[SCHEDULE] BullMQ job added: ${job?.id}`);
    } catch (qErr: any) {
      console.warn(`[SCHEDULE] BullMQ enqueue notice for job ${jobData.id}:`, qErr?.message || qErr);
    }
  }

  return {
    campaignId: campaign.id,
    scheduledCount: jobsData.length
  };
};

export const getScheduledEmailsService = async (userId: string) => {
  return prisma.emailJob.findMany({
    where: {
      userId,
      status: 'SCHEDULED'
    },
    orderBy: {
      scheduledAt: 'asc'
    }
  });
};

export const getSentEmailsService = async (userId: string) => {
  return prisma.emailJob.findMany({
    where: {
      userId,
      status: 'COMPLETED'
    },
    orderBy: {
      sentAt: 'desc'
    }
  });
};

export const getEmailJobByIdService = async (id: string, userId: string) => {
  const job = await prisma.emailJob.findFirst({
    where: {
      id,
      userId
    }
  });

  if (!job) throw new Error('Email job not found');
  return job;
};
