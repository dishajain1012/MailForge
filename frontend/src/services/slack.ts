import api from './api';
import { SlackStatus } from '../types/slack';

export const getSlackStatus = async (): Promise<{ success: boolean; data: SlackStatus }> => {
  const { data } = await api.get('/slack/status');
  return data;
};

export const disconnectSlack = async () => {
  const { data } = await api.post('/slack/disconnect');
  return data;
};
