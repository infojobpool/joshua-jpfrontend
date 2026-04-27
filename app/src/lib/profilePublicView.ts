/**
 * Public profile `/profilepage/[id]` can hide the "Public listings" block when the visitor
 * arrives from task-focused surfaces (bids, task detail, Q&A, listing request, etc.) so the
 * page stays about trust + reviews. Discovery links omit `?from=` so listings stay visible.
 *
 * Wired `from=` sources: OffersSection (bids), TaskInfo/PosterInfo (task), TaskPublicQuestionsSection
 * (questions), listing-request success/back (booking). Optional: messages, dashboard, reviews.
 *
 * Override: `?showListings=1` always shows listings (also persists for this profile for the tab session).
 * `?hideListings=1` always hides (for deep links).
 */

const HIDE_LISTINGS_FROM = new Set([
  "bids",
  "bid",
  "offers",
  "reviews",
  "review",
  "task",
  "questions",
  "messages",
  "dashboard",
  "booking",
]);

export type ProfileFromContext =
  | "bids"
  | "reviews"
  | "task"
  | "questions"
  | "messages"
  | "offers"
  | "booking";

const LISTINGS_OPT_IN_PREFIX = "jp_profile_show_listings_";

export function profileListingsOptInStorageKey(profileUserId: string): string {
  return `${LISTINGS_OPT_IN_PREFIX}${encodeURIComponent(profileUserId)}`;
}

export function readProfileListingsSessionOptIn(profileUserId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(profileListingsOptInStorageKey(profileUserId)) === "1";
  } catch {
    return false;
  }
}

export function writeProfileListingsSessionOptIn(profileUserId: string): void {
  try {
    sessionStorage.setItem(profileListingsOptInStorageKey(profileUserId), "1");
  } catch {
    /* ignore quota / private mode */
  }
}

/** Build `/profilepage/{id}` with optional `from=` when it should hide listings. */
export function profilePageHref(userId: string, from?: ProfileFromContext): string {
  const base = `/profilepage/${encodeURIComponent(userId)}`;
  if (!from) return base;
  const key = from.toLowerCase();
  if (!HIDE_LISTINGS_FROM.has(key)) return base;
  return `${base}?from=${encodeURIComponent(key)}`;
}

export function shouldHidePublicListingsFromParams(sp: URLSearchParams): boolean {
  const show = sp.get("showListings")?.trim().toLowerCase();
  if (show === "1" || show === "true" || show === "yes") return false;

  const hide = sp.get("hideListings")?.trim().toLowerCase();
  if (hide === "1" || hide === "true" || hide === "yes") return true;

  const from = sp.get("from")?.trim().toLowerCase();
  if (!from) return false;
  return HIDE_LISTINGS_FROM.has(from);
}
