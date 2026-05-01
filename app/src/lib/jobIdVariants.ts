/**
 * Backend routes sometimes expect `task_147` and sometimes `147` (see get-bids / mark-complete).
 * Task detail page tries both; dashboard and other callers should match to avoid 404/500 on wrong id.
 */
export function jobIdVariants(id: string): string[] {
  const s = String(id).trim();
  const alt = s.startsWith("task_") ? s.replace(/^task_/, "") : `task_${s}`;
  return [s, alt].filter((x, i, arr) => arr.indexOf(x) === i);
}

/** All common id shapes for GET /get-job-with-bids/ and /get-job/ (deduped). */
export function jobIdTryList(id: string): string[] {
  const trimmed = String(id).trim();
  return [
    trimmed,
    trimmed.startsWith("task_") ? trimmed.replace(/^task_/, "") : `task_${trimmed}`,
    trimmed.replace(/^task_/, ""),
  ].filter((x, i, arr) => arr.indexOf(x) === i);
}

/** Route param id vs API `job_id` may differ by `task_` prefix only. */
export function jobIdsAlign(routeId: string, jobId: unknown): boolean {
  const a = String(routeId ?? "").trim();
  const b = String(jobId ?? "").trim();
  if (!a || !b) return false;
  if (a === b) return true;
  const strip = (s: string) => s.replace(/^task_/, "");
  return strip(a) === strip(b);
}
