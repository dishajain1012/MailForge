import { PrismaClient } from '@prisma/client';
import { handleSlackCallbackService, disconnectSlackService, getSlackStatusService } from './services/slack.service';
import axios from 'axios';

const prisma = new PrismaClient();

// Manually stub axios.post for testing without real Slack API

async function main() {
  console.log('--- Slack OAuth & Integration Test ---');

  // Ensure a test user exists
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({ data: { email: 'slack-test@mailforge.test', name: 'Slack Tester' } });
  }

  const userId = user.id;
  console.log(`[1] Test User ID: ${userId}`);

  // 1. Initial Status check
  let status = await getSlackStatusService(userId);
  console.log(`[2] Initial Slack Status connected: ${status.connected}`);

  // 2. Simulate Slack Callback
  console.log('[3] Simulating successful Slack OAuth callback...');
  
  // Apply manual stub
  axios.post = async () => ({
    data: {
      ok: true,
      access_token: 'xoxp-mock-token-123',
      team: { id: 'T12345678' }
    }
  }) as any;

  await handleSlackCallbackService(userId, 'mock-auth-code');
  
  // 3. Verify Database Record & Connected Status
  status = await getSlackStatusService(userId);
  console.log(`[4] Post-Callback Status connected: ${status.connected}`);
  
  const dbConnection = await prisma.slackConnection.findUnique({ where: { userId } });
  if (dbConnection && dbConnection.accessToken === 'xoxp-mock-token-123') {
    console.log('✅ Database record securely stored and verified!');
  } else {
    console.log('❌ Database record missing or incorrect!');
  }

  // 4. Disconnect Slack
  console.log('[5] Disconnecting Slack...');
  await disconnectSlackService(userId);

  // 5. Verify Disconnect Status
  status = await getSlackStatusService(userId);
  console.log(`[6] Post-Disconnect Status connected: ${status.connected}`);

  const removedConnection = await prisma.slackConnection.findUnique({ where: { userId } });
  if (!removedConnection) {
    console.log('✅ Database record successfully removed!');
  }

  if (status.connected === false && !removedConnection) {
    console.log('✅ TEST PASSED: Slack connect and disconnect flow works perfectly!');
  } else {
    console.log('❌ TEST FAILED: Disconnect did not clean up properly.');
  }

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(console.error);
