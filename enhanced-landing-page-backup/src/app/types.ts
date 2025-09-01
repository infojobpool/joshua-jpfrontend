export interface Image {
    id: string;
    url: string;
    alt: string;
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
    status: boolean;
    job_completion_status: number;
    postedAt: string;
    dueDate: string;
    category: string;
    images: Image[];
    poster: User;
    offers: Offer[];
    assignedTasker?: User;
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


  