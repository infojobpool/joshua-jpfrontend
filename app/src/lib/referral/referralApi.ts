import axiosInstance from "@/lib/axiosInstance";
import { buildReferralLink } from "./referralShare";
import {
  DEFAULT_REFEREE_REWARD_INR,
  DEFAULT_REFERRER_REWARD_INR,
} from "./constants";
import {
  clearRefereeBonusPending,
  getRefereeBonusPending,
} from "./referralStorage";

export type ReferralStatus =
  | "pending"
  | "qualified"
  | "credited"
  | "expired"
  | "cancelled";

export type ReferralSummary = {
  referral_code: string;
  referral_link: string;
  referrer_reward_inr: number;
  referee_reward_inr: number;
  pending_count: number;
  completed_count: number;
  total_earned_inr: number;
};

export type ReferralEntry = {
  id: string;
  referee_name: string;
  referee_email?: string | null;
  status: ReferralStatus;
  created_at: string;
  credited_at?: string | null;
  reward_amount_inr?: number | null;
};

export type RefereeBonusStatus = "none" | "pending" | "qualified" | "credited";

export type RefereeStatus = {
  was_referred: boolean;
  referral_code_used?: string | null;
  reward_inr: number;
  status: RefereeBonusStatus;
};

function fallbackReferralCode(userId: string): string {
  const clean = userId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const tail = clean.slice(-6) || "000000";
  return `JP${tail.padStart(6, "0")}`;
}

function parseSummaryPayload(data: unknown, userId: string): ReferralSummary {
  const root = (data as { data?: unknown })?.data ?? data;
  const row = (root ?? {}) as Record<string, unknown>;
  const code = String(row.referral_code ?? row.code ?? "").trim() || fallbackReferralCode(userId);
  const rewards = (row.rewards ?? row.reward ?? {}) as Record<string, unknown>;
  const stats = (row.stats ?? row.statistics ?? row) as Record<string, unknown>;

  return {
    referral_code: code,
    referral_link: String(row.referral_link ?? row.link ?? buildReferralLink(code)),
    referrer_reward_inr: Number(
      row.referrer_reward_inr ??
        rewards.referrer_amount_inr ??
        rewards.referrer ??
        DEFAULT_REFERRER_REWARD_INR
    ),
    referee_reward_inr: Number(
      row.referee_reward_inr ??
        rewards.referee_amount_inr ??
        rewards.referee ??
        DEFAULT_REFEREE_REWARD_INR
    ),
    pending_count: Number(stats.pending_count ?? stats.pending ?? 0),
    completed_count: Number(
      stats.completed_count ?? stats.completed ?? stats.credited_count ?? 0
    ),
    total_earned_inr: Number(
      stats.total_earned_inr ?? stats.total_earned ?? stats.earned_inr ?? 0
    ),
  };
}

function parseReferralRows(data: unknown): ReferralEntry[] {
  const root = (data as { data?: unknown })?.data ?? data;
  let rows: unknown[] = [];
  if (Array.isArray(root)) rows = root;
  else if (root && typeof root === "object") {
    const obj = root as Record<string, unknown>;
    if (Array.isArray(obj.referrals)) rows = obj.referrals;
    else if (Array.isArray(obj.items)) rows = obj.items;
  }

  return rows.map((raw, i) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    const statusRaw = String(r.status ?? "pending").toLowerCase();
    const status = (
      ["pending", "qualified", "credited", "expired", "cancelled"].includes(statusRaw)
        ? statusRaw
        : "pending"
    ) as ReferralStatus;
    return {
      id: String(r.id ?? r.referral_id ?? `ref-${i}`),
      referee_name: String(
        r.referee_name ?? r.user_name ?? r.name ?? r.referee_fullname ?? "Friend"
      ),
      referee_email: (r.referee_email ?? r.user_email ?? null) as string | null,
      status,
      created_at: String(r.created_at ?? r.signed_up_at ?? new Date().toISOString()),
      credited_at: (r.credited_at ?? r.completed_at ?? null) as string | null,
      reward_amount_inr:
        r.reward_amount_inr != null
          ? Number(r.reward_amount_inr)
          : r.reward_amount != null
            ? Number(r.reward_amount)
            : null,
    };
  });
}

export function fallbackReferralSummary(userId: string): ReferralSummary {
  const code = fallbackReferralCode(userId);
  return {
    referral_code: code,
    referral_link: buildReferralLink(code),
    referrer_reward_inr: DEFAULT_REFERRER_REWARD_INR,
    referee_reward_inr: DEFAULT_REFEREE_REWARD_INR,
    pending_count: 0,
    completed_count: 0,
    total_earned_inr: 0,
  };
}

/** GET /referral/summary/?user_id= — falls back to client-generated code if API not ready. */
export async function fetchReferralSummary(userId: string): Promise<ReferralSummary> {
  try {
    const res = await axiosInstance.get("/referral/summary/", {
      params: { user_id: userId },
    });
    return parseSummaryPayload(res.data, userId);
  } catch {
    try {
      const res = await axiosInstance.get("/referrals/summary/", {
        params: { user_id: userId },
      });
      return parseSummaryPayload(res.data, userId);
    } catch {
      return fallbackReferralSummary(userId);
    }
  }
}

/** GET /referrals/?user_id= */
export async function fetchReferralList(userId: string): Promise<ReferralEntry[]> {
  try {
    const res = await axiosInstance.get("/referrals/", { params: { user_id: userId } });
    return parseReferralRows(res.data);
  } catch {
    try {
      const res = await axiosInstance.get("/referral/list/", { params: { user_id: userId } });
      return parseReferralRows(res.data);
    } catch {
      return [];
    }
  }
}

export function referralStatusLabel(status: ReferralStatus): string {
  switch (status) {
    case "pending":
      return "Signed up";
    case "qualified":
      return "Task completed";
    case "credited":
      return "Reward credited";
    case "expired":
      return "Expired";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

function parseRefereeStatusPayload(data: unknown): RefereeStatus | null {
  const root = (data as { data?: unknown })?.data ?? data;
  if (!root || typeof root !== "object") return null;
  const row = root as Record<string, unknown>;
  const wasReferred = Boolean(
    row.was_referred ?? row.is_referred ?? row.referred ?? row.has_referral
  );
  if (!wasReferred && !row.referral_code_used && !row.status) return null;

  const statusRaw = String(row.status ?? row.bonus_status ?? "pending").toLowerCase();
  const status = (
    ["none", "pending", "qualified", "credited"].includes(statusRaw)
      ? statusRaw
      : wasReferred
        ? "pending"
        : "none"
  ) as RefereeBonusStatus;

  return {
    was_referred: wasReferred || status !== "none",
    referral_code_used: (row.referral_code_used ?? row.referral_code ?? null) as string | null,
    reward_inr: Number(row.reward_inr ?? row.referee_reward_inr ?? DEFAULT_REFEREE_REWARD_INR),
    status,
  };
}

/** GET /referral/referee-status/?user_id= — with local pending fallback. */
export async function fetchRefereeStatus(userId: string): Promise<RefereeStatus> {
  try {
    const res = await axiosInstance.get("/referral/referee-status/", {
      params: { user_id: userId },
    });
    const parsed = parseRefereeStatusPayload(res.data);
    if (parsed) {
      if (parsed.status === "credited" || parsed.status === "none") {
        clearRefereeBonusPending();
      }
      return parsed;
    }
  } catch {
    try {
      const res = await axiosInstance.get("/referrals/referee-status/", {
        params: { user_id: userId },
      });
      const parsed = parseRefereeStatusPayload(res.data);
      if (parsed) {
        if (parsed.status === "credited" || parsed.status === "none") {
          clearRefereeBonusPending();
        }
        return parsed;
      }
    } catch {
      /* fall through */
    }
  }

  const pending = getRefereeBonusPending();
  if (pending) {
    return {
      was_referred: true,
      referral_code_used: pending.code,
      reward_inr: DEFAULT_REFEREE_REWARD_INR,
      status: "pending",
    };
  }

  return {
    was_referred: false,
    reward_inr: DEFAULT_REFEREE_REWARD_INR,
    status: "none",
  };
}
