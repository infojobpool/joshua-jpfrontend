export interface Review {
  review_id: string;
  reviewee_user_id: string;
  reviewee_name: string;
  reviewee_email: string;
  reviewer_id: string;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  job_ref_id: string;
  job_title: string | null;
  rating: number | null;
  comment: string;
  timestamp: string | null;
  role: string | null;
}
