import { listPublishedOfferingsForHomeApi } from "@/lib/offerings/api";
import type { Offering } from "@/lib/offerings/types";

const TTL_MS = 45_000;
const DEFAULT_LIMIT = 16;
/** Persist at most this many rows to keep disk cache small. */
const PERSIST_CAP = 48;
const STORAGE_KEY = "jobpool_home_offerings_feed_v2";
/** Persisted home strip must not stay valid for days — stale ids cause “Listing not found” after tap. */
const DISK_MAX_AGE_MS = 6 * 60 * 60 * 1000;

let inflight: Promise<Offering[]> | null = null;
let cache: { rows: Offering[]; fetchedAt: number } | null = null;

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

function tryHydrateOfferingsFromDisk(): void {
  if (typeof window === "undefined" || cache) return;
  try {
    const raw = readDiskSnapshotRaw();
    if (!raw) return;
    const p = JSON.parse(raw) as { rows?: Offering[]; fetchedAt?: number };
    if (!p || typeof p.fetchedAt !== "number" || !Array.isArray(p.rows)) return;
    if (Date.now() - p.fetchedAt > DISK_MAX_AGE_MS) return;
    cache = { rows: p.rows, fetchedAt: p.fetchedAt };
  } catch {
    /* ignore */
  }
}

function persistOfferings(rows: Offering[]): void {
  if (typeof window === "undefined") return;
  try {
    const slice = rows.slice(0, PERSIST_CAP);
    writeDiskSnapshotRaw(JSON.stringify({ rows: slice, fetchedAt: Date.now() }));
  } catch {
    /* quota / private mode */
  }
}

/**
 * Synchronous read for first paint: show last session’s listings while the network refreshes.
 */
export function readPersistedHomeOfferingsSnapshot(limit: number): {
  rows: Offering[];
  fromCache: boolean;
} {
  if (typeof window === "undefined") {
    return { rows: [], fromCache: false };
  }
  try {
    const raw = readDiskSnapshotRaw();
    if (!raw) return { rows: [], fromCache: false };
    const p = JSON.parse(raw) as { rows?: Offering[]; fetchedAt?: number };
    if (!p || typeof p.fetchedAt !== "number" || !Array.isArray(p.rows)) {
      return { rows: [], fromCache: false };
    }
    if (Date.now() - p.fetchedAt > DISK_MAX_AGE_MS) return { rows: [], fromCache: false };
    return { rows: p.rows.slice(0, limit), fromCache: true };
  } catch {
    return { rows: [], fromCache: false };
  }
}

/**
 * Single-flight cached fetch for homepage service-listings strip (mobile + desktop).
 */
export async function getHomeOfferingsCached(limit = DEFAULT_LIMIT): Promise<Offering[]> {
  tryHydrateOfferingsFromDisk();

  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return cache.rows.slice(0, limit);
  }
  if (inflight) {
    const rows = await inflight;
    return rows.slice(0, limit);
  }
  inflight = (async () => {
    try {
      const rows = await listPublishedOfferingsForHomeApi(limit);
      cache = { rows, fetchedAt: Date.now() };
      if (rows.length > 0) {
        persistOfferings(rows);
      }
      return rows;
    } catch (e) {
      tryHydrateOfferingsFromDisk();
      if (cache && cache.rows.length > 0) {
        return cache.rows;
      }
      /** Stale disk snapshot (beyond TTL) — still better than a false “connection” empty state. */
      try {
        const raw = readDiskSnapshotRaw();
        if (raw) {
          const p = JSON.parse(raw) as { rows?: Offering[] };
          if (Array.isArray(p.rows) && p.rows.length > 0) {
            cache = { rows: p.rows, fetchedAt: Date.now() - TTL_MS - 1 };
            return p.rows;
          }
        }
      } catch {
        /* ignore */
      }
      throw Object.assign(new Error("HOME_OFFERINGS_FETCH_FAILED"), {
        code: "HOME_OFFERINGS_FETCH_FAILED",
        cause: e,
      });
    }
  })();
  try {
    const rows = await inflight;
    return rows.slice(0, limit);
  } finally {
    inflight = null;
  }
}

/** Start offerings fetch as soon as the home route mounts (parallel with jobs prefetch). */
export function warmHomeOfferingsCache(): void {
  if (typeof window === "undefined") return;
  tryHydrateOfferingsFromDisk();
  void getHomeOfferingsCached();
}

/** Clear memory cache so the next fetch hits the network (e.g. user taps Retry). */
export function invalidateHomeOfferingsCache(): void {
  cache = null;
  inflight = null;
}
