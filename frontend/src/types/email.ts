export type JobStatus = 'PENDING' | 'SCHEDULED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface EmailJob {
  id: string;
  campaignId: string;
  userId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  status: JobStatus;
  attempts: number;
  sentAt?: string;
  failedAt?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailCampaign {
  id: string;
  userId: string;
  subject: string;
  body: string;
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleEmailPayload {
  subject: string;
  body: string;
  recipients: string[];
  startTime: string;
  delayBetweenEmails: number;
  hourlyLimit: number;
}
