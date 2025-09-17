"use client";

import { MobileDashboard } from "../../components/mobile/MobileDashboard";
import { useIsMobile } from "../../components/mobile/MobileWrapper";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { 
  Clock, 
  MapPin, 
  IndianRupee, 
  Briefcase, 
  Star, 
  CheckCircle, 
  Search, 
  Filter, 
  Trash2, 
  X,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Bell
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import useStore from "@/lib/Zustand";

interface Image {
  id: string;
  url: string;
  alt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  status: string;
  postedAt: string;
  dueDate?: string;
  completedDate?: string;
  rating?: number;
  offers: number;
  posted_by: string;
  category: string;
  job_completion_status?: string;
  deletion_status: boolean;
  cancel_status: boolean;
  images?: Image[];
}

interface Bid {
  id: string;
  task_id: string;
  task_title: string;
  bid_amount: number;
  status: string;
  created_at: string;
  task_location: string;
  task_description: string;
  posted_by: string;
}

interface BidRequest {
  bid_id: string;
  task_id: string;
  task_title: string;
  bid_amount: number;
  bid_description: string;
  status: string;
  created_at: string;
  task_location: string;
  task_description: string;
  posted_by: string;
  job_due_date: string;
  job_budget: number;
  job_category: string;
  category_name: string;
  images?: Image[];
  task_cancelled?: boolean;
  task_deleted?: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface APIResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

export default function Dashboard() {
  const router = useRouter();
  const { user, userId, isAuthenticated, logout } = useStore();
  const { isMobile } = useIsMobile();
  // Prevent SSR → CSR flicker on mobile by delaying mobile-only UI until mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const mobile = mounted && isMobile;
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1";
  
  // Debug authentication state
  console.log("🔍 Dashboard render - Auth state:", {
    isAuthenticated,
    user: user ? { id: user.id, name: user.name } : null,
    userId,
    userType: typeof user,
    userIdType: typeof userId
  });
  
  // Debug useEffect dependencies
  console.log("🔍 useEffect dependencies - user:", !!user, "userId:", !!userId);
  console.log("🔍 User object details:", user);
  console.log("🔍 UserId details:", userId);
  const [loading, setLoading] = useState(true);
  
  // Task states
  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [completedTasksLoading, setCompletedTasksLoading] = useState<boolean>(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [requestedTasks, setRequestedTasks] = useState<BidRequest[]>([]);
  // Local filter for My Tasks summary chips
  const [myTasksFilter, setMyTasksFilter] = useState<"all" | "in_progress" | "open" | "completed">("all");
  // Store task orders to check payment status
  const [taskOrders, setTaskOrders] = useState<any[]>([]);
  
  // Fetch task orders to check payment status
  const fetchTaskOrders = async () => {
    try {
      // Use fetch API directly to bypass axios timeout issues
      const token = localStorage.getItem('token');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const fetchResponse = await fetch(`${API_BASE}/get-all-task-orders/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!fetchResponse.ok) {
        console.warn("Fetch task orders failed with status:", fetchResponse.status);
        return;
      }

      const response = await fetchResponse.json();
      if (response.status_code === 200 && response.data?.task_orders) {
        setTaskOrders(response.data.task_orders);
        console.log("📋 Task orders fetched:", response.data.task_orders);
        console.log("📋 Total orders:", response.data.task_orders.length);
        console.log("📋 Sample order structure:", response.data.task_orders[0]);
        console.log("📋 All order statuses:", response.data.task_orders.map((order: any) => ({
          order_id: order.order_id,
          job_id: order.job_id,
          status: order.status,
          tasker_id: order.tasker_id,
          poster_id: order.taskmanager_id
        })));
      }
    } catch (error) {
      // Handle AbortError separately (don't show error for timeouts)
      if ((error as any)?.name === 'AbortError') {
        console.log("⏰ Fetch task orders was aborted (timeout)");
        return;
      }
      console.error("Failed to fetch task orders:", error);
    }
  };
  
  // Summary counts for "My Tasks"
  const myTasksSummary = (() => {
    const inProgress = postedTasks.filter(
      (t) => t.status === "in_progress" && !t.deletion_status && !t.cancel_status
    ).length;
    const open = postedTasks.filter(
      (t) => t.status === "open" && !t.deletion_status && !t.cancel_status
    ).length;
    const completedCount = postedTasks.filter((t) => t.status === "completed").length;
    
    return { inProgress, open, completed: completedCount };
  })();
  
  // Filter states
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  // Mobile-only extra filter UI state
  const [sortBy, setSortBy] = useState<string>("newest");
  const [onlyOpen, setOnlyOpen] = useState<boolean>(true);
  const [withImages, setWithImages] = useState<boolean>(false);

  // Inline filters: do not lock body scroll to avoid touch blocking on mobile
  
  // Dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [requestUndeleteOpen, setRequestUndeleteOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  // Assigned-to-me cancel dialog
  const [assignedCancelOpen, setAssignedCancelOpen] = useState(false);
  const [selectedAssignedId, setSelectedAssignedId] = useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = useState("");
  const [activeTab, setActiveTab] = useState<string>("available");


  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownOpen) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [profileDropdownOpen]);

  useEffect(() => {
    // Hydrate from session to reduce flicker on tab switches
    try {
      const a = sessionStorage.getItem("assignedTasks");
      if (a) setAssignedTasks(JSON.parse(a));
    } catch {}
    try {
      const p = sessionStorage.getItem("postedTasks");
      if (p) setPostedTasks(JSON.parse(p));
    } catch {}
    try {
      const r = sessionStorage.getItem("requestedTasks");
      if (r) setRequestedTasks(JSON.parse(r));
    } catch {}
  }, []);

  // Ensure categories are loaded when the inline mobile filters are opened
  useEffect(() => {
    const loadCats = async () => {
      try {
        setCategoriesLoading(true);
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const res = await fetch(`${API_BASE}/get-all-categories/`, {
          method: 'GET',
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          if (json?.status_code === 200 && Array.isArray(json?.data?.categories)) {
            setCategories(json.data.categories);
          }
        }
      } catch (_) {
        // silent
      } finally {
        setCategoriesLoading(false);
      }
    };
    if (isMobile && showFilters && categories.length === 0 && !categoriesLoading) {
      loadCats();
    }
  }, [showFilters, isMobile, categories.length, categoriesLoading, API_BASE]);

  // Ensure flags for session-hydrated bids (runs once post-hydration)
  useEffect(() => {
    const needsEnrichment = requestedTasks.some(
      (b) => b.task_cancelled === undefined || b.task_deleted === undefined
    );
    if (!needsEnrichment || requestedTasks.length === 0) return;
    const enrich = async () => {
      try {
        const results = await Promise.allSettled(
          requestedTasks.map(async (b) => {
            const r = await axiosInstance.get(`/get-job/${b.task_id}/`);
            const job = r.data?.data?.job || r.data?.job || {};
            const isCancelled = job?.status === true || job?.cancel_status === true || job?.status === "Cancelled" || job?.status === "cancelled";
            const isDeleted = job?.deletion_status === true || job?.deletion_status === 1 || job?.status === "Deleted" || job?.status === "deleted";
            return { task_id: b.task_id, cancelled: !!isCancelled, deleted: !!isDeleted };
          })
        );
        const cancelMap: Record<string, boolean> = {};
        const deleteMap: Record<string, boolean> = {};
        for (const res of results) {
          if (res.status === "fulfilled") {
            cancelMap[res.value.task_id] = res.value.cancelled;
            deleteMap[res.value.task_id] = res.value.deleted;
          }
        }
        const updated = requestedTasks.map((b) => ({
          ...b,
          task_cancelled: cancelMap[b.task_id] ?? b.task_cancelled ?? false,
          task_deleted: deleteMap[b.task_id] ?? b.task_deleted ?? false,
        }));
        setRequestedTasks(updated);
        try { sessionStorage.setItem("requestedTasks", JSON.stringify(updated)); } catch {}
      } catch {}
    };
    enrich();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedTasks.length]);

  useEffect(() => {
    console.log("🔍 Auth check useEffect - isAuthenticated:", isAuthenticated, "user:", !!user, "userId:", !!userId);
    
    if (!isAuthenticated || !user || !userId) {
        console.log("🔍 Redirecting to signin - missing auth data");
        router.push("/signin");
        return;
      }
    console.log("🔍 Auth check passed, setting loading false and fetching task orders");
    setLoading(false);
    fetchTaskOrders(); // Fetch task orders when user is authenticated
  }, [isAuthenticated, user, userId, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Use fetch API directly to bypass axios timeout issues
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const fetchResponse = await fetch(`${API_BASE}/get-all-categories/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!fetchResponse.ok) {
          console.warn("Fetch categories failed with status:", fetchResponse.status);
          return;
        }

        const result = await fetchResponse.json();
        
        if (result.status_code === 200 && result.data?.categories) {
          setCategories(result.data.categories);
        }
      } catch (error) {
        // Handle AbortError separately (don't show error for timeouts)
        if ((error as any)?.name === 'AbortError') {
          console.log("⏰ Fetch categories was aborted (timeout)");
          return;
        }
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch user's posted tasks
  useEffect(() => {
    if (!user || !userId) return;
    

    const fetchUserTasks = async () => {
      try {
        // Check cache first
        const cacheKey = `user_tasks_${userId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          const cacheAge = Date.now() - cachedData.timestamp;
          if (cacheAge < 60000) { // 1 minute cache
            console.log("Using cached user tasks");
            setPostedTasks(cachedData.tasks);
            return;
          }
        }
        
        // Use the faster get-all-jobs-admin API with better filtering
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const fetchResponse = await fetch(`${API_BASE}/get-user-jobs/${userId}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!fetchResponse.ok) {
          console.warn("Fetch user tasks failed with status:", fetchResponse.status);
          return;
        }

        const result = await fetchResponse.json();


        if (result.status_code === 200 && result.data?.jobs) {
          // Filter for tasks that belong to the current user
          const userJobs = result.data.jobs.filter((job: any) => {
            const jobUserId = job.user_ref_id || job.posted_by_id || job.user_id;
            return jobUserId === userId?.toString() || jobUserId === userId;
          });
          
          console.log(`🔍 Found ${userJobs.length} tasks for user ${userId} out of ${result.data.jobs.length} total jobs`);
          
          // First, get the basic task data
          const tasks: Task[] = userJobs.map((job: any) => {
            let jobStatus = "open";
            console.log(`🔍 MY TASKS - Processing task ${job.job_id} for user ${userId}`);
            
            // Check if this task has a paid order - use correct field name
            const hasPaidOrder = taskOrders.some(order => {
              const orderTaskId = order.job_id || order.postId || order.post_id || order.task_id;
              // Status 1 = Completed/Paid, Status 0 = Processing
              // TEMPORARY FIX: Treat status 0 as paid since backend isn't updating to status 1
              const isPaid = order.status === 1 || order.status === "1" || order.status === 0;
              const isMatching = orderTaskId === job.job_id.toString();
              
              // Only log if there's a match for debugging
              if (isMatching) {
                console.log(`🔍 Order ${order.order_id} matches task ${job.job_id}:`, {
                  orderStatus: order.status,
                  isPaid,
                  willMatch: isMatching && isPaid,
                  orderDetails: {
                    order_id: order.order_id,
                    job_id: order.job_id,
                    status: order.status,
                    tasker_id: order.tasker_id,
                    poster_id: order.taskmanager_id
                  }
                });
              }
              
              return isMatching && isPaid;
            });
            
            const matchingOrders = taskOrders.filter(order => {
              const orderTaskId = order.job_id || order.postId || order.post_id || order.task_id;
              return orderTaskId === job.job_id.toString();
            });
            
            console.log(`🔍 Task ${job.job_id} payment check:`, {
              taskId: job.job_id,
              hasPaidOrder,
              matchingOrders: matchingOrders.map(order => ({
                orderId: order.order_id || order.id,
                job_id: order.job_id,
                status: order.status,
                payment_status: order.payment_status,
                order_status: order.order_status,
                fullOrder: order // Show the complete order object
              })),
              finalStatus: hasPaidOrder ? "in_progress" : "open"
            });
            
            if (job.job_completion_status === 1) {
              jobStatus = "completed";
            } else if (job.deletion_status) {
              jobStatus = "deleted";
            } else if (job.cancel_status) {
              jobStatus = "canceled";
            } else if (job.status === "in_progress" || job.status === "working" || job.status === "assigned" || 
                      job.status === "accepted" || job.status === "paid" || job.status === "active" ||
                      job.status === true) {
              jobStatus = "in_progress";
              console.log(`✅ Task ${job.job_id} marked as in_progress due to status: ${job.status} (type: ${typeof job.status})`);
            } else if (job.bid_accepted === true || job.bid_accepted === "true" || 
                      job.offer_accepted === true || job.offer_accepted === "true" ||
                      job.payment_status === "paid" || job.payment_status === "completed" ||
                      job.payment_status === "success" || job.payment_status === true ||
                      job.payment_status === "PAID" || job.payment_status === "COMPLETED" ||
                      job.payment_status === "SUCCESS" || job.payment_status === 1 ||
                      job.payment_status === "1" || job.payment_status === "confirmed" ||
                      job.payment_status === "CONFIRMED" || job.payment_status === "processed" ||
                      job.payment_status === "PROCESSED" || job.payment_status === "settled" ||
                      job.payment_status === "SETTLED" || hasPaidOrder) {
              jobStatus = "in_progress";
              console.log(`Task ${job.job_id} marked as in_progress due to payment/acceptance`);
              console.log(`🔍 Task ${job.job_id} status details:`, {
                bid_accepted: job.bid_accepted,
                offer_accepted: job.offer_accepted,
                payment_status: job.payment_status,
                hasPaidOrder: hasPaidOrder,
                assigned_tasker_id: job.assigned_tasker_id,
                accepted_bidder_id: job.accepted_bidder_id
              });
            }
            
            // Debug logging for tasks that remain "open"
            if (jobStatus === "open" && (job.bid_accepted || job.offer_accepted || job.assigned_tasker_id || job.accepted_bidder_id)) {
              console.log(`⚠️ Task ${job.job_id} showing as "open" but has acceptance/assignment indicators:`, {
                bid_accepted: job.bid_accepted,
                offer_accepted: job.offer_accepted,
                assigned_tasker_id: job.assigned_tasker_id,
                accepted_bidder_id: job.accepted_bidder_id,
                payment_status: job.payment_status,
                status: job.status,
                hasPaidOrder: hasPaidOrder
              });
            }
            
            // All other tasks remain "open"
            

            return {
              id: job.job_id.toString(),
              title: job.job_title || "Untitled",
              description: job.job_description || "No description provided.",
              budget: Number(job.job_budget) || 0,
              location: job.job_location || "Unknown",
              status: jobStatus,
              postedAt: job.job_due_date
                ? new Date(job.job_due_date).toLocaleDateString("en-GB")
                : "Unknown",
              offers: job.offers || 0, // Use original offers field as fallback
              posted_by: job.posted_by || "Unknown",
              category: job.job_category || "general",
              job_completion_status: job.job_completion_status === 1 ? "Completed" : "Not Completed",
              deletion_status: job.deletion_status || false,
              cancel_status: job.cancel_status ?? false,
              images: job.job_images?.urls?.length
                ? job.job_images.urls.map((url: string, index: number) => ({
                    id: `img${index + 1}`,
                    url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url,
                    alt: `Job image ${index + 1}`,
                  }))
                : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
            };
          });

          setPostedTasks(tasks);
          try { sessionStorage.setItem("postedTasks", JSON.stringify(tasks)); } catch {}
          
          // Cache the user tasks
          localStorage.setItem(cacheKey, JSON.stringify({
            tasks: tasks,
            timestamp: Date.now()
          }));
        } else {
          console.warn("No jobs found or API error:", result.message);
        }
      } catch (err) {
        // Handle AbortError separately (don't show error for timeouts)
        if ((err as any)?.name === 'AbortError') {
          console.log("⏰ Fetch user tasks was aborted (timeout)");
          
          // Try to load from cache as fallback
          try {
            const cachedTasks = localStorage.getItem('postedTasks');
            if (cachedTasks) {
              const tasks = JSON.parse(cachedTasks);
              setPostedTasks(tasks);
              console.log("Loaded user tasks from cache after timeout");
            }
          } catch (cacheError) {
            console.error("Failed to load cached tasks:", cacheError);
          }
          return;
        }
        console.error("Failed to fetch user tasks:", err);
        toast.error("An error occurred while fetching your tasks.");
      } finally {
        // Clean up
      }
    };

    fetchUserTasks();
  }, [user, userId, taskOrders]);

  // Test useEffect
  useEffect(() => {
    console.log("🔍 TEST useEffect - This should always run");
  }, []);

  // Load available tasks from localStorage on mount
  useEffect(() => {
    const loadCachedTasks = () => {
      try {
        const cachedTasks = localStorage.getItem('availableTasks');
        const timestamp = localStorage.getItem('availableTasksTimestamp');
        
        if (cachedTasks && timestamp) {
          const age = Date.now() - parseInt(timestamp);
          const maxAge = 30 * 60 * 1000; // 30 minutes
          
          if (age < maxAge) {
            const tasks = JSON.parse(cachedTasks);
            console.log("🔄 Loading cached available tasks:", tasks.length);
            setAvailableTasks(tasks);
            
            // Also store in shared cache for other tabs
            const cachedData = localStorage.getItem('all_jobs_data');
            if (cachedData) {
              localStorage.setItem(`all_jobs_data_${userId}`, cachedData);
            }
            return true;
        } else {
            console.log("🔄 Cached tasks are too old, will fetch fresh");
            localStorage.removeItem('availableTasks');
            localStorage.removeItem('availableTasksTimestamp');
        }
      }
      } catch (error) {
        console.error("Error loading cached tasks:", error);
      }
      return false;
    };

    loadCachedTasks();
  }, []);

  // Fetch all available tasks
  console.log("🔍 About to register fetchAllTasks useEffect");
  useEffect(() => {
    console.log("🔍 ===== FETCH ALL TASKS useEffect TRIGGERED =====");
    console.log("🔍 useEffect triggered - user:", user, "userId:", userId);
    console.log("🔍 User type:", typeof user, "UserId type:", typeof userId);
    console.log("🔍 User keys:", user ? Object.keys(user) : "No user");
    console.log("🔍 User ID from user object:", user?.id);
    console.log("🔍 User ID from store:", userId);
    
    if (!user || !userId) {
      console.log("🔍 User or userId missing, returning early");
      console.log("🔍 user exists:", !!user, "userId exists:", !!userId);
      console.log("🔍 user.id exists:", !!user?.id);
      return;
    }

    const fetchAllTasks = async () => {
      try {
        console.log("🔍 Starting fetchAllTasks...");
        
        // Use fetch API directly to bypass axios CORS issues
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
        
        const fetchResponse = await fetch(`${API_BASE}/get-all-jobs/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!fetchResponse.ok) {
          console.warn("Fetch all tasks failed with status:", fetchResponse.status);
          
          // Try to load from cache as fallback
          try {
            const cachedTasks = localStorage.getItem('availableTasks');
            if (cachedTasks) {
              const tasks = JSON.parse(cachedTasks);
              setAvailableTasks(tasks);
              console.log("Loaded available tasks from cache after API failure");
            }
          } catch (cacheError) {
            console.error("Failed to load cached available tasks:", cacheError);
          }
          return;
        }
        
        const fetchData = await fetchResponse.json();
        const result = fetchData;


        if (result.status_code === 200 && result.data?.jobs) {
          console.log("🔍 Total jobs from API:", result.data.jobs.length);
          console.log("🔍 Current user ID:", userId);
          console.log("🔍 User from store:", user?.id);
          
          const tasks: Task[] = result.data.jobs
            .filter((job: any) => {
              // Debug: Log the full job object to see what fields are available
              
              // The API uses user_ref_id as the user identifier
              const jobPostedById = job.user_ref_id;
              const currentUserId = userId?.toString();
              
              // Use userId from store as the primary identifier
              const isNotPostedByUser = jobPostedById !== currentUserId;
              
              // Only show open tasks (not completed, deleted, or cancelled)
              const isOpen = job.job_completion_status !== 1 && 
                           !job.deletion_status && 
                           !job.cancel_status;
              
              // Debug logging for all jobs
              console.log(`🔍 Job ${job.job_id}:`, {
                jobPostedById,
                currentUserId,
                isNotPostedByUser,
                isOpen,
                job_completion_status: job.job_completion_status,
                deletion_status: job.deletion_status,
                cancel_status: job.cancel_status,
                posted_by: job.posted_by
              });
              
              // Additional debug for filtering
              if (job.job_id === "task_31" || job.job_id === "task_32") {
                console.log(`🔍 DETAILED DEBUG for ${job.job_id}:`, {
                  'job.user_ref_id': job.user_ref_id,
                  'job.posted_by_id': job.posted_by_id,
                  'job.user_id': job.user_id,
                  'userId': userId,
                  'user.id': user?.id,
                  'typeof jobPostedById': typeof jobPostedById,
                  'typeof currentUserId': typeof currentUserId,
                  'jobPostedById === currentUserId': jobPostedById === currentUserId,
                  'isNotPostedByUser': isNotPostedByUser,
                  'isOpen': isOpen,
                  'FINAL RESULT': isNotPostedByUser && isOpen
                });
              }
              
              return isNotPostedByUser && isOpen;
            })
            .map((job: any) => {
              let jobStatus = "open";
              console.log(`🔍 AVAILABLE TASKS - Processing task ${job.job_id} for available tasks`);
              
              // For available tasks, we only care about basic status
              // All available tasks should be "open" for bidding
              if (job.job_completion_status === 1) {
                jobStatus = "completed";
              } else if (job.deletion_status) {
                jobStatus = "deleted";
              } else if (job.cancel_status) {
                jobStatus = "canceled";
              }
              // All other tasks remain "open" for bidding
              

              return {
                id: job.job_id.toString(),
                title: job.job_title || "Untitled",
                description: job.job_description || "No description provided.",
                budget: Number(job.job_budget) || 0,
                location: job.job_location || "Unknown",
                status: jobStatus,
                postedAt: job.job_due_date
                  ? new Date(job.job_due_date).toLocaleDateString("en-GB")
                  : "Unknown",
                offers: job.offers || 0, // Use original offers field as fallback
                posted_by: job.posted_by || "Unknown",
                category: job.job_category || "general",
                job_completion_status: job.job_completion_status === 1 ? "Completed" : "Not Completed",
                deletion_status: job.deletion_status || false,
                cancel_status: job.cancel_status ?? false,
                images: job.job_images?.urls?.length
                  ? job.job_images.urls.map((url: string, index: number) => ({
                      id: `img${index + 1}`,
                      url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url,
                      alt: `Job image ${index + 1}`,
                    }))
                  : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
              };
            });

          // Skip bid count fetching for now to avoid API errors
          const availableTasksWithBidCounts = tasks;

          console.log("🔍 FINAL FILTERED AVAILABLE TASKS:", availableTasksWithBidCounts.length);
          console.log("🔍 Available tasks details:", availableTasksWithBidCounts);

          console.log("🔍 Available tasks after filtering:", availableTasksWithBidCounts.length);
          // Store in localStorage for persistence
          localStorage.setItem('availableTasks', JSON.stringify(availableTasksWithBidCounts));
          localStorage.setItem('availableTasksTimestamp', Date.now().toString());
          
          setAvailableTasks(availableTasksWithBidCounts);
          console.log("🔍 setAvailableTasks called with", availableTasksWithBidCounts.length, "tasks");
          
          // Store shared cache for other tabs to use
          localStorage.setItem(`all_jobs_data_${userId}`, JSON.stringify({
            jobs: result.data.jobs,
            timestamp: Date.now()
          }));
        } else {
          console.warn("No jobs found or API error:", result.message);
        }
      } catch (err) {
        // Handle AbortError separately (don't show error for timeouts)
        if ((err as any)?.name === 'AbortError') {
          console.log("⏰ Fetch all tasks was aborted (timeout)");
          return; // Don't show error toast or clear tasks
        }
        
        console.error("❌ Failed to fetch all tasks:", err);
        console.error("❌ Error details:", {
          name: (err as any)?.name,
          message: (err as any)?.message,
          stack: (err as any)?.stack,
          response: (err as any)?.response?.status,
          data: (err as any)?.response?.data
        });
        
        // Don't clear available tasks on error - keep showing existing ones
        console.log("🔄 Keeping existing available tasks due to API error");
        
        toast.error("Unable to refresh tasks. Showing cached data.");
      } finally {
        console.log("🔍 fetchAllTasks completed");
        // avoid global loader flicker
      }
    };

    fetchAllTasks();
  }, [user, userId]);

  // Fetch user's bids
  useEffect(() => {
    if (!user || !userId) return;

    const fetchBids = async () => {
      try {
        // Use fetch API directly to bypass axios timeout issues
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const fetchResponse = await fetch(`${API_BASE}/get-user-bids/${userId}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!fetchResponse.ok) {
          console.warn("Fetch bids failed with status:", fetchResponse.status);
          return;
        }

        const result = await fetchResponse.json();

        if (result.status_code === 200 && result.data?.bids) {
          const userBids: Bid[] = result.data.bids.map((bid: any) => ({
            id: bid.bid_id.toString(),
            task_id: bid.task_id.toString(),
            task_title: bid.task_title || "Untitled",
            bid_amount: Number(bid.bid_amount) || 0,
            // Normalize to 'Requested' for clarity in My Bids
            status: "Requested",
            created_at: bid.created_at
              ? new Date(bid.created_at).toLocaleDateString("en-GB")
              : "Unknown",
            task_location: bid.task_location || "Unknown",
            task_description: bid.task_description || "No description provided.",
            posted_by: bid.posted_by || "Unknown",
          }));
          setBids(userBids);
        } else {
          console.warn("No bids found or API error:", result.message);
          // Removed annoying toast notification for no bids found
        }
      } catch (err) {
        // Handle AbortError separately (don't show error for timeouts)
        if ((err as any)?.name === 'AbortError') {
          console.log("⏰ Fetch bids was aborted (timeout)");
          return;
        }
        console.error("Failed to fetch bids:", err);
      }
    };

    fetchBids();
  }, [user, userId]);

  // Fetch assigned tasks
  useEffect(() => {
    if (!user || !userId) return;

    const fetchAssignedBids = async () => {
      try {
        // Use fetch API directly to bypass axios timeout issues
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const fetchResponse = await fetch(`${API_BASE}/get-user-assigned-bids/${userId}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!fetchResponse.ok) {
          console.warn("Fetch assigned bids failed with status:", fetchResponse.status);
          return;
        }

        const result = await fetchResponse.json();

        if (result.status_code === 200 && Array.isArray(result.data?.jobs)) {
          const tasks: Task[] = result.data.jobs.map((job: any) => ({
            id: job.job_id.toString(),
            title: job.job_title || "Untitled",
            description: job.job_description || "No description provided.",
            budget: Number(job.job_budget) || 0,
            location: job.job_location || "Unknown",
            // Treat assigned jobs as in_progress in UI
            status: job.status ? "in_progress" : "open",
            postedAt: (() => {
              const raw = job.created_at || job.timestamp || job.job_due_date || job.updated_at;
              try {
                return raw ? new Date(raw).toLocaleDateString("en-GB") : "Unknown";
              } catch {
                return typeof raw === "string" && raw ? raw : "Unknown";
              }
            })(),
            dueDate: job.job_due_date
              ? new Date(job.job_due_date).toLocaleDateString("en-GB")
              : "Unknown",
            offers: job.offers?.length || 0,
            posted_by: job.posted_by || "Unknown",
            category: job.job_category || "general",
            deletion_status: job.deletion_status || false,
            cancel_status: job.cancel_status ?? false,
            images: job.job_images?.urls?.length
              ? job.job_images.urls.map((url: string, index: number) => ({
                  id: `img${index + 1}`,
                  url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url,
                  alt: `Job image ${index + 1}`,
                }))
              : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
          }));
          setAssignedTasks(tasks);
          try { sessionStorage.setItem("assignedTasks", JSON.stringify(tasks)); } catch {}
        } else {
          console.warn("No assigned tasks found or API error:", result.message);
        }
      } catch (err) {
        // Handle AbortError separately (don't show error for timeouts)
        if ((err as any)?.name === 'AbortError') {
          console.log("⏰ Fetch assigned bids was aborted (timeout)");
          return;
        }
        console.error("Failed to fetch assigned tasks:", err);
      }
    };

    fetchAssignedBids();
  }, [user, userId]);

  // Fetch requested bids
  useEffect(() => {
    if (!user || !userId) return;

    const fetchRequestedBids = async () => {
      try {
        // Use fetch API directly to bypass axios timeout issues
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

        const fetchResponse = await fetch(`${API_BASE}/get-user-requested-bids/${userId}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!fetchResponse.ok) {
          console.warn("Fetch requested bids failed with status:", fetchResponse.status);
          return;
        }

        const result = await fetchResponse.json();

        if (result.status_code === 200 && Array.isArray(result.data?.bids)) {
          const bids: BidRequest[] = result.data.bids.map((bid: any) => ({
            bid_id: bid.bid_id,
            task_id: bid.task_id.toString(),
            task_title: bid.task_title || "Untitled",
            bid_amount: Number(bid.bid_amount) || 0,
            bid_description: bid.bid_description || "No description provided.",
            status: bid.status || "pending",
            created_at: bid.created_at
              ? new Date(bid.created_at).toLocaleDateString("en-GB")
              : "Unknown",
            task_location: bid.task_location || "Unknown",
            task_description: bid.task_description || "No description provided.",
            posted_by: bid.posted_by || "Unknown",
            job_due_date: bid.job_due_date
              ? new Date(bid.job_due_date).toLocaleDateString("en-GB")
              : "Unknown",
            job_budget: Number(bid.job_budget) || 0,
            job_category: bid.job_category || "general",
            category_name: bid.category_name || "Unknown",
            images: bid.images?.length
              ? bid.images.map((img: any, index: number) => ({
                  id: `img${index + 1}`,
                  url: typeof img === 'string' ? img : img.url,
                  alt: `Job image ${index + 1}`,
                }))
              : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
            task_cancelled: false,
          }));
          // Enrich each bid with task cancel status and filter out cancelled tasks
          try {
            const results = await Promise.allSettled(
              bids.map(async (b) => {
                const r = await axiosInstance.get(`/get-job/${b.task_id}/`);
                const job = r.data?.data?.job || r.data?.job || {};
                const isCancelled = job?.status === true || job?.cancel_status === true || job?.status === "Cancelled" || job?.status === "cancelled";
                const isDeleted = job?.deletion_status === true || job?.deletion_status === 1 || job?.status === "Deleted" || job?.status === "deleted";
                return { id: b.bid_id, task_id: b.task_id, cancelled: !!isCancelled, deleted: !!isDeleted };
              })
            );
            const cancelledMap: Record<string, boolean> = {};
            const deletedMap: Record<string, boolean> = {};
            for (const res of results) {
              if (res.status === 'fulfilled') {
                cancelledMap[res.value.task_id] = res.value.cancelled;
                deletedMap[res.value.task_id] = res.value.deleted;
              }
            }
            const enriched = bids
              .map((b) => ({ ...b, task_cancelled: cancelledMap[b.task_id] ?? false, task_deleted: deletedMap[b.task_id] ?? false }));
            setRequestedTasks(enriched);
            try { sessionStorage.setItem("requestedTasks", JSON.stringify(enriched)); } catch {}
          } catch {
            // If enrichment fails, fallback to original list
          setRequestedTasks(bids);
            try { sessionStorage.setItem("requestedTasks", JSON.stringify(bids)); } catch {}
          }
        } else {
          console.warn("No requested bids found or API error:", result.message);
        }
      } catch (err) {
        // Handle AbortError separately (don't show error for timeouts)
        if ((err as any)?.name === 'AbortError') {
          console.log("⏰ Fetch requested bids was aborted (timeout)");
          return;
        }
        console.error("Failed to fetch requested bids:", err);
      }
    };

    fetchRequestedBids();
  }, [user, userId]);

  // Fetch completed tasks with deduplication
  useEffect(() => {
    if (!user || !userId) return;


    const fetchCompletedTasks = async () => {
      try {
        setCompletedTasksLoading(true);
        
        
        // Check cache first with longer TTL for better performance (completed tasks don't change often)
        const cacheKey = `completed_tasks_${userId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          const cacheAge = Date.now() - cachedData.timestamp;
          if (cacheAge < 300000) { // 5 minutes cache (completed tasks change less frequently)
            console.log("Using cached completed tasks");
            setCompletedTasks(cachedData.tasks);
            setCompletedTasksLoading(false);
            return;
          }
        }

        // Use the same fast endpoint as available tasks for consistency
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        console.log("Fetching completed tasks from get-user-jobs...");
        const fetchResponse = await fetch(`${API_BASE}/get-user-jobs/${userId}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!fetchResponse.ok) {
          console.warn("Get user jobs failed with status:", fetchResponse.status);
          // Show fallback message for database connection issues
          if (fetchResponse.status >= 500) {
            toast.error("Server is experiencing high load. Please try again in a moment.");
          }
          return;
        }

        const result = await fetchResponse.json();

        if (result.status_code === 200 && result.data?.jobs) {
          // First, get the basic task data
          const tasks: Task[] = result.data.jobs.map((job: any) => {
            let jobStatus = "open";
            
            // Check if this task has a paid order - use correct field name
            const hasPaidOrder = taskOrders.some(order => {
              const orderTaskId = order.job_id || order.postId || order.post_id || order.task_id;
              // Status 1 = Completed/Paid, Status 0 = Processing
              // TEMPORARY FIX: Treat status 0 as paid since backend isn't updating to status 1
              const isPaid = order.status === 1 || order.status === "1" || order.status === 0;
              const isMatching = orderTaskId === job.job_id.toString();
              
              return isMatching && isPaid;
            });
            
            // Determine job status based on completion and payment
            if (job.job_completion_status === 1) {
              jobStatus = "completed";
            } else if (hasPaidOrder) {
              jobStatus = "in_progress";
            } else if (job.deletion_status || job.cancel_status) {
              jobStatus = "cancelled";
            }
            
            return {
              id: job.job_id.toString(),
              title: job.job_title || "Untitled",
              description: job.job_description || "No description provided.",
              budget: Number(job.job_budget) || 0,
              location: job.job_location || "Unknown",
              status: jobStatus,
              postedAt: (() => {
                const raw = job.job_due_date || job.created_at;
                return raw ? new Date(raw).toLocaleDateString("en-GB") : "Unknown";
              })(),
              completedDate: jobStatus === "completed" ? (() => {
                const raw = job.updated_at || job.completed_at;
                return raw ? new Date(raw).toLocaleDateString("en-GB") : "Unknown";
              })() : undefined,
              images: job.images && Array.isArray(job.images) && job.images.length > 0
                ? job.images.map((url: string, index: number) => ({
                    id: `img${index + 1}`,
                    url,
                    alt: `Job image ${index + 1}`,
                  }))
                : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
            };
          });

          // Filter for completed tasks only
          const completedTasks = tasks.filter(task => task.status === "completed");
          
          if (completedTasks.length > 0) {
            console.log(`Found ${completedTasks.length} completed tasks for user ${userId}`);
            
            setCompletedTasks(completedTasks);
            
            // Cache the completed tasks
            localStorage.setItem(cacheKey, JSON.stringify({
              tasks: completedTasks,
              timestamp: Date.now()
            }));
          } else {
            console.log("No completed tasks found");
          }
        } else {
          console.log("No jobs found in API response");
        }
      } catch (err) {
        // Handle AbortError separately (don't show error for timeouts)
        if ((err as any)?.name === 'AbortError') {
          console.log("⏰ Fetch completed tasks was aborted (timeout)");
          
          // Try to load from cache as fallback
          try {
            const fallbackCacheKey = `completed_tasks_${userId}`;
            const cachedTasks = localStorage.getItem(fallbackCacheKey);
            if (cachedTasks) {
              const cachedData = JSON.parse(cachedTasks);
              setCompletedTasks(cachedData.tasks);
              console.log("Loaded completed tasks from cache after timeout");
            }
          } catch (cacheError) {
            console.error("Failed to load cached completed tasks:", cacheError);
          }
          return;
        }
        console.error("Failed to fetch completed tasks:", err);
      } finally {
        setCompletedTasksLoading(false);
      }
    };

    fetchCompletedTasks();
  }, [user, userId]);

  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const handleComplete = async (jobId: string) => {
    if (completingTaskId) return; // Prevent multiple clicks
    
    try {
      setCompletingTaskId(jobId);
      console.log("Attempting to complete task:", jobId);
      
      // Show immediate feedback
      toast.loading("Marking task as complete...", { id: `complete-${jobId}` });
      
      // Optimized API call with shorter timeout
      const token = localStorage.getItem('token');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Reduced to 15s
      
      const response = await fetch(`${API_BASE}/mark-complete/${jobId}/`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const result = await response.json();
      console.log("Complete task response:", result);

      if (result.status_code === 200) {
        toast.dismiss(`complete-${jobId}`);
        toast.success("Task marked as complete!");
        
        // Optimistic UI update
        const completedTask = assignedTasks.find((task) => task.id === jobId);
        if (completedTask) {
        setAssignedTasks((prev) => prev.filter((task) => task.id !== jobId));
        setCompletedTasks((prev) => [
          ...prev,
          {
              ...completedTask,
            status: "completed",
            completedDate: new Date().toLocaleDateString("en-GB"),
          },
        ]);
        }

        // Navigate to completion page
        setTimeout(() => {
        router.push(`/tasks/${jobId}/complete`);
        }, 500);
      } else {
        toast.dismiss(`complete-${jobId}`);
        console.error("Error marking task as complete:", result);
        toast.error(`Failed to complete task: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      toast.dismiss(`complete-${jobId}`);
      console.error("Error marking task as complete:", error);
      if ((error as any)?.name === 'AbortError') {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Failed to complete task. Please try again.");
      }
    } finally {
      setCompletingTaskId(null);
    }
  };

  // Handle marking My Tasks as complete
  const handleMyTaskComplete = async (jobId: string) => {
    if (completingTaskId) return; // Prevent multiple clicks
    
    try {
      setCompletingTaskId(jobId);
      toast.loading("Marking task as complete...", { id: `my-complete-${jobId}` });
      
      const response = await axiosInstance.put<APIResponse<any>>(`/mark-complete/${jobId}/`);

      if (response.data.status_code === 200) {
        toast.dismiss(`my-complete-${jobId}`);
        toast.success("Task marked as complete!");
        // Update the posted task status
        setPostedTasks((prev) =>
          prev.map((task) =>
            task.id === jobId
              ? { ...task, status: "completed", completedDate: new Date().toLocaleDateString("en-GB") }
              : task
          )
        );
      } else {
        toast.dismiss(`my-complete-${jobId}`);
        toast.error(response.data.message || "Failed to mark task as complete");
      }
    } catch (error) {
      toast.dismiss(`my-complete-${jobId}`);
      console.error("Error marking task as complete:", error);
      toast.error("An error occurred while marking the task as complete");
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleDeleteClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedJobId) return;

    setConfirmOpen(false);

    try {
      const response = await axiosInstance.put(`/delete-job/${selectedJobId}/`);
      if (response.data.status_code === 200) {
        toast.success("Task deleted successfully!");
        setPostedTasks((prev) =>
          prev.map((task) =>
            task.id === selectedJobId
              ? { ...task, deletion_status: true }
              : task
          )
        );
      } else {
        toast.error(response.data.message || "Failed to delete task");
      }
    } catch (error) {
      toast.error("An error occurred while deleting the task");
    } finally {
      setSelectedJobId(null);
    }
  };

  const handleConfirmUndelete = async () => {
    if (!selectedJobId) return;

    toast.success("Your request has been sent to admin");
    setPostedTasks((prev) =>
      prev.map((task) =>
        task.id === selectedJobId
          ? { ...task, deletion_status: true }
          : task
      )
    );

    setSelectedJobId(null);
    setRequestUndeleteOpen(false);
  };

  const handleSignOut = () => {
    logout();
    router.push("/signin");
  };

  const handleCancelClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setCancelConfirmOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!selectedJobId) return;

    setCancelConfirmOpen(false);

    try {
      const response = await axiosInstance.put(`/cancel-job/${selectedJobId}/`);
      if (response.data.status_code === 200) {
        toast.success("Task canceled successfully!");
        setPostedTasks((prev) =>
          prev.map((task) =>
            task.id === selectedJobId
              ? { ...task, cancel_status: true }
              : task
          )
        );
      } else {
        toast.error(response.data.message || "Failed to cancel task");
      }
    } catch (error) {
      toast.error("An error occurred while canceling the task");
    } finally {
      setSelectedJobId(null);
    }
  };

  // Cancel for assigned-to-me tasks
  const handleAssignedCancelClick = (jobId: string) => {
    setSelectedAssignedId(jobId);
    setAssignedCancelOpen(true);
  };

  const handleAssignedConfirmCancel = async () => {
    if (!selectedAssignedId) return;
    
    // Check if cancellation reason is provided
    if (!cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }
    
    setAssignedCancelOpen(false);
    
    // Store cancellation reason in localStorage first (regardless of API success)
    const cancellationData = {
      taskId: selectedAssignedId,
      reason: cancellationReason.trim(),
      taskerName: user?.name || "Unknown",
      cancelledAt: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    try {
      const existingCancellations = JSON.parse(localStorage.getItem('taskerCancellations') || '[]');
      existingCancellations.push(cancellationData);
      localStorage.setItem('taskerCancellations', JSON.stringify(existingCancellations));
      console.log("✅ Cancellation reason stored locally:", cancellationData);
    } catch (error) {
      console.error("Failed to store cancellation reason:", error);
    }
    
    // Try to cancel via API (but don't fail if it doesn't work)
    try {
      let response;
      try {
        // Try the PUT endpoint first (more likely to work)
        response = await axiosInstance.put(`/cancel-job/${selectedAssignedId}/`);
      } catch (err) {
        // If PUT fails, try POST
        response = await axiosInstance.post(`/request-cancel-job/${selectedAssignedId}/`);
      }
      
      if (response.data.status_code === 200) {
        toast.success("Task cancelled successfully with reason recorded");
        setAssignedTasks((prev) => prev.filter((t) => t.id !== selectedAssignedId));
      } else {
        toast.success("Cancellation reason recorded. Task cancellation may need admin approval.");
        setAssignedTasks((prev) => prev.filter((t) => t.id !== selectedAssignedId));
      }
    } catch (error) {
      console.error("API cancellation failed, but reason is saved locally:", error);
      toast.success("Cancellation reason recorded. Task cancellation may need admin approval.");
      setAssignedTasks((prev) => prev.filter((t) => t.id !== selectedAssignedId));
    } finally {
      setSelectedAssignedId(null);
      setCancellationReason(""); // Reset the reason
    }
  };

  // Filter tasks for Available Tasks tab
  const filteredTasks = availableTasks.filter((task) => {
    const matchesSearch =
      searchTerm === "" ||
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = category === "all" || task.category === category;
    const matchesPrice =
      task.budget >= priceRange[0] && task.budget <= priceRange[1];
    const matchesLocation =
      location === "" ||
      task.location.toLowerCase().includes(location.toLowerCase());
    
    const isNotCanceled = !task.cancel_status;

    return matchesSearch && matchesCategory && matchesPrice && matchesLocation && isNotCanceled;
  });

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleRequestUndeleteClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setRequestUndeleteOpen(true);
  };

  if (loading) {
    return (
      <div className={`flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100 ${isMobile ? 'px-4' : ''}`}>
        <div className="text-center">
          {/* Mobile-optimized loading animation */}
          <div className="relative mb-6">
            {isMobile ? (
              // Mobile: Bouncing dots animation
              <div className="flex items-center justify-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            ) : (
              // Desktop: Spinner animation
              <div className="w-16 h-16 mx-auto">
                <div className="w-full h-full border-3 border-gray-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-3 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          
          {/* Mobile-optimized loading text */}
          <div className="space-y-3">
            <h2 className={`font-medium text-gray-700 ${isMobile ? 'text-lg' : 'text-xl'} animate-pulse`}>
              {isMobile ? 'Loading...' : 'Loading Dashboard'}
            </h2>
            {!isMobile && (
              <div className="flex items-center justify-center space-x-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const NotificationBar = dynamic(() => import("@/components/NotificationBar"), { ssr: false });

  // Always use unified dashboard; remove dummy MobileDashboard on mobile

  const counts = {
    my: postedTasks.length,
    available: availableTasks.length,
    assigned: assignedTasks.length,
    completed: completedTasks.length,
    bids: bids.length,
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-50 to-gray-100 overflow-x-hidden">
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes shimmer {
          0% {
            background-position: -200px 0;
          }
          100% {
            background-position: calc(200px + 100%) 0;
          }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out;
        }
        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
        .animate-shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200px 100%;
          animation: shimmer 1.5s infinite;
        }
        .tab-content-enter {
          opacity: 0;
          transform: translateX(20px);
        }
        .tab-content-enter-active {
          opacity: 1;
          transform: translateX(0);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .tab-content-exit {
          opacity: 1;
          transform: translateX(0);
        }
        .tab-content-exit-active {
          opacity: 0;
          transform: translateX(-20px);
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
      `}</style>
      
      <main className="flex-1 w-full max-w-none mx-auto py-3 md:py-10 px-4 md:px-8 lg:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-8 gap-3 md:gap-4 animate-fade-in-up">
          {/* Move profile block up on mobile */}
          {mobile && (
            <div className="w-full">
              <div className="flex items-center justify-end">
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="relative">
                      {user && user.profile_image ? (
                        <img 
                          src={user.profile_image} 
                          alt={(user && user.name) || "Profile"} 
                          className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold border-2 border-gray-200">
                          {(user && user.name ? user.name.charAt(0) : "U")}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900">{user?.name || "User"}</span>
                      <span className="text-xs text-gray-500">Online</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 animate-fade-in-up">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          {user?.profile_image ? (
                            <img 
                              src={user.profile_image} 
                              alt={user?.name || "Profile"} 
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-lg font-semibold border-2 border-gray-200">
                              {user?.name?.charAt(0) || "U"}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{user?.name || "User"}</p>
                            <p className="text-sm text-gray-500">{user?.email || ""}</p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                          <div className="p-2 rounded-lg bg-blue-100">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="text-gray-700 font-medium">My Profile</span>
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                          <div className="p-2 rounded-lg bg-gray-100">
                            <Settings className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="text-gray-700 font-medium">Settings</span>
                        </Link>
                        <div className="border-t border-gray-100 my-2"></div>
                        <button 
                          onClick={handleSignOut} 
                          className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 w-full text-left"
                        >
                          <div className="p-2 rounded-lg bg-red-100">
                            <LogOut className="h-4 w-4 text-red-600" />
                          </div>
                          <span className="text-red-600 font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 text-left">
                <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
                <p className="text-xs text-gray-600 mt-1">Manage your tasks and bids efficiently</p>
              </div>
            </div>
          )}
          {!isMobile && (
            <div className="animate-slide-in-right">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-gray-900">
                Dashboard
              </h1>
              <p className="text-sm md:text-xl text-gray-600 mt-2 md:mt-3 font-medium">Manage your tasks and bids efficiently</p>
            </div>
          )}
          <div className="hidden md:flex items-center gap-6 animate-slide-in-right">
            {/* Enhanced Notifications with proper clickable functionality */}
            <div className="relative">
              <NotificationBar />
            </div>
            
            {/* Premium Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900 font-medium px-6 py-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="relative">
                  {user?.profile_image ? (
                    <img 
                      src={user.profile_image} 
                      alt={user?.name || "Profile"} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-lg font-semibold border-2 border-gray-200">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-lg">{user?.name || "User"}</span>
                <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {user?.profile_image ? (
                        <img 
                          src={user.profile_image} 
                          alt={user?.name || "Profile"} 
                          className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xl font-semibold border-2 border-gray-200">
                          {user?.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-lg">{user?.name || "User"}</p>
                        <p className="text-sm text-gray-500">{user?.email || ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700 font-medium">My Profile</span>
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Settings className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-gray-700 font-medium">Settings</span>
                    </Link>
                    <div className="border-t border-gray-100 my-2"></div>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 w-full text-left"
                    >
                      <div className="p-2 rounded-lg bg-red-100">
                        <LogOut className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-red-600 font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact mobile header (disabled to avoid duplicate profile chip) */}
        {false && (
          <div className="md:hidden -mt-1 mb-3 flex items-center justify-end">
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-4 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
              >
                <div className="relative">
                  {user?.profile_image ? (
                    <img 
                      src={user.profile_image} 
                      alt={user?.name || "Profile"} 
                      className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold border-2 border-gray-200">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">{user?.name || "User"}</span>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {user && user.profile_image ? (
                        <img 
                          src={user.profile_image} 
                          alt={(user && user.name) || "Profile"} 
                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-lg font-semibold border-2 border-gray-200">
                          {(user && user.name ? user.name.charAt(0) : "U")}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user?.name || "User"}</p>
                        <p className="text-sm text-gray-500">{user?.email || ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700 font-medium">My Profile</span>
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Settings className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-gray-700 font-medium">Settings</span>
                    </Link>
                    <div className="border-t border-gray-100 my-2"></div>
                    <button 
                      onClick={handleSignOut} 
                      className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 w-full text-left"
                    >
                      <div className="p-2 rounded-lg bg-red-100">
                        <LogOut className="h-4 w-4 text-red-600" />
                      </div>
                      <span className="text-red-600 font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile quick actions: Profile and Post */}
        {mobile && (
          <div className="md:hidden mb-3 flex items-center gap-3">
            <Link href="/profile" className="flex-1">
              <Button variant="outline" className="w-full h-10 rounded-xl border-gray-300 text-gray-800">
                Profile
              </Button>
            </Link>
            <Link href="/post-task" className="flex-1">
              <Button className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700">
                Post a Task
              </Button>
            </Link>
          </div>
        )}

        {/* Premium Post Task Button */}
        {/* Hide big CTA bar on small screens to avoid duplicate name/header block */}
        <div className="hidden md:flex justify-start mb-8 animate-fade-in-up">
          <Link href="/post-task" passHref>
            <Button className="group bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-lg">
              <span className="flex items-center gap-3">
                <span className="text-xl group-hover:rotate-90 transition-transform duration-300">+</span>
                Post a Task
              </span>
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className={
            isMobile
              ? "grid grid-cols-5 w-full p-2 bg-white border border-gray-100 rounded-3xl shadow-sm z-20 gap-2 sticky top-[calc(env(safe-area-inset-top)+48px)]"
              : "flex w-full bg-transparent p-0 border-0 gap-2"
          }>
            <TabsTrigger value="my-tasks" className={
              isMobile 
                ? "flex flex-col items-center gap-1 px-3 py-4 rounded-2xl text-[11px] font-medium border border-gray-100 bg-white shadow-sm hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-gray-200"
                : "px-4 py-2 rounded-xl text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
            }>
              <span className="text-2xl">📋</span>
              <span className="hidden md:inline">My Tasks</span>
              <span className="md:hidden">My Tasks</span>
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] bg-blue-600 text-white shadow">{counts.my}</span>
            </TabsTrigger>
            <TabsTrigger value="available" className={
              isMobile 
                ? "flex flex-col items-center gap-1 px-3 py-4 rounded-2xl text-[11px] font-medium border border-gray-100 bg-white shadow-sm hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-gray-200"
                : "px-4 py-2 rounded-xl text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
            }>
              <span className="text-2xl">🔍</span>
              <span className="hidden md:inline">Available</span>
              <span className="md:hidden">Available</span>
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] bg-slate-700 text-white shadow">{counts.available}</span>
            </TabsTrigger>
            <TabsTrigger value="assigned" className={
              isMobile 
                ? "flex flex-col items-center gap-1 px-3 py-4 rounded-2xl text-[11px] font-medium border border-gray-100 bg-white shadow-sm hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-gray-200"
                : "px-4 py-2 rounded-xl text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
            }>
              <span className="text-2xl">✅</span>
              <span className="hidden md:inline">Assigned</span>
              <span className="md:hidden">Assigned</span>
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] bg-amber-600 text-white shadow">{counts.assigned}</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className={
              isMobile 
                ? "flex flex-col items-center gap-1 px-3 py-4 rounded-2xl text-[11px] font-medium border border-gray-100 bg-white shadow-sm hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-gray-200"
                : "px-4 py-2 rounded-xl text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
            }>
              <span className="text-2xl">🎉</span>
              <span className="hidden md:inline">Completed</span>
              <span className="md:hidden">Done</span>
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] bg-emerald-600 text-white shadow">{counts.completed}</span>
            </TabsTrigger>
            <TabsTrigger value="my-bids" className={
              isMobile 
                ? "flex flex-col items-center gap-1 px-3 py-4 rounded-2xl text-[11px] font-medium border border-gray-100 bg-white shadow-sm hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:ring-2 data-[state=active]:ring-gray-200"
                : "px-4 py-2 rounded-xl text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm whitespace-nowrap"
            }>
              <span className="text-2xl">💰</span>
              <span className="hidden md:inline">My Bids</span>
              <span className="md:hidden">Bids</span>
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[10px] bg-indigo-600 text-white shadow">{counts.bids}</span>
            </TabsTrigger>
          </TabsList>

          {/* Mobile spacer to ensure content never peeks under the tabs */}
          <div className="md:hidden h-10"></div>

          {/* Active filter chips (mobile) - removed per request */}

          {isMobile && showFilters && (
            <div id="mobile-filters" className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Sort by</label>
                  <div className="bg-white border border-gray-200 rounded-lg p-2">
                    <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="w-full bg-transparent text-gray-700">
                      <option value="newest">Newest first</option>
                      <option value="budget_high">Budget: High to Low</option>
                      <option value="budget_low">Budget: Low to High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      {categoriesLoading && (
                        <SelectItem value="loading" disabled>Loading…</SelectItem>
                      )}
                      {categories.map((c)=> (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Price range</label>
                  <div className="px-2 py-3 bg-gray-50 rounded-lg border">
                    <Slider value={priceRange} onValueChange={setPriceRange} max={50000} step={10} />
                    <div className="flex justify-between text-sm mt-2 text-gray-700">
                      <span>₹{priceRange[0].toLocaleString()}</span>
                      <span>₹{priceRange[1].toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
                  <Input value={location} onChange={(e)=>setLocation(e.target.value)} placeholder="e.g., Mumbai" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={onlyOpen} onChange={e=>setOnlyOpen(e.target.checked)} /> Only open
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={withImages} onChange={e=>setWithImages(e.target.checked)} /> With images
                  </label>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button type="button" variant="outline" className="flex-1" onClick={()=>{setSearchTerm("");setCategory("all");setPriceRange([0,50000]);setLocation("");}}>Clear</Button>
                  <Button type="button" className="flex-1" onClick={()=>setShowFilters(false)}>Apply</Button>
                </div>
              </div>
            </div>
          )}

          <TabsContent value="my-tasks" forceMount className="space-y-6 mt-8 animate-fade-in-up min-h-[500px]">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight border-b border-gray-200 pb-4">Tasks You've Posted</h2>
            {/* Premium Summary strip */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setMyTasksFilter("in_progress")}
                className={`rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md border bg-gradient-to-br from-emerald-50 to-white ${
                  myTasksFilter === "in_progress" ? "border-emerald-300 shadow" : "border-gray-200 hover:border-emerald-200"
                }`}
              >
                <div className="text-sm font-semibold text-emerald-700 mb-1 flex items-center justify-center gap-2">
                  <span>🚀</span>
                  In Progress
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{myTasksSummary.inProgress}</div>
              </button>
              <button
                onClick={() => setMyTasksFilter("open")}
                className={`rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md border bg-gradient-to-br from-sky-50 to-white ${
                  myTasksFilter === "open" ? "border-sky-300 shadow" : "border-gray-200 hover:border-sky-200"
                }`}
              >
                <div className="text-sm font-semibold text-sky-700 mb-1 flex items-center justify-center gap-2">
                  <span>📋</span>
                  Open
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{myTasksSummary.open}</div>
              </button>
              <button
                onClick={() => setMyTasksFilter("completed")}
                className={`rounded-xl p-4 text-center transition-all duration-200 hover:shadow-md border bg-gradient-to-br from-gray-50 to-white ${
                  myTasksFilter === "completed" ? "border-gray-300 shadow" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-semibold text-gray-700 mb-1 flex items-center justify-center gap-2">
                  <span>✅</span>
                  Completed
                </div>
                <div className="text-3xl font-extrabold text-gray-900">{myTasksSummary.completed}</div>
              </button>
            </div>
            <div className="text-right -mt-2">
              <button 
                onClick={() => setMyTasksFilter("all")} 
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                Clear filter
              </button>
            </div>
            {postedTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground mb-4">
                    You haven't posted any tasks yet
                  </p>
                  <Link href="/post-task">
                    <Button>Post Your First Task</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                {postedTasks
                  .filter((t) => {
                    if (myTasksFilter === "all") return true;
                    if (myTasksFilter === "in_progress") return t.status === "in_progress" && !t.deletion_status && !t.cancel_status;
                    if (myTasksFilter === "open") return t.status === "open" && !t.deletion_status && !t.cancel_status;
                    if (myTasksFilter === "completed") return t.status === "completed";
                    return true;
                  })
                  .sort((a, b) => {
                    // Prioritize actively in-progress (accepted/paid) tasks to the top
                    const aTop = a.status === "in_progress" && !a.deletion_status && !a.cancel_status;
                    const bTop = b.status === "in_progress" && !b.deletion_status && !b.cancel_status;
                    if (aTop && !bTop) return -1;
                    if (bTop && !aTop) return 1;
                    // Push deleted/canceled to bottom
                    if (a.deletion_status && !b.deletion_status) return 1;
                    if (!a.deletion_status && b.deletion_status) return -1;
                    if (a.cancel_status && !b.cancel_status) return 1;
                    if (!a.cancel_status && b.cancel_status) return -1;
                    return 0;
                  })
                  .map((task) => (
                    <Card
                      key={task.id}
                      className={`relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1 rounded-2xl overflow-hidden group border ${
                        task.deletion_status || task.cancel_status
                          ? "opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed"
                          : task.status === "in_progress"
                          ? "shadow-md border-emerald-200 bg-white hover:border-emerald-300"
                          : task.status === "completed"
                          ? "shadow-sm border-gray-200 bg-gray-50"
                          : "shadow-sm border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      {/* In Progress Task Banner */}
                      {task.status === "in_progress" && (
                        <div className="w-full bg-emerald-700 text-white text-center py-1.5 px-3 font-semibold text-xs">
                          🚀 In Progress — Bid Accepted
                        </div>
                      )}
                      
                      {/* Mobile-optimized layout */}
                      <div className={isMobile ? "p-4" : "p-6"}>
                        {/* Header with title and status */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-gray-900 line-clamp-2 ${isMobile ? "text-base" : "text-lg"}`}>
                              {task.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{task.postedAt}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-3">
                            <Badge
                              variant="outline"
                              className={`font-medium text-xs px-2 py-1 rounded-full ${
                                task.cancel_status
                                  ? "border-red-200 text-red-600 bg-red-50"
                                  : task.deletion_status
                                  ? "border-red-200 text-red-600 bg-red-50"
                                  : task.status === "in_progress"
                                  ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                                  : task.status === "completed"
                                  ? "border-gray-300 text-gray-600 bg-gray-50"
                                  : "border-gray-300 text-gray-600 bg-gray-50"
                              }`}
                            >
                              {task.cancel_status
                                ? "❌ Canceled"
                                : task.deletion_status
                                ? "🗑️ Deleted"
                                : task.status === "in_progress"
                                ? "🚀 In Progress"
                                : task.status === "completed"
                                ? "✅ Completed"
                                : "📋 Open"}
                            </Badge>
                            {!task.deletion_status && !task.cancel_status && (
                              <div className="flex gap-1">
                                {(task.status === "open" || task.status === "in_progress") && (
                                  <button
                                    onClick={() => handleCancelClick(task.id)}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded-full shadow-lg transition-all duration-200 hover:scale-110 font-medium text-xs"
                                    aria-label="Cancel task"
                                    title="Cancel task"
                                  >
                                    ❌
                                  </button>
                                )}
                                {task.status === "open" && (
                                  <button
                                    onClick={() => handleDeleteClick(task.id)}
                                    className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded-full shadow-lg transition-all duration-200 hover:scale-110 font-medium text-xs"
                                    aria-label="Delete task"
                                    title="Delete task"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {task.description}
                        </p>

                        {/* Mobile-optimized info row */}
                        <div className={`flex items-center justify-between ${isMobile ? "flex-col gap-2" : "gap-4"}`}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg">
                              <IndianRupee className="h-4 w-4 text-blue-600 font-bold" />
                              <span className="font-bold text-blue-800">{task.budget}</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                              <MapPin className="h-3 w-3" />
                              <span className="text-xs">{task.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className={`flex gap-2 mt-4 ${isMobile ? "flex-col" : "flex-row"}`}>
                          {task.deletion_status || task.cancel_status ? (
                            <Button
                              variant="outline"
                              className="w-full"
                              onClick={() => handleRequestUndeleteClick(task.id)}
                            >
                              Request Access
                            </Button>
                          ) : task.status === "in_progress" ? (
                            <>
                              <Button
                                onClick={() => handleMyTaskComplete(task.id)}
                                disabled={completingTaskId === task.id}
                                className={`${isMobile ? "w-full" : "flex-1"} bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${isMobile ? "py-2 text-sm" : "py-3 px-4"}`}
                              >
                                {completingTaskId === task.id ? (
                                  <div className="flex items-center gap-2">
                                    {isMobile ? (
                                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                    ) : (
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                    <span className={isMobile ? 'text-sm' : ''}>Completing...</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">✅</span>
                                    <span>Mark as Complete</span>
                                  </div>
                                )}
                              </Button>
                              <Link href={`/tasks/${task.id}`} className={`${isMobile ? "w-full" : "flex-1"}`}>
                                <Button variant="outline" className={`${isMobile ? "w-full" : "w-full"} border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] ${isMobile ? "py-2 text-sm" : "py-3 px-4"}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">👁️</span>
                                    <span>View Details</span>
                                  </div>
                                </Button>
                              </Link>
                            </>
                          ) : (
                            <Link href={`/tasks/${task.id}`} className="w-full">
                              <Button variant="outline" className={`w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] ${isMobile ? "py-2 text-sm" : "py-3 px-4"}`}>
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">👁️</span>
                                  <span>View Details</span>
                                </div>
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" forceMount className="space-y-6 mt-12 pt-2 animate-fade-in-up min-h-[500px]">
            <h2 className="text-2xl font-bold text-gray-900 pb-2">Available Tasks</h2>
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "md:grid-cols-4"}`} style={{zIndex:1, position:'relative'}}>
              <div className={`${isMobile ? "hidden" : "md:col-span-1"} space-y-6`}>
                <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50 border-b border-gray-200 p-6">
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-800 shadow-sm">
                        <Filter className="w-4 h-4 text-white" />
                      </div>
                      Filters
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium">Refine your search</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-8">
                      {/* Category Filter */}
                      <div className="group">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded-lg bg-gray-100">
                            <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        Category
                      </label>
                        <div className="bg-white border border-gray-200 rounded-lg p-2 hover:border-gray-300 transition-all duration-200">
                      <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="border-0 focus:ring-0 text-gray-700">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                            <SelectContent className="rounded-lg border border-gray-200 shadow-lg">
                              <SelectItem value="all" className="rounded-md">All Categories</SelectItem>
                          {categories.length > 0 ? (
                            categories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id} className="rounded-md">
                                {cat.name}
                              </SelectItem>
                            ))
                          ) : (
                                <SelectItem value="loading" disabled className="rounded-md">
                              Loading categories...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                      </div>

                      {/* Price Range Filter */}
                      <div className="group">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded-lg bg-gray-100">
                            <IndianRupee className="w-3 h-3 text-gray-600" />
                        </div>
                        Price Range
                      </label>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-all duration-200">
                          <Slider
                            defaultValue={[0, 50000]}
                            max={50000}
                            step={10}
                            value={priceRange}
                            onValueChange={setPriceRange}
                            className="mb-3"
                          />
                          <div className="flex justify-between">
                            <div className="bg-white px-3 py-1.5 rounded-md border border-gray-200">
                              <span className="text-gray-700 font-medium text-sm">₹{priceRange[0].toLocaleString()}</span>
                          </div>
                            <div className="bg-white px-3 py-1.5 rounded-md border border-gray-200">
                              <span className="text-gray-700 font-medium text-sm">₹{priceRange[1].toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                      </div>

                      {/* Location Filter */}
                      <div className="group">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                          <div className="p-1.5 rounded-lg bg-gray-100">
                            <MapPin className="w-3 h-3 text-gray-600" />
                        </div>
                        Location
                      </label>
                        <div className="bg-white border border-gray-200 rounded-lg p-2 hover:border-gray-300 transition-all duration-200">
                      <Input
                            placeholder="Enter location (e.g., Mumbai, Delhi)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                            className="border-0 focus:ring-0 text-gray-700 placeholder:text-gray-400"
                          />
                        </div>
                      </div>

                      {/* Clear Filters Button */}
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchTerm("");
                            setCategory("all");
                            setPriceRange([0, 50000]);
                            setLocation("");
                          }}
                          className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-all duration-200"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className={`${isMobile ? "col-span-1" : "md:col-span-3"} space-y-6`}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <form onSubmit={handleSearch} className="flex-1 flex gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="search"
                        placeholder="Search tasks by title or description..."
                        className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-gray-400 focus:ring-0 text-gray-700 placeholder:text-gray-400 transition-all duration-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      Search
                    </Button>
                  </form>
                  <Button
                    variant="outline"
                    className="sm:hidden bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-medium px-4 py-2.5 rounded-lg transition-all duration-200"
                    onClick={() => setShowFilters(!showFilters)}
                    aria-expanded={showFilters}
                    aria-controls="mobile-filters"
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {filteredTasks.length} tasks found
                  </p>
                  <Select defaultValue="newest">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="highest">Highest budget</SelectItem>
                      <SelectItem value="lowest">Lowest budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredTasks.length === 0 ? (
                  <div className="min-h-[400px] flex items-center justify-center">
                    <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                      <CardContent className="flex flex-col items-center justify-center py-20 px-12 text-center">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                          <span className="text-4xl">📝</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2">No Tasks Found</h3>
                        <p className="text-gray-600 mb-6 leading-relaxed">
                          No tasks match your current filter criteria. Try adjusting your filters or clear them to see all tasks.
                      </p>
                      <Button
                        onClick={() => {
                          setSearchTerm("");
                          setCategory("all");
                          setPriceRange([0, 50000]);
                          setLocation("");
                        }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                          Clear All Filters
                      </Button>
                    </CardContent>
                  </Card>
                  </div>
                ) : (
                  <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                    {filteredTasks.map((task) => {
                      const hasUserBid = requestedTasks.some(bid => bid.task_id === task.id);
                      
                      return (
                        <Card key={task.id} className="flex flex-col bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 border-l-4 border-l-pink-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
                          {/* Mobile-optimized layout */}
                          <div className={isMobile ? "p-4" : "p-6"}>
                            {/* Header with title and status */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-semibold text-gray-900 line-clamp-2 ${isMobile ? "text-base" : "text-lg"}`}>
                                  {task.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">{task.postedAt}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="border-pink-500 text-pink-600 font-medium text-xs px-2 py-1">
                                {task.status === "open" ? "🔓 Open" : 
                                 task.status === "completed" ? "✅ Completed" :
                                 task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </Badge>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {task.description}
                            </p>

                            {/* Mobile-optimized info row */}
                            <div className={`flex items-center justify-between ${isMobile ? "flex-col gap-2" : "gap-4"}`}>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 bg-pink-100 px-2 py-1 rounded-lg">
                                  <IndianRupee className="h-4 w-4 text-pink-700 font-bold" />
                                  <span className="font-bold text-pink-800">{task.budget}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                  <MapPin className="h-3 w-3" />
                                  <span className="text-xs">{task.location}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 text-gray-500">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-xs">
                                    {task.posted_by?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs">{task.posted_by || "Unknown"}</span>
                              </div>
                            </div>

                            {/* Action button */}
                            <div className="mt-4">
                              <Link href={`/tasks/${task.id}`} className="w-full">
                                <Button variant="outline" className={`w-full border-2 border-pink-300 hover:border-pink-400 text-pink-700 hover:text-pink-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] ${isMobile ? "py-2 text-sm" : "py-3 px-4"}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">💰</span>
                                    <span>{hasUserBid ? "View Offer" : "Make an Offer"}</span>
                                  </div>
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assigned" forceMount className="space-y-6 mt-8 animate-fade-in-up min-h-[500px]">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-orange-200 pb-2">Tasks Assigned to You</h2>
            {assignedTasks.length === 0 ? (
              <div className="min-h-[400px] flex items-center justify-center">
                <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardContent className="flex flex-col items-center justify-center py-20 px-12 text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-6">
                      <span className="text-4xl">📋</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Assigned Tasks</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      You don't have any tasks assigned to you yet. Check back later or browse available tasks to submit bids.
                    </p>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setActiveTab("available")} 
                        className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        Browse Available Tasks
                      </Button>
                      <Button 
                        onClick={() => setActiveTab("my-tasks")} 
                        variant="outline" 
                        className="border-orange-200 text-orange-700 hover:bg-orange-50 px-6 py-2 rounded-lg font-medium transition-colors"
                      >
                        View My Tasks
                      </Button>
                    </div>
                </CardContent>
              </Card>
              </div>
            ) : (
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                {assignedTasks.map((task) => (
                  <Card key={task.id} className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
                    {/* Mobile-optimized layout */}
                    <div className={isMobile ? "p-4" : "p-6"}>
                      {/* Header with title and status */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-gray-900 line-clamp-2 ${isMobile ? "text-base" : "text-lg"}`}>
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{task.postedAt}</span>
                          </div>
                        </div>
                        <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-2 py-1">
                          🚀 In Progress
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {task.description}
                      </p>

                      {/* Mobile-optimized info row */}
                      <div className={`flex items-center justify-between ${isMobile ? "flex-col gap-2" : "gap-4"}`}>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-lg">
                            <IndianRupee className="h-4 w-4 text-orange-600 font-bold" />
                            <span className="font-bold text-orange-800">{task.budget}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">{task.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs">
                              {task.posted_by?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{task.posted_by}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className={`flex gap-2 mt-4 ${isMobile ? "flex-col" : "flex-row"}`}>
                        <Link href={`/tasks/${task.id}`} className="flex-1" onClick={() => { try { sessionStorage.setItem("nav_from_assigned","1"); } catch {} }}>
                          <Button variant="outline" className={`w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] ${isMobile ? "py-2 text-sm" : "py-3 px-4"}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👁️</span>
                              <span>View Details</span>
                            </div>
                          </Button>
                        </Link>
                        <Button
                          className={`flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${isMobile ? "py-2 text-sm" : "py-3 px-4"}`}
                          onClick={() => handleComplete(task.id)}
                          disabled={completingTaskId === task.id}
                        >
                          {completingTaskId === task.id ? (
                            <div className="flex items-center gap-2">
                              {isMobile ? (
                                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                              ) : (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              )}
                              <span className={isMobile ? 'text-sm' : ''}>Completing...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-lg">✅</span>
                              <span>Complete</span>
                            </div>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className={`flex-1 border-2 border-red-300 hover:border-red-400 text-red-600 hover:text-red-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] ${isMobile ? "py-2 text-sm" : "py-3 px-4"}`}
                          onClick={() => handleAssignedCancelClick(task.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">❌</span>
                            <span>Cancel</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" forceMount className="space-y-6 mt-8 animate-fade-in-up min-h-[500px]">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-green-200 pb-2">Completed Tasks</h2>
            {completedTasksLoading ? (
              <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  {isMobile ? (
                    // Mobile: Bouncing dots
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                    </div>
                  ) : (
                    // Desktop: Spinner
                    <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-4"></div>
                  )}
                  <p className={`text-gray-600 font-medium ${isMobile ? 'text-sm' : ''}`}>
                    {isMobile ? 'Loading...' : 'Loading completed tasks...'}
                  </p>
                </div>
              </div>
            ) : completedTasks.length === 0 ? (
              <div className="min-h-[400px] flex items-center justify-center">
                <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="flex flex-col items-center justify-center py-20 px-12 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <span className="text-4xl">✅</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Completed Tasks</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      You haven't completed any tasks yet. Complete your assigned tasks to see them here.
                    </p>
                    <Button 
                      onClick={() => setActiveTab("assigned")} 
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      View Assigned Tasks
                    </Button>
                </CardContent>
              </Card>
              </div>
            ) : (
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                {completedTasks.map((task) => (
                  <Card key={task.id} className="bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 border-l-4 border-l-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
                    {/* Mobile-optimized layout */}
                    <div className={isMobile ? "p-4" : "p-6"}>
                      {/* Header with title and status */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-gray-900 line-clamp-2 ${isMobile ? "text-base" : "text-lg"}`}>
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Task completed successfully</span>
                          </div>
                        </div>
                        <Badge className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs px-2 py-1">
                          ✅ Completed
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {task.description}
                      </p>

                      {/* Mobile-optimized info row */}
                      <div className={`flex items-center justify-between ${isMobile ? "flex-col gap-2" : "gap-4"}`}>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-lg">
                            <IndianRupee className="h-4 w-4 text-green-600 font-bold" />
                            <span className="font-bold text-green-800">{task.budget}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">{task.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs">Rating: {task.rating || "Not rated"}/5</span>
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="mt-4">
                        <Link href={`/tasks/${task.id}`} className="w-full">
                          <Button variant="outline" className={`w-full border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] ${isMobile ? "py-2 text-sm" : "py-3 px-4"}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👁️</span>
                              <span>View Details</span>
                            </div>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-bids" forceMount className="space-y-6 mt-8 animate-fade-in-up min-h-[500px]">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-purple-200 pb-2">My Bids</h2>
            {requestedTasks.length === 0 ? (
              <div className="min-h-[400px] flex items-center justify-center">
                <Card className="w-full max-w-2xl mx-auto shadow-lg border-0 bg-gradient-to-br from-purple-50 to-violet-50">
                  <CardContent className="flex flex-col items-center justify-center py-20 px-12 text-center">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                      <span className="text-4xl">📝</span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No Bids Placed</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      You haven't placed any bids yet. Browse available tasks and submit your first bid to get started.
                    </p>
                    <Button
                      onClick={() => setActiveTab("available")}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Browse Available Tasks
                    </Button>
                </CardContent>
              </Card>
              </div>
            ) : (
              <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                {requestedTasks.map((bid) => (
                  <Card key={bid.bid_id} className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
                    {/* Mobile-optimized layout */}
                    <div className={isMobile ? "p-4" : "p-6"}>
                      {/* Header with title and status */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-gray-900 line-clamp-2 ${isMobile ? "text-base" : "text-lg"}`}>
                            {bid.task_title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Bid placed: {bid.created_at}</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {bid.task_deleted && (
                            <Badge className="bg-gray-600 text-white text-xs px-2 py-1">🗑️ Deleted</Badge>
                          )}
                          {bid.task_cancelled && (
                            <Badge className="bg-red-600 text-white text-xs px-2 py-1">❌ Cancelled</Badge>
                          )}
                          {!bid.task_deleted && !bid.task_cancelled && (
                            <Badge
                              variant="outline"
                              className="border-purple-500 text-purple-600 bg-purple-50 text-xs px-2 py-1"
                            >
                              📝 Requested
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {bid.task_description}
                      </p>

                      {/* Mobile-optimized info row */}
                      <div className={`flex items-center justify-between ${isMobile ? "flex-col gap-2" : "gap-4"}`}>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1 bg-blue-100 px-2 py-1 rounded-lg">
                            <IndianRupee className="h-4 w-4 text-blue-600 font-bold" />
                            <span className="font-bold text-blue-800">Your bid: {bid.bid_amount}</span>
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">{bid.task_location}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs">
                              {bid.posted_by?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{bid.posted_by}</span>
                        </div>
                      </div>

                      {/* Action button */}
                      <div className="mt-4">
                        <Link href={`/tasks/${bid.task_id}`} className="w-full">
                          <Button variant="outline" className={`w-full border-2 border-blue-300 hover:border-blue-400 text-blue-700 hover:text-blue-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] ${isMobile ? "py-2 text-sm" : "py-3 px-4"}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👁️</span>
                              <span>View Task Details</span>
                            </div>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
                  </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Mobile Filters Bottom Sheet */}
        {/* Remove dialog-based filters completely to avoid overlay issues */}

        <ConfirmDialog
          open={requestUndeleteOpen}
          onOpenChange={setRequestUndeleteOpen}
          onConfirm={handleConfirmUndelete}
          title="Request Undelete Task"
          description="This task has been deleted. Would you like to send a request to the admin to undelete it?"
          confirmText="Send Request"
          cancelText="Cancel"
        />
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          onConfirm={handleConfirmDelete}
          title="Delete Task"
          description="Are you sure you want to delete this task? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
        />
        <ConfirmDialog
          open={cancelConfirmOpen}
          onOpenChange={setCancelConfirmOpen}
          onConfirm={handleConfirmCancel}
          title="Cancel Task"
          description="Canceling this task will incur an 8% cancellation fee. Are you sure you want to proceed?"
          confirmText="Yes, Cancel"
          cancelText="No"
        />
        <Dialog open={assignedCancelOpen} onOpenChange={setAssignedCancelOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cancel Assigned Task</DialogTitle>
              <DialogDescription>
                Please provide a reason for cancelling this task. The admin will be notified with your reason.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="cancellation-reason" className="text-sm font-medium">
                  Cancellation Reason *
                </label>
                <Textarea
                  id="cancellation-reason"
                  placeholder="Please explain why you need to cancel this task..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setAssignedCancelOpen(false);
                  setCancellationReason("");
                  setSelectedAssignedId(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAssignedConfirmCancel}
                variant="destructive"
              >
                Submit Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog> 

        {/* Floating Post a Task (mobile only) */}
        <div className="md:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-40">
          <Link href="/post-task">
            <Button className="rounded-full h-14 w-14 p-0 shadow-xl bg-blue-600 hover:bg-blue-700 active:scale-95 transition-transform">
              <span className="text-2xl leading-none">+</span>
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}