import { fetchPublicBlogPostSummariesServer } from "@/lib/publicBlog";
import { extractOfferingsPayload, mapOfferingFromApi } from "@/lib/offerings/api";

const MAX_BLOG_URLS = 500;
const MAX_LISTING_URLS = 500;
const FETCH_PAGE_SIZE = 100;

function apiBase(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) ||
    "https://api.jobpool.in/api/v1";
  return raw.replace(/\/+$/, "");
}

export async function fetchAllBlogSlugsForSitemap(): Promise<string[]> {
  const slugs: string[] = [];
  let offset = 0;

  while (slugs.length < MAX_BLOG_URLS) {
    const { posts, total } = await fetchPublicBlogPostSummariesServer(FETCH_PAGE_SIZE, offset);
    if (posts.length === 0) break;
    for (const post of posts) {
      if (post.slug.trim()) slugs.push(post.slug.trim());
    }
    offset += posts.length;
    if (offset >= total) break;
  }

  return slugs.slice(0, MAX_BLOG_URLS);
}

export async function fetchAllListingIdsForSitemap(): Promise<string[]> {
  const ids: string[] = [];
  let offset = 0;
  const base = apiBase();

  while (ids.length < MAX_LISTING_URLS) {
    const url = `${base}/offerings/feed/?limit=${FETCH_PAGE_SIZE}&offset=${offset}`;
    try {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;
      const json = (await res.json()) as unknown;
      const root = json && typeof json === "object" ? (json as Record<string, unknown>) : null;
      const payload = root?.data ?? json;
      const rows = extractOfferingsPayload(payload);
      if (rows.length === 0) break;

      for (const row of rows) {
        const offering = mapOfferingFromApi(row);
        if (
          offering &&
          offering.status === "published" &&
          !offering.adminHidden &&
          offering.userId.trim()
        ) {
          ids.push(offering.id);
        }
      }

      offset += rows.length;
      let total = 0;
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        const t = (payload as Record<string, unknown>).total;
        if (typeof t === "number" && Number.isFinite(t)) total = t;
        else if (typeof t === "string" && /^\d+$/.test(t)) total = parseInt(t, 10);
      }
      if (total > 0 && offset >= total) break;
    } catch {
      break;
    }
  }

  return [...new Set(ids)].slice(0, MAX_LISTING_URLS);
}
