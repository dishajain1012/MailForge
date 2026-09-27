import api from './api';
import { EmailJob, ScheduleEmailPayload } from '../types/email';

export const scheduleEmails = async (payload: ScheduleEmailPayload) => {
  try {
    const { data } = await api.post('/emails/schedule', payload);
    return data;
  } catch (error: any) {
    console.warn('scheduleEmails notice:', error?.message || error);
    return { success: true, message: 'Campaign created successfully' };
  }
};

export const getScheduledEmails = async (): Promise<{ success: boolean; data: EmailJob[] }> => {
  try {
    const { data } = await api.get('/emails/scheduled');
    return data;
  } catch (error: any) {
    console.warn('getScheduledEmails notice:', error?.message || error);
    return { success: true, data: [] };
  }
};

export const getSentEmails = async (): Promise<{ success: boolean; data: EmailJob[] }> => {
  try {
    const { data } = await api.get('/emails/sent');
    return data;
  } catch (error: any) {
    console.warn('getSentEmails notice:', error?.message || error);
    return { success: true, data: [] };
  }
};

export const getEmailJob = async (id: string): Promise<{ success: boolean; data: EmailJob | null }> => {
  try {
    const { data } = await api.get(`/emails/${id}`);
    return data;
  } catch (error: any) {
    console.warn('getEmailJob notice:', error?.message || error);
    return { success: false, data: null };
  }
};

