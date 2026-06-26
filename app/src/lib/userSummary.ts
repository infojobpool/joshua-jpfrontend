import axiosInstance from "@/lib/axiosInstance";
import { resolveProfileImageUrl } from "@/lib/profileImage";

export type UserSummary = {
  user_id: string;
  name: string;
  profile_image: string | null;
  verification_status: number;
};

type UserSummaryEnvelope = {
  status_code?: number;
  message?: string;
  data?: UserSummary;
};

const summaryCache = new Map<string, { data: UserSummary; at: number }>();
const summaryInflight = new Map<string, Promise<UserSummary | null>>();
const SUMMARY_CACHE_MS = 60_000;

function parseSummary(raw: unknown, fallbackUserId: string): UserSummary | null {
  const body = raw as UserSummaryEnvelope | UserSummary;
  const payload =
    body && typeof body === "object" && "status_code" in body
      ? (body as UserSummaryEnvelope).data
      : (body as UserSummary);

  if (!payload || typeof payload !== "object") return null;

  const user_id = String(payload.user_id ?? fallbackUserId).trim();
  if (!user_id) return null;

  const rawImg = payload.profile_image;
  const profile_image =
    rawImg && String(rawImg).trim()
      ? resolveProfileImageUrl(String(rawImg)) ?? String(rawImg)
      : null;

  const statusRaw = payload.verification_status;
  const verification_status =
    typeof statusRaw === "number"
      ? statusRaw
      : typeof statusRaw === "string" && /^\d+$/.test(statusRaw)
        ? parseInt(statusRaw, 10)
        : 0;

  return {
    user_id,
    name: String(payload.name ?? "").trim() || "User",
    profile_image,
    verification_status,
  };
}

/** Lightweight avatar + verification — replaces full GET /profile on task page. */
export async function fetchUserSummary(userId: string): Promise<UserSummary | null> {
  const id = String(userId).trim();
  if (!id) return null;

  const hit = summaryCache.get(id);
  if (hit && Date.now() - hit.at < SUMMARY_CACHE_MS) {
    return hit.data;
  }

  const pending = summaryInflight.get(id);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const { data: raw } = await axiosInstance.get<UserSummaryEnvelope | UserSummary>(
        `/users/${encodeURIComponent(id)}/summary/`,
      );
      const envelope = raw as UserSummaryEnvelope;
      if (envelope?.status_code != null && envelope.status_code !== 200) {
        throw new Error(envelope.message || "Unable to load user summary");
      }
      const parsed = parseSummary(raw, id);
      if (parsed) {
        summaryCache.set(id, { data: parsed, at: Date.now() });
      }
      return parsed;
    } catch {
      return null;
    } finally {
      summaryInflight.delete(id);
    }
  })();

  summaryInflight.set(id, promise);
  return promise;
}

export function isUserVerifiedForBidding(verification_status: number | undefined | null): boolean {
  const n = typeof verification_status === "number" ? verification_status : Number(verification_status);
  return Number.isFinite(n) && n >= 2;
}
