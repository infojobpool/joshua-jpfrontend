const DEFAULT_API_BASE = "https://api.jobpool.in/api/v1";

/** Ensures admin calls hit the FastAPI host, not the Vercel admin origin (which 404s on /admin-login/). */
function normalizeApiBase(): string {
  let raw =
    (typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) ||
    DEFAULT_API_BASE;
  raw = raw.replace(/\/+$/, "");

  if (
    raw.startsWith("/") ||
    (!raw.startsWith("http://") && !raw.startsWith("https://"))
  ) {
    return DEFAULT_API_BASE;
  }

  try {
    const u = new URL(raw);
    if (
      typeof window !== "undefined" &&
      window.location.hostname === "admin.jobpool.in" &&
      u.hostname.includes("onrender.com")
    ) {
      return DEFAULT_API_BASE;
    }
    const segments = u.pathname
      .replace(/^\/|\/$/g, "")
      .split("/")
      .filter(Boolean);
    const hasApiVersion =
      segments[0] === "api" && segments[1] != null && /^v\d+$/.test(segments[1]);
    if (!hasApiVersion) {
      if (segments.length === 0) {
        u.pathname = "/api/v1";
        return u.toString().replace(/\/+$/, "");
      }
      if (segments.length === 1 && segments[0] === "api") {
        u.pathname = "/api/v1";
        return u.toString().replace(/\/+$/, "");
      }
    }
  } catch {
    return DEFAULT_API_BASE;
  }

  return raw;
}

/** Must match the backend that serves /api/v1 (set NEXT_PUBLIC_API_BASE_URL in Vercel / .env) */
export const API_BASE = normalizeApiBase();
