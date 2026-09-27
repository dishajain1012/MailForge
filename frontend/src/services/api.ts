import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Ensure standard configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Necessary for cookies (session)
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('mailforge_user');
  if (stored) {
    try {
      const u = JSON.parse(stored);
      if (u?.id) config.headers['x-user-id'] = u.id;
      if (u?.email) config.headers['x-user-email'] = u.email;
    } catch (e) {}
  }
  return config;
});

export default api;

