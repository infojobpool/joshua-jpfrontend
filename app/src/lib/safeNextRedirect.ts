/** Internal path only — avoids open redirects (e.g. //evil.com). */
export function getSafeRelativeNext(raw: string | null | undefined): string | null {
  const n = raw?.trim();
  if (!n || !n.startsWith("/") || n.startsWith("//")) return null;
  return n;
}
