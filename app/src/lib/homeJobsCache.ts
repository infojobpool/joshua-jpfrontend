import axiosInstance from "@/lib/axiosInstance";

const TTL_MS = 45_000;

let inflight: Promise<RawJob[]> | null = null;
let cache: { jobs: RawJob[]; fetchedAt: number } | null = null;

/** Raw job row from GET /get-all-jobs/ */
export type RawJob = Record<string, unknown>;

/**
 * Single-flight cached fetch for homepage sections (recent tasks + scroller).
 * Avoids duplicate /get-all-jobs/ when both components mount (mobile + desktop hidden siblings).
 */
export async function getAllJobsForHomeCached(): Promise<RawJob[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return cache.jobs;
  }
  if (inflight) {
    return inflight;
  }
  inflight = (async () => {
    try {
      const response = await axiosInstance.get("/get-all-jobs/");
      const data = response?.data;
      if (data?.status_code === 200) {
        const raw = data?.data?.jobs ?? [];
        const jobs = Array.isArray(raw) ? raw : [];
        cache = { jobs, fetchedAt: Date.now() };
        return jobs;
      }
    } catch {
      /* ignore */
    }
    cache = { jobs: [], fetchedAt: Date.now() };
    return [];
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/** Normalized card for homepage task rows (open listings, recent first). */
export type HomeTaskCard = {
  id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  category_name: string;
  imageUrl: string | null;
};

function parsePostedAtMs(job: RawJob): number {
  const raw =
    (job.created_at ??
      job.timestamp ??
      job.tstamp ??
      job.job_tstamp ??
      job.updated_at ??
      job.date ??
      job.posted_at) as string | number | undefined;
  const t = raw != null && raw !== "" ? new Date(String(raw)).getTime() : NaN;
  return Number.isFinite(t) ? t : 0;
}

function firstJobImageUrl(job: RawJob): string | null {
  const ji = job.job_images as { urls?: string[] } | string[] | undefined;
  if (!ji) return null;
  const urls = Array.isArray(ji) ? ji : ji.urls;
  if (!Array.isArray(urls) || urls.length === 0) return null;
  const u = urls[0];
  if (typeof u !== "string" || !u.trim()) return null;
  return u.trim();
}

/** Same “active listing” rule as browse: not deleted and status is true. */
export function isOpenListingJob(job: RawJob): boolean {
  if (job.deletion_status === true) return false;
  return job.status === true;
}

/**
 * Open jobs only, newest first, capped. Empty ids dropped.
 */
export function selectOpenRecentTaskCards(jobs: RawJob[], limit: number): HomeTaskCard[] {
  return jobs
    .filter(isOpenListingJob)
    .sort((a, b) => parsePostedAtMs(b) - parsePostedAtMs(a))
    .slice(0, limit)
    .map((job) => ({
      id: String(job.job_id ?? ""),
      title: String(job.job_title ?? "Task"),
      description: String(job.job_description ?? ""),
      budget: Number(job.job_budget) || 0,
      location: String(job.job_location ?? ""),
      category_name: String(
        (job.job_category_name as string) || (job.job_category as string) || "General"
      ),
      imageUrl: firstJobImageUrl(job),
    }))
    .filter((t) => t.id.length > 0);
}
