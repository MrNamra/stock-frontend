import axios from 'axios';
import tokenManager from './tokenManager';
import config from '../config/config';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: config.API.BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('Token expired or invalid, clearing storage');
      tokenManager.clearAll();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient; 