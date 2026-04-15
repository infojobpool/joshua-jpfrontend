/** Shared rules for “payout / withdrawal readiness” (Wallet + Dashboard). */

export const PAYOUT_SETUP_TOTAL_STEPS = 6;

export type PayoutEligibilityItem = { id: string; label: string; href: string };

export function hasRealProfilePhotoUrl(url: string | undefined | null): boolean {
  if (!url || !String(url).trim()) return false;
  const lower = String(url).toLowerCase();
  if (lower.includes("placeholder")) return false;
  return true;
}

export function getMissingPayoutEligibilityItems(input: {
  verificationLevel: number;
  hasProfilePhoto: boolean;
  hasAddressOnProfile: boolean;
  upiVpa: string | undefined;
}): PayoutEligibilityItem[] {
  const items: PayoutEligibilityItem[] = [];
  const v = input.verificationLevel;
  if (v < 1) items.push({ id: "pan", label: "Verify PAN card", href: "/verification" });
  else if (v < 2) items.push({ id: "aadhaar", label: "Verify Aadhaar (UID)", href: "/verification" });
  else if (v < 3)
    items.push({ id: "bank", label: "Add bank account details", href: "/bankverification" });
  if (!input.hasProfilePhoto) {
    items.push({ id: "photo", label: "Add a profile photo", href: "/profile" });
  }
  if (!input.hasAddressOnProfile) {
    items.push({ id: "address", label: "Add your address in profile", href: "/profile" });
  }
  if (!input.upiVpa?.trim()) {
    items.push({ id: "upi", label: "Add UPI ID for withdrawals", href: "/wallet#wallet-upi" });
  }
  return items;
}

export function getPayoutCompletionStats(missingCount: number) {
  const total = PAYOUT_SETUP_TOTAL_STEPS;
  const completed = Math.max(0, Math.min(total, total - missingCount));
  const percent = Math.min(100, Math.round((completed / total) * 100));
  return { total, completed, percent, remaining: missingCount };
}
