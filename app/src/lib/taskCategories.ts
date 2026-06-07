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
  if (/^category_/i.test(t)) return true;
  if (/^\d+$/.test(t)) return true;
  if (t === CUSTOM_CATEGORY_VALUE) return true;
  return false;
}

let categoriesCache: TaskCategory[] | null = null;
let categoriesInflight: Promise<TaskCategory[]> | null = null;

/** In-memory cache for resolving category ids → labels on task cards. */
export async function getTaskCategoriesCached(): Promise<TaskCategory[]> {
  if (categoriesCache?.length) return categoriesCache;
  if (categoriesInflight) return categoriesInflight;
  categoriesInflight = fetchTaskCategoriesList()
    .then((list) => {
      categoriesCache = list;
      return list;
    })
    .finally(() => {
      categoriesInflight = null;
    });
  return categoriesInflight;
}

export function getCachedCategoryNameMapSync(): Record<string, string> | undefined {
  if (!categoriesCache?.length) return undefined;
  return buildCategoryNameMap(categoriesCache);
}

export function buildCategoryNameMap(categories: TaskCategory[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of categories) {
    const id = c.id.trim();
    const name = c.name.trim();
    if (!id || !name) continue;
    map[id] = name;
    const bare = id.replace(/^category_/i, "");
    if (bare !== id) map[bare] = name;
  }
  return map;
}

/** Human-readable category for task/job rows (never show raw category_8 ids). */
export function resolveJobCategoryDisplayName(
  job: Record<string, unknown>,
  nameById?: Record<string, string>
): string {
  const custom = String(job.custom_category_name ?? job.customCategoryName ?? "").trim();
  if (custom) return custom;

  for (const key of [
    "job_category_name",
    "category_name",
    "jobCategoryName",
    "categoryName",
  ]) {
    const v = String(job[key] ?? "").trim();
    if (v && !looksLikeTaskCategoryId(v)) return v;
  }

  const id = String(
    job.job_category ?? job.category ?? job.jobCategory ?? job.category_id ?? ""
  ).trim();

  if (id && nameById) {
    const resolved =
      nameById[id] ??
      nameById[id.replace(/^category_/i, "")] ??
      nameById[`category_${id.replace(/^category_/i, "")}`];
    if (resolved) return resolved;
  }

  return "General";
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
