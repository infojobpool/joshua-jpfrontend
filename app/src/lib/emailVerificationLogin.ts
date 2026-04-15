/** Heuristic: API/login copy likely means “verify email before sign-in”. */
export function messageSuggestsEmailVerification(message: string | undefined | null): boolean {
  const m = (message || "").toLowerCase();
  if (!m) return false;
  return (
    m.includes("verify") ||
    m.includes("verification") ||
    m.includes("not verified") ||
    m.includes("unverified") ||
    m.includes("confirm your email") ||
    m.includes("email confirmation") ||
    m.includes("activate your account") ||
    (m.includes("email") && (m.includes("not been") || m.includes("not verified") || m.includes("pending")))
  );
}
