import { PrismaClient } from '@prisma/client';
import { scheduleEmailsService } from './src/services/email.service';
import { redisConnection } from './src/config/redis';

const prisma = new PrismaClient();

async function runTest() {
  const user = await prisma.user.findFirst();
  if (!user) throw new Error('No user found');

  console.log(`Using user: ${user.email} (${user.id})`);

  const payload = {
    userId: user.id,
    subject: "MailForge Rate Limit Test",
    body: "Testing MailForge hourly rate limiting and Slack notification.",
    recipients: [
      "test1@ethereal.email",
      "test2@ethereal.email",
      "test3@ethereal.email",
      "test4@ethereal.email",
      "test5@ethereal.email"
    ],
    startTime: new Date(),
    delayBetweenEmails: 2,
    hourlyLimit: 2
  };

  const result = await scheduleEmailsService(payload);
  console.log('Campaign Scheduled:', result);

  // Wait 12 seconds for processing to occur (2 allowed emails * 2 sec delay + margin)
  console.log('Waiting 12 seconds for worker to process jobs...');
  await new Promise(resolve => setTimeout(resolve, 12000));

  // Query states
  const jobs = await prisma.emailJob.findMany({
    where: { campaignId: result.campaignId },
    orderBy: { scheduledAt: 'asc' }
  });

  const sent = jobs.filter(j => j.status === 'COMPLETED');
  const delayed = jobs.filter(j => j.status === 'SCHEDULED' && j.scheduledAt > new Date(Date.now() + 60000));
  const failed = jobs.filter(j => j.status === 'FAILED');
  const otherScheduled = jobs.filter(j => j.status === 'SCHEDULED' && j.scheduledAt <= new Date(Date.now() + 60000));

  console.log('\n--- Test Results ---');
  console.log(`Total jobs created: ${jobs.length}`);
  console.log(`Jobs COMPLETED (sent): ${sent.length}`);
  console.log(`Jobs SCHEDULED (delayed to next hour): ${delayed.length}`);
  console.log(`Jobs SCHEDULED (not delayed): ${otherScheduled.length}`);
  console.log(`Jobs FAILED: ${failed.length}`);

  if (delayed.length > 0) {
    console.log(`Delayed Job Scheduled At: ${delayed[0].scheduledAt}`);
  }

  // Check Redis counter
  const now = new Date();
  const hourWindow = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
  const rateKey = `email-rate:${user.id}:${hourWindow}`;
  const slackKey = `slack-notified:${user.id}:${hourWindow}`;

  const counterValue = await redisConnection.get(rateKey);
  const slackNotified = await redisConnection.get(slackKey);

  console.log(`Redis counter (${rateKey}):`, counterValue);
  console.log(`Slack notification flag (${slackKey}):`, slackNotified);
}

runTest().finally(() => {
  prisma.$disconnect();
  redisConnection.disconnect();
});
