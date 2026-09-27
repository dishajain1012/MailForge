import { PrismaClient } from '@prisma/client';
import { scheduleEmailsService } from './src/services/email.service';

const prisma = new PrismaClient();

async function runTest() {
  const user = await prisma.user.findFirst();

  console.log(`Scheduling 5 emails for minimum delay test...`);
  
  const payload = {
    userId: user!.id,
    subject: "Minimum Delay Test",
    body: "Testing the 2-second global minimum delay.",
    recipients: [
      "min1@ethereal.email",
      "min2@ethereal.email",
      "min3@ethereal.email",
      "min4@ethereal.email",
      "min5@ethereal.email"
    ],
    startTime: new Date(),
    delayBetweenEmails: 2, // 2s logical delay in scheduledAt
    hourlyLimit: 0 // no hourly limit
  };

  const res = await scheduleEmailsService(payload);

  console.log('Waiting 20 seconds for processing to finish...');
  await new Promise(resolve => setTimeout(resolve, 20000));

  const jobs = await prisma.emailJob.findMany({
    where: { campaignId: res.campaignId },
    orderBy: { sentAt: 'asc' }
  });

  console.log('\n--- Send Timestamps ---');
  let prevTime: number | null = null;
  jobs.forEach(j => {
    if (j.sentAt) {
      const time = j.sentAt.getTime();
      const diff = prevTime ? time - prevTime : 0;
      console.log(`Job ${j.recipient}: ${j.sentAt.toISOString()} | Gap: ${diff}ms`);
      prevTime = time;
    } else {
      console.log(`Job ${j.recipient}: Not sent. Status: ${j.status}`);
    }
  });
}

runTest().finally(() => prisma.$disconnect());
