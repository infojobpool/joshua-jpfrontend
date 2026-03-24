// lib/axiosInstance.ts

import axios from "axios";

const DEFAULT_API_BASE = "https://api.jobpool.in/api/v1";

/** Ensures admin calls hit the FastAPI host, not the Vercel admin origin (which 404s on /admin-login/). */
function normalizeApiBase(): string {
  let raw =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) ||
    DEFAULT_API_BASE;
  raw = raw.replace(/\/+$/, "");

  // Relative values like "/api/v1" resolve against the admin site's origin → 404. Force absolute API URL.
  if (
    raw.startsWith("/") ||
    (!raw.startsWith("http://") && !raw.startsWith("https://"))
  ) {
    return DEFAULT_API_BASE;
  }

  try {
    const u = new URL(raw);
    const segments = u.pathname
      .replace(/^\/|\/$/g, "")
      .split("/")
      .filter(Boolean);
    const hasApiVersion =
      segments[0] === "api" && segments[1] != null && /^v\d+$/.test(segments[1]);
    // Production API lives under /api/v1; bare https://api.jobpool.in 404s on /admin-login/
    if (!hasApiVersion && u.hostname === "api.jobpool.in") {
      u.pathname = "/api/v1";
      return u.toString().replace(/\/+$/, "");
    }
  } catch {
    return DEFAULT_API_BASE;
  }

  return raw;
}

// Must match the backend that serves /api/v1 (set NEXT_PUBLIC_API_BASE_URL in Vercel / .env)
export const API_BASE = normalizeApiBase();

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: 30000,
  maxRedirects: 0,
});

function extractRefreshToken(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  const data = b.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.token === "string") return d.token;
    if (typeof d.access_token === "string") return d.access_token;
  }
  if (typeof b.token === "string") return b.token;
  if (typeof b.access_token === "string") return b.access_token;
  return undefined;
}

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

// On 401: POST refresh-token with same Authorization; prefer data.token per backend contract
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
    const url = (error?.config?.url || "").toLowerCase();
    const isLogin = url.includes("admin-login");
    const isRefresh = url.includes("refresh-token");

    if (status !== 401) {
      return Promise.reject(error);
    }
    if (isLogin || isRefresh) {
      return Promise.reject(error);
    }

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      return Promise.reject(error);
    }

    try {
      const refreshResponse = await axios.post(
        `${API_BASE}/refresh-token/`,
        {},
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const newToken = extractRefreshToken(refreshResponse.data);
      if (newToken && error.config) {
        localStorage.setItem("token", newToken);
        error.config.headers["Authorization"] = `Bearer ${newToken}`;
        return axiosInstance(error.config);
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

export default axiosInstance;
