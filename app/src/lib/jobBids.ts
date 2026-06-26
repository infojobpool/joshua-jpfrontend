/** Parse bids array + pagination meta from GET /get-job-with-bids/ (and prefetched JSON). */

export type JobBidsPayload = {
  bids: unknown[];
  bidsTotal: number | null;
  bidsHasMore: boolean;
};

function readTotal(value: unknown, fallback: number): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value)) return parseInt(value, 10);
  return fallback > 0 ? fallback : null;
}

export function parseJobBidsPayload(res: unknown): JobBidsPayload {
  const envelope =
    res && typeof res === "object" && "data" in (res as object)
      ? (res as { data: unknown }).data
      : res;
  const bag =
    envelope && typeof envelope === "object" ? (envelope as Record<string, unknown>) : {};

  const bids = Array.isArray(bag.bids) ? bag.bids : [];
  const bidsTotal = readTotal(bag.bids_total, bids.length);
  const bidsHasMore =
    bag.bids_has_more === true ||
    bag.bids_has_more === 1 ||
    bag.bids_has_more === "true" ||
    bag.bids_has_more === "1";

  return { bids, bidsTotal, bidsHasMore };
}

export function offersCountLabel(shown: number, total: number | null | undefined): string {
  if (total != null && total > shown) {
    return `${shown} of ${total}`;
  }
  return String(shown);
}
