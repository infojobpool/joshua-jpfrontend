/** Admin blog API response helpers */

export type AdminBlogPostRow = {
  post_id: string;
  title: string;
  excerpt: string;
  body_markdown?: string;
  hero_image_url?: string | null;
  slug?: string | null;
  is_published?: boolean;
  sort_order?: number;
};

function unwrapList(root: unknown): unknown[] {
  if (!root || typeof root !== "object") return [];
  const o = root as Record<string, unknown>;
  if (o.status_code != null && Number(o.status_code) !== 200) return [];
  const d = o.data !== undefined ? o.data : o;
  if (Array.isArray(d)) return d;
  if (d && typeof d === "object") {
    const inner = d as Record<string, unknown>;
    if (Array.isArray(inner.posts)) return inner.posts;
    if (Array.isArray(inner.items)) return inner.items;
  }
  return [];
}

export function parseAdminBlogDetailResponse(data: unknown): AdminBlogPostRow | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  if (root.status_code != null && Number(root.status_code) !== 200) return null;
  const d = (root.data ?? root) as Record<string, unknown>;
  const postId = String(d.post_id ?? d.id ?? "").trim();
  const title = String(d.title ?? "").trim();
  if (!postId || !title) return null;
  return {
    post_id: postId,
    title,
    excerpt: String(d.excerpt ?? "").trim(),
    body_markdown: typeof d.body_markdown === "string" ? d.body_markdown : "",
    hero_image_url: d.hero_image_url != null ? String(d.hero_image_url) : "",
    slug: d.slug != null ? String(d.slug) : "",
    is_published: Boolean(d.is_published ?? d.isPublished ?? true),
    sort_order: Number(d.sort_order ?? d.sortOrder ?? 0) || 0,
  };
}

export function parseAdminBlogListResponse(data: unknown): AdminBlogPostRow[] {
  const rows = unwrapList(data);
  const out: AdminBlogPostRow[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const postId = String(r.post_id ?? r.id ?? "").trim();
    const title = String(r.title ?? "").trim();
    if (!postId || !title) continue;
    out.push({
      post_id: postId,
      title,
      excerpt: String(r.excerpt ?? "").trim(),
      body_markdown: typeof r.body_markdown === "string" ? r.body_markdown : "",
      hero_image_url: r.hero_image_url != null ? String(r.hero_image_url) : "",
      slug: r.slug != null ? String(r.slug) : "",
      is_published: Boolean(r.is_published ?? r.isPublished ?? true),
      sort_order: Number(r.sort_order ?? r.sortOrder ?? 0) || 0,
    });
  }
  return out;
}
