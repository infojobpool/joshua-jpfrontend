/** Wallet / ₹100 bonus eligibility — aligned with backend deploy 931ba9a (6 fields, no bank/address/photo). */

export const PAYOUT_SETUP_TOTAL_STEPS = 6;

export type PayoutEligibilityItem = { id: string; label: string; href: string };

export const MISSING_REQUIREMENT_LABELS: Record<string, string> = {
  email: "Verify your email",
  full_name: "Add your full name",
  mobile: "Add mobile number on profile",
  pan: "Complete PAN verification",
  aadhaar: "Complete Aadhaar verification",
  upi: "Add UPI ID",
};

export function missingRequirementHref(key: string): string {
  const k = key.toLowerCase().trim();
  if (k === "email" || k === "full_name" || k === "mobile") return "/profile";
  if (k === "pan" || k === "aadhaar") return "/verification";
  if (k === "upi") return "/wallet#wallet-upi";
  return "/wallet";
}

export function mapMissingRequirementsToItems(missing: string[]): PayoutEligibilityItem[] {
  const seen = new Set<string>();
  const items: PayoutEligibilityItem[] = [];
  for (const raw of missing) {
    const key = String(raw).toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    const label = MISSING_REQUIREMENT_LABELS[key];
    if (!label) continue;
    seen.add(key);
    items.push({ id: key, label, href: missingRequirementHref(key) });
  }
  return items;
}

export type WalletEligibilityPayload = {
  is_withdraw_eligible?: boolean;
  missing_requirements?: string[];
  upi_vpa?: string | null;
  balance?: number;
};

export type ProfileEligibilityHints = {
  verificationLevel?: number;
  fullName?: string;
  phoneNumber?: string;
  upiVpa?: string;
  /** When omitted, email is not guessed client-side — rely on API missing_requirements. */
  emailVerified?: boolean;
};

/** Used for poster avatars — not part of wallet eligibility. */
export function hasRealProfilePhotoUrl(url: string | undefined | null): boolean {
  if (!url || !String(url).trim()) return false;
  const lower = String(url).toLowerCase();
  if (lower.includes("placeholder")) return false;
  return true;
}

function countPhoneDigits(phone?: string): number {
  if (!phone) return 0;
  return phone.replace(/\D/g, "").length;
}

export function profileHintsFromApiPayload(payload: Record<string, unknown> | null | undefined): ProfileEligibilityHints {
  if (!payload) return {};
  const rawV = payload.verification_status ?? payload.verificationStatus;
  let verificationLevel = 0;
  if (rawV !== null && rawV !== undefined) {
    const n = typeof rawV === "string" ? parseInt(rawV, 10) : Number(rawV);
    if (!isNaN(n)) verificationLevel = n;
  }
  const fullName = String(
    payload.user_fullname ?? payload.name ?? payload.full_name ?? ""
  ).trim();
  const phoneNumber = String(payload.phone_number ?? payload.phone ?? "").trim();
  const upiVpa = String(payload.upi_vpa ?? "").trim();
  const emailVerified =
    payload.email_verified === true || payload.emailVerified === true
      ? true
      : payload.email_verified === false || payload.emailVerified === false
        ? false
        : undefined;
  return {
    verificationLevel,
    fullName,
    phoneNumber,
    upiVpa: upiVpa || undefined,
    emailVerified,
  };
}

/** Client-side fallback when GET /wallet omits missing_requirements. */
export function computeMissingFromProfile(input: ProfileEligibilityHints): string[] {
  const missing: string[] = [];
  if (input.emailVerified === false) missing.push("email");
  const name = (input.fullName || "").trim();
  if (name.length < 2) missing.push("full_name");
  if (countPhoneDigits(input.phoneNumber) < 10) missing.push("mobile");
  const v = input.verificationLevel ?? 0;
  if (v < 1) missing.push("pan");
  else if (v < 2) missing.push("aadhaar");
  if (!(input.upiVpa || "").trim()) missing.push("upi");
  return missing;
}

export function resolvePayoutEligibility(
  wallet?: WalletEligibilityPayload | null,
  profile?: ProfileEligibilityHints | null
): { missing: PayoutEligibilityItem[]; isEligible: boolean } {
  const apiMissing = wallet?.missing_requirements;
  if (Array.isArray(apiMissing)) {
    const missing = mapMissingRequirementsToItems(apiMissing);
    const isEligible =
      wallet?.is_withdraw_eligible === true ||
      (wallet?.is_withdraw_eligible !== false && missing.length === 0);
    return { missing, isEligible };
  }

  const upiFromWallet = wallet?.upi_vpa != null ? String(wallet.upi_vpa).trim() : "";
  const keys = computeMissingFromProfile({
    verificationLevel: profile?.verificationLevel ?? 0,
    fullName: profile?.fullName,
    phoneNumber: profile?.phoneNumber,
    upiVpa: profile?.upiVpa || upiFromWallet || undefined,
    emailVerified: profile?.emailVerified,
  });
  const missing = mapMissingRequirementsToItems(keys);
  return { missing, isEligible: missing.length === 0 };
}

export function getPayoutEligibilityStats(
  wallet?: WalletEligibilityPayload | null,
  profile?: ProfileEligibilityHints | null
) {
  const { missing, isEligible } = resolvePayoutEligibility(wallet, profile);
  const stats = getPayoutCompletionStats(missing.length);
  return { ...stats, missing, isEligible };
}

/** @deprecated Prefer resolvePayoutEligibility with wallet API response. */
export function getMissingPayoutEligibilityItems(input: {
  verificationLevel: number;
  upiVpa?: string;
  fullName?: string;
  phoneNumber?: string;
  emailVerified?: boolean;
  apiMissingRequirements?: string[];
}): PayoutEligibilityItem[] {
  if (Array.isArray(input.apiMissingRequirements)) {
    return mapMissingRequirementsToItems(input.apiMissingRequirements);
  }
  return mapMissingRequirementsToItems(
    computeMissingFromProfile({
      verificationLevel: input.verificationLevel,
      fullName: input.fullName,
      phoneNumber: input.phoneNumber,
      upiVpa: input.upiVpa,
      emailVerified: input.emailVerified,
    })
  );
}

export function getPayoutCompletionStats(missingCount: number) {
  const total = PAYOUT_SETUP_TOTAL_STEPS;
  const completed = Math.max(0, Math.min(total, total - missingCount));
  const percent = Math.min(100, Math.round((completed / total) * 100));
  return { total, completed, percent, remaining: missingCount };
}
