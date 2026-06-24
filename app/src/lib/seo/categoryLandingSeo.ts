import type { PublicCategory } from "@/lib/categorySlug";
import { buildPublicMetadata } from "./metadata";
import { fetchPageSeoByPath } from "./pageSeo";
import { sitePath } from "./site";

export function categoryLandingPath(slug: string): string {
  return `/categories/${encodeURIComponent(slug)}`;
}

export function categorySeoFallback(category: PublicCategory) {
  const name = category.name.trim();
  const lower = name.toLowerCase();
  return {
    title: `${name} Tasks & Services | JobPool India`,
    description: `Find ${lower} tasks or hire ${lower} help on JobPool. Post a job, compare offers from verified taskers, and get work done across India.`,
    keywords: `${name}, ${lower} tasks, hire ${lower}, jobpool ${category.slug}, local services India`,
  };
}

export async function buildCategoryLandingMetadata(category: PublicCategory) {
  const path = categoryLandingPath(category.slug);
  const canonical = sitePath(path);
  const fb = categorySeoFallback(category);
  const seo = await fetchPageSeoByPath(path);

  if (!seo) {
    return {
      ...buildPublicMetadata({
        title: fb.title,
        description: fb.description,
        path: canonical,
      }),
      keywords: fb.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    };
  }

  return {
    ...buildPublicMetadata({
      title: seo.meta_title,
      description: seo.meta_description ?? fb.description,
      path: seo.canonical_path || canonical,
      ogImage: seo.og_image_url ?? undefined,
      noindex: seo.noindex,
    }),
    keywords:
      seo.meta_keywords_list.length > 0
        ? seo.meta_keywords_list
        : fb.keywords.split(",").map((k) => k.trim()).filter(Boolean),
  };
}
