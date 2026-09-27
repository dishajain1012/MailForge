import api from './api';
import { AuthResponse } from '../types/auth';

export const checkAuth = async (): Promise<AuthResponse> => {
  try {
    const { data } = await api.get<AuthResponse>('/auth/me');
    return data;
  } catch (error) {
    return { success: false };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout request failed:', error);
  }
};
