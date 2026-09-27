import { PrismaClient } from '@prisma/client';
import { createEmailWorker } from './workers/email.worker';
import { emailQueue } from './queues/email.queue';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';

const prisma = new PrismaClient();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('--- Distributed Delay & Concurrency Test ---');
  console.log(`Configured MIN_EMAIL_DELAY_MS: ${config.minEmailDelayMs}`);
  console.log(`Configured WORKER_CONCURRENCY: ${config.workerConcurrency}`);

  // Ensure a test user exists
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({ data: { email: 'delay-test@mailforge.test', name: 'Delay Tester' } });
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      userId: user.id,
      subject: 'Delay Test',
      body: '<p>Testing distributed delay!</p>',
      startTime: new Date(),
    }
  });

  const totalEmails = 3;
  console.log(`\n[1] Creating ${totalEmails} identical jobs to fire at the exact same time...`);

  for (let i = 0; i < totalEmails; i++) {
    const emailJobId = uuidv4();
    const idempotencyKey = uuidv4();

    await prisma.emailJob.create({
      data: {
        id: emailJobId,
        campaignId: campaign.id,
        userId: user.id,
        recipient: `delay-target-${i}@example.com`,
        subject: `Delay Test ${i}`,
        body: '<p>Testing distributed delay!</p>',
        scheduledAt: new Date(), // Schedule immediately!
        idempotencyKey,
        status: 'SCHEDULED',
      }
    });

    await emailQueue.add('send-email', {
      emailJobId,
      recipient: `delay-target-${i}@example.com`,
      subject: `Delay Test ${i}`,
      body: '<p>Testing distributed delay!</p>'
    }, {
      jobId: idempotencyKey,
      delay: 0
    });
  }

  console.log('\n[2] Starting Worker (Concurrency = 5)...');
  const worker = createEmailWorker();

  console.log('\n[3] Waiting 15 seconds for jobs to process. Watch the timestamp logs for exact send timing!\n');
  await sleep(15000);

  const jobs = await prisma.emailJob.findMany({
    where: { campaignId: campaign.id },
    orderBy: { sentAt: 'asc' }
  });

  console.log('\n--- RESULTS ---');
  jobs.forEach((job, index) => {
    console.log(`Job ${index + 1} (${job.recipient}) Sent At: ${job.sentAt?.toISOString() || 'NOT SENT'}`);
  });

  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(console.error);
