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
