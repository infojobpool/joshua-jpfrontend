/** Parse task due label (e.g. DD/MM/YYYY) to local calendar date, or null if flexible / invalid. */
export function parseDueDateEndOfDay(due: string | undefined): Date | null {
  const t = due?.trim();
  if (!t || t === "Flexible" || t === "N/A") return null;
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    const dt = new Date(y, mo, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const parsed = Date.parse(t);
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
}

/** Values that mean “no specific date” from API or legacy forms. */
const NO_SPECIFIC_DUE = new Set([
  "",
  "unknown",
  "n/a",
  "na",
  "none",
  "tbd",
  "—",
  "-",
  "not set",
  "not specified",
]);

export function isPlaceholderDueDate(due?: string | null): boolean {
  const t = due?.trim();
  if (!t) return true;
  return NO_SPECIFIC_DUE.has(t.toLowerCase());
}

/**
 * What to show on list cards under “To be done”.
 * Returns display text and whether we can compute a “days left” chip from `dueDate`.
 */
export function dueDisplayForListCard(
  dueDate?: string | null,
  dueDateFlexible?: boolean,
): { display: string; showDaysBadge: boolean } {
  if (dueDateFlexible) {
    return { display: "Flexible", showDaysBadge: false };
  }
  if (isPlaceholderDueDate(dueDate)) {
    return { display: "Upon agreement", showDaysBadge: false };
  }
  return { display: dueDate!.trim(), showDaysBadge: true };
}

/** Human label for days until due date (same rules as task detail). */
export function daysLeftLabel(due: string): string | null {
  const end = parseDueDateEndOfDay(due);
  if (!end) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (diff < 0) return "Past due";
  if (diff === 0) return "Due today";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
}
