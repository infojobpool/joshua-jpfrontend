// lib/axiosInstance.ts

import axios from 'axios';
import { notifyTokenUpdated, parseRefreshTokenBody } from './tokenRefresh';

/** Light polling endpoints — must not consume the global throttle budget (was delaying chat by minutes). */
function isChatInboxLightRead(url: string | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes('get-messages') || u.includes('my-chats');
}

/** Public marketing / home reads — should not queue behind the global throttle (first paint). */
function isHomePublicRead(url: string | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.includes('get-all-jobs') || u.includes('recent-open-jobs') || u.includes('offerings/feed');
}

/** Task detail + bid + profile-by-user reads — many parallel calls were hitting the 35/15s throttle and stalling for seconds. */
function isTaskDetailRead(url: string | undefined): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  if (u.includes('get-job-with-bids') || u.includes('get-job')) return true;
  if (u.includes('get-bids') || u.includes('get-user-bids')) return true;
  if (u.includes('profile') && u.includes('user_id')) return true;
  return false;
}

/** Listings workspace read: GET offerings with user_id should not be throttled by client budget. */
function isProfileListingsRead(
  url: string | undefined,
  params: unknown
): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  if (!(u === 'offerings/' || u.endsWith('/offerings/') || u.includes('/offerings?') || u.includes('/offerings/?'))) {
    return false;
  }
  if (!params || typeof params !== 'object') return false;
  const p = params as Record<string, unknown>;
  const uid = String(p.user_id ?? '').trim();
  return uid.length > 0;
}

function shouldSkip401Refresh(url: string): boolean {
  const u = url.toLowerCase();
  if (u.includes('refresh-token')) return true;
  if (u.includes('signin') || u.includes('login')) return true;
  if (
    u.includes('sign-up') ||
    u.includes('signup') ||
    u.includes('registration') ||
    u.includes('user-registration')
  ) {
    return true;
  }
  if (u.includes('forgot-password') || u.includes('reset-password')) return true;
  if (u.includes('admin-login')) return true;
  return false;
}

// Environment flag
const isDev = process.env.NODE_ENV !== 'production';

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

// Request throttling - CLIENT-SIDE ONLY (prevents accidental overload, NOT a security control)
// Real API protection must be server-side (rate limit on api.jobpool.in per IP/user)
// Env overrides: NEXT_PUBLIC_THROTTLE_WINDOW_MS, NEXT_PUBLIC_THROTTLE_MAX_REQUESTS
const requestThrottle = {
  requests: 0,
  windowStart: Date.now(),
  windowSize: isDev ? 1000 : Number(process.env.NEXT_PUBLIC_THROTTLE_WINDOW_MS) || 15000, // 15s in prod
  maxRequests: isDev ? 1000 : Number(process.env.NEXT_PUBLIC_THROTTLE_MAX_REQUESTS) || 35, // conservative: dashboard+profile+notifications
};

// API base URL for all requests and refresh endpoint (full URL including /api/v1)
const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.jobpool.in/api/v1';

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
  timeout: 60000,
  maxRedirects: 0, // Prevent redirects that cause CORS issues
});

// Add a request interceptor to include JWT in headers and deduplicate requests
axiosInstance.interceptors.request.use(
  (config) => {
    const urlStr = String(config.url || "");

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
    
    // Check request throttling (disabled for development)
    if (!isDev) {
      const skipThrottle =
        isChatInboxLightRead(urlStr) ||
        isHomePublicRead(urlStr) ||
        isTaskDetailRead(urlStr) ||
        isProfileListingsRead(urlStr, config.params);
      const now = Date.now();
      if (now - requestThrottle.windowStart > requestThrottle.windowSize) {
        // Reset window
        requestThrottle.requests = 0;
        requestThrottle.windowStart = now;
      }
      if (!skipThrottle && requestThrottle.requests >= requestThrottle.maxRequests) {
        console.log(`🚨 Request throttled - too many requests (${requestThrottle.requests}/${requestThrottle.maxRequests})`);
        return Promise.reject(new Error('Too many requests - please slow down'));
      }
      if (!skipThrottle) {
        requestThrottle.requests++;
      }
    }
    
    // Token from localStorage or sessionStorage (PWA/mobile fallback)
    const token =
      (typeof window !== 'undefined' && localStorage.getItem('token')) ||
      (typeof window !== 'undefined' && sessionStorage.getItem('token')) ||
      null;
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['X-Access-Token'] = token;
    }

    /** GET/HEAD with Content-Type: application/json is non-simple and triggers CORS preflight on many APIs. */
    const method = String(config.method || "get").toLowerCase();
    if (method === "get" || method === "head") {
      const h = config.headers;
      if (h && typeof (h as { delete?: (n: string) => void }).delete === "function") {
        (h as { delete: (n: string) => void }).delete("Content-Type");
        (h as { delete: (n: string) => void }).delete("content-type");
      } else if (h && typeof h === "object") {
        delete (h as Record<string, unknown>)["Content-Type"];
        delete (h as Record<string, unknown>)["content-type"];
      }
    }

    // Request deduplication (skip for chat/inbox reads — polling changes params; broken promise was not a real in-flight dedupe)
    const skipDedupe = isChatInboxLightRead(urlStr);
    if (!skipDedupe) {
      const requestKey = `${config.method?.toUpperCase()}_${config.url}_${JSON.stringify(config.params)}`;
      if (pendingRequests.has(requestKey)) {
        console.log(`Request deduplication: Reusing pending request for ${requestKey}`);
        return pendingRequests.get(requestKey)!;
      }
      const requestPromise = Promise.resolve(config);
      pendingRequests.set(requestKey, requestPromise);
      requestPromise.finally(() => {
        pendingRequests.delete(requestKey);
      });
    }

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

    const config = error.config;
    const url = config?.url || '';
    const skipRefresh = shouldSkip401Refresh(url);
    const hasToken = typeof window !== 'undefined' && (localStorage.getItem('token') || sessionStorage.getItem('token'));

    // Use optional chaining so network errors (error.response undefined) don't crash
    if (error.response?.status === 401 && !skipRefresh && hasToken) {
      // Avoid infinite retry loop
      if (config._retry) {
        try {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('session-expired'));
          }
        } catch {}
        return Promise.reject(error);
      }
      config._retry = true;

      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const refreshResponse = await axios.post(
          `${apiBaseUrl.replace(/\/?$/, '')}/refresh-token/`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            withCredentials: true,
          }
        );
        const newToken = parseRefreshTokenBody(refreshResponse.data);
        if (newToken) {
          localStorage.setItem('token', newToken);
          try { sessionStorage.setItem('token', newToken); } catch {}
          if (typeof window !== 'undefined') {
            notifyTokenUpdated();
          }
          if (config.headers) {
            config.headers['Authorization'] = `Bearer ${newToken}`;
            config.headers['X-Access-Token'] = newToken;
          }
          return axiosInstance(config);
        }
      } catch (refreshError) {
        try {
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('session-expired'));
          }
        } catch {}
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
