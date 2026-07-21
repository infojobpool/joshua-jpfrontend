import axiosInstance from "@/lib/axiosInstance";

/** Fast path when backend supports it (skips per-user task/earnings aggregation). */
export const ALL_USER_DETAILS_FAST_PARAMS = { include_stats: "false" } as const;

const CUSTOMERS_CACHE_KEY = "admin_customers_cache_v1";
const CUSTOMERS_CACHE_TTL_MS = 10 * 60 * 1000;

/** Normalize GET all-user-details/ (and similar) into a user row array. */
export function coerceAdminUserList(res: { data?: unknown }): Record<string, unknown>[] {
  const root = res?.data as Record<string, unknown> | undefined;
  const raw = (root?.data ?? root) as unknown;
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const k of ["users", "results", "items", "user_list"]) {
      const v = o[k];
      if (Array.isArray(v)) return v as Record<string, unknown>[];
    }
  }
  return [];
}

export async function fetchAllUserDetailsAdmin(
  signal?: AbortSignal
): Promise<Record<string, unknown>[]> {
  const response = await axiosInstance.get("all-user-details/", {
    params: ALL_USER_DETAILS_FAST_PARAMS,
    signal,
  });
  return coerceAdminUserList(response);
}

export function readAdminCustomersCache<T>(): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOMERS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { fetchedAt?: number; rows?: T[] };
    if (!parsed?.fetchedAt || !Array.isArray(parsed.rows)) return [];
    if (Date.now() - parsed.fetchedAt > CUSTOMERS_CACHE_TTL_MS) return [];
    return parsed.rows;
  } catch {
    return [];
  }
}

export function writeAdminCustomersCache<T>(rows: T[]): void {
  if (typeof window === "undefined" || rows.length === 0) return;
  try {
    localStorage.setItem(
      CUSTOMERS_CACHE_KEY,
      JSON.stringify({ fetchedAt: Date.now(), rows })
    );
  } catch {
    /* quota */
  }
}
