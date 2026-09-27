import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

export const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.ethereal.host,
    port: config.ethereal.port,
    auth: {
      user: config.ethereal.user,
      pass: config.ethereal.password,
    },
  });
};

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmailService = async (options: SendEmailOptions) => {
  const transporter = createTransporter();

  try {
    const info = await transporter.sendMail({
      from: '"ReachInbox Scheduler" <scheduler@reachinbox.test>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    logger.info(`Message sent: ${info.messageId}`);
    
    // Ethereal provides a preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info(`Preview URL: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (error: any) {
    logger.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};
