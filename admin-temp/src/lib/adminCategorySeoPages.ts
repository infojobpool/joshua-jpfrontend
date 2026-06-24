import axiosInstance from "@/lib/axiosInstance";
import { assignCategorySlugs } from "@/lib/categorySlug";
import type { StaticPageSeoFallback } from "@/lib/publicStaticPages";

/** Category landing routes for admin Page SEO picker. */
export async function fetchCategorySeoPageStubs(): Promise<StaticPageSeoFallback[]> {
  try {
    const res = await axiosInstance.get("get-all-categories/");
    if (res.data?.status_code !== 200) return [];
    const rows = Array.isArray(res.data?.data) ? res.data.data : [];
    const mapped = rows
      .map((row: Record<string, unknown>) => ({
        id: String(row.category_id ?? row.id ?? "").trim(),
        name: String(row.category_name ?? row.name ?? "").trim(),
      }))
      .filter((r) => r.id && r.name);

    return assignCategorySlugs(mapped).map((c) => {
      const lower = c.name.toLowerCase();
      return {
        path: `/categories/${c.slug}`,
        label: `Category: ${c.name}`,
        title: `${c.name} Tasks & Services | JobPool India`,
        description: `Find ${lower} tasks or hire ${lower} help on JobPool. Post a job, compare offers from verified taskers, and get work done across India.`,
        keywords: `${c.name}, ${lower} tasks, hire ${lower}, jobpool ${c.slug}`,
      };
    });
  } catch {
    return [];
  }
}
