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
