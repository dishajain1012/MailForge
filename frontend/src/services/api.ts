import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Ensure standard configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Necessary for cookies (session)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
