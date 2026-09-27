import api from './api';
import { AuthResponse } from '../types/auth';

export const checkAuth = async (): Promise<AuthResponse> => {
  try {
    const { data } = await api.get<AuthResponse>('/auth/me');
    if (data.success && data.data) {
      localStorage.setItem('mailforge_user', JSON.stringify(data.data));
    }
    return data;
  } catch (error) {
    const stored = localStorage.getItem('mailforge_user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        return { success: true, data: u };
      } catch (e) {}
    }
    return { success: false };
  }
};

export const loginWithEmail = async (email: string, name?: string): Promise<AuthResponse> => {
  try {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, name });
    if (data.success && data.data) {
      localStorage.setItem('mailforge_user', JSON.stringify(data.data));
    }
    return data;
  } catch (error) {
    return { success: false };
  }
};

export const demoLogin = async (): Promise<AuthResponse> => {
  try {
    const { data } = await api.post<AuthResponse>('/auth/demo', {});
    if (data.success && data.data) {
      localStorage.setItem('mailforge_user', JSON.stringify(data.data));
    }
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
  } finally {
    localStorage.removeItem('mailforge_user');
  }
};


