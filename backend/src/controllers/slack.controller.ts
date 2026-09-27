import { Request, Response } from 'express';
import { 
  getSlackAuthUrl, 
  handleSlackCallbackService, 
  disconnectSlackService, 
  getSlackStatusService 
} from '../services/slack.service';
import { config } from '../config';

export const connectSlack = (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Pass userId in state to correlate the callback
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');
  const url = getSlackAuthUrl(state);
  
  res.redirect(url);
};

export const slackCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;

  if (!code || !state) {
    return res.status(400).send('Missing code or state');
  }

  try {
    const { userId } = JSON.parse(Buffer.from(state, 'base64').toString('ascii'));

    await handleSlackCallbackService(userId, code);
    
    // Redirect back to frontend settings or dashboard
    res.redirect(`${config.clientUrl}?slack_connected=true`);
  } catch (error: any) {
    res.redirect(`${config.clientUrl}?slack_error=${encodeURIComponent(error.message)}`);
  }
};

export const disconnectSlack = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    await disconnectSlackService(userId);
    res.json({ success: true, message: 'Slack disconnected' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSlackStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const status = await getSlackStatusService(userId);
    res.json({ success: true, data: status });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
