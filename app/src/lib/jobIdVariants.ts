/**
 * Backend routes sometimes expect `task_147` and sometimes `147` (see get-bids / mark-complete).
 * Task detail page tries both; dashboard and other callers should match to avoid 404/500 on wrong id.
 */
export function jobIdVariants(id: string): string[] {
  const s = String(id).trim();
  const alt = s.startsWith("task_") ? s.replace(/^task_/, "") : `task_${s}`;
  return [s, alt].filter((x, i, arr) => arr.indexOf(x) === i);
}
