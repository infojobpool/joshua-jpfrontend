import axiosInstance from "@/lib/axiosInstance";

export type TaskCategory = {
  id: string;
  name: string;
};

export const CUSTOM_CATEGORY_VALUE = "__custom__";

/** Same helper as post-task when user picks “type your own”. */
export function getFallbackCategoryId(categories: TaskCategory[], customName?: string): string | null {
  if (!categories.length) return null;
  const lower = (s: string) => (s || "").toLowerCase().trim();
  const custom = lower(customName || "");

  if (custom) {
    const matched = categories.find((c) => {
      const n = lower(c.name);
      return n.includes(custom) || custom.includes(n);
    });
    if (matched) return matched.id;
  }

  const other = categories.find((c) => lower(c.name).includes("other"));
  if (other) return other.id;
  const general = categories.find((c) => lower(c.name).includes("general"));
  if (general) return general.id;
  return categories[0].id;
}

function mapCategoryRows(rows: unknown[]): TaskCategory[] {
  return rows
    .map((row) => {
      const c = row as Record<string, unknown>;
      const id = String(c.category_id ?? c.id ?? "").trim();
      const name = String(c.category_name ?? c.name ?? "").trim();
      if (!id || !name) return null;
      return { id, name };
    })
    .filter((x): x is TaskCategory => x !== null);
}

/** Task/job categories for listings and post-task (prefer dedicated list endpoint). */
export async function fetchTaskCategoriesList(): Promise<TaskCategory[]> {
  const paths = ["get-categories-list/", "get-all-categories/"];
  for (const path of paths) {
    try {
      const response = await axiosInstance.get(path);
      const data = response.data as { status_code?: number; data?: unknown };
      if (data?.status_code != null && Number(data.status_code) !== 200) continue;
      const rows = Array.isArray(data?.data) ? data.data : [];
      const mapped = mapCategoryRows(rows);
      if (mapped.length > 0) return mapped;
    } catch {
      /* try next */
    }
  }
  return [];
}

export function looksLikeTaskCategoryId(value: string | undefined | null): boolean {
  const t = String(value ?? "").trim();
  if (!t) return false;
  return /^category_/i.test(t) || /^\d+$/.test(t);
}

export function resolveCategoryForOfferingApi(
  categoryId: string,
  customCategoryName: string,
  categories: TaskCategory[],
): { category: string; custom_category_name: string | null } {
  const id = categoryId.trim();
  if (!id) {
    throw new Error("Category is required to publish.");
  }
  if (id === CUSTOM_CATEGORY_VALUE) {
    const custom = customCategoryName.trim();
    if (!custom) {
      throw new Error("Please type your category name, or select one from the list.");
    }
    const fallback = getFallbackCategoryId(categories, custom);
    if (!fallback) {
      throw new Error("Categories are still loading. Try again in a moment.");
    }
    return { category: fallback, custom_category_name: custom };
  }
  return { category: id, custom_category_name: null };
}
