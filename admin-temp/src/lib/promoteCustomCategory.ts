import axiosInstance from "@/lib/axiosInstance";

export type PromoteCategoryResult = {
  category_name: string;
  category_id?: string;
  created?: boolean;
  offering_updated?: boolean;
  job_updated?: boolean;
};

function parsePromoteResponse(response: {
  data?: Record<string, unknown>;
  status?: number;
}): PromoteCategoryResult {
  const root = response.data ?? {};
  const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<
    string,
    unknown
  >;
  return {
    category_name: String(data.category_name ?? "Category"),
    category_id: data.category_id != null ? String(data.category_id) : undefined,
    created: Boolean(data.created),
    offering_updated: Boolean(data.offering_updated),
    job_updated: Boolean(data.job_updated),
  };
}

function isPromoteSuccess(response: { data?: Record<string, unknown>; status?: number }): boolean {
  const sc = response.data?.status_code;
  if (sc != null) return Number(sc) === 200;
  return response.status === 200;
}

/** Promote a task's custom_category_name to an official category (existing admin Tasks flow). */
export async function promoteTaskCustomCategory(taskId: string): Promise<PromoteCategoryResult> {
  const response = await axiosInstance.post(
    `/promote-custom-category/${taskId}/?update_job=true`,
  );
  if (!isPromoteSuccess(response)) {
    throw new Error(String(response.data?.message ?? "Failed to promote category"));
  }
  return parsePromoteResponse(response);
}

/**
 * Promote a listing's custom_category_name to an official category.
 * Tries offering-specific backend routes first (mirror of task promote).
 */
export async function promoteOfferingCustomCategory(
  offeringId: string,
): Promise<PromoteCategoryResult> {
  const attempts = [
    `/promote-custom-category/${offeringId}/?update_offering=true`,
    `admin/offerings/${offeringId}/promote-category/`,
  ];

  let lastError: unknown = null;
  for (const path of attempts) {
    try {
      const response = await axiosInstance.post(path);
      if (isPromoteSuccess(response)) {
        return parsePromoteResponse(response);
      }
      lastError = new Error(String(response.data?.message ?? "Failed to promote category"));
    } catch (error: unknown) {
      lastError = error;
      const st = (error as { response?: { status?: number } })?.response?.status;
      if (st === 404 || st === 405) continue;
      const msg =
        (error as { response?: { data?: { message?: string; detail?: string } } })?.response?.data
          ?.message ??
        (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      if (typeof msg === "string" && /not found|invalid|job/i.test(msg) && attempts.indexOf(path) < attempts.length - 1) {
        continue;
      }
      throw error;
    }
  }

  const msg =
    (lastError as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    (lastError instanceof Error ? lastError.message : null) ??
    "Failed to promote category for this listing";
  throw new Error(msg);
}
