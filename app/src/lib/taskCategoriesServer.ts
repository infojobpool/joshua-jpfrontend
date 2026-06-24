import { assignCategorySlugs, type PublicCategory } from "@/lib/categorySlug";

function apiBase(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) ||
    "https://api.jobpool.in/api/v1";
  return raw.replace(/\/+$/, "");
}

function mapCategoryRows(rows: unknown[]): PublicCategory[] {
  const mapped = rows
    .map((row) => {
      const c = row as Record<string, unknown>;
      const id = String(c.category_id ?? c.id ?? "").trim();
      const name = String(c.category_name ?? c.name ?? "").trim();
      const jobCountRaw = c.job_count ?? c.open_tasks ?? c.task_count;
      const job_count =
        jobCountRaw != null && Number.isFinite(Number(jobCountRaw)) ? Number(jobCountRaw) : undefined;
      if (!id || !name) return null;
      return { id, name, job_count };
    })
    .filter((x): x is { id: string; name: string; job_count?: number } => x !== null);

  return assignCategorySlugs(mapped);
}

/** Server-side category list for SEO pages, sitemap, and static generation. */
export async function fetchPublicCategoriesServer(): Promise<PublicCategory[]> {
  const paths = ["get-categories-list/", "get-all-categories/"];
  for (const path of paths) {
    try {
      const res = await fetch(`${apiBase()}/${path}`, { next: { revalidate: 3600 } });
      if (!res.ok) continue;
      const json = (await res.json()) as Record<string, unknown>;
      if (json.status_code != null && Number(json.status_code) !== 200) continue;
      const inner = json.data ?? json;
      let rows: unknown[] = [];
      if (Array.isArray(inner)) rows = inner;
      else if (inner && typeof inner === "object") {
        const o = inner as Record<string, unknown>;
        if (Array.isArray(o.categories)) rows = o.categories;
      }
      const mapped = mapCategoryRows(rows);
      if (mapped.length > 0) return mapped;
    } catch {
      /* try next path */
    }
  }
  return [];
}
