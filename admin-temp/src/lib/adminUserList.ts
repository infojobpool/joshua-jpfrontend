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
