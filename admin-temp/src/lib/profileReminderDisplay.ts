/**
 * Maps GET all-user-details/ (snake_case JSON) for profile/KYC reminder stats.
 * Canonical: profile_reminder_send_count, last_profile_reminder_at; aliases duplicate the same values when present.
 * When the user has never been reminded, the backend omits reminder fields (exclude_none) — UI shows —.
 *
 * We read profile-named counts first. Loose keys (e.g. verification_reminder_count) are only used when
 * count > 0 or a last-sent timestamp exists, so default zeros on unrelated columns do not fake “0 times”.
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
    null
  );
}

/** Count fields that specifically mean “profile / KYC reminder sends” (including 0). */
const PRIMARY_COUNT_KEYS = [
  "profile_reminder_send_count",
  "profile_reminder_count",
  "incomplete_profile_reminder_count",
] as const;

/** Broader snake_case aliases: only trust when > 0, or when a last-sent timestamp is present. */
const LOOSE_COUNT_KEYS = ["verification_reminder_count", "reminder_send_count"] as const;

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
