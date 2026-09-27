import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const connection = await prisma.slackConnection.findFirst();
  if (connection) {
    console.log('User ID:', connection.userId ? 'Present' : 'Missing');
    console.log('Slack Team ID:', connection.slackTeamId);
    console.log('Slack User ID:', connection.slackUserId);
    console.log('Access Token:', connection.accessToken ? 'Stored (hidden)' : 'Missing');
  } else {
    console.log('No Slack connection found in database.');
  }
}

check().finally(() => prisma.$disconnect());
