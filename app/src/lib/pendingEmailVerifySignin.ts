/** Session flag: user left signup success and should see verify-email strip on /signin. */
export const PENDING_EMAIL_VERIFY_SESSION_KEY = "jobpool_pending_email_verify";

export function setPendingEmailVerifyFromSignupClient(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(PENDING_EMAIL_VERIFY_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearPendingEmailVerifyFromSignupClient(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PENDING_EMAIL_VERIFY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function readPendingEmailVerifyFromSignupClient(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(PENDING_EMAIL_VERIFY_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}
