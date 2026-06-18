/** Admin + public site SEO from GET/PUT /admin/site-seo/ */

export type AdminSiteSeo = {
  meta_title: string;
  meta_description: string;
  og_image_url: string;
  noindex: boolean;
  canonical_path: string;
};

export function emptySiteSeo(): AdminSiteSeo {
  return {
    meta_title: "JobPool - Task Marketplace",
    meta_description:
      "Connect with skilled taskers for home services, repairs, and more. Post tasks or find work opportunities.",
    og_image_url: "",
    noindex: false,
    canonical_path: "/",
  };
}

export function parseAdminSiteSeoResponse(data: unknown): AdminSiteSeo | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  if (root.status_code != null && Number(root.status_code) !== 200) return null;
  const d = (root.data ?? root) as Record<string, unknown>;
  if (!d || typeof d !== "object" || Array.isArray(d)) return null;

  const canonicalRaw = String(d.canonical_path ?? "/").trim() || "/";
  return {
    meta_title: String(d.meta_title ?? "").trim(),
    meta_description: String(d.meta_description ?? "").trim(),
    og_image_url: String(d.og_image_url ?? "").trim(),
    noindex: Boolean(d.noindex),
    canonical_path: canonicalRaw.startsWith("/") ? canonicalRaw : `/${canonicalRaw}`,
  };
}

export function siteSeoToPayload(seo: AdminSiteSeo): Record<string, unknown> {
  return {
    meta_title: seo.meta_title.trim() || null,
    meta_description: seo.meta_description.trim() || null,
    og_image_url: seo.og_image_url.trim() || null,
    noindex: seo.noindex,
    canonical_path: seo.canonical_path.trim() || "/",
  };
}
