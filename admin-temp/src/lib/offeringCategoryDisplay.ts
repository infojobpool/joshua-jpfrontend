/** True when value looks like a backend category id (category_12, numeric pk). */
export function looksLikeCategoryId(value: string | null | undefined): boolean {
  const t = String(value ?? "").trim();
  if (!t) return false;
  if (/^category_/i.test(t)) return true;
  if (/^\d+$/.test(t)) return true;
  return false;
}

export type OfferingCategoryFields = {
  categoryId: string | null;
  categoryName: string | null;
  customCategoryName: string | null;
  /** Best label for table display */
  displayLabel: string;
  hasSuggestedCategory: boolean;
};

/** Normalize admin offerings list/detail payloads for category UI. */
export function offeringCategoryFromApi(raw: Record<string, unknown>): OfferingCategoryFields {
  const customRaw = raw.custom_category_name ?? raw.customCategoryName;
  const customCategoryName =
    typeof customRaw === "string" && customRaw.trim() ? customRaw.trim() : null;

  const categoryNameRaw = raw.category_name ?? raw.categoryName;
  let categoryName =
    typeof categoryNameRaw === "string" && categoryNameRaw.trim() ? categoryNameRaw.trim() : null;

  const categoryField = raw.category != null ? String(raw.category).trim() : "";
  const categoryIdRaw = raw.category_id ?? raw.categoryId;
  const categoryIdFromField = looksLikeCategoryId(categoryField) ? categoryField : null;
  const categoryId =
    (categoryIdRaw != null && String(categoryIdRaw).trim()
      ? String(categoryIdRaw).trim()
      : null) ?? categoryIdFromField;

  if (!categoryName && categoryField && !looksLikeCategoryId(categoryField)) {
    categoryName = categoryField;
  }

  const displayLabel =
    customCategoryName ??
    categoryName ??
    (categoryId ? categoryId.replace(/^category_/i, "Category ") : null) ??
    "—";

  return {
    categoryId,
    categoryName,
    customCategoryName,
    displayLabel,
    hasSuggestedCategory: Boolean(customCategoryName),
  };
}
