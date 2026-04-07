import axiosInstance from "@/lib/axiosInstance";

const TTL_MS = 45_000;

let inflight: Promise<RawJob[]> | null = null;
let cache: { jobs: RawJob[]; fetchedAt: number } | null = null;

/** Raw job row from GET /get-all-jobs/ */
export type RawJob = Record<string, unknown>;

/** True when GET /get-all-jobs/ body indicates success (handles string/number status_code). */
export function isGetAllJobsResponseOk(
  data: unknown,
  httpStatus: number | undefined
): boolean {
  const sc = (data as { status_code?: unknown } | null)?.status_code;
  if (Number(sc) === 200 || sc === "200") return true;
  if (sc === 200) return true;
  if (httpStatus === 200 && (sc === undefined || sc === null)) return true;
  return false;
}

export function extractJobsArray(data: unknown): RawJob[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  const inner = d.data;
  if (inner && typeof inner === "object") {
    const j = (inner as { jobs?: unknown }).jobs;
    if (Array.isArray(j)) return j as RawJob[];
  }
  if (Array.isArray(d.jobs)) return d.jobs as RawJob[];
  return [];
}

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
      if (isGetAllJobsResponseOk(data, response?.status)) {
        const jobs = extractJobsArray(data);
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
  if (ji) {
    const urls = Array.isArray(ji) ? ji : ji.urls;
    if (Array.isArray(urls) && urls.length > 0) {
      const u = urls[0];
      if (typeof u === "string" && u.trim()) return u.trim();
    }
  }
  const single = job.image_url ?? job.job_image_url ?? job.thumbnail_url;
  if (typeof single === "string" && single.trim()) return single.trim();
  return null;
}

/**
 * Open listing available to taskers. Per FRONTEND_API_BROWSE.md, boolean `status === false`
 * means open; `true` means taken/in progress. Also accepts common string statuses.
 */
export function isOpenListingJob(job: RawJob): boolean {
  if (job.deletion_status === true) return false;

  const st = job.status;

  if (st === false) return true;

  if (st === true) return false;

  if (typeof st === "string") {
    const s = st.toLowerCase().trim();
    if (
      /cancel|completed|closed|assigned|in.?progress|paid|working|accepted/.test(s)
    ) {
      return false;
    }
    if (/^(open|active|posted|available|pending)$/.test(s)) return true;
    return false;
  }

  return false;
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
