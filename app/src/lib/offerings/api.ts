import axiosInstance from "@/lib/axiosInstance";
import { parseMediaUploadResponse } from "@/lib/parseMediaUploadResponse";
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

export function mapOfferingFromApi(raw: unknown): Offering | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = String(pick(r, "id") ?? "");
  if (!id) return null;
  const statusRaw = String(pick(r, "status") ?? "draft").toLowerCase();
  const status: OfferingStatus =
    statusRaw === "published" || statusRaw === "paused" || statusRaw === "draft" ? statusRaw : "draft";
  const typeRaw = String(pick(r, "type") ?? "service").toLowerCase();
  const type: OfferingType = typeRaw === "product" ? "product" : "service";
  const photos = pick(r, "photo_urls", "photoUrls");
  const photoUrls = Array.isArray(photos)
    ? (photos as unknown[]).filter((u): u is string => typeof u === "string" && u.length > 0).slice(0, 12)
    : [];
  return {
    id,
    userId: String(pick(r, "user_id", "userId") ?? ""),
    type,
    title: String(pick(r, "title") ?? ""),
    category: String(pick(r, "category") ?? ""),
    description: String(pick(r, "description") ?? ""),
    locationText: String(pick(r, "location_text", "locationText") ?? ""),
    startingPriceInr: toNum(pick(r, "starting_price_inr", "startingPriceInr"), 0),
    photoUrls,
    status,
    createdAt: toMs(pick(r, "created_at", "createdAt")),
    updatedAt: toMs(pick(r, "updated_at", "updatedAt")),
    attestationAccepted: Boolean(pick(r, "attestation_accepted", "attestationAccepted")),
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
  if (o.category != null) body.category = o.category;
  if (o.description != null) body.description = o.description;
  if (o.locationText != null) body.location_text = o.locationText;
  if (o.startingPriceInr != null) body.starting_price_inr = o.startingPriceInr;
  if (o.photoUrls != null) body.photo_urls = filterHttpsPhotoUrls(o.photoUrls);
  if (o.status != null) body.status = o.status;
  if (o.attestationAccepted != null) body.attestation_accepted = o.attestationAccepted;
  return body;
}

function unwrapResponseData<T = unknown>(res: { data?: unknown }): T | undefined {
  const d = res.data as Record<string, unknown> | undefined;
  if (!d) return undefined;
  if (d.status_code != null && Number(d.status_code) !== 200) return undefined;
  return d.data as T;
}

function hasOfferingShapeId(idVal: unknown): boolean {
  return (
    (typeof idVal === "string" && idVal.length > 0) ||
    (typeof idVal === "number" && Number.isFinite(idVal))
  );
}

/**
 * Normalize single-offering bodies: envelopes, flat JSON, numeric ids, nested `offering`.
 * PATCH often differs from POST (e.g. Django returns integer pk or minimal payload).
 */
function extractOfferingRawFromAxiosResponse(res: { data?: unknown }): unknown {
  const d = res.data as Record<string, unknown> | undefined;
  if (!d || typeof d !== "object" || Array.isArray(d)) return undefined;
  if (d.status_code != null && Number(d.status_code) !== 200) return undefined;

  const inner = d.data;
  if (inner != null && typeof inner === "object" && !Array.isArray(inner)) {
    const io = inner as Record<string, unknown>;
    if (io.offering && typeof io.offering === "object" && !Array.isArray(io.offering)) return io.offering;
    if (io.Offering && typeof io.Offering === "object" && !Array.isArray(io.Offering)) return io.Offering;
    if (hasOfferingShapeId(io.id)) return inner;
  }

  if (hasOfferingShapeId(d.id)) return d;

  return undefined;
}

function applyOfferingPatch(base: Offering, patch: Partial<Offering>): Offering {
  const out: Offering = { ...base };
  (Object.entries(patch) as [keyof Offering, Offering[keyof Offering]][]).forEach(([k, v]) => {
    if (v !== undefined) (out as Record<string, unknown>)[k as string] = v;
  });
  out.id = base.id;
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
  const rows = extractOfferingsPayload(unwrapResponseData(res) ?? res.data);
  return rows.map(mapOfferingFromApi).filter((x): x is Offering => x !== null);
}

export async function createOfferingApi(o: Offering): Promise<Offering> {
  const body = offeringToApiBody(o);
  body.status = o.status;
  const res = await axiosInstance.post("offerings/", body);
  return parseOfferingResponse(res);
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
