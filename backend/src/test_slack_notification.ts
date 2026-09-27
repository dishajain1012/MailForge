import { PrismaClient } from '@prisma/client';
import { sendRateLimitNotification } from './services/slack.service';
import axios from 'axios';
import { redisConnection } from './config/redis';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Slack Rate Limit Notification Test ---');

  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({ data: { email: 'spam-test@example.com', name: 'Spam Tester' } });
  }

  // Inject a mock slack connection
  await prisma.slackConnection.upsert({
    where: { userId: user.id },
    update: { accessToken: 'xoxp-mock-test', slackTeamId: 'T12345' },
    create: { userId: user.id, accessToken: 'xoxp-mock-test', slackTeamId: 'T12345' }
  });

  // Mock axios to track how many times it was called
  let slackMessagesSent = 0;
  (axios as any).post = async (url: string, data: any, config: any) => {
    if (url.includes('auth.test')) {
      return { data: { ok: true, user_id: 'U123456' } };
    }
    if (url.includes('chat.postMessage')) {
      console.log(`\n[Slack API Mock] Message sent to ${data.channel}:`);
      console.log(data.text);
      slackMessagesSent++;
      return { data: { ok: true } };
    }
    return { data: { ok: false } };
  };

  // Clear Redis state for a fresh test
  const now = new Date();
  const hourWindow = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
  await redisConnection.del(`slack-notified:${user.id}:${hourWindow}`);

  console.log('\n[1] Simulating 100 concurrent workers hitting the rate limit simultaneously...');
  
  // Fire 100 concurrent notifications
  const promises = [];
  for (let i = 0; i < 100; i++) {
    promises.push(sendRateLimitNotification(user.id, 200));
  }
  
  await Promise.all(promises);

  console.log(`\n[2] Verification...`);
  if (slackMessagesSent === 1) {
    console.log('✅ TEST PASSED: Exactly 1 Slack notification was sent despite 100 concurrent requests! Spam prevention works.');
  } else {
    console.log(`❌ TEST FAILED: Sent ${slackMessagesSent} notifications instead of 1.`);
  }

  await prisma.$disconnect();
  await redisConnection.quit();
  process.exit(0);
}

main().catch(console.error);
