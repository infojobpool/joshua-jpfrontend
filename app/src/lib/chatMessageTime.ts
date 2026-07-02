/**
 * Chat APIs return timestamps under different keys and shapes (ISO, SQL datetime, unix).
 * Normalise so the UI shows consistent local times and chronological order.
 */

export function getMessageTimeRaw(msg: {
  tstamp?: string;
  timestamp?: string;
  created_at?: string;
}): string | number | undefined {
  return msg.tstamp ?? msg.timestamp ?? msg.created_at;
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Parse to epoch ms, or null if unusable */
export function parseMessageToMs(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw < 1e12 ? raw * 1000 : raw;
  }
  const s = String(raw).trim();
  if (!s) return null;
  if (/^\d+$/.test(s)) {
    const n = parseInt(s, 10);
    if (!Number.isFinite(n)) return null;
    return n < 1e12 ? n * 1000 : n;
  }
  // "YYYY-MM-DD HH:mm:ss" — Safari often fails without "T"
  let normalized = s;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s) && !s.includes("T")) {
    normalized = s.replace(" ", "T");
    if (!/[zZ]|[+-]\d{2}:\d{2}$/.test(normalized)) {
      normalized += "Z";
    }
  }
  const d = new Date(normalized);
  if (!Number.isNaN(d.getTime())) return d.getTime();

  const d2 = new Date(s);
  if (!Number.isNaN(d2.getTime())) return d2.getTime();

  return null;
}

function formatTimeOfDay(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Shared format for chat bubbles and inbox list — one style everywhere. */
export function formatChatTimestamp(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const clock = formatTimeOfDay(ms);

  if (sameCalendarDay(d, now)) return clock;

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameCalendarDay(d, yesterday)) return `Yesterday, ${clock}`;

  const datePart = d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
  return `${datePart}, ${clock}`;
}

/** Inbox row — same rules as bubbles (no separate "3 days ago" vs "Jun 30 at 10:14"). */
export function formatChatListTimestamp(raw: unknown): string {
  const ms = parseMessageToMs(raw);
  if (ms == null) return "";
  return formatChatTimestamp(ms);
}

export function compareMessagesByTime(
  a: { tstamp?: string; timestamp?: string; created_at?: string },
  b: { tstamp?: string; timestamp?: string; created_at?: string },
): number {
  const ta = parseMessageToMs(getMessageTimeRaw(a)) ?? 0;
  const tb = parseMessageToMs(getMessageTimeRaw(b)) ?? 0;
  return ta - tb;
}
