/**
 * POST path for admin auth, under `NEXT_PUBLIC_API_BASE_URL` (must include /api/v1 in that base).
 *
 * Default `admin-login/` matches this repo’s historical frontend. If production returns **404**,
 * your backend likely uses a different route — set **`NEXT_PUBLIC_ADMIN_LOGIN_PATH`** on Vercel
 * (admin project) to the path your API actually exposes (e.g. `admin/login/` or `auth/admin-login/`),
 * then redeploy. No leading slash required.
 */
export function adminLoginPostPath(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ADMIN_LOGIN_PATH?.trim()) || "";
  if (raw) {
    const p = raw.replace(/^\//, "");
    return p.endsWith("/") ? p : `${p}/`;
  }
  return "admin-login/";
}
