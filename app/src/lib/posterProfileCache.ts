/**
 * Session cache for poster profile snippets (avatar URL + review stats) so the
 * task page can paint faster on repeat views without waiting on /profile.
 */
import type { PosterReviewSnippet } from "@/app/types";
import { resolveApiMediaUrl } from "@/lib/profileImage";
import { hasRealProfilePhotoUrl } from "@/lib/payoutProfileCompletion";

const KEY_PREFIX = "jobpool_poster_profile_v1:";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

export type PosterProfileCacheEntry = {
  avatar: string;
  rating?: number | null;
  taskmasterAverageRating?: number | null;
  taskmasterReviewCount?: number | null;
  recentPosterReviews?: PosterReviewSnippet[];
  savedAt: number;
};

function storageKey(userId: string) {
  return `${KEY_PREFIX}${userId}`;
}

export function readPosterProfileCache(userId: string | undefined | null): PosterProfileCacheEntry | null {
  if (!userId || typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(storageKey(String(userId)));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PosterProfileCacheEntry;
    if (!parsed || typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > TTL_MS) {
      sessionStorage.removeItem(storageKey(String(userId)));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writePosterProfileCache(
  userId: string | undefined | null,
  partial: {
    avatar?: string | null;
    rating?: number | null;
    taskmasterAverageRating?: number | null;
    taskmasterReviewCount?: number | null;
    recentPosterReviews?: PosterReviewSnippet[];
  },
) {
  if (!userId || typeof window === "undefined") return;
  const id = String(userId);
  try {
    const prev = readPosterProfileCache(id);
    const nextAvatarRaw = partial.avatar ?? prev?.avatar ?? "";
    const nextAvatar = nextAvatarRaw ? resolveApiMediaUrl(nextAvatarRaw) : prev?.avatar ?? "";
    const entry: PosterProfileCacheEntry = {
      avatar: nextAvatar,
      rating: partial.rating !== undefined ? partial.rating : prev?.rating ?? null,
      taskmasterAverageRating:
        partial.taskmasterAverageRating !== undefined
          ? partial.taskmasterAverageRating
          : prev?.taskmasterAverageRating ?? null,
      taskmasterReviewCount:
        partial.taskmasterReviewCount !== undefined
          ? partial.taskmasterReviewCount
          : prev?.taskmasterReviewCount ?? null,
      recentPosterReviews:
        partial.recentPosterReviews !== undefined
          ? partial.recentPosterReviews
          : prev?.recentPosterReviews,
      savedAt: Date.now(),
    };
    const hasExplicitReviewList = partial.recentPosterReviews !== undefined;
    const hasUsefulData =
      hasExplicitReviewList ||
      hasRealProfilePhotoUrl(entry.avatar) ||
      (entry.taskmasterReviewCount != null && entry.taskmasterReviewCount > 0) ||
      (entry.rating != null && entry.rating > 0) ||
      (Array.isArray(entry.recentPosterReviews) && entry.recentPosterReviews.length > 0);
    if (!hasUsefulData) return;
    sessionStorage.setItem(storageKey(id), JSON.stringify(entry));
  } catch {
    /* ignore quota / private mode */
  }
}
