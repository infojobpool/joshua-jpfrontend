/**
 * Chat APIs return timestamps under different keys and shapes (ISO, SQL datetime, unix).
 * Backend stores naive UTC (datetime.utcnow) — timezone-less ISO strings must parse as UTC.
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

export function sameCalendarDayMs(aMs: number, bMs: number): boolean {
  return sameCalendarDay(new Date(aMs), new Date(bMs));
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

  let normalized = s;
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(s);

  // "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DDTHH:mm:ss" without offset — treat as UTC
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(s) && !hasTz) {
    normalized = s.includes("T") ? s : s.replace(" ", "T");
    if (!normalized.endsWith("Z")) normalized += "Z";
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

/** Under each bubble — clock time only */
export function formatChatBubbleTime(ms: number): string {
  if (Number.isNaN(new Date(ms).getTime())) return "";
  return formatTimeOfDay(ms);
}

/** Centered day pill between message groups */
export function formatChatDateSeparator(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  if (sameCalendarDay(d, now)) return "Today";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameCalendarDay(d, yesterday)) return "Yesterday";

  return d.toLocaleString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}

/** Inbox row — compact relative date + time */
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

/** Normalise get-messages payload — API returns an array or { messages: [] }. */
export function extractMessagesFromGetMessagesResponse(data: unknown): Array<{
  tstamp?: string;
  timestamp?: string;
  created_at?: string;
  description?: string;
  userrefid?: string;
  username?: string;
  sender_id?: string;
  receiver_id?: string;
  sender_name?: string;
  receiver_name?: string;
}> {
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  if (typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  if (Array.isArray(obj.messages)) return obj.messages as ReturnType<typeof extractMessagesFromGetMessagesResponse>;
  const inner = obj.data;
  if (Array.isArray(inner)) return inner as ReturnType<typeof extractMessagesFromGetMessagesResponse>;
  if (inner != null && typeof inner === "object") {
    const nested = inner as Record<string, unknown>;
    if (Array.isArray(nested.messages)) {
      return nested.messages as ReturnType<typeof extractMessagesFromGetMessagesResponse>;
    }
  }
  return [];
}
