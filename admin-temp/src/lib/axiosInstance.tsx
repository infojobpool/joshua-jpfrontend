// lib/axiosInstance.ts

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add a request interceptor to include JWT in headers
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Cache-bust GET requests so admin list reflects latest edits immediately
    if ((config.method || 'get').toLowerCase() === 'get') {
      config.params = { ...(config.params || {}), _t: Date.now() };
    }
    try {
      const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
      // Lightweight console trace to verify admin requests
      // Example: [admin][http] PUT http://api/update-job/task_17/
      // eslint-disable-next-line no-console
      console.log('[admin][http]', (config.method || 'GET').toUpperCase(), fullUrl, config.params || '');
    } catch {}
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
    try {
      const cfg = error?.config || {};
      const fullUrl = `${cfg.baseURL || ''}${cfg.url || ''}`;
      // eslint-disable-next-line no-console
      console.warn('[admin][http][error]', (cfg.method || 'GET').toUpperCase(), fullUrl, error?.response?.status);
    } catch {}
    if (error.response.status === 401) {
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
