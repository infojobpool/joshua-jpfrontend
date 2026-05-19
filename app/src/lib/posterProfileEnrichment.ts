/**
 * Fetch and merge poster avatar + review stats for the task detail page.
 */
import type { PosterReviewSnippet } from "@/app/types";
import axiosInstance from "@/lib/axiosInstance";
import { hasRealProfilePhotoUrl } from "@/lib/payoutProfileCompletion";
import { resolveProfileImageUrl } from "@/lib/profileImage";
import { pickRecentPosterReviews } from "@/lib/posterReviewsFromProfile";
import { readPosterProfileCache, writePosterProfileCache, type PosterProfileCacheEntry } from "@/lib/posterProfileCache";

export type PosterEnrichment = {
  avatar?: string;
  rating?: number | null;
  taskmasterAverageRating?: number | null;
  taskmasterReviewCount?: number | null;
  recentPosterReviews?: PosterReviewSnippet[];
};

const inflight = new Map<string, Promise<PosterEnrichment | null>>();

export function posterNeedsEnrichment(poster: {
  avatar?: string;
  taskmasterReviewCount?: number | null;
  recentPosterReviews?: PosterReviewSnippet[];
}): boolean {
  return (
    !hasRealProfilePhotoUrl(poster.avatar) ||
    poster.taskmasterReviewCount == null ||
    !Array.isArray(poster.recentPosterReviews)
  );
}

export function applyPosterEnrichment<T extends PosterEnrichment>(poster: T, patch: PosterEnrichment): T {
  const next = { ...poster };
  if (hasRealProfilePhotoUrl(patch.avatar)) {
    next.avatar = patch.avatar;
  }
  if (patch.rating != null && patch.rating > 0) {
    next.rating = patch.rating;
  }
  if (patch.taskmasterReviewCount != null) {
    next.taskmasterReviewCount = patch.taskmasterReviewCount;
    next.taskmasterAverageRating = patch.taskmasterAverageRating ?? null;
  }
  if (Array.isArray(patch.recentPosterReviews)) {
    next.recentPosterReviews = patch.recentPosterReviews;
  }
  return next;
}

export function enrichmentFromCacheEntry(hit: PosterProfileCacheEntry): PosterEnrichment {
  return {
    avatar: hit.avatar,
    rating: hit.rating ?? null,
    taskmasterAverageRating: hit.taskmasterAverageRating ?? null,
    taskmasterReviewCount: hit.taskmasterReviewCount ?? null,
    recentPosterReviews: hit.recentPosterReviews ?? [],
  };
}

function parseProfileResponse(data: unknown): PosterEnrichment | null {
  const d = data as Record<string, unknown>;
  const payload = (d?.data ?? d) as Record<string, unknown>;
  const rawImg =
    payload?.profile_img ??
    payload?.profile_image ??
    payload?.profile_photo ??
    payload?.photo_url ??
    payload?.avatar ??
    (payload?.user as { profile_img?: string } | undefined)?.profile_img ??
    (payload?.user as { profile_image?: string } | undefined)?.profile_image ??
    d?.profile_img ??
    d?.profile_image;
  const img = resolveProfileImageUrl(typeof rawImg === "string" ? rawImg : undefined);
  const rating =
    payload?.rating ??
    payload?.average_rating ??
    payload?.review_rating ??
    d?.rating ??
    d?.average_rating ??
    d?.review_rating;
  const reviews = (payload?.reviews ?? d?.reviews ?? []) as unknown[];
  const recentSnippets = pickRecentPosterReviews(reviews);
  let taskmasterAverage: number | null = null;
  let taskmasterCount = 0;
  if (Array.isArray(reviews)) {
    const taskmasterReviews = reviews.filter((r) => {
      const role = String((r as { role?: string })?.role ?? "").toLowerCase();
      return role === "taskmaster" || role === "poster";
    });
    taskmasterCount = taskmasterReviews.length;
    if (taskmasterCount > 0) {
      const sum = taskmasterReviews.reduce((s, r) => s + (Number((r as { rating?: number })?.rating) || 0), 0);
      taskmasterAverage = sum / taskmasterCount;
    }
  }
  return {
    avatar: img || undefined,
    rating: rating != null ? Number(rating) : null,
    taskmasterAverageRating: taskmasterCount > 0 ? taskmasterAverage : null,
    taskmasterReviewCount: taskmasterCount,
    recentPosterReviews: recentSnippets,
  };
}

/** GET /profile for poster — deduped in-flight; writes session cache. */
export async function fetchPosterProfileEnrichment(userId: string): Promise<PosterEnrichment | null> {
  const id = String(userId).trim();
  if (!id) return null;

  const cached = readPosterProfileCache(id);
  if (cached && !posterNeedsEnrichment(enrichmentFromCacheEntry(cached))) {
    return enrichmentFromCacheEntry(cached);
  }

  const existing = inflight.get(id);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await axiosInstance.get(`/profile?user_id=${id}`);
      const parsed = parseProfileResponse(res.data);
      if (parsed) {
        writePosterProfileCache(id, {
          avatar: parsed.avatar,
          rating: parsed.rating,
          taskmasterAverageRating: parsed.taskmasterAverageRating,
          taskmasterReviewCount: parsed.taskmasterReviewCount,
          recentPosterReviews: parsed.recentPosterReviews,
        });
      }
      return parsed;
    } catch {
      return null;
    } finally {
      inflight.delete(id);
    }
  })();

  inflight.set(id, promise);
  return promise;
}

/** Fire-and-forget before navigation (card hover / tap). */
export function prefetchPosterProfile(userId: string | undefined | null): void {
  if (!userId || typeof window === "undefined") return;
  const id = String(userId).trim();
  if (!id) return;
  const hit = readPosterProfileCache(id);
  if (hit && !posterNeedsEnrichment(enrichmentFromCacheEntry(hit))) return;
  void fetchPosterProfileEnrichment(id);
}
