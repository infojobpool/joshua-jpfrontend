import axiosInstance from "@/lib/axiosInstance";
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

export function offeringToApiBody(o: Partial<Offering>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (o.type != null) body.type = o.type;
  if (o.title != null) body.title = o.title;
  if (o.category != null) body.category = o.category;
  if (o.description != null) body.description = o.description;
  if (o.locationText != null) body.location_text = o.locationText;
  if (o.startingPriceInr != null) body.starting_price_inr = o.startingPriceInr;
  if (o.photoUrls != null) body.photo_urls = o.photoUrls;
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

function parseOfferingResponse(res: { data?: unknown }): Offering {
  const d = res.data as Record<string, unknown> | undefined;
  let raw: unknown = unwrapResponseData(res);
  if (raw == null && d) {
    if (typeof d.id === "string") raw = d;
    else if (d.data && typeof d.data === "object") raw = d.data;
  }
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

export async function updateOfferingApi(id: string, patch: Partial<Offering>): Promise<Offering> {
  const body = offeringToApiBody(patch);
  const res = await axiosInstance.patch(`offerings/${id}/`, body);
  return parseOfferingResponse(res);
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
