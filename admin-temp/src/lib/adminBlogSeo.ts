/** Admin blog SEO fields (nested under `seo` on API). */

export type AdminBlogSeo = {
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  meta_keywords: string;
  noindex: boolean;
  canonical_path: string;
};

export type BlogSeoFormState = AdminBlogSeo;

export function defaultBlogSeo(slug: string, title = ""): BlogSeoFormState {
  const pathSlug = slug.trim() || "post";
  return {
    meta_title: title.trim(),
    meta_description: "",
    og_image_url: "",
    meta_keywords: "",
    noindex: false,
    canonical_path: `/blog/${pathSlug}`,
  };
}

export function parseAdminBlogSeo(
  raw: unknown,
  fallbacks: { slug: string; title: string; excerpt: string; hero_image_url?: string },
): AdminBlogSeo {
  const base = defaultBlogSeo(fallbacks.slug, fallbacks.title);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      ...base,
      meta_description: fallbacks.excerpt,
      og_image_url: (fallbacks.hero_image_url ?? "").trim(),
    };
  }
  const s = raw as Record<string, unknown>;
  const canonical = String(s.canonical_path ?? base.canonical_path).trim() || base.canonical_path;
  return {
    meta_title: String(s.meta_title ?? fallbacks.title).trim() || fallbacks.title,
    meta_description: String(s.meta_description ?? fallbacks.excerpt).trim(),
    og_image_url: String(s.og_image_url ?? fallbacks.hero_image_url ?? "").trim(),
    meta_keywords: String(s.meta_keywords ?? "").trim(),
    noindex: Boolean(s.noindex),
    canonical_path: canonical.startsWith("/") ? canonical : `/${canonical}`,
  };
}

export function blogSeoToPayload(seo: BlogSeoFormState): Record<string, unknown> {
  return {
    meta_title: seo.meta_title.trim() || null,
    meta_description: seo.meta_description.trim() || null,
    og_image_url: seo.og_image_url.trim() || null,
    meta_keywords: seo.meta_keywords.trim() || null,
    noindex: seo.noindex,
    canonical_path: seo.canonical_path.trim() || null,
  };
}

/** Flat blog CRUD field names (alongside nested `seo` when supported). */
export function blogSeoFlatFields(seo: BlogSeoFormState): Record<string, unknown> {
  return {
    seo_meta_title: seo.meta_title.trim() || null,
    seo_meta_description: seo.meta_description.trim() || null,
    seo_og_image_url: seo.og_image_url.trim() || null,
    seo_meta_keywords: seo.meta_keywords.trim() || null,
    seo_noindex: seo.noindex,
    seo_canonical_path: seo.canonical_path.trim() || null,
  };
}
