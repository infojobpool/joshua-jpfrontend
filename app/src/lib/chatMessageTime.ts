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
  }
  const d = new Date(normalized);
  if (!Number.isNaN(d.getTime())) return d.getTime();
  return null;
}

export function formatChatTimestamp(ms: number): string {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (sameDay) {
    return d.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function compareMessagesByTime(
  a: { tstamp?: string; timestamp?: string; created_at?: string },
  b: { tstamp?: string; timestamp?: string; created_at?: string },
): number {
  const ta = parseMessageToMs(getMessageTimeRaw(a)) ?? 0;
  const tb = parseMessageToMs(getMessageTimeRaw(b)) ?? 0;
  return ta - tb;
}
