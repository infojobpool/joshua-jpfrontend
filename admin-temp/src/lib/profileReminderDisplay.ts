/**
 * Maps GET all-user-details/ fields (canonical + backend aliases) for profile/KYC reminder stats.
 * Backend: profile_reminder_send_count, last_profile_reminder_at (+ aliases on same payload).
 *
 * We read profile-named counts first. Generic keys (e.g. verification_reminder_count) are often
 * default 0 for every row; using them in a flat ?? chain made the UI show "0 times" even when
 * reminder history was not actually tracked — use those only when count > 0 or a last-sent date exists.
 */

export function formatProfileReminderShortDate(d: Date): string {
  try {
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export type ProfileReminderDisplay = { count: number | null; lastLabel: string | null };

function asNum(v: unknown): number | null {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function firstNonNullCount(row: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const n = asNum(row[k]);
    if (n !== null) return n;
  }
  return null;
}

function getLastRaw(row: Record<string, unknown>): string | null {
  return (
    (typeof row.last_profile_reminder_at === "string" && row.last_profile_reminder_at) ||
    (typeof row.last_incomplete_profile_reminder_at === "string" &&
      row.last_incomplete_profile_reminder_at) ||
    (typeof row.last_reminder_sent_at === "string" && row.last_reminder_sent_at) ||
    (typeof row.profile_reminder_last_at === "string" && row.profile_reminder_last_at) ||
    (typeof row.lastProfileReminderAt === "string" && row.lastProfileReminderAt) ||
    (typeof row.lastIncompleteProfileReminderAt === "string" &&
      row.lastIncompleteProfileReminderAt) ||
    (typeof row.lastReminderSentAt === "string" && row.lastReminderSentAt) ||
    (typeof row.profileReminderLastAt === "string" && row.profileReminderLastAt) ||
    null
  );
}

/** Count fields that specifically mean “profile / KYC reminder sends” (including 0). */
const PRIMARY_COUNT_KEYS = [
  "profile_reminder_send_count",
  "profileReminderSendCount",
  "profile_reminder_count",
  "profileReminderCount",
  "incomplete_profile_reminder_count",
  "incompleteProfileReminderCount",
] as const;

/** Broader aliases: only trust when > 0, or when a last-sent timestamp is present (avoids default 0 noise). */
const LOOSE_COUNT_KEYS = [
  "verification_reminder_count",
  "verificationReminderCount",
  "reminder_send_count",
  "reminderSendCount",
] as const;

export function getProfileReminderDisplay(row: Record<string, unknown>): ProfileReminderDisplay {
  const lastRaw = getLastRaw(row);

  let lastLabel: string | null = null;
  if (lastRaw) {
    const d = new Date(lastRaw);
    lastLabel = Number.isNaN(d.getTime()) ? lastRaw : formatProfileReminderShortDate(d);
  }

  let count = firstNonNullCount(row, [...PRIMARY_COUNT_KEYS]);

  if (count === null) {
    for (const k of LOOSE_COUNT_KEYS) {
      const n = asNum(row[k]);
      if (n === null) continue;
      if (n > 0 || lastRaw) {
        count = n;
        break;
      }
    }
  }

  return { count, lastLabel };
}
