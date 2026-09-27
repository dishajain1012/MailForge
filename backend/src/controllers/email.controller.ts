import { Request, Response } from 'express';
import { 
  scheduleEmailsService, 
  getScheduledEmailsService, 
  getSentEmailsService, 
  getEmailJobByIdService 
} from '../services/email.service';

export const scheduleEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { subject, body, recipients, startTime, delayBetweenEmails, hourlyLimit } = req.body;

    const result = await scheduleEmailsService({
      userId,
      subject,
      body,
      recipients,
      startTime,
      delayBetweenEmails: delayBetweenEmails || 0,
      hourlyLimit: hourlyLimit || 0
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getScheduledEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const emails = await getScheduledEmailsService(userId);
    res.json({ success: true, data: emails });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSentEmails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const emails = await getSentEmailsService(userId);
    res.json({ success: true, data: emails });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmailJob = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const jobId = req.params.id;
    const email = await getEmailJobByIdService(jobId, userId);
    res.json({ success: true, data: email });
  } catch (error: any) {
    res.status(404).json({ success: false, message: error.message });
  }
};
