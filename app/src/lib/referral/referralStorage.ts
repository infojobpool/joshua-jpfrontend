import {
  REFERRAL_STORAGE_KEY,
  REFERRAL_STORAGE_TS_KEY,
  REFERRAL_TTL_MS,
  REFEREE_BANNER_DISMISSED_KEY,
  REFEREE_PENDING_KEY,
  REFERRAL_PROMO_DISMISSED_KEY,
} from "./constants";

function normalizeReferralCode(raw: string | null | undefined): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

export function isValidReferralCode(code: string): boolean {
  return normalizeReferralCode(code).length >= 4;
}

export function storeReferralCode(raw: string): string | null {
  const code = normalizeReferralCode(raw);
  if (!isValidReferralCode(code)) return null;
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, code);
    localStorage.setItem(REFERRAL_STORAGE_TS_KEY, String(Date.now()));
  } catch {
    /* ignore quota / private mode */
  }
  return code;
}

export function getStoredReferralCode(): string | null {
  try {
    const code = localStorage.getItem(REFERRAL_STORAGE_KEY);
    const ts = localStorage.getItem(REFERRAL_STORAGE_TS_KEY);
    if (!code || !ts) return null;
    const age = Date.now() - Number(ts);
    if (!Number.isFinite(age) || age > REFERRAL_TTL_MS) {
      clearStoredReferralCode();
      return null;
    }
    return normalizeReferralCode(code);
  } catch {
    return null;
  }
}

export function clearStoredReferralCode(): void {
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    localStorage.removeItem(REFERRAL_STORAGE_TS_KEY);
  } catch {
    /* ignore */
  }
}

/** Read ?ref= or ?referral= from the current URL and persist it. */
export function captureReferralFromSearchParams(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const raw = params.get("ref") ?? params.get("referral") ?? params.get("invite");
  if (!raw) return null;
  return storeReferralCode(raw);
}

export type RefereePendingRecord = {
  code: string;
  marked_at: number;
};

export function markRefereeBonusPending(code: string): void {
  const normalized = normalizeReferralCode(code);
  if (!isValidReferralCode(normalized)) return;
  try {
    const record: RefereePendingRecord = { code: normalized, marked_at: Date.now() };
    localStorage.setItem(REFEREE_PENDING_KEY, JSON.stringify(record));
    localStorage.removeItem(REFEREE_BANNER_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

export function getRefereeBonusPending(): RefereePendingRecord | null {
  try {
    const raw = localStorage.getItem(REFEREE_PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RefereePendingRecord;
    if (!parsed?.code || !isValidReferralCode(parsed.code)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearRefereeBonusPending(): void {
  try {
    localStorage.removeItem(REFEREE_PENDING_KEY);
    localStorage.removeItem(REFEREE_BANNER_DISMISSED_KEY);
  } catch {
    /* ignore */
  }
}

export function isRefereeBannerDismissed(): boolean {
  try {
    return localStorage.getItem(REFEREE_BANNER_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissRefereeBanner(): void {
  try {
    localStorage.setItem(REFEREE_BANNER_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function isReferralPromoDismissed(): boolean {
  try {
    return localStorage.getItem(REFERRAL_PROMO_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissReferralPromo(): void {
  try {
    localStorage.setItem(REFERRAL_PROMO_DISMISSED_KEY, "1");
  } catch {
    /* ignore */
  }
}
