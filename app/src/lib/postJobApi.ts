/** True when POST /post-a-job/ created a job (handles numeric/string status_code and HTTP 201). */
export function isPostJobCreated(response: {
  status?: number;
  data?: unknown;
}): boolean {
  const http = response.status ?? 0;
  if (http === 201) return true;

  const data = response.data;
  if (data == null || typeof data !== "object") return false;

  const root = data as Record<string, unknown>;
  const sc = root.status_code;
  if (Number(sc) === 201 || sc === "201") return true;

  const inner = root.data;
  if (inner != null && typeof inner === "object") {
    const payload = inner as Record<string, unknown>;
    if (payload.job_id != null && String(payload.job_id).trim() !== "") {
      if (Number(sc) === 200 || sc === "200" || sc == null) return true;
    }
  }

  return false;
}
