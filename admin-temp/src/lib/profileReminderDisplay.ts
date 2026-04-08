/**
 * Maps GET all-user-details/ fields (canonical + backend aliases) for profile/KYC reminder stats.
 * Backend: profile_reminder_send_count, last_profile_reminder_at (+ aliases on same payload).
 */

export function formatProfileReminderShortDate(d: Date): string {
  try {
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export type ProfileReminderDisplay = { count: number | null; lastLabel: string | null };

export function getProfileReminderDisplay(row: Record<string, unknown>): ProfileReminderDisplay {
  const asNum = (v: unknown): number | null => {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
    return null;
  };
  const count =
    asNum(row.profile_reminder_send_count) ??
    asNum(row.profile_reminder_count) ??
    asNum(row.incomplete_profile_reminder_count) ??
    asNum(row.verification_reminder_count) ??
    asNum(row.reminder_send_count);

  const lastRaw =
    (typeof row.last_profile_reminder_at === "string" && row.last_profile_reminder_at) ||
    (typeof row.last_incomplete_profile_reminder_at === "string" &&
      row.last_incomplete_profile_reminder_at) ||
    (typeof row.last_reminder_sent_at === "string" && row.last_reminder_sent_at) ||
    (typeof row.profile_reminder_last_at === "string" && row.profile_reminder_last_at) ||
    null;

  let lastLabel: string | null = null;
  if (lastRaw) {
    const d = new Date(lastRaw);
    lastLabel = Number.isNaN(d.getTime()) ? lastRaw : formatProfileReminderShortDate(d);
  }
  return { count, lastLabel };
}
