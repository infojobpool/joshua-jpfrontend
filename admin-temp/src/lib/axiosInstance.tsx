// lib/axiosInstance.ts

import axios from "axios";
import { API_BASE } from "./apiBase";
import { notifyTokenUpdated, parseRefreshTokenBody } from "./tokenRefresh";

function shouldSkip401Refresh(url: string): boolean {
  const u = url.toLowerCase();
  if (u.includes("refresh-token")) return true;
  if (u.includes("signin") || u.includes("login")) return true;
  if (
    u.includes("sign-up") ||
    u.includes("signup") ||
    u.includes("registration") ||
    u.includes("user-registration")
  ) {
    return true;
  }
  if (u.includes("forgot-password") || u.includes("reset-password")) return true;
  return false;
}

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  /** Must stay false unless the API sends real cookies + CORS uses a concrete origin (not `*`). Credentialed + `*` = browser blocks → "Provisional headers" + failed admin-login. */
  withCredentials: false,
  timeout: 30000,
  maxRedirects: 0,
});

// Add a request interceptor to include JWT in headers
axiosInstance.interceptors.request.use(
  (config) => {
    const url = (config.url || "").toLowerCase();
    const isLogin = url.includes("admin-login");
    if (!isLogin) {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    if ((config.method || "get").toLowerCase() === "get") {
      config.params = { ...(config.params || {}), _t: Date.now() };
    }
    try {
      const fullUrl = `${config.baseURL || ""}${config.url || ""}`;
      // eslint-disable-next-line no-console
      console.log(
        "[admin][http]",
        (config.method || "GET").toUpperCase(),
        fullUrl,
        config.params || ""
      );
    } catch {
      /* ignore */
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On 401: POST refresh-token with same Authorization; parse token same as proactive refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    try {
      const cfg = error?.config || {};
      const fullUrl = `${cfg.baseURL || ""}${cfg.url || ""}`;
      // eslint-disable-next-line no-console
      console.warn(
        "[admin][http][error]",
        (cfg.method || "GET").toUpperCase(),
        fullUrl,
        error?.response?.status
      );
    } catch {
      /* ignore */
    }

    const status = error?.response?.status;
    const url = error?.config?.url || "";
    const skipRefresh = shouldSkip401Refresh(url);

    if (status !== 401) {
      return Promise.reject(error);
    }
    if (skipRefresh) {
      return Promise.reject(error);
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || !error.config) {
      return Promise.reject(error);
    }

    const cfg = error.config as typeof error.config & { _retry?: boolean };
    if (cfg._retry) {
      try {
        localStorage.removeItem("token");
      } catch {
        /* ignore */
      }
      return Promise.reject(error);
    }
    cfg._retry = true;

    try {
      const refreshResponse = await axios.post(
        `${API_BASE}/refresh-token/`,
        {},
        {
          withCredentials: false,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const newToken = parseRefreshTokenBody(refreshResponse.data);
      if (newToken) {
        localStorage.setItem("token", newToken);
        if (typeof window !== "undefined") {
          notifyTokenUpdated();
        }
        if (cfg.headers) {
          cfg.headers["Authorization"] = `Bearer ${newToken}`;
        }
        return axiosInstance(cfg);
      }
      localStorage.removeItem("token");
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    }
    return Promise.reject(error);
  }
);

export { API_BASE };
export default axiosInstance;
