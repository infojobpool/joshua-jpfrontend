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
