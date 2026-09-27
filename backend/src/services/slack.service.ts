import axios from 'axios';
import { prisma } from '../config/db';
import { redisConnection } from '../config/redis';
import { config } from '../config';
import { logger } from '../utils/logger';

export const getSlackAuthUrl = (state: string) => {
  const { clientId, redirectUri } = config.slack;
  const scopes = ['chat:write']; // Minimum scopes needed for notifications
  
  return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scopes.join(',')}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;
};

export const handleSlackCallbackService = async (userId: string, code: string) => {
  try {
    const { clientId, clientSecret, redirectUri } = config.slack;
    
    // Exchange code for access token
    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    const data = response.data;

    if (!data.ok) {
      throw new Error(data.error || 'Failed to authenticate with Slack');
    }

    const accessToken = data.access_token || data.authed_user?.access_token;
    const slackTeamId = data.team?.id;
    const slackUserId = data.authed_user?.id || data.bot_user_id || data.user_id || data.user?.id || 'default';

    if (!accessToken || !slackTeamId) {
      throw new Error('Invalid response from Slack. Missing access token or team ID.');
    }

    // Upsert the Slack connection for the user securely
    await prisma.slackConnection.upsert({
      where: { userId },
      update: {
        accessToken,
        slackTeamId,
        slackUserId
      },
      create: {
        userId,
        accessToken,
        slackTeamId,
        slackUserId
      }
    });

    return true;
  } catch (error: any) {
    logger.error('Slack OAuth Error:', error.message);
    throw new Error(error.response?.data?.error || error.message);
  }
};

export const disconnectSlackService = async (userId: string) => {
  const connection = await prisma.slackConnection.findUnique({ where: { userId } });
  
  if (!connection) {
    throw new Error('Slack connection not found');
  }

  // Delete the connection from our database
  await prisma.slackConnection.delete({ where: { userId } });
  
  return true;
};

export const getSlackStatusService = async (userId: string) => {
  const connection = await prisma.slackConnection.findUnique({ where: { userId } });
  
  // Do NOT expose the access token
  if (connection) {
    return {
      connected: true,
      slackTeamId: connection.slackTeamId,
      updatedAt: connection.updatedAt
    };
  }

  return { connected: false };
};

export const sendRateLimitNotification = async (userId: string, limit: number) => {
  const now = new Date();
  const hourWindow = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
  const notifiedKey = `slack-notified:${userId}:${hourWindow}`;

  // Atomic spam prevention: only allow this exactly once per hour window per user
  const acquired = await redisConnection.set(notifiedKey, '1', 'EX', 3600, 'NX');
  if (acquired !== 'OK') {
    return; // We already notified this user during this hour window
  }

  try {
    // Fetch user and slack connection
    const [user, connection] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.slackConnection.findUnique({ where: { userId } })
    ]);

    if (!user || !connection || !connection.accessToken) {
      return; // Do nothing if not connected or user deleted
    }

    const targetChannel = connection.slackUserId || connection.slackTeamId;
    if (!targetChannel) return;

    // 2. Send the message directly using the stored user ID or team channel
    const text = `*Email sending rate limit reached.*\nSender: ${user.email}\nHourly limit: ${limit}.\nRemaining emails have been rescheduled.`;

    const messageRes = await axios.post('https://slack.com/api/chat.postMessage', {
      channel: targetChannel,
      text
    }, {
      headers: { 
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!messageRes.data.ok) {
      logger.warn(`[Slack] chat.postMessage failed for user ${userId}: ${messageRes.data.error}`);
    } else {
      logger.info(`[Slack] Rate limit notification successfully sent to user ${userId}`);
    }
  } catch (error: any) {
    // Safely swallow errors so we don't crash or fail the email queue
    logger.error(`[Slack] Error sending notification: ${error.message}`);
  }
};

