export interface Image {
    id: string;
    url: string;
    alt: string;
  }

  /** Short quote shown on task page under poster stats (from GET /profile reviews). */
  export interface PosterReviewSnippet {
    id: string;
    rating: number;
    comment: string;
    reviewerName: string;
    jobTitle?: string;
  }
  
  export interface User {
    avatar: string;
    id: string; // Strictly string, as expected in OffersSection, TaskInfo, PosterInfo
    name: string;
    rating?: number | null; 
    taskCount?: number | null;
    joinedDate: string | null;
    email?: string;
    accountType?: string;
    isLoggedIn?: boolean;
    /** Average from reviews where user was taskmaster/poster */
    taskmasterAverageRating?: number | null;
    taskmasterReviewCount?: number | null;
    /** Last 1–2 reviews as poster (after /profile load); empty array = loaded, none */
    recentPosterReviews?: PosterReviewSnippet[];
  }
  
  export interface Offer {
    id: string;
    tasker: User;
    amount: number;
    message: string;
    createdAt: string;
  }
  
  export interface Task {
    id: string;
    title: string;
    description: string;
    budget: number;
    location: string;
    status: string;
    job_completion_status: number;
    // New flags from backend so we can track who has confirmed completion
    tasker_completed?: boolean;
    taskmaster_completed?: boolean;
    postedAt: string;
    postedAtISO?: string;
    dueDate: string;
    category: string;
    images: Image[];
    poster: User;
    offers: Offer[];
    assignedTasker?: User;
    progressLabel?: string;
    latitude?: number;
    longitude?: number;
    /** Edit form: API due_date_flexible */
    dueDateFlexible?: boolean;
    /** yyyy-mm-dd for date input when not flexible */
    jobDueDateIso?: string | null;
    /** API job_category id when known */
    jobCategoryId?: string | null;
    /** When task used a custom category label */
    customCategoryName?: string | null;
  }
  
  export interface Bid {
    job_id: string;
    bidder_id: string;
    bid_description: string;
    bid_amount: number;
    bidder_name?: string;
  }
  
  export interface ApiBidResponse {
    status_code: number;
    message: string;
    timestamp: string;
    data: Bid[];
  }
  
  export interface ApiJobResponse {
    status_code: number;
    message: string;
    data: {
      job_id: string;
      posted_by: string;
      job_title: string;
      job_description: string;
      job_category_name: string;
      job_budget: number;
      job_location: string;
      job_due_date: string;
      job_images: { urls: string[] };
      status: boolean;
      job_completion_status: number;
      user_ref_id: string;
      timestamp: string;
    };
  }


  