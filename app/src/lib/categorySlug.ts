/** URL slug for category landing pages (/categories/{slug}). */

export function categoryNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  job_count?: number;
};

export function assignCategorySlugs(
  rows: { id: string; name: string; job_count?: number }[],
): PublicCategory[] {
  const used = new Map<string, number>();
  return rows.map((row) => {
    const base = categoryNameToSlug(row.name) || "category";
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const slug = count === 0 ? base : `${base}-${count + 1}`;
    return { id: row.id, name: row.name, slug, job_count: row.job_count };
  });
}

export function findCategoryBySlug(categories: PublicCategory[], slug: string): PublicCategory | undefined {
  const key = slug.trim().toLowerCase();
  return (
    categories.find((c) => c.slug === key) ||
    categories.find((c) => c.id.toLowerCase() === key) ||
    categories.find((c) => categoryNameToSlug(c.name) === key)
  );
}

export type CategoryIdName = {
  category_id: string;
  category_name: string;
};

export function toPublicCategories(rows: CategoryIdName[]): PublicCategory[] {
  return assignCategorySlugs(
    rows.map((c) => ({ id: c.category_id, name: c.category_name })),
  );
}

/** Map ?category= slug, name slug, or legacy category_id → category_id for filtering. */
export function resolveCategoryUrlParam(
  param: string,
  rows: CategoryIdName[],
): string | undefined {
  const key = param.trim();
  if (!key || rows.length === 0) return undefined;
  if (rows.some((c) => c.category_id === key)) return key;
  return findCategoryBySlug(toPublicCategories(rows), key)?.id;
}

/** Human-readable slug for browse/post-task URLs (?category=cleaner). */
export function categorySlugForId(categoryId: string, rows: CategoryIdName[]): string {
  const pub = toPublicCategories(rows);
  const found = pub.find((c) => c.id === categoryId);
  if (found) return found.slug;
  const row = rows.find((c) => c.category_id === categoryId);
  return row ? categoryNameToSlug(row.category_name) || categoryId : categoryId;
}
