import type { AdminReferralRow } from "./adminReferralsApi";

export type ReferrerAggregate = {
  key: string;
  referrer_name: string;
  referrer_email: string | null;
  referrer_user_id: string | null;
  referral_code_used: string;
  invited_total: number;
  verifying: number;
  verified: number;
  milestones_estimated: number;
  referee_names: string[];
};

function referrerKey(r: AdminReferralRow): string {
  return (
    r.referrer_user_id?.trim() ||
    r.referrer_email?.trim()?.toLowerCase() ||
    r.referrer_name.trim().toLowerCase() ||
    r.id
  );
}

function isVerifiedStatus(status: string): boolean {
  const s = status.toLowerCase();
  return s === "qualified" || s === "credited";
}

/** Group flat referral rows by referrer for admin overview. */
export function aggregateByReferrer(rows: AdminReferralRow[]): ReferrerAggregate[] {
  const map = new Map<string, ReferrerAggregate>();

  for (const r of rows) {
    const key = referrerKey(r);
    let agg = map.get(key);
    if (!agg) {
      agg = {
        key,
        referrer_name: r.referrer_name,
        referrer_email: r.referrer_email ?? null,
        referrer_user_id: r.referrer_user_id ?? null,
        referral_code_used: r.referral_code_used,
        invited_total: 0,
        verifying: 0,
        verified: 0,
        milestones_estimated: 0,
        referee_names: [],
      };
      map.set(key, agg);
    }
    agg.invited_total += 1;
    if (String(r.status).toLowerCase() === "pending") agg.verifying += 1;
    if (isVerifiedStatus(String(r.status))) agg.verified += 1;
    if (r.referee_name && r.referee_name !== "—") {
      agg.referee_names.push(r.referee_name);
    }
    if (r.referral_code_used && !agg.referral_code_used) {
      agg.referral_code_used = r.referral_code_used;
    }
  }

  const list = Array.from(map.values());
  for (const agg of list) {
    agg.milestones_estimated = Math.floor(agg.verified / 3);
  }
  list.sort((a, b) => b.invited_total - a.invited_total || b.verified - a.verified);
  return list;
}
