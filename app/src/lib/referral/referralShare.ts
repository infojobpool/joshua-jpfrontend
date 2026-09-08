import { absoluteUrl } from "@/lib/seo/site";
import {
  DEFAULT_REFEREE_REWARD_INR,
  DEFAULT_REFERRER_REWARD_INR,
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
  const text = `${who} to get tasks done or earn as a tasker. Sign up with my link and we both get up to ₹${DEFAULT_REFERRER_REWARD_INR + DEFAULT_REFEREE_REWARD_INR} in wallet credits after your first completed task.\n\n${link}`;
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
