/**
 * Public blog API helpers (GET /public-blog-posts/, by-slug).
 * Parsers tolerate { status_code, data } or flat shapes.
 */

export type PublicBlogPostSummary = {
  slug: string;
  title: string;
  excerpt: string;
  hero_image_url: string | null;
};

export type PublicBlogPostDetail = PublicBlogPostSummary & {
  body_markdown: string;
};

function apiBase(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) ||
    "https://api.jobpool.in/api/v1";
  return raw.replace(/\/+$/, "");
}

/** Client or server: full URL for public blog list (no auth). */
export function buildPublicBlogListUrl(limit: number, offset: number): string {
  return `${apiBase()}/public-blog-posts/?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`;
}

function unwrapPayload(root: unknown): Record<string, unknown> | null {
  if (!root || typeof root !== "object") return null;
  const o = root as Record<string, unknown>;
  if (o.status_code != null && Number(o.status_code) !== 200) return null;
  const d = o.data;
  if (d != null && typeof d === "object" && !Array.isArray(d)) return d as Record<string, unknown>;
  return o;
}

export function parseBlogListResponse(root: unknown): { posts: PublicBlogPostSummary[]; total: number } {
  const payload = unwrapPayload(root) ?? (root && typeof root === "object" ? (root as Record<string, unknown>) : null);
  if (!payload) return { posts: [], total: 0 };
  const rawPosts =
    (Array.isArray(payload.posts) && payload.posts) ||
    (Array.isArray(payload.results) && payload.results) ||
    (Array.isArray(payload.items) && payload.items) ||
    [];
  const totalRaw = payload.total ?? payload.count ?? payload.total_count ?? 0;
  const total = typeof totalRaw === "number" && Number.isFinite(totalRaw) ? totalRaw : parseInt(String(totalRaw), 10) || 0;
  const posts: PublicBlogPostSummary[] = [];
  for (const row of rawPosts) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const slug = String(r.slug ?? r.post_slug ?? "").trim();
    const title = String(r.title ?? "").trim();
    if (!slug || !title) continue;
    const hero = r.hero_image_url ?? r.heroImageUrl;
    posts.push({
      slug,
      title,
      excerpt: String(r.excerpt ?? r.summary ?? "").trim(),
      hero_image_url: hero != null && String(hero).trim() ? String(hero).trim() : null,
    });
  }
  return { posts, total };
}

export function parseBlogDetailResponse(root: unknown): PublicBlogPostDetail | null {
  const payload = unwrapPayload(root);
  if (!payload) return null;
  const slug = String(payload.slug ?? payload.post_slug ?? "").trim();
  const title = String(payload.title ?? "").trim();
  if (!slug || !title) return null;
  const hero = payload.hero_image_url ?? payload.heroImageUrl;
  const body =
    String(payload.body_markdown ?? payload.bodyMarkdown ?? payload.body ?? "").trim();
  return {
    slug,
    title,
    excerpt: String(payload.excerpt ?? payload.summary ?? "").trim(),
    hero_image_url: hero != null && String(hero).trim() ? String(hero).trim() : null,
    body_markdown: body,
  };
}

/** Server / SSG: list posts */
export async function fetchPublicBlogPostSummariesServer(
  limit: number,
  offset: number,
): Promise<{ posts: PublicBlogPostSummary[]; total: number }> {
  const base = apiBase();
  const url = `${base}/public-blog-posts/?limit=${encodeURIComponent(String(limit))}&offset=${encodeURIComponent(String(offset))}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return { posts: [], total: 0 };
  const json = (await res.json()) as unknown;
  return parseBlogListResponse(json);
}

/** Server / SSG: single post */
export async function fetchPublicBlogPostBySlugServer(slug: string): Promise<PublicBlogPostDetail | null> {
  const s = encodeURIComponent(slug.trim());
  if (!s) return null;
  const base = apiBase();
  const url = `${base}/public-blog-posts/by-slug/${s}/`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const json = (await res.json()) as unknown;
  return parseBlogDetailResponse(json);
}
