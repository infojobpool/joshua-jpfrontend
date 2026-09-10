import axiosInstance from "@/lib/axiosInstance";

export type AdminReferralStatus =
  | "pending"
  | "qualified"
  | "credited"
  | "expired"
  | "cancelled"
  | string;

export type AdminReferralRow = {
  id: string;
  status: AdminReferralStatus;
  referral_code_used: string;
  referrer_user_id?: string | null;
  referee_user_id?: string | null;
  referrer_name: string;
  referrer_email?: string | null;
  referee_name: string;
  referee_email?: string | null;
  referrer_reward_inr: number;
  referee_reward_inr: number;
  qualifying_job_id?: string | null;
  referrer_credited_at?: string | null;
  referee_credited_at?: string | null;
  created_at: string;
};

function pickString(row: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = row[key];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (typeof val === "number" && Number.isFinite(val)) return String(val);
  }
  return "";
}

function pickNullableString(row: Record<string, unknown>, keys: string[]): string | null {
  const val = pickString(row, keys);
  return val || null;
}

function pickNumber(row: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const val = row[key];
    if (typeof val === "number" && Number.isFinite(val)) return val;
    if (typeof val === "string" && val.trim()) {
      const n = Number(val);
      if (Number.isFinite(n)) return n;
    }
  }
  return fallback;
}

export function normalizeAdminReferral(raw: unknown, index = 0): AdminReferralRow | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  const id = pickString(row, ["id", "referral_id", "uuid"]);
  if (!id) return null;

  const statusRaw = pickString(row, ["status"]).toLowerCase() || "pending";

  return {
    id,
    status: statusRaw,
    referral_code_used: pickString(row, ["referral_code_used", "referral_code", "code_used"]),
    referrer_user_id: pickNullableString(row, ["referrer_user_id", "referrer_id"]),
    referee_user_id: pickNullableString(row, ["referee_user_id", "referee_id"]),
    referrer_name: pickString(row, [
      "referrer_name",
      "referrer_fullname",
      "referrer_user_fullname",
    ]) || "—",
    referrer_email: pickNullableString(row, ["referrer_email", "referrer_user_email"]),
    referee_name: pickString(row, [
      "referee_name",
      "referee_fullname",
      "referee_user_fullname",
    ]) || "—",
    referee_email: pickNullableString(row, ["referee_email", "referee_user_email"]),
    referrer_reward_inr: pickNumber(row, ["referrer_reward_inr", "referrer_reward", "referrer_amount_inr"]),
    referee_reward_inr: pickNumber(row, ["referee_reward_inr", "referee_reward", "referee_amount_inr"]),
    qualifying_job_id: pickNullableString(row, ["qualifying_job_id", "job_id", "qualifying_task_id"]),
    referrer_credited_at: pickNullableString(row, ["referrer_credited_at", "referrer_credit_at"]),
    referee_credited_at: pickNullableString(row, ["referee_credited_at", "referee_credit_at"]),
    created_at: pickString(row, ["created_at", "signed_up_at"]) || new Date(0).toISOString(),
  };
}

function extractReferralsList(payload: unknown): AdminReferralRow[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data ?? root;

  const candidates: unknown[] = [];
  if (Array.isArray(data)) candidates.push(data);
  else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.referrals)) candidates.push(obj.referrals);
    if (Array.isArray(obj.items)) candidates.push(obj.items);
    if (Array.isArray(obj.results)) candidates.push(obj.results);
  }
  if (Array.isArray(root.referrals)) candidates.push(root.referrals);

  for (const list of candidates) {
    if (!Array.isArray(list)) continue;
    const out: AdminReferralRow[] = [];
    list.forEach((item, i) => {
      const row = normalizeAdminReferral(item, i);
      if (row) out.push(row);
    });
    if (out.length) return out;
  }
  return [];
}

/** GET /admin/referrals/ — all referral rows (admin JWT). */
export async function fetchAdminReferrals(): Promise<AdminReferralRow[]> {
  const res = await axiosInstance.get("admin/referrals/");
  return extractReferralsList(res.data);
}

export function referralStatusLabel(status: AdminReferralStatus): string {
  switch (String(status).toLowerCase()) {
    case "pending":
      return "Signed up";
    case "qualified":
      return "Task completed";
    case "credited":
      return "Rewards credited";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    default:
      return status ? String(status) : "Unknown";
  }
}

export function referralStatusBadgeClass(status: AdminReferralStatus): string {
  switch (String(status).toLowerCase()) {
    case "credited":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "qualified":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "pending":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "expired":
    case "cancelled":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}
