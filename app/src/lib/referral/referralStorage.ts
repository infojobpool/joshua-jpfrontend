import {
  REFERRAL_STORAGE_KEY,
  REFERRAL_STORAGE_TS_KEY,
  REFERRAL_TTL_MS,
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
