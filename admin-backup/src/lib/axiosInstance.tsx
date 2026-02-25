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
    const url = (config.url || '').toLowerCase();
    const isLogin = url.includes('admin-login');
    if (!isLogin) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
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
    const status = error?.response?.status;
    const url = (error?.config?.url || '').toLowerCase();
    const isLogin = url.includes('admin-login');
    if (status === 401) {
      if (isLogin) {
        return Promise.reject(error);
      }
      try {
        const base = axiosInstance.defaults.baseURL || '';
        const refreshResponse = await axios.post(
          `${base}/refresh-token/`,
          {},
          { withCredentials: true }
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
