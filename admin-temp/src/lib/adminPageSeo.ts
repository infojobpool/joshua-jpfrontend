import {
  emptyPageSeoForm,
  normalizeSeoPath,
  type AdminPageSeoForm,
} from "@/lib/publicStaticPages";

function resolveMetaKeywords(d: Record<string, unknown>): string {
  const override = d.override;
  if (override && typeof override === "object" && !Array.isArray(override)) {
    const o = override as Record<string, unknown>;
    if ("meta_keywords" in o) {
      return String(o.meta_keywords ?? "").trim();
    }
  }
  if (d.meta_keywords != null) {
    return String(d.meta_keywords ?? "").trim();
  }
  return "";
}

function parsePageRow(raw: unknown): AdminPageSeoForm | null {
  if (!raw || typeof raw !== "object") return null;
  const d = raw as Record<string, unknown>;
  const path = normalizeSeoPath(String(d.path ?? d.page_path ?? ""));
  if (!path) return null;
  const canonicalRaw = String(d.canonical_path ?? (path === "/" ? "/" : `${path}/`)).trim();
  return {
    path,
    label: String(d.label ?? path).trim() || path,
    meta_title: String(d.meta_title ?? "").trim(),
    meta_description: String(d.meta_description ?? "").trim(),
    og_image_url: String(d.og_image_url ?? "").trim(),
    meta_keywords: resolveMetaKeywords(d),
    noindex: Boolean(d.noindex),
    canonical_path: canonicalRaw.startsWith("/") ? canonicalRaw : `/${canonicalRaw}`,
  };
}

export function parseAdminPageSeoListResponse(data: unknown): AdminPageSeoForm[] {
  if (!data || typeof data !== "object") return [];
  const root = data as Record<string, unknown>;
  if (root.status_code != null && Number(root.status_code) !== 200) return [];
  const inner = root.data ?? root;
  let rows: unknown[] = [];
  if (Array.isArray(inner)) rows = inner;
  else if (inner && typeof inner === "object") {
    const o = inner as Record<string, unknown>;
    if (Array.isArray(o.pages)) rows = o.pages;
    else if (Array.isArray(o.results)) rows = o.results;
  }
  return rows.map(parsePageRow).filter((r): r is AdminPageSeoForm => r !== null);
}

export function parseAdminPageSeoDetailResponse(data: unknown): AdminPageSeoForm | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  if (root.status_code != null && Number(root.status_code) !== 200) return null;
  const inner = root.data ?? root;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    return parsePageRow(inner);
  }
  return null;
}

export function pageSeoToPayload(form: AdminPageSeoForm): Record<string, unknown> {
  const path = normalizeSeoPath(form.path);
  return {
    path,
    label: form.label.trim() || path,
    meta_title: form.meta_title.trim() || null,
    meta_description: form.meta_description.trim() || null,
    og_image_url: form.og_image_url.trim() || null,
    meta_keywords: form.meta_keywords.trim() || null,
    noindex: form.noindex,
    canonical_path: form.canonical_path.trim() || (path === "/" ? "/" : `${path}/`),
  };
}

export function mergePageSeoRows(
  knownPaths: { path: string; label: string }[],
  fromApi: AdminPageSeoForm[],
): AdminPageSeoForm[] {
  const byPath = new Map<string, AdminPageSeoForm>();
  for (const p of knownPaths) {
    byPath.set(normalizeSeoPath(p.path), emptyPageSeoForm(p.path));
  }
  for (const row of fromApi) {
    byPath.set(normalizeSeoPath(row.path), { ...emptyPageSeoForm(row.path), ...row, path: normalizeSeoPath(row.path) });
  }
  return Array.from(byPath.values()).sort((a, b) => a.label.localeCompare(b.label));
}
