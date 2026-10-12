import { absoluteUrl } from "@/lib/seo/site";
import {
  REFERRAL_MILESTONE_REWARD_INR,
  REFERRAL_MILESTONE_VERIFIED_COUNT,
  WELCOME_BONUS_INR,
} from "./constants";

export function buildReferralSignupPath(code: string): string {
  return `/signup?ref=${encodeURIComponent(code.trim())}`;
}

export function buildReferralLink(code: string): string {
  return absoluteUrl(buildReferralSignupPath(code));
}

export function buildWhatsAppShareUrl(code: string, referrerName?: string): string {
  const link = buildReferralLink(code);
  const who = referrerName?.trim() ? `${referrerName.trim()} invited you` : "Join JobPool";
  const text = `${who} on JobPool. Sign up with my link — get ₹${WELCOME_BONUS_INR} welcome bonus after you complete verification. I earn ₹${REFERRAL_MILESTONE_REWARD_INR} for every ${REFERRAL_MILESTONE_VERIFIED_COUNT} friends who verify.\n\n${link}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export async function copyReferralLink(code: string): Promise<boolean> {
  const link = buildReferralLink(code);
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
      return true;
    }
  } catch {
    /* fallback below */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = link;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

export async function copyReferralCode(code: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(code);
      return true;
    }
  } catch {
    /* fallback */
  }
  return false;
}
