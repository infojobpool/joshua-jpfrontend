/**
 * Routes where the fixed mobile tab bar is hidden so focused flows
 * (auth, post task, verification, payments, chat) get full vertical space.
 * Match is prefix-based after normalizing trailing slashes.
 */
const MOBILE_BOTTOM_NAV_HIDDEN_PREFIXES = [
  "/post-task",
  "/post-task-home",
  "/signin",
  "/signup",
  "/forgotpassword",
  "/resetpassword",
  "/emailconfirmation",
  "/verification",
  "/bankverification",
  "/payments",
  "/payment-callback",
  "/listing-request",
  "/admin",
] as const;

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isMobileBottomNavHidden(pathname: string | null): boolean {
  if (!pathname) return false;
  const p = normalizePathname(pathname);
  // Inbox keeps the tab bar; threads and compose live under /messages/...
  if (p.startsWith("/messages/")) return true;
  return MOBILE_BOTTOM_NAV_HIDDEN_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  );
}

/** Global marketing footer hidden on focused flows (wizard, profile editor, etc.). */
export function isAppFooterHidden(pathname: string | null): boolean {
  if (!pathname) return false;
  const p = normalizePathname(pathname);
  if (p === "/post-task" || p.startsWith("/post-task/") || p === "/listing-request") return true;
  if (p === "/profile" || p.startsWith("/profile/")) return true;
  /** Inbox + threads: full-height messaging (no marketing footer). */
  if (p === "/messages" || p.startsWith("/messages/")) return true;
  return false;
}
