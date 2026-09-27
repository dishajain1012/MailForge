import { PrismaClient } from '@prisma/client';
import { scheduleEmailsService } from './src/services/email.service';

const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst();
  
  const startTime = new Date(Date.now() + 15000); // 15 seconds in future
  console.log(`Scheduling 2 emails for ${startTime.toISOString()}`);
  
  const res = await scheduleEmailsService({
    userId: user!.id,
    subject: "Reliability Test - Future",
    body: "Testing persistence across restart.",
    recipients: ["future1@ethereal.email", "future2@ethereal.email"],
    startTime,
    delayBetweenEmails: 0,
    hourlyLimit: 0
  });

  console.log(`Campaign created: ${res.campaignId}`);
}

run().finally(() => prisma.$disconnect());
