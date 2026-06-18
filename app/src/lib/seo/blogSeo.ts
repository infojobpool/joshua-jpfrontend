export type BlogSeo = {
  meta_title: string;
  meta_description: string | null;
  og_image_url: string | null;
  noindex: boolean;
  canonical_path: string;
};

export function parseBlogSeoFromPayload(
  payload: Record<string, unknown>,
  fallbacks: {
    slug: string;
    title: string;
    excerpt: string;
    hero_image_url: string | null;
  },
): BlogSeo {
  const defaultPath = `/blog/${encodeURIComponent(fallbacks.slug)}`;
  const raw = payload.seo;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const s = raw as Record<string, unknown>;
    const canonical = String(s.canonical_path ?? defaultPath).trim() || defaultPath;
    const metaTitle = String(s.meta_title ?? fallbacks.title).trim() || fallbacks.title;
    const metaDescRaw = s.meta_description;
    const metaDescription =
      metaDescRaw != null && String(metaDescRaw).trim()
        ? String(metaDescRaw).trim()
        : fallbacks.excerpt.trim() || null;
    const ogRaw = s.og_image_url;
    const og_image_url =
      ogRaw != null && String(ogRaw).trim()
        ? String(ogRaw).trim()
        : fallbacks.hero_image_url;
    return {
      meta_title: metaTitle,
      meta_description: metaDescription,
      og_image_url,
      noindex: Boolean(s.noindex),
      canonical_path: canonical.startsWith("/") ? canonical : `/${canonical}`,
    };
  }

  return {
    meta_title: fallbacks.title,
    meta_description: fallbacks.excerpt.trim() || null,
    og_image_url: fallbacks.hero_image_url,
    noindex: false,
    canonical_path: defaultPath,
  };
}
