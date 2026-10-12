import {
  REFERRAL_MILESTONE_REWARD_INR,
  REFERRAL_MILESTONE_VERIFIED_COUNT,
} from "./constants";

export type ReferralMilestoneProgress = {
  verified_count: number;
  /** 0–3 toward the next ₹ payout */
  progress_toward_next: number;
  required_for_next: number;
  milestones_completed: number;
  total_earned_inr: number;
  next_payout_inr: number;
};

/** Count referees who finished full payout verification (qualified or credited). */
export function countVerifiedReferees(
  statuses: Array<"pending" | "qualified" | "credited" | "expired" | "cancelled">
): number {
  return statuses.filter((s) => s === "qualified" || s === "credited").length;
}

export function computeMilestoneProgress(verifiedCount: number): ReferralMilestoneProgress {
  const required = REFERRAL_MILESTONE_VERIFIED_COUNT;
  const reward = REFERRAL_MILESTONE_REWARD_INR;
  const milestones = Math.floor(Math.max(0, verifiedCount) / required);
  const toward = verifiedCount % required;

  return {
    verified_count: verifiedCount,
    progress_toward_next: toward,
    required_for_next: required,
    milestones_completed: milestones,
    total_earned_inr: milestones * reward,
    next_payout_inr: reward,
  };
}
