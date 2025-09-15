// lib/axiosInstance.ts

import axios from 'axios';

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>();

// Circuit breaker to prevent API overload
const circuitBreaker = {
  failures: 0,
  lastFailureTime: 0,
  threshold: 5, // 5 failures trigger circuit breaker
  timeout: 30000, // 30 seconds before retry
  isOpen: false
};

// Request throttling to prevent API overload
const requestThrottle = {
  requests: 0,
  windowStart: Date.now(),
  windowSize: 10000, // 10 seconds
  maxRequests: 20 // Max 20 requests per 10 seconds
};

const axiosInstance = axios.create({
  // Respect env override so all environments (mobile/desktop) hit the same API
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || `https://api.jobpool.in/api/v1`,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
  withCredentials: false,
  timeout: 60000,
  maxRedirects: 0, // Prevent redirects that cause CORS issues
});

// Add a request interceptor to include JWT in headers and deduplicate requests
axiosInstance.interceptors.request.use(
  (config) => {
    // Check circuit breaker
    if (circuitBreaker.isOpen) {
      const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
      if (timeSinceLastFailure < circuitBreaker.timeout) {
        console.log(`🚨 Circuit breaker OPEN - blocking request to ${config.url}`);
        return Promise.reject(new Error('Service temporarily unavailable - too many failures'));
      } else {
        // Reset circuit breaker after timeout
        circuitBreaker.isOpen = false;
        circuitBreaker.failures = 0;
        console.log(`🔄 Circuit breaker CLOSED - retrying requests`);
      }
    }
    
    // Check request throttling
    const now = Date.now();
    if (now - requestThrottle.windowStart > requestThrottle.windowSize) {
      // Reset window
      requestThrottle.requests = 0;
      requestThrottle.windowStart = now;
    }
    
    if (requestThrottle.requests >= requestThrottle.maxRequests) {
      console.log(`🚨 Request throttled - too many requests (${requestThrottle.requests}/${requestThrottle.maxRequests})`);
      return Promise.reject(new Error('Too many requests - please slow down'));
    }
    
    requestThrottle.requests++;
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // add cache-busting param to avoid stale results after admin updates
    config.params = { ...(config.params || {}), _ts: Date.now() };
    
    // Create a unique key for request deduplication
    const requestKey = `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(config.params)}`;
    
    // Check if the same request is already pending
    if (pendingRequests.has(requestKey)) {
      console.log(`Request deduplication: Reusing pending request for ${requestKey}`);
      return pendingRequests.get(requestKey)!;
    }
    
    // Store the request promise
    const requestPromise = Promise.resolve(config);
    pendingRequests.set(requestKey, requestPromise);
    
    // Clean up after request completes (success or failure)
    requestPromise.finally(() => {
      pendingRequests.delete(requestKey);
    });
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    // Reset circuit breaker on successful response
    circuitBreaker.failures = 0;
    circuitBreaker.isOpen = false;
    return response;
  },
  async (error) => {
    // Handle circuit breaker logic for failures
    if (error.response?.status >= 500) {
      circuitBreaker.failures++;
      circuitBreaker.lastFailureTime = Date.now();
      
      if (circuitBreaker.failures >= circuitBreaker.threshold) {
        circuitBreaker.isOpen = true;
        console.log(`🚨 Circuit breaker OPENED after ${circuitBreaker.failures} failures`);
      }
    }
    
    if (error.response?.status === 401) {
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
        if (error.config?.headers) {
          error.config.headers['Authorization'] = `Bearer ${newToken}`;
        }
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
