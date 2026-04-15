/**
 * Profile phone helpers (India-focused).
 * Accepts 10-digit numbers and common variants: leading trunk "0" (+10 digits) and +91 / 91 prefix.
 */

function stripSeparators(raw: string): string {
  return raw.trim().replace(/[\s\-().]/g, "");
}

/**
 * Returns digits-only phone suitable for API (typically 10 digits), or "" if empty.
 */
export function normalizeProfilePhone(raw: string): string {
  let s = stripSeparators(raw);
  if (!s) return "";
  if (s.startsWith("+91")) s = s.slice(3);
  else if (s.startsWith("91") && s.length >= 12) s = s.slice(2);
  s = s.replace(/\D/g, "");
  if (!s) return "";
  if (s.length === 11 && s.startsWith("0")) s = s.slice(1);
  return s;
}

/** True if empty (optional field) or if normalized value is exactly 10 digits. */
export function isValidProfilePhone(raw: string): boolean {
  const normalized = normalizeProfilePhone(raw);
  if (!normalized) return true;
  return /^\d{10}$/.test(normalized);
}
