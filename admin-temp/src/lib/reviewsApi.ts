import axiosInstance from "@/lib/axiosInstance";
import type { Review } from "@/types/review";

export async function fetchReviews(search?: string): Promise<{ reviews: Review[]; total: number }> {
  const { data } = await axiosInstance.get("admin-user-reviews/", {
    params: { limit: 200, offset: 0, ...(search ? { search } : {}) },
  });
  if (data.status_code !== 200) throw new Error(data.message || "Failed to load reviews");
  const payload = data.data as { reviews?: Review[]; total?: number } | undefined;
  return {
    reviews: Array.isArray(payload?.reviews) ? payload.reviews : [],
    total: typeof payload?.total === "number" ? payload.total : 0,
  };
}

export async function createReview(body: {
  user_id: string;
  reviewer_id: string;
  job_ref_id: string;
  rating: number;
  comment?: string;
}): Promise<Review> {
  const { data } = await axiosInstance.post("admin-user-review/", body);
  if (data.status_code !== 201) throw new Error(data.message || "Failed to create review");
  return data.data as Review;
}

export async function updateReview(body: {
  reviewee_user_id: string;
  reviewer_id: string;
  job_ref_id: string;
  rating?: number;
  comment?: string;
}): Promise<Review> {
  const { data } = await axiosInstance.put("admin-user-review/", body);
  if (data.status_code !== 200) throw new Error(data.message || "Failed to update review");
  return data.data as Review;
}

export async function deleteReview(body: {
  reviewee_user_id: string;
  reviewer_id: string;
  job_ref_id: string;
}): Promise<void> {
  const { data } = await axiosInstance.delete("admin-user-review/", { data: body });
  if (data.status_code !== 200) throw new Error(data.message || "Failed to delete review");
}
