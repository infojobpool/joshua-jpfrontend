import { resolveApiMediaUrl } from "@/lib/profileImage";
import { canonicalJobId, jobIdsAlign } from "@/lib/jobIdVariants";
import {
  applyPosterEnrichment,
  enrichmentFromCacheEntry,
  prefetchPosterProfile,
} from "@/lib/posterProfileEnrichment";
import { readPosterProfileCache } from "@/lib/posterProfileCache";

/**
 * Store task data before navigation for instant display on task detail page.
 * Reduces perceived loading time when clicking "Make offer" or "View offer".
 */
const NAV_TASK_KEY = "nav_task";
const BIDS_CACHE_PREFIX = "bids_cache_";
const TTL_MS = 60_000; // 1 minute
const BIDS_TTL_MS = 120_000; // 2 minutes for bids cache

export interface NavTaskInput {
  id: string;
  title: string;
  description: string;
  budget: number;
  location?: string;
  status?: string;
  posted_by?: string;
  posted_by_id?: string | number;
  posted_by_profile_image?: string;
  category?: string;
  dueDate?: string;
  postedAt?: string;
  images?: { id?: string; url: string; alt?: string }[];
}

export function storeTaskForNav(task: NavTaskInput) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        budget: typeof task.budget === "number" ? task.budget : Number(task.budget) || 0,
        location: task.location || "",
        status: task.status || "open",
        job_completion_status: 0,
        postedAt: task.postedAt || "N/A",
        dueDate: task.dueDate?.trim() || "",
        category: task.category || "",
        images: (task.images && task.images.length)
          ? task.images.map((img, i) => ({
              id: img.id || `img${i + 1}`,
              url: typeof img === "object" && img.url ? img.url : "/images/placeholder.svg",
              alt: (img as any).alt || `Image ${i + 1}`,
            }))
          : [],
        poster: (() => {
          const posterId = String(task.posted_by_id ?? "").trim();
          let poster = {
            id: posterId,
            name: task.posted_by || "Unknown",
            avatar: (() => {
              const raw = task.posted_by_profile_image;
              if (!raw || !String(raw).trim()) return "/images/placeholder.svg";
              return resolveApiMediaUrl(raw);
            })(),
            rating: null as number | null,
            taskCount: null as number | null,
            joinedDate: null as string | null,
          };
          const hit = posterId ? readPosterProfileCache(posterId) : null;
          if (hit) poster = applyPosterEnrichment(poster, enrichmentFromCacheEntry(hit));
          return poster;
        })(),
        offers: [],
        assignedTasker: undefined,
      },
      timestamp: Date.now(),
    };
    sessionStorage.setItem(NAV_TASK_KEY, JSON.stringify(payload));
  } catch (_) {}
}

function readNavTaskEntry(taskId: string, consume: boolean): { task: any } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(NAV_TASK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.task || String(parsed.task.id) !== String(taskId)) return null;
    const age = Date.now() - (parsed.timestamp || 0);
    if (age > TTL_MS) {
      sessionStorage.removeItem(NAV_TASK_KEY);
      return null;
    }
    if (consume) sessionStorage.removeItem(NAV_TASK_KEY);
    return { task: parsed.task };
  } catch (_) {
    return null;
  }
}

/** Read nav task without removing (for instant paint + background refresh). */
export function peekNavTask(taskId: string): { task: any } | null {
  return readNavTaskEntry(taskId, false);
}

export function clearNavTask() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(NAV_TASK_KEY);
  } catch (_) {}
}

/** @deprecated Prefer peekNavTask + clearNavTask after fresh data loads. */
export function getNavTask(taskId: string): { task: any } | null {
  return readNavTaskEntry(taskId, true);
}

/** Prefetch bids + poster profile for task detail (fire-and-forget). Call on hover or when card is visible. */
export function prefetchBidsForTask(taskId: string, posterUserId?: string | null) {
  if (typeof window === "undefined" || !taskId) return;
  if (posterUserId) prefetchPosterProfile(posterUserId);
  const key = BIDS_CACHE_PREFIX + taskId;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) {
      const parsed = JSON.parse(existing);
      if (parsed?.timestamp && Date.now() - parsed.timestamp < BIDS_TTL_MS) return; // Already fresh
    }
  } catch {}
  const token = localStorage.getItem("token");
  if (!token) return;
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1";
  fetch(`${API_BASE}/get-bids/${taskId}/`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      credentials: "omit",
    })
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data?.data?.bids ?? data?.bids) {
        const raw = data.data?.bids ?? data.bids ?? data.data ?? [];
        try {
          sessionStorage.setItem(key, JSON.stringify({ bids: Array.isArray(raw) ? raw : [], timestamp: Date.now() }));
        } catch (_) {}
      }
    })
    .catch(() => {});
}

/** Get cached bids for a task. Returns raw bids array or null. */
export function getBidsFromCache(taskId: string): { bids: any[] } | null {
  if (typeof window === "undefined" || !taskId) return null;
  try {
    const raw = sessionStorage.getItem(BIDS_CACHE_PREFIX + taskId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.bids || !Array.isArray(parsed.bids)) return null;
    const age = Date.now() - (parsed.timestamp || 0);
    if (age > BIDS_TTL_MS) return null;
    return { bids: parsed.bids };
  } catch (_) {
    return null;
  }
}

/** Store bids in cache (called when we fetch fresh). */
export function storeBidsInCache(taskId: string, bids: any[]) {
  if (typeof window === "undefined" || !taskId) return;
  try {
    sessionStorage.setItem(BIDS_CACHE_PREFIX + taskId, JSON.stringify({ bids: Array.isArray(bids) ? bids : [], timestamp: Date.now() }));
  } catch (_) {}
}

const PREFETCH_JOBWB_PREFIX = "jp_prefetch_jwb_";
const PREFETCH_JOBWB_TTL_MS = 90_000;
const JOB_WITH_BIDS_FETCH_MS = 45_000;

/** Fire-and-forget: parallel GET /get-job-with-bids/ for all id shapes; warms session + bids cache for task detail. */
export function prefetchJobWithBidsForTask(taskId: string) {
  if (typeof window === "undefined" || !taskId) return;
  const key = PREFETCH_JOBWB_PREFIX + taskId;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) {
      const p = JSON.parse(existing);
      if (p?.fetchedAt && Date.now() - p.fetchedAt < PREFETCH_JOBWB_TTL_MS) return;
    }
  } catch (_) {}

  const token = localStorage.getItem("token");
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1";
  const apiJobId = canonicalJobId(taskId);

  const fetchOne = async () => {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), JOB_WITH_BIDS_FETCH_MS);
    try {
      const r = await fetch(`${API_BASE}/get-job-with-bids/${apiJobId}/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "omit",
        signal: ctrl.signal,
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const json = await r.json();
      if (json?.status_code === 200 && json?.data) {
        const j = json.data.job ?? json.data;
        if (j && jobIdsAlign(taskId, j.job_id)) return json;
      }
      throw new Error("bad response");
    } finally {
      clearTimeout(tid);
    }
  };

  void fetchOne()
    .then((json) => {
      try {
        sessionStorage.setItem(key, JSON.stringify({ fetchedAt: Date.now(), res: json }));
        const rawBids = json.data?.bids;
        if (Array.isArray(rawBids)) storeBidsInCache(taskId, rawBids);
      } catch (_) {}
    })
    .catch(() => {});
}

/** Synchronous read of prefetched get-job-with-bids JSON (valid TTL + job id match). Does not remove the entry. */
export function peekPrefetchJobWithBids(taskId: string): { res: any } | null {
  if (typeof window === "undefined" || !taskId) return null;
  try {
    const raw = sessionStorage.getItem(PREFETCH_JOBWB_PREFIX + taskId);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.res || typeof p.fetchedAt !== "number" || Date.now() - p.fetchedAt > PREFETCH_JOBWB_TTL_MS) {
      return null;
    }
    const res = p.res;
    if (res?.status_code !== 200 || !res?.data) return null;
    const job = res.data.job ?? res.data;
    if (!job || !jobIdsAlign(taskId, job.job_id)) return null;
    return { res };
  } catch (_) {
    return null;
  }
}

export function clearPrefetchJobWithBids(taskId: string) {
  if (typeof window === "undefined" || !taskId) return;
  try {
    sessionStorage.removeItem(PREFETCH_JOBWB_PREFIX + taskId);
  } catch (_) {}
}

/** Call on hover/tap before navigating to /tasks/[id] for instant task detail paint. */
export function warmTaskDetailNavigation(task: NavTaskInput) {
  if (typeof window === "undefined" || !task.id) return;
  try {
    storeTaskForNav(task);
    prefetchBidsForTask(task.id, task.posted_by_id);
    prefetchJobWithBidsForTask(task.id);
  } catch (_) {}
}
