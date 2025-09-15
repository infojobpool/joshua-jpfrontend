// lib/mobileAxiosInstance.ts - Mobile-specific axios configuration

import axios from 'axios';

// Mobile-specific axios instance with proper CORS and network handling
const mobileAxiosInstance = axios.create({
  // Use env if provided, otherwise default to the public API so mobile can reach it
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.jobpool.in/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
  },
  withCredentials: false, // Disable credentials for mobile
  timeout: 60000, // 60s to tolerate slow cold starts / pooled DB
  maxRedirects: 0,
});

// Add request interceptor for mobile
mobileAxiosInstance.interceptors.request.use(
  (config) => {
    // Add token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Add mobile-specific headers
    config.headers['X-Mobile-App'] = 'true';
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Add cache-busting for mobile
    config.params = { 
      ...(config.params || {}), 
      _ts: Date.now(),
      _mobile: 'true'
    };
    
    console.log('📱 Mobile API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('📱 Mobile API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for mobile
mobileAxiosInstance.interceptors.response.use(
  (response) => {
    console.log('📱 Mobile API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('📱 Mobile API Error:', error.message, error.config?.url);
    
    // Handle network errors specifically for mobile
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(new Error('Server is busy. Please try again in a moment.'));
    }
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      console.error('📱 Network Error - Check if backend is running and accessible');
      return Promise.reject(new Error('Unable to connect to server. Please check your internet connection.'));
    }
    
    // Handle CORS errors
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      console.error('📱 CORS Error - Backend needs to allow mobile origins');
      return Promise.reject(new Error('Server configuration error. Please contact support.'));
    }
    
    return Promise.reject(error);
  }
);

export default mobileAxiosInstance;
