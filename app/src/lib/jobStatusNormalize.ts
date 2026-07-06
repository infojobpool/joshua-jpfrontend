/**
 * Backend sometimes returns booleans, sometimes strings/numbers ("false", "0", 1).
 * Plain `!job.cancel_status` is wrong when cancel_status === "false" (non-empty string is truthy).
 */

export function isCoercedTruthy(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v === null || v === undefined) return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "" || s === "false" || s === "0" || s === "no" || s === "null" || s === "undefined") return false;
    if (s === "true" || s === "yes" || s === "1") return true;
  }
  return Boolean(v);
}

export function isJobCompletedFlag(job: Record<string, unknown>): boolean {
  const jc = job.job_completion_status;
  if (jc === 1 || jc === "1") return true;
  if (typeof jc === "string" && jc.trim().toLowerCase() === "completed") return true;
  return false;
}

/** True if job should be excluded from “open / available” lists. */
export function isJobDeletedOrCancelled(job: Record<string, unknown>): boolean {
  if (isCoercedTruthy(job.deletion_status)) return true;
  if (isCoercedTruthy(job.deleted)) return true;
  if (isCoercedTruthy(job.cancel_status)) return true;
  if (isCoercedTruthy(job.cancelled)) return true;
  if (isCoercedTruthy(job.is_cancelled)) return true;
  if (isCoercedTruthy(job.is_canceled)) return true;

  const cancelledBy = job.cancelled_by_role ?? job.cancelled_by;
  if (cancelledBy != null && String(cancelledBy).trim() !== "") return true;

  const reason = job.cancellation_reason ?? job.cancellationReason;
  if (reason != null && String(reason).trim() !== "") return true;

  const cancelledAt = job.cancelled_at ?? job.cancelledAt;
  if (cancelledAt != null && String(cancelledAt).trim() !== "") return true;

  for (const key of ["status", "job_status", "listing_status"] as const) {
    const st = String(job[key] ?? "")
      .toLowerCase()
      .trim();
    if (!st) continue;
    if (
      st.includes("deleted") ||
      st.includes("cancel") ||
      st === "canceled"
    ) {
      return true;
    }
  }

  return false;
}

export function isOpenForAvailableList(job: Record<string, unknown>, currentUserId: string): boolean {
  const poster = String(job.user_ref_id ?? job.posted_by_id ?? job.user_id ?? "").trim();
  const me = String(currentUserId ?? "").trim();
  if (poster && me && poster === me) return false;
  if (isJobCompletedFlag(job)) return false;
  if (isJobDeletedOrCancelled(job)) return false;
  return true;
}
