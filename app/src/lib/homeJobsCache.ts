import axiosInstance from "@/lib/axiosInstance";
import { isJobCompletedFlag, isJobDeletedOrCancelled } from "@/lib/jobStatusNormalize";
import { resolveProfileImageUrl } from "@/lib/profileImage";

/** Fresh window: serve from memory without hitting the network. */
const TTL_MS = 120_000;
/** Persist at most this many raw rows to keep disk cache small and fast. */
const PERSIST_JOB_CAP = 100;
const STORAGE_KEY = "jobpool_home_get_all_jobs_v1";
/** Ignore disk snapshot older than this. */
const DISK_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

let inflight: Promise<RawJob[]> | null = null;
let cache: { jobs: RawJob[]; fetchedAt: number } | null = null;

function readDiskSnapshotRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeDiskSnapshotRaw(value: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore localStorage quota / private mode */
  }
  try {
    sessionStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore sessionStorage quota / private mode */
  }
}

/** Raw job row from GET /get-all-jobs/ */
export type RawJob = Record<string, unknown>;

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
  if (Array.isArray(d.data)) return d.data as RawJob[];
  const inner = d.data;
  if (inner && typeof inner === "object") {
    const j = (inner as { jobs?: unknown }).jobs;
    if (Array.isArray(j)) return j as RawJob[];
  }
  if (Array.isArray(d.jobs)) return d.jobs as RawJob[];
  return [];
}

function tryHydrateCacheFromDisk(): void {
  if (typeof window === "undefined" || cache) return;
  try {
    const raw = readDiskSnapshotRaw();
    if (!raw) return;
    const p = JSON.parse(raw) as { jobs?: RawJob[]; fetchedAt?: number };
    if (!p || typeof p.fetchedAt !== "number" || !Array.isArray(p.jobs)) return;
    if (Date.now() - p.fetchedAt > DISK_MAX_AGE_MS) return;
    cache = { jobs: p.jobs, fetchedAt: p.fetchedAt };
  } catch {
    /* ignore */
  }
}

function persistJobs(jobs: RawJob[]): void {
  if (typeof window === "undefined") return;
  try {
    const slice = jobs.slice(0, PERSIST_JOB_CAP);
    writeDiskSnapshotRaw(JSON.stringify({ jobs: slice, fetchedAt: Date.now() }));
  } catch {
    /* quota / private mode */
  }
}

/** Map `GET /recent-open-jobs/` slim rows into the shape used by home cards (legacy uses job_* keys). */
function coerceRecentRowToRawJob(row: RawJob): RawJob {
  const legacy = row.job_id != null || row.job_title != null;
  if (legacy) {
    return row.status !== undefined ? row : { ...row, status: false };
  }
  const jobId = String(row.job_id ?? row.id ?? row.pk ?? "").trim();
  if (!jobId) return { ...row, status: row.status ?? false };
  return {
    ...row,
    job_id: jobId,
    job_title: String(row.job_title ?? row.title ?? "Task"),
    job_description: String(row.job_description ?? row.description ?? ""),
    job_budget: Number(row.job_budget ?? row.budget ?? 0) || 0,
    job_location: String(row.job_location ?? row.location ?? row.location_text ?? ""),
    job_category_name: String(row.job_category_name ?? row.job_category ?? row.category ?? "General"),
    status: row.status ?? false,
  };
}

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

function firstNonEmptyStringUrl(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function firstUrlFromStringArray(arr: unknown): string | null {
  if (!Array.isArray(arr)) return null;
  for (const el of arr) {
    const s = firstNonEmptyStringUrl(el);
    if (s) return s;
  }
  return null;
}

/**
 * First task image URL from a job row. Supports full `get-all-jobs` shape plus slim
 * `recent-open-jobs` fields (often omit `job_images.urls` or use a flat thumbnail).
 */
function firstJobImageUrl(job: RawJob): string | null {
  const ji = job.job_images as { urls?: unknown[] } | unknown[] | string | undefined;
  if (ji) {
    if (typeof ji === "string") {
      const s = firstNonEmptyStringUrl(ji);
      if (s) return s;
    } else {
      const urls = Array.isArray(ji) ? ji : ji.urls;
      const fromArr = firstUrlFromStringArray(urls);
      if (fromArr) return fromArr;
    }
  }

  const fromArrays = firstUrlFromStringArray(
    job.photo_urls ?? job.photos ?? job.images ?? job.task_images ?? job.media_urls,
  );
  if (fromArrays) return fromArrays;

  const flat =
    firstNonEmptyStringUrl(job.image_url) ??
    firstNonEmptyStringUrl(job.job_image_url) ??
    firstNonEmptyStringUrl(job.thumbnail_url) ??
    firstNonEmptyStringUrl(job.thumbnail) ??
    firstNonEmptyStringUrl(job.cover_image) ??
    firstNonEmptyStringUrl(job.cover_image_url) ??
    firstNonEmptyStringUrl(job.primary_image_url) ??
    firstNonEmptyStringUrl(job.preview_image) ??
    firstNonEmptyStringUrl(job.preview_image_url) ??
    firstNonEmptyStringUrl(job.photo_url) ??
    firstNonEmptyStringUrl(job.picture) ??
    firstNonEmptyStringUrl(job.image) ??
    firstNonEmptyStringUrl(job.banner_url) ??
    firstNonEmptyStringUrl(job.job_image) ??
    firstNonEmptyStringUrl(job.task_image) ??
    firstNonEmptyStringUrl(job.hero_image) ??
    firstNonEmptyStringUrl(job.main_image) ??
    firstNonEmptyStringUrl(job.media_url);

  return flat;
}

/** Absolute URL for `<img src>` (slim APIs often return `/media/...` paths). */
function resolveHomeCardImageUrl(raw: string | null): string | null {
  if (!raw) return null;
  if (/placeholder\.com/i.test(raw)) return null;
  return resolveProfileImageUrl(raw) ?? raw;
}

/**
 * Open listing available to taskers. Per FRONTEND_API_BROWSE.md, boolean `status === false`
 * means open; `true` means taken/in progress. Also accepts common string statuses.
 */
export function isOpenListingJob(job: RawJob): boolean {
  const j = job as Record<string, unknown>;
  if (isJobDeletedOrCancelled(j)) return false;
  if (isJobCompletedFlag(j)) return false;

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
      imageUrl: resolveHomeCardImageUrl(firstJobImageUrl(job)),
    }))
    .filter((t) => t.id.length > 0);
}

/**
 * Synchronous read for first paint: hydrate task cards from last session fetch.
 * Returns `fromCache: true` only when a valid snapshot existed (even if zero open tasks).
 */
export function readPersistedHomeSnapshot(limit: number): {
  tasks: HomeTaskCard[];
  fromCache: boolean;
} {
  if (typeof window === "undefined") {
    return { tasks: [], fromCache: false };
  }
  try {
    const raw = readDiskSnapshotRaw();
    if (!raw) return { tasks: [], fromCache: false };
    const p = JSON.parse(raw) as { jobs?: RawJob[]; fetchedAt?: number };
    if (!p || typeof p.fetchedAt !== "number" || !Array.isArray(p.jobs)) {
      return { tasks: [], fromCache: false };
    }
    if (Date.now() - p.fetchedAt > DISK_MAX_AGE_MS) return { tasks: [], fromCache: false };
    const cards = selectOpenRecentTaskCards(p.jobs, limit);
    return { tasks: cards, fromCache: true };
  } catch {
    return { tasks: [], fromCache: false };
  }
}

/**
 * Dashboard / browse fast path: only GET /recent-open-jobs/ (small payload).
 * Does not touch the home cache or fall back to get-all-jobs — avoids duplicate heavy calls
 * when the dashboard also fetches the full list in parallel.
 */
export async function fetchRecentOpenJobsQuick(
  limit = 48,
  signal?: AbortSignal
): Promise<RawJob[]> {
  try {
    const recent = await axiosInstance.get("/recent-open-jobs/", {
      params: { limit },
      signal,
      timeout: 12_000,
    });
    const rd = recent?.data;
    if (!isGetAllJobsResponseOk(rd, recent?.status)) return [];
    let jobs = extractJobsArray(rd);
    if (jobs.length === 0 && rd && typeof rd === "object") {
      const r = rd as Record<string, unknown>;
      if (Array.isArray(r.results)) jobs = r.results as RawJob[];
    }
    if (jobs.length === 0) return [];
    return jobs.map(coerceRecentRowToRawJob);
  } catch {
    return [];
  }
}

/**
 * Single-flight cached fetch for homepage sections (recent tasks + scroller).
 * Avoids duplicate /get-all-jobs/ when both components mount (mobile + desktop hidden siblings).
 */
export async function getAllJobsForHomeCached(): Promise<RawJob[]> {
  tryHydrateCacheFromDisk();

  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return cache.jobs;
  }
  if (inflight) {
    return inflight;
  }
  inflight = (async () => {
    let gotSuccessfulHttpParse = false;
    try {
      try {
        const recent = await axiosInstance.get("/recent-open-jobs/", {
          params: { limit: 16 },
          timeout: 14_000,
        });
        const rd = recent?.data;
        if (isGetAllJobsResponseOk(rd, recent?.status)) {
          gotSuccessfulHttpParse = true;
          let jobs = extractJobsArray(rd);
          if (jobs.length === 0 && rd && typeof rd === "object") {
            const r = rd as Record<string, unknown>;
            if (Array.isArray(r.results)) jobs = r.results as RawJob[];
          }
          if (jobs.length > 0) {
            const coerced = jobs.map(coerceRecentRowToRawJob);
            cache = { jobs: coerced, fetchedAt: Date.now() };
            persistJobs(coerced);
            return coerced;
          }
        }
      } catch {
        /* Older API without recent-open-jobs */
      }

      const response = await axiosInstance.get("/get-all-jobs/", { timeout: 26_000 });
      const data = response?.data;
      if (isGetAllJobsResponseOk(data, response?.status)) {
        gotSuccessfulHttpParse = true;
        const jobs = extractJobsArray(data);
        cache = { jobs, fetchedAt: Date.now() };
        if (jobs.length > 0) {
          persistJobs(jobs);
        }
        return jobs;
      }
    } catch {
      /* ignore */
    }
    if (cache && cache.jobs.length > 0) {
      return cache.jobs;
    }
    tryHydrateCacheFromDisk();
    if (cache && cache.jobs.length > 0) {
      return cache.jobs;
    }
    if (!gotSuccessfulHttpParse) {
      throw Object.assign(new Error("HOME_JOBS_FETCH_FAILED"), { code: "HOME_JOBS_FETCH_FAILED" });
    }
    return [];
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

/** Start fetch early so `recent-open-jobs` (or `get-all-jobs`) overlaps first paint. */
export function warmHomeJobsCache(): void {
  if (typeof window === "undefined") return;
  tryHydrateCacheFromDisk();
  void getAllJobsForHomeCached().catch(() => {
    /* prefetch must not surface as unhandled rejection */
  });
}

/** Clear memory cache so the next home fetch hits the network (e.g. user taps Retry). */
export function invalidateHomeJobsCache(): void {
  cache = null;
  inflight = null;
}
