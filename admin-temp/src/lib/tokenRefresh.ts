/**
 * Proactive JWT refresh + resume for admin (same /refresh-token/ + localStorage `token` as user app).
 */

import { API_BASE } from "./apiBase";

const PROACTIVE_BEFORE_MS = 15 * 60 * 1000;
const RESUME_THRESHOLD_MS = 20 * 60 * 1000;

let proactiveTimer: ReturnType<typeof setTimeout> | null = null;
let visibilityListenerAttached = false;

export function parseRefreshTokenBody(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const b = data as Record<string, unknown>;
  const nested = b.data;
  if (nested && typeof nested === "object") {
    const d = nested as Record<string, unknown>;
    if (typeof d.token === "string" && d.token) return d.token;
    if (typeof d.access_token === "string" && d.access_token) {
      return d.access_token;
    }
  }
  if (typeof b.token === "string" && b.token) return b.token;
  if (typeof b.access_token === "string" && b.access_token) return b.access_token;
  return null;
}

function base64UrlToJson(payload: string): Record<string, unknown> | null {
  try {
    let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    return JSON.parse(atob(b64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function decodeJwtExpMs(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = base64UrlToJson(parts[1]);
    const exp = payload?.exp;
    if (typeof exp !== "number") return null;
    return exp * 1000;
  } catch {
    return null;
  }
}

function clearProactiveTimer() {
  if (proactiveTimer) {
    clearTimeout(proactiveTimer);
    proactiveTimer = null;
  }
}

async function postRefresh(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;

  const axios = (await import("axios")).default;
  const res = await axios.post(
    `${API_BASE}/refresh-token/`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      withCredentials: true,
    }
  );
  const newToken = parseRefreshTokenBody(res.data);
  if (!newToken) return null;
  localStorage.setItem("token", newToken);
  return newToken;
}

function scheduleProactiveRefresh() {
  clearProactiveTimer();
  if (typeof window === "undefined") return;

  const token = localStorage.getItem("token");
  if (!token) return;

  const expMs = decodeJwtExpMs(token);
  if (!expMs) return;

  const delay = Math.max(0, expMs - Date.now() - PROACTIVE_BEFORE_MS);
  proactiveTimer = setTimeout(async () => {
    try {
      const t = await postRefresh();
      if (t) {
        window.dispatchEvent(new CustomEvent("token-refreshed"));
        scheduleProactiveRefresh();
      }
    } catch {
      /* 401 path may refresh on next request */
    }
  }, delay);
}

function onVisibilityChange() {
  if (typeof document === "undefined" || document.visibilityState !== "visible") {
    return;
  }
  const token = localStorage.getItem("token");
  if (!token) return;

  const expMs = decodeJwtExpMs(token);
  if (!expMs) return;

  if (expMs - Date.now() < RESUME_THRESHOLD_MS) {
    void postRefresh()
      .then((t) => {
        if (t) {
          window.dispatchEvent(new CustomEvent("token-refreshed"));
          scheduleProactiveRefresh();
        }
      })
      .catch(() => {});
  }
}

export function notifyTokenUpdated() {
  if (typeof window === "undefined") return;
  scheduleProactiveRefresh();
  if (!visibilityListenerAttached) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    visibilityListenerAttached = true;
  }
}

export function stopTokenRefreshCycle() {
  clearProactiveTimer();
  if (typeof document !== "undefined" && visibilityListenerAttached) {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    visibilityListenerAttached = false;
  }
}
