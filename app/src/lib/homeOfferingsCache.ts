import { listPublishedOfferingsForHomeApi } from "@/lib/offerings/api";
import type { Offering } from "@/lib/offerings/types";

const TTL_MS = 45_000;
const DEFAULT_LIMIT = 24;

let inflight: Promise<Offering[]> | null = null;
let cache: { rows: Offering[]; fetchedAt: number } | null = null;

/**
 * Single-flight cached fetch for homepage service-listings strip (mobile + desktop).
 */
export async function getHomeOfferingsCached(limit = DEFAULT_LIMIT): Promise<Offering[]> {
  const now = Date.now();
  if (cache && now - cache.fetchedAt < TTL_MS) {
    return cache.rows;
  }
  if (inflight) {
    return inflight;
  }
  inflight = (async () => {
    const rows = await listPublishedOfferingsForHomeApi(limit);
    cache = { rows, fetchedAt: Date.now() };
    return rows;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}
