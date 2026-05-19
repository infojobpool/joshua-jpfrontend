/** Read optional short description from get-all-categories row (field names vary by API version). */
export function categoryDescriptionFromApi(row: Record<string, unknown>): string | null {
  const raw =
    row.category_description ??
    row.categoryDescription ??
    row.description ??
    row.category_desc;
  if (typeof raw !== "string") return null;
  const t = raw.trim();
  return t.length > 0 ? t : null;
}

/** One-line hint when API has no description yet. */
export function categoryDescriptionFallback(categoryName: string): string {
  const name = categoryName.trim();
  if (!name) return "Browse and post tasks in this category.";
  return `Find help with ${name.toLowerCase()} tasks on JobPool.`;
}

export function categoryDescriptionForDisplay(
  row: Record<string, unknown>,
  categoryName: string,
): string {
  return categoryDescriptionFromApi(row) ?? categoryDescriptionFallback(categoryName);
}
