import api from './api';
import { EmailJob, ScheduleEmailPayload } from '../types/email';

export const scheduleEmails = async (payload: ScheduleEmailPayload) => {
  const { data } = await api.post('/emails/schedule', payload);
  return data;
};

export const getScheduledEmails = async (): Promise<{ success: boolean; data: EmailJob[] }> => {
  const { data } = await api.get('/emails/scheduled');
  return data;
};

export const getSentEmails = async (): Promise<{ success: boolean; data: EmailJob[] }> => {
  const { data } = await api.get('/emails/sent');
  return data;
};

export const getEmailJob = async (id: string): Promise<{ success: boolean; data: EmailJob }> => {
  const { data } = await api.get(`/emails/${id}`);
  return data;
};
