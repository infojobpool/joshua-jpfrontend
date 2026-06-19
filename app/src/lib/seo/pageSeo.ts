function apiBase(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) ||
    "https://api.jobpool.in/api/v1";
  return raw.replace(/\/+$/, "");
}

export type PageSeoResolved = {
  path: string;
  label: string;
  meta_title: string;
  meta_description: string | null;
  og_image_url: string | null;
  meta_keywords: string | null;
  meta_keywords_list: string[];
  noindex: boolean;
  canonical_path: string;
};

function parseKeywordsList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item).trim()).filter(Boolean);
}

function parsePageSeoPayload(root: unknown): PageSeoResolved | null {
  if (!root || typeof root !== "object") return null;
  const o = root as Record<string, unknown>;
  if (o.status_code != null && Number(o.status_code) !== 200) return null;
  const d = (o.data ?? o) as Record<string, unknown>;
  if (!d || typeof d !== "object" || Array.isArray(d)) return null;

  const pathRaw = String(d.path ?? d.page_path ?? "/").trim() || "/";
  const path = pathRaw.startsWith("/") ? pathRaw : `/${pathRaw}`;
  const canonicalRaw = String(d.canonical_path ?? path).trim() || path;
  const canonical_path = canonicalRaw.startsWith("/") ? canonicalRaw : `/${canonicalRaw}`;
  const metaTitle = String(d.meta_title ?? "").trim();
  if (!metaTitle) return null;

  const metaDescRaw = d.meta_description;
  const ogRaw = d.og_image_url;
  const metaKeywordsRaw = d.meta_keywords;
  const metaKeywordsList = parseKeywordsList(d.meta_keywords_list);

  return {
    path,
    label: String(d.label ?? path).trim() || path,
    meta_title: metaTitle,
    meta_description:
      metaDescRaw != null && String(metaDescRaw).trim() ? String(metaDescRaw).trim() : null,
    og_image_url: ogRaw != null && String(ogRaw).trim() ? String(ogRaw).trim() : null,
    meta_keywords:
      metaKeywordsRaw != null && String(metaKeywordsRaw).trim()
        ? String(metaKeywordsRaw).trim()
        : null,
    meta_keywords_list: metaKeywordsList,
    noindex: Boolean(d.noindex),
    canonical_path,
  };
}

/** GET /public-page-seo/by-path/?path=/browse */
export async function fetchPageSeoByPath(path: string): Promise<PageSeoResolved | null> {
  try {
    const normalized = path === "/" ? "/" : path.replace(/\/+$/, "") || "/";
    const queryPath = normalized.startsWith("/") ? normalized : `/${normalized}`;
    const res = await fetch(
      `${apiBase()}/public-page-seo/by-path/?path=${encodeURIComponent(queryPath)}`,
      { next: { revalidate: 120 } },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as unknown;
    return parsePageSeoPayload(json);
  } catch {
    return null;
  }
}
