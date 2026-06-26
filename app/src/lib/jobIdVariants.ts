/**
 * Canonical job id for API paths. Backend accepts `task_147` or `147`; we use `task_` prefix everywhere.
 */
export function canonicalJobId(id: string): string {
  const s = String(id ?? "").trim();
  if (!s) return s;
  const numeric = s.replace(/^task_/, "");
  return numeric ? `task_${numeric}` : s;
}

/** @deprecated Prefer canonicalJobId — returns single canonical shape. */
export function jobIdVariants(id: string): string[] {
  return [canonicalJobId(id)];
}

/** Single id for GET /get-job-with-bids/ and /get-job/ (backend accepts both shapes; one request is enough). */
export function jobIdTryList(id: string): string[] {
  return [canonicalJobId(id)];
}

/** Route param id vs API `job_id` may differ by `task_` prefix only. */
export function jobIdsAlign(routeId: string, jobId: unknown): boolean {
  const a = canonicalJobId(String(routeId ?? ""));
  const b = canonicalJobId(String(jobId ?? ""));
  if (!a || !b) return false;
  return a === b;
}
