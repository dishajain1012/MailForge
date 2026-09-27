import { PrismaClient } from '@prisma/client';
import { createEmailWorker } from './workers/email.worker';
import { emailQueue } from './queues/email.queue';
import { v4 as uuidv4 } from 'uuid';
import { config } from './config';

const prisma = new PrismaClient();
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('--- Distributed Hourly Rate Limiter Test ---');

  // Override limits for this test in memory
  config.maxEmailsPerHour = 2; // We only allow 2 per hour
  config.minEmailDelayMs = 0; // Turn off the individual delay so tests run fast

  console.log(`Configured MAX_EMAILS_PER_HOUR: ${config.maxEmailsPerHour}`);

  // Ensure a test user exists
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({ data: { email: 'ratelimit-test@mailforge.test', name: 'RateLimit Tester' } });
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      userId: user.id,
      subject: 'Rate Limit Test',
      body: '<p>Testing distributed hourly rate limit!</p>',
      startTime: new Date(),
    }
  });

  const totalEmails = 5;
  console.log(`\n[1] Creating ${totalEmails} identical jobs to fire at the exact same time...`);

  const jobIds = [];
  for (let i = 0; i < totalEmails; i++) {
    const emailJobId = uuidv4();
    const idempotencyKey = uuidv4();
    jobIds.push(emailJobId);

    await prisma.emailJob.create({
      data: {
        id: emailJobId,
        campaignId: campaign.id,
        userId: user.id,
        recipient: `rate-limit-target-${i}@example.com`,
        subject: `Rate Limit Test ${i}`,
        body: '<p>Testing distributed rate limit!</p>',
        scheduledAt: new Date(), // Schedule immediately!
        idempotencyKey,
        status: 'SCHEDULED',
      }
    });

    await emailQueue.add('send-email', {
      emailJobId,
      recipient: `rate-limit-target-${i}@example.com`,
      subject: `Rate Limit Test ${i}`,
      body: '<p>Testing distributed rate limit!</p>'
    }, {
      jobId: idempotencyKey,
      delay: 0
    });
  }

  console.log('\n[2] Starting TWO Concurrent Workers...');
  const worker1 = createEmailWorker();
  const worker2 = createEmailWorker();

  console.log('\n[3] Waiting 10 seconds for jobs to process...');
  await sleep(10000);

  const jobs = await prisma.emailJob.findMany({
    where: { campaignId: campaign.id },
    orderBy: { recipient: 'asc' }
  });

  console.log('\n--- RESULTS ---');
  let completedCount = 0;
  let rescheduledCount = 0;

  jobs.forEach((job, index) => {
    console.log(`Job ${index + 1} (${job.recipient}) | Status: ${job.status} | Scheduled At: ${job.scheduledAt.toISOString()}`);
    if (job.status === 'COMPLETED') completedCount++;
    if (job.status === 'SCHEDULED' && job.scheduledAt > new Date()) rescheduledCount++;
  });

  console.log('\n--- VERIFICATION ---');
  if (completedCount === 2 && rescheduledCount === 3) {
    console.log('✅ TEST PASSED: Exactly 2 emails sent (at limit). 3 emails were correctly rescheduled for the next hour window over multiple workers!');
  } else {
    console.log('❌ TEST FAILED: Rate limit was not perfectly respected.');
  }

  await worker1.close();
  await worker2.close();
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(console.error);
