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
