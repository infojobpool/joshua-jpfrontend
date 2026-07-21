/** Distinguish slow backend / client abort from true offline errors. */

export function isSlowServerError(error: unknown): boolean {
  const e = error as { name?: string; code?: string; message?: string };
  if (e?.name === "AbortError") return true;
  if (e?.code === "ECONNABORTED") return true;
  const msg = (e?.message ?? "").toLowerCase();
  if (msg.includes("timeout") || msg.includes("aborted")) return true;
  return false;
}

export function isLikelyOfflineError(error: unknown): boolean {
  const e = error as { code?: string; message?: string; response?: unknown };
  if (e?.code === "ERR_NETWORK" && e?.response == null) return true;
  const msg = (e?.message ?? "").toLowerCase();
  if (msg === "network error" || msg.includes("failed to fetch")) return true;
  return false;
}

export function loadFailureUserMessage(error: unknown, entityLabel: string): string {
  if (isLikelyOfflineError(error)) {
    return `Couldn't load ${entityLabel}. Check your connection and try again.`;
  }
  if (isSlowServerError(error)) {
    return `Couldn't load ${entityLabel}. The server is responding slowly — tap Retry in a moment.`;
  }
  return `Couldn't load ${entityLabel}. Please try again in a moment.`;
}

export function retryToastMessage(error: unknown): string {
  if (isLikelyOfflineError(error)) {
    return "Connection issue. Retrying…";
  }
  return "Still loading — the server is slow. Retrying…";
}

/** Task detail fetch: allow slow backend before abort (seconds). */
export const TASK_DETAIL_FETCH_MS = 45_000;

/** PAN / Aadhaar — Cashfree + cold API can exceed 6s backend default; client waits longer. */
export const VERIFICATION_REQUEST_TIMEOUT_MS = 120_000;

export function isVerificationTimeoutMessage(text: string): boolean {
  const msg = text.toLowerCase();
  return msg.includes("timeout") && (msg.includes("exceeded") || msg.includes("timed out"));
}

export function verificationFailureMessage(error: unknown, fallback: string): string {
  const e = error as {
    code?: string;
    message?: string;
    response?: { data?: unknown };
  };
  if (isSlowServerError(error) || isVerificationTimeoutMessage(e.message ?? "")) {
    return "Verification is taking longer than usual. Please wait 30 seconds and try again.";
  }
  const fromBody = extractApiMessage(e.response?.data);
  if (fromBody && isVerificationTimeoutMessage(fromBody)) {
    return "Verification is taking longer than usual. Please wait 30 seconds and try again.";
  }
  if (fromBody) return fromBody;
  if (typeof e.message === "string" && e.message.trim() && !isVerificationTimeoutMessage(e.message)) {
    return e.message.trim();
  }
  return fallback;
}

function extractApiMessage(payload: unknown): string | null {
  if (payload == null) return null;
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  if (typeof payload !== "object") return null;
  const root = payload as Record<string, unknown>;
  for (const key of ["message", "detail", "error"] as const) {
    const val = root[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  if (root.data != null) return extractApiMessage(root.data);
  return null;
}
