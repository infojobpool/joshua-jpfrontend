import type { Metadata } from "next";
import { buildPublicMetadata } from "./metadata";
import { fetchPageSeoByPath } from "./pageSeo";
import { normalizeSeoPath } from "./publicStaticPages";
import { sitePath } from "./site";

type StaticFallback = {
  title: string;
  description: string;
};

/** API-driven metadata for static marketing pages with Phase 1 fallbacks. */
export function staticPageMetadata(path: string, fallback: StaticFallback) {
  return async (): Promise<Metadata> => {
    const normalized = normalizeSeoPath(path);
    const canonicalFallback = normalized === "/" ? "/" : sitePath(normalized);
    const seo = await fetchPageSeoByPath(normalized);

    if (!seo) {
      return buildPublicMetadata({
        title: fallback.title,
        description: fallback.description,
        path: canonicalFallback,
      });
    }

    return buildPublicMetadata({
      title: seo.meta_title,
      description: seo.meta_description ?? undefined,
      path: seo.canonical_path || canonicalFallback,
      ogImage: seo.og_image_url ?? undefined,
      noindex: seo.noindex,
    });
  };
}
