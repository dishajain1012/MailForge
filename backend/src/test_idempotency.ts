import { PrismaClient } from '@prisma/client';
import { createEmailWorker } from './workers/email.worker';
import { emailQueue } from './queues/email.queue';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('--- Idempotency & Reliability Test ---');

  // Ensure a test user exists
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({ data: { email: 'test@mailforge.test', name: 'Tester' } });
  }

  // 1. Create a future EmailJob in PostgreSQL
  const campaign = await prisma.emailCampaign.create({
    data: {
      userId: user.id,
      subject: 'Idempotency Test',
      body: '<p>Testing duplicate sends!</p>',
      startTime: new Date(),
    }
  });

  const emailJobId = uuidv4();
  const idempotencyKey = uuidv4();

  await prisma.emailJob.create({
    data: {
      id: emailJobId,
      campaignId: campaign.id,
      userId: user.id,
      recipient: 'idempotency-target@example.com',
      subject: 'Idempotency Test',
      body: '<p>Testing duplicate sends!</p>',
      scheduledAt: new Date(Date.now() + 5000), // 5 seconds in the future
      idempotencyKey,
      status: 'SCHEDULED',
    }
  });
  console.log(`[1] Created DB EmailJob: ${emailJobId} (status: SCHEDULED)`);

  // Schedule in BullMQ with 5 second delay
  await emailQueue.add('send-email', {
    emailJobId,
    recipient: 'idempotency-target@example.com',
    subject: 'Idempotency Test',
    body: '<p>Testing duplicate sends!</p>'
  }, {
    jobId: idempotencyKey,
    delay: 5000
  });
  console.log('[2] Added delayed job to BullMQ (5s delay).');

  // Start Worker
  console.log('[3] Starting Worker #1...');
  let worker1 = createEmailWorker();

  console.log('[4] Instantly stopping Worker #1 (simulating crash)...');
  await worker1.close();
  console.log('Worker #1 stopped.');

  console.log('[5] Waiting 2 seconds...');
  await sleep(2000);

  // Restart Worker
  console.log('[6] Starting Worker #2...');
  let worker2 = createEmailWorker();

  // Accidentally queue the exact same job in BullMQ to simulate a duplicate message!
  console.log('[7] Injecting a duplicate message into BullMQ (Simulating bug/retry)...');
  await emailQueue.add('send-email', {
    emailJobId,
    recipient: 'idempotency-target@example.com',
    subject: 'Idempotency Test',
    body: '<p>Testing duplicate sends!</p>'
  }, {
    jobId: uuidv4(), // Different BullMQ ID to bypass BullMQ's native deduplication, forcing our DB to handle it
    delay: 0
  });

  console.log('[8] Waiting 8 seconds for jobs to process...');
  await sleep(8000);

  // Check Database
  const finalJobState = await prisma.emailJob.findUnique({ where: { id: emailJobId } });
  
  console.log('--- RESULTS ---');
  console.log(`Final DB Status: ${finalJobState?.status}`);
  console.log(`Total Attempts recorded in DB: ${finalJobState?.attempts}`);
  
  if (finalJobState?.status === 'COMPLETED' && finalJobState?.attempts === 1) {
    console.log('✅ TEST PASSED: The job was executed exactly once despite duplicates and restarts!');
  } else {
    console.log('❌ TEST FAILED: Job was processed incorrectly.');
  }

  await worker2.close();
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(console.error);
