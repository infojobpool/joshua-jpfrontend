// lib/axiosInstance.ts

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `https://api.jobpool.in/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
  withCredentials: true,
  timeout: 30000,
  maxRedirects: 0, // Prevent redirects that cause CORS issues
});

// Add a request interceptor to include JWT in headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // add cache-busting param to avoid stale results after admin updates
    config.params = { ...(config.params || {}), _ts: Date.now() };
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Unauthorized
      // Handle token refresh logic here
      // This might involve calling a refresh endpoint and updating the token
      try {
        const refreshResponse = await axios.post(
          '/refresh-token/',
          {},
          {
            withCredentials: true,
          }
        );
        const newToken = refreshResponse.data.token;
        localStorage.setItem('token', newToken);
        error.config.headers['Authorization'] = `Bearer ${newToken}`;
        return axiosInstance(error.config);
      } catch (refreshError) {
        // Handle refresh token failure (e.g., logout user)
        localStorage.removeItem('token');
        //  window.location.href = '/auth'; // Redirect to login
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
