import type { AxiosInstance } from "axios";

/** Normalize GET /get-bids/{job_id}/ response into a bids array. */
export function parseBidsFromResponse(data: unknown): unknown[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;

  const payload = data as { data?: unknown };
  const inner = payload.data;

  if (Array.isArray(inner)) return inner;
  if (inner && typeof inner === "object" && Array.isArray((inner as { bids?: unknown[] }).bids)) {
    return (inner as { bids: unknown[] }).bids;
  }

  return [];
}

export async function fetchBidCountForJob(
  axios: AxiosInstance,
  jobId: string
): Promise<number> {
  const response = await axios.get(`/get-bids/${jobId}/`);
  return parseBidsFromResponse(response.data).length;
}

/** Fetch bid counts for many jobs with a concurrency limit. */
export async function fetchBidCountsForJobs(
  axios: AxiosInstance,
  jobIds: string[],
  concurrency = 5
): Promise<Record<string, number>> {
  const idToCount: Record<string, number> = {};
  const uniqueIds = [...new Set(jobIds.filter(Boolean))];

  for (let i = 0; i < uniqueIds.length; i += concurrency) {
    const batch = uniqueIds.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(async (id) => {
        const count = await fetchBidCountForJob(axios, id);
        return { id, count };
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        idToCount[result.value.id] = result.value.count;
      }
    }
  }

  return idToCount;
}
