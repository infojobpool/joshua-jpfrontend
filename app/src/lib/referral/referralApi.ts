import axiosInstance from "@/lib/axiosInstance";
import { buildReferralLink } from "./referralShare";
import {
  REFERRAL_MILESTONE_REWARD_INR,
  REFERRAL_MILESTONE_VERIFIED_COUNT,
  WELCOME_BONUS_INR,
} from "./constants";
import { computeMilestoneProgress, countVerifiedReferees } from "./milestoneProgress";
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
  /** Referees who completed full payout verification */
  completed_count: number;
  total_earned_inr: number;
  verified_referee_count: number;
  milestone_progress_toward_next: number;
  milestone_verified_required: number;
  milestone_reward_inr: number;
  milestones_completed: number;
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

  const verifiedFromApi = Number(
    stats.verified_referee_count ??
      stats.verified_count ??
      stats.completed_count ??
      stats.completed ??
      stats.credited_count ??
      0
  );
  const milestoneFromApi =
    row.milestone_progress_toward_next ??
    stats.milestone_progress_toward_next ??
    stats.progress_toward_next;
  const milestonesPaid = Number(
    row.milestones_completed ?? stats.milestones_completed ?? stats.milestones_paid ?? NaN
  );
  const earnedFromApi = Number(
    stats.total_earned_inr ?? stats.total_earned ?? stats.earned_inr ?? stats.referral_earned_inr ?? NaN
  );

  const computed = computeMilestoneProgress(verifiedFromApi);
  const progressToward =
    milestoneFromApi != null && milestoneFromApi !== ""
      ? Number(milestoneFromApi)
      : computed.progress_toward_next;
  const milestonesCompleted = Number.isFinite(milestonesPaid)
    ? milestonesPaid
    : computed.milestones_completed;
  const totalEarned = Number.isFinite(earnedFromApi)
    ? earnedFromApi
    : milestonesCompleted * REFERRAL_MILESTONE_REWARD_INR;

  return {
    referral_code: code,
    referral_link: String(row.referral_link ?? row.link ?? buildReferralLink(code)),
    referrer_reward_inr: Number(
      row.referrer_reward_inr ??
        rewards.referrer_milestone_inr ??
        rewards.referrer_amount_inr ??
        rewards.referrer ??
        REFERRAL_MILESTONE_REWARD_INR
    ),
    referee_reward_inr: Number(
      row.referee_reward_inr ??
        rewards.referee_amount_inr ??
        rewards.referee ??
        WELCOME_BONUS_INR
    ),
    pending_count: Number(stats.pending_count ?? stats.pending ?? stats.verifying_count ?? 0),
    completed_count: verifiedFromApi,
    total_earned_inr: totalEarned,
    verified_referee_count: verifiedFromApi,
    milestone_progress_toward_next: progressToward,
    milestone_verified_required: Number(
      row.milestone_verified_required ??
        stats.milestone_verified_required ??
        REFERRAL_MILESTONE_VERIFIED_COUNT
    ),
    milestone_reward_inr: Number(
      row.milestone_reward_inr ?? stats.milestone_reward_inr ?? REFERRAL_MILESTONE_REWARD_INR
    ),
    milestones_completed: milestonesCompleted,
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
  const empty = computeMilestoneProgress(0);
  return {
    referral_code: code,
    referral_link: buildReferralLink(code),
    referrer_reward_inr: REFERRAL_MILESTONE_REWARD_INR,
    referee_reward_inr: WELCOME_BONUS_INR,
    pending_count: 0,
    completed_count: 0,
    total_earned_inr: 0,
    verified_referee_count: 0,
    milestone_progress_toward_next: empty.progress_toward_next,
    milestone_verified_required: empty.required_for_next,
    milestone_reward_inr: empty.next_payout_inr,
    milestones_completed: 0,
  };
}

/** Reconcile summary stats from referral list when API omits milestone fields. */
export function enrichSummaryFromReferrals(
  summary: ReferralSummary,
  referrals: ReferralEntry[]
): ReferralSummary {
  if (referrals.length === 0) return summary;

  const verified = countVerifiedReferees(referrals.map((r) => r.status));
  const pending = referrals.filter((r) => r.status === "pending").length;
  const apiVerified = summary.verified_referee_count;

  if (apiVerified > 0 && apiVerified >= verified) {
    return summary;
  }

  const progress = computeMilestoneProgress(verified);
  return {
    ...summary,
    pending_count: Math.max(summary.pending_count, pending),
    completed_count: verified,
    verified_referee_count: verified,
    milestone_progress_toward_next: progress.progress_toward_next,
    milestone_verified_required: progress.required_for_next,
    milestone_reward_inr: progress.next_payout_inr,
    milestones_completed: progress.milestones_completed,
    total_earned_inr:
      summary.total_earned_inr > 0
        ? summary.total_earned_inr
        : progress.total_earned_inr,
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
      return "Verifying profile";
    case "qualified":
      return "Verified";
    case "credited":
      return "Counted toward reward";
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
    reward_inr: Number(row.reward_inr ?? row.referee_reward_inr ?? WELCOME_BONUS_INR),
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
      reward_inr: WELCOME_BONUS_INR,
      status: "pending",
    };
  }

  return {
    was_referred: false,
    reward_inr: WELCOME_BONUS_INR,
    status: "none",
  };
}
