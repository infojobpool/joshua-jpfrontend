import type { SiteSeo } from "./types";

function parseKeywordsList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => String(item).trim()).filter(Boolean);
}

function apiBase(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) ||
    "https://api.jobpool.in/api/v1";
  return raw.replace(/\/+$/, "");
}

function parseSiteSeoPayload(root: unknown): SiteSeo | null {
  if (!root || typeof root !== "object") return null;
  const o = root as Record<string, unknown>;
  if (o.status_code != null && Number(o.status_code) !== 200) return null;
  const d = (o.data ?? o) as Record<string, unknown>;
  if (!d || typeof d !== "object" || Array.isArray(d)) return null;

  const canonicalRaw = String(d.canonical_path ?? "/").trim() || "/";
  const canonical_path = canonicalRaw.startsWith("/") ? canonicalRaw : `/${canonicalRaw}`;

  const metaTitleRaw = d.meta_title;
  const metaDescRaw = d.meta_description;
  const ogRaw = d.og_image_url;
  const metaKeywordsRaw = d.meta_keywords;

  return {
    meta_title:
      metaTitleRaw != null && String(metaTitleRaw).trim() ? String(metaTitleRaw).trim() : null,
    meta_description:
      metaDescRaw != null && String(metaDescRaw).trim() ? String(metaDescRaw).trim() : null,
    og_image_url: ogRaw != null && String(ogRaw).trim() ? String(ogRaw).trim() : null,
    meta_keywords:
      metaKeywordsRaw != null && String(metaKeywordsRaw).trim()
        ? String(metaKeywordsRaw).trim()
        : null,
    meta_keywords_list: parseKeywordsList(d.meta_keywords_list),
    noindex: Boolean(d.noindex),
    canonical_path,
  };
}

/** Global site SEO from GET /public-site-seo/ */
export async function fetchSiteSeo(): Promise<SiteSeo | null> {
  try {
    const res = await fetch(`${apiBase()}/public-site-seo/`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as unknown;
    return parseSiteSeoPayload(json);
  } catch {
    return null;
  }
}
