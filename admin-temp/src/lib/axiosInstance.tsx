// lib/axiosInstance.ts

import axios from 'axios';

// Admin backend: point to legacy API on api.jobpool.in
// This matches how the admin was originally configured.
const axiosInstance = axios.create({
  baseURL: 'https://api.jobpool.in/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000,
  maxRedirects: 0,
});

// Add a request interceptor to include JWT in headers
axiosInstance.interceptors.request.use(
  (config) => {
    const url = (config.url || '').toLowerCase();
    const isLogin = url.includes('admin-login');
    if (!isLogin) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
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
    const status = error?.response?.status;
    const url = (error?.config?.url || '').toLowerCase();
    const isLogin = url.includes('admin-login');
    if (status === 401) {
      if (isLogin) {
        // Login 401 = wrong credentials, don't attempt refresh
        return Promise.reject(error);
      }
      // Unauthorized on other endpoints - try refresh
      try {
        const refreshResponse = await axios.post(
          `${axiosInstance.defaults.baseURL || 'https://api.jobpool.in/api/v1'}/refresh-token/`,
          {},
          {
            withCredentials: true,
          }
        );
        const newToken = refreshResponse.data?.token;
        if (newToken) {
          localStorage.setItem('token', newToken);
          error.config.headers['Authorization'] = `Bearer ${newToken}`;
          return axiosInstance(error.config);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
      }
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
