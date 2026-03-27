/**
 * Proactive JWT refresh + resume refresh so sessions stay alive without waiting for 401.
 * Backend sets exp (e.g. USER_JWT_EXPIRE_HOURS=2); client schedules refresh ~15m before expiry.
 */

const PROACTIVE_BEFORE_MS = 15 * 60 * 1000;
const RESUME_THRESHOLD_MS = 20 * 60 * 1000;

let proactiveTimer: ReturnType<typeof setTimeout> | null = null;
let visibilityListenerAttached = false;

function getApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ||
    "https://api.jobpool.in/api/v1"
  );
}

function base64UrlToJson(payload: string): Record<string, unknown> | null {
  try {
    let b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4;
    if (pad) b64 += "=".repeat(4 - pad);
    const json = atob(b64);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Matches backend API wrappers: `data.token`, nested `data.data.token`,
 * or `access_token` at either level.
 */
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

/** JWT exp as milliseconds since epoch, or null if missing/invalid */
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
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return null;

  const axios = (await import("axios")).default;
  const base = getApiBase();
  const res = await axios.post(
    `${base}/refresh-token/`,
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
  try {
    sessionStorage.setItem("token", newToken);
  } catch {
    /* ignore */
  }
  return newToken;
}

function scheduleProactiveRefresh() {
  clearProactiveTimer();
  if (typeof window === "undefined") return;

  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
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
      /* next API call may 401 and axios will try refresh */
    }
  }, delay);
}

function onVisibilityChange() {
  if (typeof document === "undefined" || document.visibilityState !== "visible") {
    return;
  }
  const token =
    localStorage.getItem("token") || sessionStorage.getItem("token");
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

/** Start proactive timer + visibility listener (idempotent listener). */
export function notifyTokenUpdated() {
  if (typeof window === "undefined") return;
  scheduleProactiveRefresh();
  if (!visibilityListenerAttached) {
    document.addEventListener("visibilitychange", onVisibilityChange);
    visibilityListenerAttached = true;
  }
}

/** Clear timers and visibility listener (call on logout). */
export function stopTokenRefreshCycle() {
  clearProactiveTimer();
  if (typeof document !== "undefined" && visibilityListenerAttached) {
    document.removeEventListener("visibilitychange", onVisibilityChange);
    visibilityListenerAttached = false;
  }
}
