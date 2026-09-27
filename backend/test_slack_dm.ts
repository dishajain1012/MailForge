import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSlackDM() {
  try {
    const connection = await prisma.slackConnection.findFirst();
    if (!connection || !connection.accessToken || !connection.slackUserId) {
      console.log('No valid Slack connection found in database.');
      return;
    }

    console.log(`Attempting to send DM to Slack User ID: ${connection.slackUserId}...`);

    const messageRes = await axios.post('https://slack.com/api/chat.postMessage', {
      channel: connection.slackUserId,
      text: '✅ *MailForge Slack Integration Verified!*\nYour Slack Messages Tab is successfully enabled and DMs are working perfectly.'
    }, {
      headers: { 
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!messageRes.data.ok) {
      console.error('Slack API Error:', messageRes.data.error);
    } else {
      console.log('Success! The DM was sent perfectly. Check your Slack app!');
    }
  } catch (err: any) {
    console.error('Script Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSlackDM();
