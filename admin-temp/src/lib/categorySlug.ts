/** URL slug for category landing pages — mirrors app/src/lib/categorySlug.ts */

export function categoryNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function assignCategorySlugs(
  rows: { id: string; name: string }[],
): { id: string; name: string; slug: string }[] {
  const used = new Map<string, number>();
  return rows.map((row) => {
    const base = categoryNameToSlug(row.name) || "category";
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const slug = count === 0 ? base : `${base}-${count + 1}`;
    return { id: row.id, name: row.name, slug };
  });
}
