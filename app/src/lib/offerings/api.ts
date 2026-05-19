import axiosInstance from "@/lib/axiosInstance";
import { parseMediaUploadResponse } from "@/lib/parseMediaUploadResponse";
import { looksLikeTaskCategoryId } from "@/lib/taskCategories";
import type { Offering, OfferingStatus, OfferingType } from "./types";

function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function toNum(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : fallback;
}

function toMs(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const t = Date.parse(v);
    if (!Number.isNaN(t)) return t;
  }
  return Date.now();
}

/** Normalize various backend list shapes to Offering[]. */
export function extractOfferingsPayload(res: unknown): unknown[] {
  if (Array.isArray(res)) return res;
  const root = res && typeof res === "object" ? (res as Record<string, unknown>) : null;
  if (!root) return [];
  const data = root.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (Array.isArray(d.results)) return d.results;
    if (Array.isArray(d.offerings)) return d.offerings;
  }
  if (Array.isArray(root.results)) return root.results;
  if (Array.isArray(root.offerings)) return root.offerings;
  return [];
}

/** Match listing ids across feed vs detail (numeric pk vs string, trimming). */
function offeringIdsMatch(listId: string, requested: string): boolean {
  const a = String(listId ?? "").trim();
  const b = String(requested ?? "").trim();
  if (!a || !b) return false;
  if (a === b) return true;
  if (/^\d+$/.test(a) && /^\d+$/.test(b)) {
    try {
      return BigInt(a) === BigInt(b);
    } catch {
      return false;
    }
  }
  return false;
}

export function mapOfferingFromApi(raw: unknown): Offering | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const idRaw = pick(r, "id", "pk", "uuid", "offering_id", "listing_id");
  const id = idRaw != null && idRaw !== "" ? String(idRaw).trim() : "";
  if (!id) return null;
  const statusRaw = String(pick(r, "status") ?? "draft").toLowerCase().replace(/\s+/g, "_");
  let status: OfferingStatus = "draft";
  if (statusRaw === "published" || statusRaw === "live" || statusRaw === "active" || statusRaw === "public") {
    status = "published";
  } else if (statusRaw === "paused") {
    status = "paused";
  } else if (statusRaw === "draft") {
    status = "draft";
  }
  const typeRaw = String(pick(r, "type") ?? "service").toLowerCase();
  const type: OfferingType = typeRaw === "product" ? "product" : "service";
  const photos = pick(r, "photo_urls", "photoUrls");
  const photoUrls = Array.isArray(photos)
    ? (photos as unknown[]).filter((u): u is string => typeof u === "string" && u.length > 0).slice(0, 12)
    : [];
  let userId = String(
    pick(r, "user_id", "userId", "profile_user_id", "provider_id", "owner_id", "tasker_id") ?? "",
  );
  if (!userId.trim()) {
    const holder = pick(r, "user", "profile", "provider", "tasker");
    if (holder && typeof holder === "object" && !Array.isArray(holder)) {
      const h = holder as Record<string, unknown>;
      userId = String(pick(h, "id", "user_id", "uuid", "pk") ?? "");
    }
  }
  const displayNameRaw = pick(r, "provider_display_name", "providerDisplayName");
  const providerDisplayName =
    typeof displayNameRaw === "string" && displayNameRaw.trim() ? displayNameRaw.trim() : undefined;

  const rawCategory = String(pick(r, "category") ?? "").trim();
  const categoryIdFromApi = String(pick(r, "category_id", "categoryId") ?? "").trim();
  const categoryId =
    categoryIdFromApi || (looksLikeTaskCategoryId(rawCategory) ? rawCategory : "");
  const categoryNameRaw = pick(r, "category_name", "categoryName");
  const categoryName =
    typeof categoryNameRaw === "string" && categoryNameRaw.trim()
      ? categoryNameRaw.trim()
      : !looksLikeTaskCategoryId(rawCategory) && rawCategory
        ? rawCategory
        : undefined;
  const customRaw = pick(r, "custom_category_name", "customCategoryName");
  const customCategoryName =
    typeof customRaw === "string" && customRaw.trim() ? customRaw.trim() : null;

  return {
    id,
    userId,
    ...(providerDisplayName ? { providerDisplayName } : {}),
    type,
    title: String(pick(r, "title") ?? ""),
    categoryId,
    ...(categoryName ? { categoryName } : {}),
    ...(customCategoryName ? { customCategoryName } : {}),
    description: String(
      pick(
        r,
        "description",
        "details",
        "about",
        "summary",
        "service_description",
        "product_description",
        "listing_description",
        "desc",
      ) ?? "",
    ),
    locationText: String(pick(r, "location_text", "locationText") ?? ""),
    startingPriceInr: toNum(pick(r, "starting_price_inr", "startingPriceInr"), 0),
    photoUrls,
    status,
    createdAt: toMs(pick(r, "created_at", "createdAt")),
    updatedAt: toMs(pick(r, "updated_at", "updatedAt")),
    attestationAccepted: Boolean(pick(r, "attestation_accepted", "attestationAccepted")),
    adminHidden: Boolean(pick(r, "admin_hidden", "adminHidden")),
  };
}

/** API accepts remote http(s) URLs in photo_urls, not browser data: URLs. */
export function filterHttpsPhotoUrls(urls: string[] | undefined): string[] {
  if (!urls?.length) return [];
  return urls.filter((u) => typeof u === "string" && /^https?:\/\//i.test(u.trim()));
}

/** POST multipart to store one listing image; returns absolute URL for photo_urls. */
export async function uploadOfferingImageApi(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await axiosInstance.post("offerings/upload-image/", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 120000,
  });
  return parseMediaUploadResponse(res);
}

export function offeringToApiBody(o: Partial<Offering>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (o.type != null) body.type = o.type;
  if (o.title != null) body.title = o.title;
  const catId = o.categoryId?.trim();
  if (catId) body.category = catId;
  if (o.customCategoryName !== undefined) {
    body.custom_category_name = o.customCategoryName?.trim() || null;
  }
  if (o.description != null) body.description = o.description;
  if (o.locationText != null) body.location_text = o.locationText;
  if (o.startingPriceInr != null) body.starting_price_inr = o.startingPriceInr;
  if (o.photoUrls != null) body.photo_urls = filterHttpsPhotoUrls(o.photoUrls);
  if (o.status != null) body.status = o.status;
  if (o.attestationAccepted != null) body.attestation_accepted = o.attestationAccepted;
  return body;
}

/** Unwrap `{ status_code, data }` API envelope; use `?? res.data` for flat bodies. */
export function unwrapOfferingEnvelope(res: { data?: unknown }): unknown {
  const d = res.data as Record<string, unknown> | undefined;
  if (!d) return undefined;
  if (d.status_code != null && Number(d.status_code) !== 200) return undefined;
  return d.data;
}

function hasOfferingShapeId(idVal: unknown): boolean {
  return (
    (typeof idVal === "string" && idVal.trim().length > 0) ||
    (typeof idVal === "number" && Number.isFinite(idVal))
  );
}

/** Deep scan for an id/pk when the API returns 200 but a non-standard envelope (POST create). */
function extractIdLoose(root: unknown): string | null {
  const seen = new Set<unknown>();
  const walk = (x: unknown, depth: number): string | null => {
    if (depth > 8 || x == null) return null;
    if (typeof x !== "object") return null;
    if (seen.has(x)) return null;
    seen.add(x);
    if (Array.isArray(x)) {
      for (const el of x) {
        const id = walk(el, depth + 1);
        if (id) return id;
      }
      return null;
    }
    const r = x as Record<string, unknown>;
    for (const k of ["id", "pk", "offering_id", "listing_id", "uuid"]) {
      const v = r[k];
      if (typeof v === "number" && Number.isFinite(v)) return String(v);
      if (typeof v === "string") {
        const t = v.trim();
        if (t.length > 0 && !t.startsWith("of_")) return t;
      }
    }
    for (const v of Object.values(r)) {
      const id = walk(v, depth + 1);
      if (id) return id;
    }
    return null;
  };
  return walk(root, 0);
}

/**
 * Normalize single-offering bodies: envelopes, flat JSON, numeric ids, nested `offering`.
 * PATCH often differs from POST (e.g. Django returns integer pk or minimal payload).
 */
function extractOfferingRawFromAxiosResponse(res: { data?: unknown }): unknown {
  const d = res.data as Record<string, unknown> | undefined;
  if (!d || typeof d !== "object" || Array.isArray(d)) return undefined;
  if (d.status_code != null && Number(d.status_code) !== 200) return undefined;

  /** Some APIs mirror the payload as `offering` next to `status_code`. */
  if (d.offering && typeof d.offering === "object" && !Array.isArray(d.offering)) {
    const off = d.offering as Record<string, unknown>;
    if (hasOfferingShapeId(off.id) || hasOfferingShapeId(off.pk)) return d.offering;
  }

  const inner = d.data;
  if (inner != null && typeof inner === "object" && !Array.isArray(inner)) {
    const io = inner as Record<string, unknown>;
    if (io.offering && typeof io.offering === "object" && !Array.isArray(io.offering)) return io.offering;
    if (io.Offering && typeof io.Offering === "object" && !Array.isArray(io.Offering)) return io.Offering;
    if (hasOfferingShapeId(io.id) || hasOfferingShapeId(io.pk)) return inner;
    const nested = io.data;
    if (nested != null && typeof nested === "object" && !Array.isArray(nested)) {
      const n = nested as Record<string, unknown>;
      if (hasOfferingShapeId(n.id) || hasOfferingShapeId(n.pk)) return nested;
    }
  }

  if (hasOfferingShapeId(d.id) || hasOfferingShapeId(d.pk)) return d;

  for (const key of ["offering", "listing", "result", "item", "object"]) {
    const v = d[key];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const vo = v as Record<string, unknown>;
      if (hasOfferingShapeId(vo.id) || hasOfferingShapeId(vo.pk)) return v;
    }
  }

  return undefined;
}

function applyOfferingPatch(base: Offering, patch: Partial<Offering>): Offering {
  const out: Offering = { ...base };
  (Object.entries(patch) as [keyof Offering, Offering[keyof Offering]][]).forEach(([k, v]) => {
    if (v !== undefined) (out as Record<string, unknown>)[k as string] = v;
  });
  if (patch.id != null && String(patch.id).trim().length > 0) {
    out.id = String(patch.id).trim();
  } else {
    out.id = base.id;
  }
  if (patch.photoUrls !== undefined) {
    out.photoUrls = filterHttpsPhotoUrls(patch.photoUrls);
  }
  return out;
}

function parseOfferingResponse(res: { data?: unknown; status?: number }): Offering {
  const raw = extractOfferingRawFromAxiosResponse(res);
  const m = mapOfferingFromApi(raw);
  if (!m) throw new Error("Invalid offering response from server");
  return m;
}

export async function listOfferingsApi(profileUserId: string): Promise<Offering[]> {
  const res = await axiosInstance.get("offerings/", {
    params: { user_id: profileUserId },
  });
  const rows = extractOfferingsPayload(unwrapOfferingEnvelope(res) ?? res.data);
  return rows.map(mapOfferingFromApi).filter((x): x is Offering => x !== null);
}

/**
 * Public discovery feed: anonymous, published only.
 * GET /offerings/feed/?limit=&offset= — see backend OFFERING_FEED_* env.
 */
export type OfferingFeedPage = {
  offerings: Offering[];
  /** Total published rows (for load more / pager) */
  total: number;
};

export async function listOfferingFeedApi(limit = 24, offset = 0): Promise<OfferingFeedPage> {
  try {
    const res = await axiosInstance.get("offerings/feed/", {
      params: { limit, offset },
    });
    const payload = unwrapOfferingEnvelope(res) ?? res.data;
    const rows = extractOfferingsPayload(payload);
    const offerings = rows
      .map(mapOfferingFromApi)
      .filter((x): x is Offering => x !== null)
      .filter(
        (o) => o.userId.trim().length > 0 && o.status === "published" && !o.adminHidden,
      );

    let total = 0;
    if (payload && typeof payload === "object" && !Array.isArray(payload)) {
      const t = (payload as Record<string, unknown>).total;
      if (typeof t === "number" && Number.isFinite(t)) total = t;
      else if (typeof t === "string" && /^\d+$/.test(t)) total = parseInt(t, 10);
    }
    if (total <= 0) total = offerings.length;

    return { offerings, total };
  } catch (e) {
    /** Do not return [] on network/throttle errors — callers treat empty as “real empty feed” and cache it. */
    throw e;
  }
}

/** Home / marketing slider: first page of the public feed. */
export async function listPublishedOfferingsForHomeApi(limit = 24): Promise<Offering[]> {
  const { offerings } = await listOfferingFeedApi(limit, 0);
  return offerings.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}

/**
 * Public listing detail for `/listings/[id]`.
 * Tries GET `offerings/{id}/` first; if missing or non-public, scans the public feed (paginated cap).
 */
export async function getPublicOfferingByIdApi(id: string): Promise<Offering | null> {
  let clean = String(id ?? "").trim();
  if (!clean) return null;
  try {
    clean = decodeURIComponent(clean).trim();
  } catch {
    /* keep clean as-is */
  }
  if (!clean) return null;

  try {
    const res = await axiosInstance.get(`offerings/${encodeURIComponent(clean)}/`, {
      timeout: 15_000,
    });
    const raw = unwrapOfferingEnvelope(res) ?? res.data;
    let single: unknown = raw;
    if (Array.isArray(raw) && raw.length > 0) single = raw[0];
    const m = mapOfferingFromApi(single);
    if (m && m.status === "published" && !m.adminHidden) return m;
  } catch {
    /* fall through to feed scan */
  }

  try {
    const pageSize = 72;
    let offset = 0;
    for (let page = 0; page < 12; page++) {
      const { offerings } = await listOfferingFeedApi(pageSize, offset);
      const found = offerings.find((o) => offeringIdsMatch(o.id, clean));
      if (found) {
        const ownerId = String(found.userId || "").trim();
        if (!ownerId) return found;
        try {
          /** Feed rows are slim (often no description). Hydrate from owner listings endpoint when possible. */
          const byUser = await axiosInstance.get("offerings/", {
            params: { user_id: ownerId },
            timeout: 15_000,
          });
          const payload = unwrapOfferingEnvelope(byUser) ?? byUser.data;
          const rows = extractOfferingsPayload(payload);
          const full = rows
            .map(mapOfferingFromApi)
            .filter((x): x is Offering => x !== null)
            .find((o) => offeringIdsMatch(o.id, clean));
          if (full && full.status === "published" && !full.adminHidden) {
            return full;
          }
        } catch {
          /* keep feed fallback */
        }
        return found;
      }
      if (offerings.length < pageSize) break;
      offset += pageSize;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function newIdempotencyKey(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export async function createOfferingApi(o: Offering): Promise<Offering> {
  const body = offeringToApiBody(o);
  body.status = o.status;
  /** Send only after API CORS allows `Idempotency-Key`; otherwise WebView/browsers often fail preflight → "Network Error". */
  const extra =
    process.env.NEXT_PUBLIC_OFFERINGS_SEND_IDEMPOTENCY_KEY === "1"
      ? { headers: { "Idempotency-Key": newIdempotencyKey() } }
      : {};
  const res = await axiosInstance.post("offerings/", body, extra);
  try {
    return parseOfferingResponse(res);
  } catch {
    const httpStatus = (res as { status?: number }).status ?? 0;
    if (httpStatus < 200 || httpStatus >= 300) {
      throw new Error("Invalid offering response from server");
    }
    const raw = extractOfferingRawFromAxiosResponse(res);
    if (raw) {
      const m = mapOfferingFromApi(raw);
      if (m) return m;
    }
    const root = res.data as Record<string, unknown> | undefined;
    if (root && typeof root.data === "string") {
      const sid = root.data.trim();
      if (sid.length > 0) {
        return applyOfferingPatch(o, {
          id: sid,
          userId: o.userId,
          status: o.status,
          updatedAt: Date.now(),
        });
      }
    }
    const id = extractIdLoose(res.data);
    if (id) {
      return applyOfferingPatch(o, {
        id,
        userId: o.userId,
        status: o.status,
        updatedAt: Date.now(),
      });
    }
    throw new Error("Invalid offering response from server");
  }
}

export async function updateOfferingApi(
  id: string,
  patch: Partial<Offering>,
  /** When the server returns 200 with no parseable offering (common on PATCH), merge onto this. */
  baseline?: Offering,
): Promise<Offering> {
  const body = offeringToApiBody(patch);
  const res = await axiosInstance.patch(`offerings/${id}/`, body);
  try {
    return parseOfferingResponse(res);
  } catch {
    const httpStatus = (res as { status?: number }).status ?? 0;
    if (httpStatus >= 200 && httpStatus < 300 && baseline) {
      return applyOfferingPatch(baseline, { ...patch, id: baseline.id });
    }
    throw new Error("Invalid offering response from server");
  }
}

export async function deleteOfferingApi(id: string): Promise<void> {
  await axiosInstance.delete(`offerings/${id}/`);
}

export function isOfferingLimitError(err: unknown): boolean {
  const ax = err as {
    response?: { status?: number; data?: Record<string, unknown> };
    message?: string;
  };
  const status = ax.response?.status;
  if (status === 403 || status === 400) {
    const msg = String(
      ax.response?.data?.message ??
        ax.response?.data?.detail ??
        ax.response?.data?.error ??
        ""
    ).toLowerCase();
    const code = String(ax.response?.data?.code ?? ax.response?.data?.error_code ?? "").toLowerCase();
    if (
      code.includes("limit") ||
      code.includes("offering") ||
      msg.includes("limit") ||
      msg.includes("subscription") ||
      msg.includes("plan") ||
      msg.includes("slot")
    ) {
      return true;
    }
  }
  return false;
}

export const OFFERING_LIMIT_TOAST =
  "Listing limit reached on your plan. Pause a listing or upgrade in Settings to publish more.";
