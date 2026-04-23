import type { PosterReviewSnippet } from "@/app/types";

const MAX_SNIPPETS = 2;
const MAX_COMMENT_LEN = 220;

function trimComment(s: unknown): string {
  const t = typeof s === "string" ? s.trim() : "";
  if (t.length <= MAX_COMMENT_LEN) return t;
  return `${t.slice(0, MAX_COMMENT_LEN)}…`;
}

function reviewTime(r: Record<string, unknown>): number {
  const raw = r.timestamp ?? r.created_at ?? r.createdAt ?? r.date ?? "";
  const n = new Date(String(raw)).getTime();
  return Number.isFinite(n) ? n : 0;
}

/** Reviews left for this user when they acted as taskmaster / poster (from GET /profile `reviews`). */
export function pickRecentPosterReviews(reviews: unknown): PosterReviewSnippet[] {
  if (!Array.isArray(reviews)) return [];
  const rows = reviews.filter((r) => {
    const role = String((r as { role?: string })?.role ?? "").toLowerCase();
    return role === "taskmaster" || role === "poster";
  }) as Record<string, unknown>[];

  rows.sort((a, b) => reviewTime(b) - reviewTime(a));

  const out: PosterReviewSnippet[] = [];
  for (let i = 0; i < rows.length && out.length < MAX_SNIPPETS; i++) {
    const r = rows[i];
    const rating = Number(r.rating);
    if (!Number.isFinite(rating) || rating <= 0) continue;
    const comment = trimComment(r.comment ?? r.review_comment ?? r.text);
    const reviewerName = String(r.reviewer_name ?? r.reviewer ?? r.name ?? "Tasker").trim() || "Tasker";
    const jobTitle = String(r.job_title ?? r.task_title ?? r.title ?? r.project ?? "").trim();
    const id = String(r.id ?? r.review_id ?? `r-${i}-${reviewTime(r)}`);
    out.push({
      id,
      rating,
      comment,
      reviewerName,
      jobTitle: jobTitle || undefined,
    });
  }
  return out;
}
