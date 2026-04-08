/**
 * FastAPI-style errors: { "detail": "..." } or validation array.
 * Prefer over `message` when present.
 */
export function getApiErrorMessage(err: unknown): string {
  const e = err as { response?: { data?: Record<string, unknown> } };
  const d = e?.response?.data;
  if (!d || typeof d !== "object") return "Request failed";

  const detail = d.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((x: unknown) => {
        if (typeof x === "string") return x;
        if (x && typeof x === "object" && "msg" in x) return String((x as { msg?: string }).msg ?? "");
        return "";
      })
      .filter(Boolean)
      .join(" ");
  }
  if (typeof d.message === "string") return d.message;
  return "Request failed";
}

type AxiosLikeError = {
  response?: { status?: number; data?: Record<string, unknown> };
  config?: { baseURL?: string; url?: string; method?: string };
  message?: string;
};

/**
 * User-facing message plus HTTP status and request URL when available.
 * Use for admin pages when debugging 404 (wrong NEXT_PUBLIC_API_BASE_URL or undeployed routes).
 */
export function formatAxiosApiError(err: unknown): string {
  const base = getApiErrorMessage(err);
  const e = err as AxiosLikeError;
  const status = e?.response?.status;
  const cfg = e?.config;
  const fullUrl =
    cfg && (cfg.baseURL || cfg.url)
      ? `${String(cfg.baseURL || "").replace(/\/+$/, "")}/${String(cfg.url || "").replace(/^\/+/, "")}`
      : "";

  let out = base;
  if (status != null) out += ` (HTTP ${status})`;
  if (status === 404) {
    if (fullUrl) out += `. URL: ${fullUrl}`;
    out +=
      ". Set admin Vercel env NEXT_PUBLIC_API_BASE_URL to your API root including /api/v1 (e.g. https://api.jobpool.in/api/v1) and redeploy.";
  }
  if (!e?.response && typeof e?.message === "string" && e.message) {
    if (!out || out === "Request failed") out = e.message;
  }
  return out;
}
