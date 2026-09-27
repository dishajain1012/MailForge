import axios from 'axios';

// Ensure standard configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true, // Necessary for cookies (session)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
