
"use client";

import { MobileDashboard } from "../../components/mobile/MobileDashboard";
import { useIsMobile } from "../../components/mobile/MobileWrapper";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CompletionReviewModal } from "@/components/CompletionReviewModal";
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
  Bell,
  Gavel,
  MessageSquare,
  ClipboardList
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import useStore from "@/lib/Zustand";
import { resolveProfileImageUrl } from "@/lib/profileImage";
import { useNotifications } from "@/lib/useNotifications";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PullToRefresh } from "@/components/PullToRefresh";
import { EmptyState } from "@/components/EmptyState";

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
  postedAtSortValue?: number; // For sorting by date
  postedAtISO?: string; // ISO date string
  dueDate?: string;
  completedDate?: string;
  rating?: number;
  review_comment?: string;
  offers: number;
  posted_by: string;
  posted_by_profile_image?: string;
  posted_by_id?: string | number;
  category: string;
  job_completion_status?: string | number;
  tasker_completed?: boolean;
  taskmaster_completed?: boolean;
  images?: Image[];
  deletion_status?: boolean;
  cancel_status?: boolean;
  cancelled_by_role?: "tasker" | "taskmaster" | "admin";
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled?: boolean;
  // New: flag to indicate this job is assigned to the current user (tasker)
  assignedToMe?: boolean;
  // Derived flags for filtering completed lists
  _posterIsMe?: boolean;
  // Store confirmed_bid_id for direct tasker identification
  confirmed_bid_id?: string | number;
  user_ref_id?: string | number;
  role?: string; // API role field: "poster" or "tasker"
  assigned_tasker_id?: string | number; // tasker user id for reviews
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
  created_at_sort_value?: number;
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

// Helper to normalize timestamp fields for display & sorting
function formatTimestampValue(raw: any): {
  formatted: string;
  sortValue: number;
  iso: string;
} {
  if (!raw) {
    return { formatted: "Unknown", sortValue: 0, iso: "" };
  }
  const date = new Date(raw);
  if (isNaN(date.getTime())) {
    return { formatted: "Unknown", sortValue: 0, iso: "" };
  }
  return {
    formatted: date.toLocaleDateString("en-GB"),
    sortValue: date.getTime(),
    iso: date.toISOString(),
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { user, userId, isAuthenticated, logout, addNotifications, updateUserProfileImage } = useStore();
  const { items: notificationItems, unreadCount, markAsRead, bellAnimating } = useNotifications(!!isAuthenticated);
  const { isMobile } = useIsMobile();
  // Prevent SSR → CSR flicker on mobile by delaying mobile-only UI until mounted
  const [mounted, setMounted] = useState(false);
  // Notifications UI state
  const [showNotifications, setShowNotifications] = useState(false);
  const formatTimeAgo = (iso: string) => {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };
  // Robust user id resolution across sources (store → user → storage)
  const effectiveUserId = useMemo(() => {
    try {
      const fromStore = userId ?? (user as any)?.id;
      if (fromStore !== undefined && fromStore !== null && fromStore !== "") {
        return String(fromStore);
      }
      const fromStorage =
        (typeof window !== "undefined" && (localStorage.getItem("userId") || sessionStorage.getItem("userId"))) || "";
      return fromStorage ? String(fromStorage) : "";
    } catch {
      return "";
    }
  }, [userId, user]);
  useEffect(() => { setMounted(true); }, []);
  const mobile = mounted && isMobile;
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1";
  const [loading, setLoading] = useState(true);
  
  // Task states
  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]); // Tasker Completed
  const [completedTasksLoading, setCompletedTasksLoading] = useState<boolean>(false);
  const [bids, setBids] = useState<Bid[]>([]);
  const [requestedTasks, setRequestedTasks] = useState<BidRequest[]>([]);
  // Local filter for My Tasks summary chips
  const [myTasksFilter, setMyTasksFilter] = useState<"all" | "in_progress" | "open" | "completed">("all");
  const [myTasksQuery, setMyTasksQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Store task orders to check payment status
  const [taskOrders, setTaskOrders] = useState<any[]>([]);

  const applyLocalPosterReviews = (tasks: Task[]): Task[] => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("poster_reviews") : null;
      if (!raw) return tasks;
      const map = JSON.parse(raw);
      return tasks.map((task) =>
        map[String(task.id)]
          ? {
              ...task,
              rating: map[String(task.id)].rating,
              review_comment: map[String(task.id)].comment,
            }
          : task
      );
    } catch (error) {
      console.warn("Failed to merge local poster reviews:", error);
      return tasks;
    }
  };
  
  // Fetch task orders to check payment status
  const fetchTaskOrders = async () => {
    try {
      // Use fetch API directly to bypass axios timeout issues
      const token = localStorage.getItem('token');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

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
      }
    } catch (error) {
      // Handle AbortError separately (don't show error for timeouts)
      if ((error as any)?.name === 'AbortError') {
        console.log("⏰ Fetch task orders was aborted (timeout after 90s) - backend may be slow");
        // Don't show error to user - this is expected for slow backends
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
  const [availableSortBy, setAvailableSortBy] = useState<string>("newest");
  const [completedSortBy, setCompletedSortBy] = useState<string>("newest");
  const [myTasksSortBy, setMyTasksSortBy] = useState<string>("newest");
  const [assignedSortBy, setAssignedSortBy] = useState<string>("newest");
  const [myBidsSortBy, setMyBidsSortBy] = useState<string>("newest");
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
  const [refetchAssignedTrigger, setRefetchAssignedTrigger] = useState(0);
  const [refetchPostedTrigger, setRefetchPostedTrigger] = useState(0);
  const [refetchAvailableTrigger, setRefetchAvailableTrigger] = useState(0);
  const [refetchCompletedTrigger, setRefetchCompletedTrigger] = useState(0);
  const [refetchBidsTrigger, setRefetchBidsTrigger] = useState(0);
  const [posterProfileCache, setPosterProfileCache] = useState<Record<string, string>>({});
  const fetchedPosterIds = useRef<Set<string>>(new Set());

  // Safe user for UI (prevents null TS checks in JSX). Support both profile_image and profile_img from API.
  const safeUser = user ? { ...user, profile_image: user.profile_image || (user as any).profile_img || "" } : { name: "User", email: "", profile_image: "" } as any;

  // Shorten long location strings (e.g. "Area, Ward X, City, State, Pin, India" -> "Area" or first locality)
  const shortLocation = (loc: string | undefined) => {
    if (!loc || loc === "Unknown") return loc || "—";
    const parts = loc.split(",").map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return "—";
    const first = parts[0];
    return first.length > 28 ? first.slice(0, 25) + "…" : first;
  };

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

  // Check if user accepted an offer but didn't complete payment
  useEffect(() => {
    if (!effectiveUserId) return;
    
    const checkPendingPayment = async () => {
      try {
        const paymentData = sessionStorage.getItem("paymentData");
        const paymentPageVisited = sessionStorage.getItem("payment_page_visited");
        const pendingVerification = localStorage.getItem("pending_payment_verification");
        
        if (paymentData && paymentPageVisited) {
          const data = JSON.parse(paymentData);
          
          // First check local task state (faster)
          const taskInState = [...postedTasks, ...assignedTasks].find(t => t.id === data.taskId);
          if (taskInState && taskInState.status === "in_progress") {
            // Payment was completed - clear the flags
            console.log("✅ Payment completed for task:", data.taskId, "- clearing flags (from local state)");
            sessionStorage.removeItem("paymentData");
            sessionStorage.removeItem("payment_page_visited");
            localStorage.removeItem("pending_payment_verification");
            return; // Don't show toast
          }
          
          // If not found in local state, check backend
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${API_BASE}/get-job/${data.taskId}/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'omit',
            });
            
            if (response.ok) {
              const result = await response.json();
              if (result.status_code === 200 && result.data) {
                const job = result.data;
                // If task is in_progress or has assigned_tasker_id, payment was completed
                const isInProgress = job.status === "in_progress" || 
                                   job.assigned_tasker_id || 
                                   job.accepted_bidder_id ||
                                   job.bid_accepted === true ||
                                   job.payment_status === "success" ||
                                   job.payment_status === true;
                
                if (isInProgress) {
                  // Payment was completed - clear the flags
                  console.log("✅ Payment completed for task:", data.taskId, "- clearing flags (from backend)");
                  sessionStorage.removeItem("paymentData");
                  sessionStorage.removeItem("payment_page_visited");
                  localStorage.removeItem("pending_payment_verification");
                  return; // Don't show toast
                }
              }
            }
          } catch (fetchError) {
            console.warn("Could not verify payment status from backend:", fetchError);
            // Continue with local check
          }
          
          // Only show warning if pendingVerification exists (payment not verified) 
          // AND we couldn't confirm payment completion from backend
          if (pendingVerification) {
            console.warn("⚠️ Payment verification pending for task:", data.taskId);
            toast.error("⚠️ Payment pending! Please complete payment to confirm the task assignment.", {
              duration: 6000,
              action: {
                label: "Complete Payment",
                onClick: () => router.push("/payments"),
              },
            });
          }
        }
      } catch (e) {
        console.error("Error checking pending payment:", e);
      }
    };
    
    // Run check after a short delay
    const timeoutId = setTimeout(checkPendingPayment, 1500);
    return () => clearTimeout(timeoutId);
  }, [effectiveUserId, router]);

  // Fetch profile image on load (API uses profile_img; login may not return it)
  useEffect(() => {
    if (!effectiveUserId || !updateUserProfileImage) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await axiosInstance.get(`/profile?user_id=${effectiveUserId}`, { signal: controller.signal });
        const payload = res.data?.data ?? res.data;
        const img = payload?.profile_img;
        if (img) updateUserProfileImage(img);
      } catch {}
    })();
    return () => controller.abort();
  }, [effectiveUserId, updateUserProfileImage]);

  // Fetch poster profile images when get-all-jobs API doesn't return them
  useEffect(() => {
    const tasks = availableTasks.filter(
      (t) => (t as any).posted_by_id && !(t as any).posted_by_profile_image
    );
    if (tasks.length === 0) return;
    const uniqueIds = [...new Set(tasks.map((t) => String((t as any).posted_by_id)))];
    const toFetch = uniqueIds.filter((id) => !fetchedPosterIds.current.has(id));
    if (toFetch.length === 0) return;
    toFetch.forEach((id) => fetchedPosterIds.current.add(id));
    const controller = new AbortController();
    (async () => {
      const results: Record<string, string> = {};
      await Promise.all(
        toFetch.map(async (pid) => {
          try {
            const res = await axiosInstance.get(`/profile?user_id=${pid}`, {
              signal: controller.signal,
            });
            const payload = res.data?.data ?? res.data;
            const img = payload?.profile_img || payload?.profile_image;
            if (img) results[pid] = img;
          } catch {
            fetchedPosterIds.current.delete(pid);
          }
        })
      );
      if (Object.keys(results).length > 0) {
        setPosterProfileCache((prev) => ({ ...prev, ...results }));
      }
    })();
    return () => controller.abort();
  }, [availableTasks]);

  // Auto-refresh: refetch current tab's data periodically and when user returns to the tab
  const refreshActiveTab = () => {
    if (activeTab === "my-tasks") {
      try { localStorage.removeItem(`user_tasks_${userId || effectiveUserId}`); } catch {}
      setRefetchPostedTrigger((t) => t + 1);
    } else if (activeTab === "available") setRefetchAvailableTrigger((t) => t + 1);
    else if (activeTab === "assigned") setRefetchAssignedTrigger((t) => t + 1);
    else if (activeTab === "completed") setRefetchCompletedTrigger((t) => t + 1);
    else if (activeTab === "my-bids") setRefetchBidsTrigger((t) => t + 1);
  };

  useEffect(() => {
    const interval = setInterval(refreshActiveTab, 45000); // refresh every 45 seconds
    return () => clearInterval(interval);
  }, [activeTab, userId, effectiveUserId]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") refreshActiveTab();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [activeTab, userId, effectiveUserId]);

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

  // Ensure categories are loaded when the inline mobile filters are opened (only if not already loaded)
  useEffect(() => {
    // Don't reload if categories are already loaded
    if (categories.length > 0) return;
    
    const loadCats = async () => {
      try {
        setCategoriesLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          setCategoriesLoading(false);
          return;
        }
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
        const res = await fetch(`${API_BASE}/get-all-categories/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const json = await res.json();
          console.log("📂 Mobile categories response:", json);
          
          // Try multiple response structures
          const cats = json?.data?.categories || 
                      json?.data || 
                      json?.categories ||
                      json || 
                      [];
          
          if (Array.isArray(cats) && cats.length > 0) {
            // Normalize category objects
            const normalized = cats.map((cat: any) => ({
              id: cat.id || cat.category_id || cat._id || String(cat),
              name: cat.name || cat.category_name || cat.title || String(cat)
            }));
            setCategories(normalized);
          }
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error("Mobile categories fetch error:", error);
        }
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    // Only load on mobile if filters are shown and categories haven't been loaded yet
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
    if (!isAuthenticated || !user || !(userId || effectiveUserId)) {
        router.push("/signin");
        return;
      }
    setLoading(false);
    fetchTaskOrders(); // Fetch task orders when user is authenticated
  }, [isAuthenticated, user, userId, effectiveUserId, router]);

  // Fetch categories - load on mount and when user is available
  useEffect(() => {
    if (!user && !userId) return; // Wait for user to be available
    
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn("No token available for categories fetch");
          setCategoriesLoading(false);
          return;
        }
        
        // Try axiosInstance first (better error handling)
        try {
          const response = await axiosInstance.get('/get-all-categories/');
          console.log("📂 Categories API response:", response.data);
          
          if (response.data?.status_code === 200) {
            // Try multiple possible response structures
            const cats = response.data.data?.categories || 
                        response.data.data || 
                        response.data.categories ||
                        response.data || 
                        [];
            
            console.log("📂 Extracted categories:", cats);
            
            if (Array.isArray(cats) && cats.length > 0) {
              // Ensure each category has id and name
              const normalized = cats.map((cat: any) => ({
                id: cat.id || cat.category_id || cat._id || String(cat),
                name: cat.name || cat.category_name || cat.title || String(cat)
              }));
              console.log("📂 Normalized categories:", normalized);
              setCategories(normalized);
              setCategoriesLoading(false);
              return;
            } else {
              console.warn("📂 Categories array is empty or not an array:", cats);
            }
          } else {
            console.warn("📂 Categories API returned non-200 status:", response.data);
          }
        } catch (axiosError: any) {
          console.warn("Axios categories fetch failed, trying fetch API:", axiosError);
          console.warn("Error details:", axiosError.response?.data || axiosError.message);
        }
        
        // Fallback to fetch API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout // 20 second timeout

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
          setCategoriesLoading(false);
          return;
        }

        const result = await fetchResponse.json();
        console.log("📂 Fetch API categories response:", result);
        
        // Handle different response structures
        if (result.status_code === 200) {
          const cats = result.data?.categories || 
                      result.data || 
                      result.categories ||
                      result || 
                      [];
          
          if (Array.isArray(cats) && cats.length > 0) {
            // Ensure each category has id and name
            const normalized = cats.map((cat: any) => ({
              id: cat.id || cat.category_id || cat._id || String(cat),
              name: cat.name || cat.category_name || cat.title || String(cat)
            }));
            console.log("📂 Normalized categories from fetch:", normalized);
            setCategories(normalized);
          } else {
            console.warn("📂 Categories array is empty from fetch API:", cats);
          }
        } else {
          console.warn("📂 Fetch API returned non-200 status:", result);
        }
      } catch (error: any) {
        // Handle AbortError separately (don't show error for timeouts)
        if (error?.name === 'AbortError') {
          console.log("⏰ Fetch categories was aborted (timeout after 90s) - backend may be slow");
        } else {
          console.error("Failed to fetch categories:", error);
          console.error("Error details:", error.response?.data || error.message);
        }
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [user, userId, API_BASE]);

  // Fetch user's posted tasks
  useEffect(() => {
    if (!user || !(userId || effectiveUserId)) return;

    const cacheKey = `user_tasks_${userId || effectiveUserId}`;
    if (refetchPostedTrigger > 0) {
      try { localStorage.removeItem(cacheKey); } catch {}
    }

    const fetchUserTasks = async () => {
      try {
        // Check cache first (skip if we just triggered a refetch)
        const cached = refetchPostedTrigger > 0 ? null : localStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          const cacheAge = Date.now() - cachedData.timestamp;
          if (cacheAge < 30000) { // 30 second cache
            console.log("Using cached user tasks");
            setPostedTasks(cachedData.tasks);
            return;
          }
        }
        
        // Use the faster get-all-jobs-admin API with better filtering
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const fetchResponse = await fetch(`${API_BASE}/get-user-jobs/${userId || effectiveUserId}/`, {
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
            const me = (userId || effectiveUserId)?.toString();
            return jobUserId === me;
          });
          
          console.log(`🔍 Found ${userJobs.length} tasks for user ${userId || effectiveUserId} out of ${result.data.jobs.length} total jobs`);
          
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
            
            // Check cancellation status FIRST (for both pre-payment and post-payment)
            // Backend may return cancel_status as boolean, string, or in status field
            const isCancelled = 
              job.cancel_status === true || 
              job.cancel_status === "true" || 
              job.cancel_status === 1 ||
              job.status === "cancelled" || 
              job.status === "Cancelled" ||
              job.status === "canceled" ||
              job.status === "Canceled" ||
              job.cancelled === true ||
              job.cancelled === "true";
            
            if (isCancelled) {
              jobStatus = "canceled";
              console.log(`✅ Task ${job.job_id} marked as cancelled (pre or post payment):`, {
                cancel_status: job.cancel_status,
                status: job.status,
                cancelled: job.cancelled
              });
            } else if (job.job_completion_status === 1) {
              jobStatus = "completed";
            } else if (job.deletion_status) {
              jobStatus = "deleted";
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
            

            // Determine if this job is assigned to current user (tasker) - handle multiple backend field variants
            const possibleTaskerIds = [
              job.assigned_tasker_id,
              job.assigned_user_id,
              job.assigned_to,
              job.accepted_bidder_id,
              job.tasker_id,
              job.executor_id,
            ].filter((v: any) => v !== undefined && v !== null);
            const normalizedUserId = userId != null ? String(userId).trim() : "";
            const assignedToMe = possibleTaskerIds.some((v: any) => String(v).trim() === normalizedUserId);
            if (jobStatus === "completed" && !assignedToMe) {
              console.debug("Completed job not linked to current tasker", {
                job_id: job.job_id,
                possibleTaskerIds,
                normalizedUserId,
              });
            }

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
              postedAtSortValue: (() => {
                const raw = job.created_at || job.timestamp || job.job_due_date;
                try { return raw ? new Date(raw).getTime() : 0; } catch { return 0; }
              })(),
              offers: job.offers || 0, // Use original offers field as fallback
              posted_by: job.posted_by || "Unknown",
              category: job.job_category || "general",
              job_completion_status: job.job_completion_status === 1 || job.job_completion_status === "1" ? "1" : String(job.job_completion_status ?? ""),
              tasker_completed: Boolean((job as any).tasker_completed),
              taskmaster_completed: Boolean((job as any).taskmaster_completed),
              deletion_status: job.deletion_status || false,
              cancel_status: isCancelled || (job.cancel_status ?? false), // Use comprehensive cancellation check
              cancelled_by_role: job.cancelled_by_role || job.cancelled_by || undefined,
              cancellation_reason: job.cancellation_reason || job.cancellationReason || undefined,
              cancelled_at: job.cancelled_at || job.cancelledAt || undefined,
              cancelled: isCancelled,
              images: job.job_images?.urls?.length
                ? job.job_images.urls.map((url: string, index: number) => ({
                    id: `img${index + 1}`,
                    url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url,
                    alt: `Job image ${index + 1}`,
                  }))
                : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
              assignedToMe,
              assigned_tasker_id: job.assigned_tasker_id || job.accepted_bidder_id || job.assigned_user_id || job.confirmed_bid_id,
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
  }, [user, userId, effectiveUserId, taskOrders, refetchPostedTrigger]);

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
  useEffect(() => {
    if (!user || !(userId || effectiveUserId)) return;

    const fetchAllTasks = async () => {
      try {
        
        // Use fetch API directly to bypass axios CORS issues
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout
        
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
          const tasks: Task[] = result.data.jobs
            .filter((job: any) => {
              const jobPostedById = job.user_ref_id;
              const currentUserId = (userId || effectiveUserId)?.toString();
              const isNotPostedByUser = jobPostedById !== currentUserId;
              const isOpen = job.job_completion_status !== 1 && 
                           !job.deletion_status && 
                           !job.cancel_status;
              return isNotPostedByUser && isOpen;
            })
            .map((job: any) => {
              let jobStatus = "open";
              
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
              
              // Posted date should come from creation timestamp, not due date
              const postedMeta = formatTimestampValue(
                job.tstamp || job.timestamp || job.created_at || job.job_tstamp || job.job_due_date
              );

              return {
                id: job.job_id.toString(),
                title: job.job_title || "Untitled",
                description: job.job_description || "No description provided.",
                budget: Number(job.job_budget) || 0,
                location: job.job_location || "Unknown",
                status: jobStatus,
                postedAt: postedMeta.formatted,
                postedAtSortValue: postedMeta.sortValue,
                postedAtISO: postedMeta.iso,
                dueDate: job.job_due_date
                  ? new Date(job.job_due_date).toLocaleDateString("en-GB")
                  : "Unknown",
                offers: job.offers || 0, // Use original offers field as fallback
                posted_by: job.posted_by || "Unknown",
                posted_by_profile_image: job.posted_by_profile_image || job.taskmanager_profile_image || job.taskmanager_profile_img || job.poster?.profile_img || job.poster?.profile_image || job.profile_img || job.user_profile_img,
                posted_by_id: job.user_ref_id || job.posted_by_id || job.user_id,
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

          const availableTasksWithBidCounts = tasks;
          // Store in localStorage for persistence
          localStorage.setItem('availableTasks', JSON.stringify(availableTasksWithBidCounts));
          localStorage.setItem('availableTasksTimestamp', Date.now().toString());
          
          setAvailableTasks(availableTasksWithBidCounts);
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
        // Quiet down the UI: log the issue but avoid spamming the user with toasts
      } finally {
        console.log("🔍 fetchAllTasks completed");
        // avoid global loader flicker
      }
    };

    fetchAllTasks();
  }, [user, userId, refetchAvailableTrigger]);

  // Fetch user's bids
  useEffect(() => {
    if (!user || !(userId || effectiveUserId)) return;

    const fetchBids = async () => {
      try {
        // Use fetch API directly to bypass axios timeout issues
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const fetchResponse = await fetch(`${API_BASE}/get-user-bids/${userId || effectiveUserId}/`, {
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
            status: bid.status || "pending",
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
  }, [user, userId, effectiveUserId, refetchBidsTrigger]);

  // Fetch assigned tasks
  useEffect(() => {
    if (!user || !(userId || effectiveUserId)) return;

    const fetchAssignedBids = async () => {
      const targetUserId = userId || effectiveUserId;
      if (!targetUserId) {
        console.warn("⚠️ Cannot fetch assigned tasks: No userId available");
        return;
      }

      try {
        // Use fetch API directly to bypass axios timeout issues
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        const url = `${API_BASE}/get-user-assigned-bids/${targetUserId}/`;
        console.log("📋 Fetching assigned tasks from:", url, "for userId:", targetUserId);

        const fetchResponse = await fetch(url, {
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
          console.error("❌ Fetch assigned bids failed with status:", fetchResponse.status, fetchResponse.statusText);
          const errorText = await fetchResponse.text();
          console.error("Error response:", errorText);
          return;
        }

        const result = await fetchResponse.json();
        console.log("📋 Assigned tasks API response (FULL):", JSON.stringify(result, null, 2));
        console.log("📋 Assigned tasks API response (SUMMARY):", {
          status_code: result.status_code,
          status: result.status,
          hasData: !!result.data,
          dataType: typeof result.data,
          dataKeys: result.data ? Object.keys(result.data) : [],
          jobsType: Array.isArray(result.data?.jobs) ? 'array' : typeof result.data?.jobs,
          jobsLength: Array.isArray(result.data?.jobs) ? result.data.jobs.length : 'N/A',
          message: result.message
        });

        // Handle different response formats - don't require status_code === 200
        let jobsArray: any[] = [];
        
        // Try different possible response structures regardless of status_code
        if (Array.isArray(result.data?.jobs)) {
          jobsArray = result.data.jobs;
          console.log("✅ Found jobs in result.data.jobs:", jobsArray.length);
        } else if (Array.isArray(result.data)) {
          jobsArray = result.data;
          console.log("✅ Found jobs in result.data (direct array):", jobsArray.length);
        } else if (Array.isArray(result.jobs)) {
          jobsArray = result.jobs;
          console.log("✅ Found jobs in result.jobs:", jobsArray.length);
        } else if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
          // Check if jobs are nested differently
          const possibleJobs = result.data.jobs || result.data.assigned_jobs || result.data.assigned_tasks || result.data.assigned_bids || [];
          if (Array.isArray(possibleJobs)) {
            jobsArray = possibleJobs;
            console.log("✅ Found jobs in nested structure:", jobsArray.length);
          } else {
            // Try to find any array in the data object
            for (const key in result.data) {
              if (Array.isArray(result.data[key])) {
                console.log(`✅ Found array in result.data.${key}:`, result.data[key].length);
                jobsArray = result.data[key];
                break;
              }
            }
          }
        } else if (Array.isArray(result)) {
          // Response might be a direct array
          jobsArray = result;
          console.log("✅ Response is direct array:", jobsArray.length);
        }

        console.log("📋 Processed jobs array length:", jobsArray.length);
        
        // If no jobs found but status_code is 200, log warning
        if (jobsArray.length === 0 && result.status_code === 200) {
          console.warn("⚠️ API returned status_code 200 but no jobs found. Full response:", result);
        }

        if (jobsArray.length > 0) {
          console.log("📋 Processing", jobsArray.length, "jobs from API");
          const taskPromises = jobsArray
            .filter((job: any) => {
              // Only filter out if explicitly deleted (keep cancelled tasks visible)
              const isDeleted = job.deletion_status === true || job.deletion_status === 1 || job.deleted === true;
              
              // Log all tasks for debugging
              console.log("🔍 Checking assigned task:", {
                job_id: job.job_id || job.id,
                title: job.job_title || job.title,
                deletion_status: job.deletion_status,
                cancel_status: job.cancel_status,
                cancelled_by_role: job.cancelled_by_role,
                isDeleted,
                willShow: !isDeleted
              });
              
              if (isDeleted) {
                console.log("⚠️ Filtering out deleted task:", job.job_id || job.id);
                return false;
              }
              return true; // Show cancelled tasks too
            })
            .map(async (job: any) => {
              console.log("✅ Processing assigned task:", job.job_id, job.job_title);
              
              // If cancellation fields are missing, try to fetch full task details
              let cancellationInfo = {
                cancel_status: job.cancel_status,
                cancelled_by_role: job.cancelled_by_role,
                cancellation_reason: job.cancellation_reason,
                cancelled_at: job.cancelled_at,
                cancelled: job.cancelled
              };
              
              // If cancellation info is missing, try to fetch from get-all-jobs-admin or get-user-jobs
              if (!job.cancel_status && !job.cancelled_by_role && !job.cancelled) {
                try {
                  const token = localStorage.getItem('token');
                  const fullTaskResponse = await fetch(`${API_BASE}/get-all-jobs-admin/`, {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    credentials: 'omit'
                  });
                  
                  if (fullTaskResponse.ok) {
                    const fullTaskResult = await fullTaskResponse.json();
                    if (fullTaskResult.status_code === 200 && fullTaskResult.data?.jobs) {
                      const fullTask = fullTaskResult.data.jobs.find((t: any) => t.job_id === job.job_id);
                      if (fullTask) {
                        cancellationInfo = {
                          cancel_status: fullTask.cancel_status,
                          cancelled_by_role: fullTask.cancelled_by_role,
                          cancellation_reason: fullTask.cancellation_reason,
                          cancelled_at: fullTask.cancelled_at,
                          cancelled: fullTask.cancelled
                        };
                        console.log(`✅ Found cancellation info for ${job.job_id}:`, cancellationInfo);
                      }
                    }
                  }
                } catch (err) {
                  console.warn(`⚠️ Failed to fetch full task details for ${job.job_id}:`, err);
                }
              }
              
              const rawDate = job.created_at || job.timestamp || job.job_due_date || job.updated_at || job.postedAt;
              let postedAtFormatted = "Unknown";
              let postedAtSortValue = 0;
              let postedAtISO = "";
              
              try {
                if (rawDate) {
                  const dateObj = new Date(rawDate);
                  if (!isNaN(dateObj.getTime())) {
                    postedAtFormatted = dateObj.toLocaleDateString("en-GB");
                    postedAtSortValue = dateObj.getTime();
                    postedAtISO = dateObj.toISOString();
                  } else if (typeof rawDate === "string") {
                    postedAtFormatted = rawDate;
                  }
                }
              } catch {
                if (typeof rawDate === "string") {
                  postedAtFormatted = rawDate;
                }
              }

              // Check if cancelled - comprehensive check (same as in rendering)
              // Also check if cancelled_by_role or cancellation_reason exists (indicates cancellation)
              const isCancelled = 
                cancellationInfo.cancel_status === true || 
                cancellationInfo.cancel_status === "true" || 
                cancellationInfo.cancel_status === 1 ||
                job.status === "cancelled" || 
                job.status === "Cancelled" ||
                job.status === "canceled" ||
                job.status === "Canceled" ||
                cancellationInfo.cancelled === true ||
                cancellationInfo.cancelled === "true" ||
                // Check if cancelled_by_role exists (indicates cancellation even if other fields are undefined)
                (cancellationInfo.cancelled_by_role !== undefined && cancellationInfo.cancelled_by_role !== null) ||
                // Check if cancellation_reason exists (indicates cancellation)
                (cancellationInfo.cancellation_reason !== undefined && cancellationInfo.cancellation_reason !== null && cancellationInfo.cancellation_reason !== "");
              
              console.log(`🔍 Assigned Task ${job.job_id} cancellation check:`, {
                job_id: job.job_id,
                cancel_status: cancellationInfo.cancel_status,
                status: job.status,
                status_type: typeof job.status,
                cancelled: cancellationInfo.cancelled,
                cancelled_by_role: cancellationInfo.cancelled_by_role,
                cancellation_reason: cancellationInfo.cancellation_reason,
                isCancelled,
                willShowAsCancelled: isCancelled,
                fullJob: job, // Log full job object to see all available fields
                cancellationInfo: cancellationInfo
              });
              
              return {
                id: job.job_id?.toString() || job.id?.toString() || String(Math.random()),
                title: job.job_title || job.title || "Untitled",
                description: job.job_description || job.description || "No description provided.",
                budget: Number(job.job_budget || job.budget || 0),
                location: job.job_location || job.location || "Unknown",
                // Set status based on cancellation
                status: isCancelled ? "canceled" : (job.status ? "in_progress" : "open"),
                postedAt: postedAtFormatted,
                postedAtSortValue: postedAtSortValue,
                postedAtISO: postedAtISO,
                dueDate: job.job_due_date || job.dueDate
                  ? new Date(job.job_due_date || job.dueDate).toLocaleDateString("en-GB")
              : "Unknown",
            offers: job.offers?.length || 0,
                posted_by: job.posted_by || job.postedBy || "Unknown",
                category: job.job_category || job.category || "general",
                job_completion_status: job.job_completion_status?.toString() || job.status?.toString() || undefined,
                tasker_completed: Boolean((job as any).tasker_completed),
                taskmaster_completed: Boolean((job as any).taskmaster_completed),
            deletion_status: job.deletion_status || false,
                cancel_status: isCancelled || (cancellationInfo.cancel_status ?? false),
                cancelled_by_role: cancellationInfo.cancelled_by_role || job.cancelled_by || undefined,
                cancellation_reason: cancellationInfo.cancellation_reason || job.cancellationReason || undefined,
                cancelled_at: cancellationInfo.cancelled_at || job.cancelledAt || undefined,
                cancelled: isCancelled,
                assignedToMe: true, // Mark as assigned to current user
                user_ref_id: job.user_ref_id || job.posted_by_id || job.user_id,
            images: job.job_images?.urls?.length
              ? job.job_images.urls.map((url: string, index: number) => ({
                  id: `img${index + 1}`,
                  url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url,
                  alt: `Job image ${index + 1}`,
                }))
                  : job.images?.length
                  ? job.images.map((img: any, index: number) => ({
                      id: `img${index + 1}`,
                      url: typeof img === "string" ? img : img.url || "/images/placeholder.svg",
                  alt: `Job image ${index + 1}`,
                }))
              : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
              } as Task;
            });
          
          // Wait for all async operations to complete
          const resolvedTasks: Task[] = await Promise.all(taskPromises);
          
          console.log("✅ Setting assigned tasks:", resolvedTasks.length, "tasks");
          setAssignedTasks(resolvedTasks);
          try { 
            sessionStorage.setItem("assignedTasks", JSON.stringify(resolvedTasks)); 
            console.log("✅ Saved assigned tasks to sessionStorage");
          } catch (e) {
            console.warn("⚠️ Failed to save to sessionStorage:", e);
          }
        } else {
          console.warn("⚠️ No assigned tasks found. Response details:", {
            status_code: result.status_code,
            status: result.status,
            message: result.message,
            hasData: !!result.data,
            dataType: typeof result.data,
            dataKeys: result.data ? Object.keys(result.data) : [],
            fullResponse: result
          });
          
          // Try fallback: use axiosInstance in case fetch has issues
          console.log("🔄 Trying fallback with axiosInstance...");
          try {
            const axiosResponse = await axiosInstance.get(`/get-user-assigned-bids/${targetUserId}/`);
            const axiosResult = axiosResponse.data;
            console.log("📋 Axios fallback response:", axiosResult);
            
            // Try to extract jobs from axios response
            let fallbackJobs: any[] = [];
            if (Array.isArray(axiosResult.data?.jobs)) {
              fallbackJobs = axiosResult.data.jobs;
            } else if (Array.isArray(axiosResult.data)) {
              fallbackJobs = axiosResult.data;
            } else if (Array.isArray(axiosResult.jobs)) {
              fallbackJobs = axiosResult.jobs;
            }
            
            if (fallbackJobs.length > 0) {
              console.log("✅ Found", fallbackJobs.length, "jobs via axios fallback");
              // Process fallback jobs (reuse the same mapping logic)
              const fallbackTasks: Task[] = fallbackJobs
                .filter((job: any) => {
                  // Only filter out deleted tasks (keep cancelled tasks visible)
                  const isDeleted = job.deletion_status === true || job.deletion_status === 1;
                  return !isDeleted;
                })
                .map((job: any) => {
                  // Use same mapping logic as above
                  const rawDate = job.created_at || job.timestamp || job.job_due_date || job.updated_at || job.postedAt;
                  let postedAtFormatted = "Unknown";
                  let postedAtSortValue = 0;
                  let postedAtISO = "";
                  
                  try {
                    if (rawDate) {
                      const dateObj = new Date(rawDate);
                      if (!isNaN(dateObj.getTime())) {
                        postedAtFormatted = dateObj.toLocaleDateString("en-GB");
                        postedAtSortValue = dateObj.getTime();
                        postedAtISO = dateObj.toISOString();
                      } else if (typeof rawDate === "string") {
                        postedAtFormatted = rawDate;
                      }
                    }
                  } catch {
                    if (typeof rawDate === "string") {
                      postedAtFormatted = rawDate;
                    }
                  }

                  // Check if cancelled - comprehensive check (same as above)
                  const isCancelled = 
                    job.cancel_status === true || 
                    job.cancel_status === "true" || 
                    job.cancel_status === 1 ||
                    job.status === "cancelled" || 
                    job.status === "Cancelled" ||
                    job.status === "canceled" ||
                    job.status === "Canceled" ||
                    job.cancelled === true ||
                    job.cancelled === "true" ||
                    // Check if cancelled_by_role exists (indicates cancellation even if other fields are undefined)
                    (job.cancelled_by_role !== undefined && job.cancelled_by_role !== null) ||
                    // Check if cancellation_reason exists (indicates cancellation)
                    (job.cancellation_reason !== undefined && job.cancellation_reason !== null && job.cancellation_reason !== "");

                  return {
                    id: job.job_id?.toString() || job.id?.toString() || String(Math.random()),
                    title: job.job_title || job.title || "Untitled",
                    description: job.job_description || job.description || "No description provided.",
                    budget: Number(job.job_budget || job.budget || 0),
                    location: job.job_location || job.location || "Unknown",
                    status: isCancelled ? "canceled" : (job.status ? "in_progress" : "open"),
                    postedAt: postedAtFormatted,
                    postedAtSortValue: postedAtSortValue,
                    postedAtISO: postedAtISO,
                    dueDate: job.job_due_date || job.dueDate
                      ? new Date(job.job_due_date || job.dueDate).toLocaleDateString("en-GB")
                      : "Unknown",
                    offers: job.offers?.length || 0,
                    posted_by: job.posted_by || job.postedBy || "Unknown",
                    category: job.job_category || job.category || "general",
                    job_completion_status: job.job_completion_status?.toString() || job.status?.toString() || undefined,
                    tasker_completed: Boolean((job as any).tasker_completed),
                    taskmaster_completed: Boolean((job as any).taskmaster_completed),
                    deletion_status: job.deletion_status || false,
                    cancel_status: isCancelled || (job.cancel_status ?? false),
                    cancelled_by_role: job.cancelled_by_role || job.cancelled_by || undefined,
                    cancellation_reason: job.cancellation_reason || job.cancellationReason || undefined,
                    cancelled_at: job.cancelled_at || job.cancelledAt || undefined,
                    cancelled: isCancelled,
                    assignedToMe: true,
                    images: job.job_images?.urls?.length
                      ? job.job_images.urls.map((url: string, index: number) => ({
                          id: `img${index + 1}`,
                          url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url,
                          alt: `Job image ${index + 1}`,
                        }))
                      : job.images?.length
                      ? job.images.map((img: any, index: number) => ({
                          id: `img${index + 1}`,
                          url: typeof img === "string" ? img : img.url || "/images/placeholder.svg",
                          alt: `Job image ${index + 1}`,
                        }))
                      : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
                  } as Task;
                });
              
              if (fallbackTasks.length > 0) {
                console.log("✅ Setting assigned tasks from fallback:", fallbackTasks.length, "tasks");
                setAssignedTasks(fallbackTasks);
                try { 
                  sessionStorage.setItem("assignedTasks", JSON.stringify(fallbackTasks)); 
                } catch {}
                return; // Exit early if fallback succeeded
              }
            }
          } catch (fallbackErr) {
            console.error("❌ Axios fallback also failed:", fallbackErr);
          }
          
          // Clear assigned tasks if API returns empty and fallback failed
          setAssignedTasks([]);
          try { sessionStorage.removeItem("assignedTasks"); } catch {}
        }
      } catch (err) {
        // Handle AbortError separately (don't show error for timeouts)
        if ((err as any)?.name === 'AbortError') {
          console.log("⏰ Fetch assigned bids was aborted (timeout)");
          return;
        }
        console.error("❌ Failed to fetch assigned tasks:", {
          error: err,
          message: (err as any)?.message,
          stack: (err as any)?.stack
        });
      }
    };

    fetchAssignedBids();
  }, [user, userId, effectiveUserId, refetchAssignedTrigger]);

  // Fetch requested bids
  useEffect(() => {
    if (!user || !userId) return;

    const fetchRequestedBids = async () => {
      try {
        // Use fetch API directly to bypass axios timeout issues
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

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
            created_at_sort_value: bid.created_at ? new Date(bid.created_at).getTime() : 0,
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
  }, [user, userId, refetchBidsTrigger]);

  // Fetch completed tasks using the dedicated endpoint
  // Endpoint: /fetch-completed-tasks/{user_id}/
  // Returns tasks where:
  // - job_completion_status == 1
  // - User is poster (user_ref_id == user_id) OR tasker (confirmed_bid_id == user_id)
  const fetchCompletedTasks = async () => {
    if (!userId) return;
    
    // Prevent multiple simultaneous calls
    if (completedTasksLoading) {
      console.log("⏸️ Fetch completed tasks already in progress, skipping...");
      return;
    }

    try {
      setCompletedTasksLoading(true);
      
      // Fetch directly from API - no caching
      const token = localStorage.getItem('token');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

      console.log("Fetching completed tasks from dedicated endpoint...");
      let completedForMe: Task[] = [];
      
      try {
        // Use the dedicated completed tasks endpoint
        // This endpoint already filters for completed tasks where user is poster or tasker
        const fetchResponse = await fetch(`${API_BASE}/fetch-completed-tasks/${userId}/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'omit',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (fetchResponse.ok) {
          const result = await fetchResponse.json();
          console.log("✅ Completed tasks API response (FULL):", JSON.stringify(result, null, 2));
          console.log("✅ Completed tasks API response (SUMMARY):", {
            status_code: result.status_code,
            status: result.status,
            hasData: !!result.data,
            dataType: typeof result.data,
            dataKeys: result.data ? Object.keys(result.data) : [],
            jobsType: Array.isArray(result.data?.jobs) ? 'array' : typeof result.data?.jobs,
            jobsLength: Array.isArray(result.data?.jobs) ? result.data.jobs.length : 'N/A',
            message: result.message
          });

          // Handle different response formats - don't require status_code === 200
          let jobsArray: any[] = [];
          
          // Try different possible response structures
          if (Array.isArray(result.data?.jobs)) {
            jobsArray = result.data.jobs;
            console.log("✅ Found jobs in result.data.jobs:", jobsArray.length);
          } else if (Array.isArray(result.data)) {
            jobsArray = result.data;
            console.log("✅ Found jobs in result.data (direct array):", jobsArray.length);
          } else if (Array.isArray(result.jobs)) {
            jobsArray = result.jobs;
            console.log("✅ Found jobs in result.jobs:", jobsArray.length);
          } else if (result.data && typeof result.data === 'object' && !Array.isArray(result.data)) {
            // Check if jobs are nested differently
            const possibleJobs = result.data.jobs || result.data.completed_jobs || result.data.user_jobs || [];
            if (Array.isArray(possibleJobs)) {
              jobsArray = possibleJobs;
              console.log("✅ Found jobs in nested structure:", jobsArray.length);
            } else {
              // Try to find any array in the data object
              for (const key in result.data) {
                if (Array.isArray(result.data[key])) {
                  console.log(`✅ Found array in result.data.${key}:`, result.data[key].length);
                  jobsArray = result.data[key];
                  break;
                }
              }
            }
          } else if (Array.isArray(result)) {
            // Response might be a direct array
            jobsArray = result;
            console.log("✅ Response is direct array:", jobsArray.length);
          }

          console.log("📋 Processing", jobsArray.length, "jobs for completed tasks");

          if (jobsArray.length > 0) {
            // First, get the basic task data
            const tasks: Task[] = jobsArray.map((job: any) => {
              console.log("🔍 Processing job for completed tasks:", {
                job_id: job.job_id || job.id,
                title: job.job_title || job.title,
                job_completion_status: job.job_completion_status,
                status: job.status
              });
              let jobStatus = "open";
              
              // Check if this task has a paid order - use correct field name
              const hasPaidOrder = taskOrders.some(order => {
                const orderTaskId = order.job_id || order.postId || order.post_id || order.task_id;
                // Status 1 = Completed/Paid, Status 0 = Processing
                const isPaid = order.status === 1 || order.status === "1" || order.status === 0;
                const isMatching = orderTaskId === job.job_id.toString();
                
                return isMatching && isPaid;
              });
              
              // Since this endpoint only returns completed tasks (job_completion_status == 1),
              // we can assume all tasks are completed
              // But still check to be safe
              const completionStatus = job.job_completion_status === 1 || 
                                      job.job_completion_status === "1" || 
                                      job.completion_status === 1 ||
                                      job.completion_status === "1" ||
                                      job.status === "completed" ||
                                      job.status === "Completed" ||
                                      job.job_status === "completed";
              
              // All tasks from this endpoint should be completed
                jobStatus = "completed";
              console.log("✅ Job from completed tasks endpoint:", job.job_id || job.id);
              
              // Normalize poster and tasker ids based on API field variations
              const possiblePosterIds = [
                job.user_ref_id,
                job.posted_by_id,
                job.user_id,
                job.taskmanager_id,
              ].filter((v: any) => v !== undefined && v !== null);
              const possibleTaskerIds2 = [
                job.assigned_tasker_id,
                job.assigned_user_id,
                job.assigned_to,
                job.accepted_bidder_id,
                job.confirmed_bid_id, // Endpoint uses this to identify tasker - CHECK THIS FIRST
                job.tasker_id,
                job.executor_id,
              ].filter((v: any) => v !== undefined && v !== null);
              const normalizedUserId2 = userId != null ? String(userId).trim() : "";
              
              // For /fetch-completed-tasks/ endpoint:
              // If confirmed_bid_id == user_id, user is the tasker
              // If user_ref_id == user_id, user is the poster
              // The API also returns a "role" field: "poster" or "tasker"
              // Priority: If user is tasker (confirmed_bid_id OR role == "tasker"), they should see it in Completed Tasks
              const isTasker = job.confirmed_bid_id && String(job.confirmed_bid_id).trim() === normalizedUserId2;
              const isTaskerByRole = job.role === "tasker" || job.role === "Tasker";
              const posterIsMe = possiblePosterIds.some((v: any) => String(v).trim() === normalizedUserId2);
              const isPosterByRole = job.role === "poster" || job.role === "Poster";
              const assignedToMe = isTasker || isTaskerByRole || possibleTaskerIds2.some((v: any) => String(v).trim() === normalizedUserId2);

              console.log("🔍 Task identification (DETAILED):", {
                job_id: job.job_id,
                title: job.job_title,
                confirmed_bid_id: job.confirmed_bid_id,
                assigned_tasker_id: job.assigned_tasker_id,
                accepted_bidder_id: job.accepted_bidder_id,
                user_ref_id: job.user_ref_id,
                posted_by_id: job.posted_by_id,
                role: job.role, // API provides role field
                userId: normalizedUserId2,
                isTasker: isTasker,
                isTaskerByRole: isTaskerByRole,
                posterIsMe: posterIsMe,
                isPosterByRole: isPosterByRole,
                assignedToMe: assignedToMe,
                possiblePosterIds: possiblePosterIds,
                possibleTaskerIds: possibleTaskerIds2
              });

              return {
                id: job.job_id?.toString() || job.id?.toString() || String(Math.random()),
                title: job.job_title || job.title || "Untitled",
                description: job.job_description || job.description || "No description provided.",
                budget: Number(job.job_budget || job.budget || 0),
                location: job.job_location || job.location || "Unknown",
                status: jobStatus,
                job_completion_status: job.job_completion_status?.toString() || job.status?.toString() || undefined,
                postedAt: (() => {
                  const raw = job.job_due_date || job.created_at || job.timestamp || job.postedAt;
                  try {
                  return raw ? new Date(raw).toLocaleDateString("en-GB") : "Unknown";
                  } catch {
                    return typeof raw === "string" && raw ? raw : "Unknown";
                  }
                })(),
                postedAtSortValue: (() => {
                  const raw = job.updated_at || job.completed_at || job.completed_date || job.created_at || job.timestamp || job.job_due_date;
                  try { return raw ? new Date(raw).getTime() : 0; } catch { return 0; }
                })(),
                dueDate: job.job_due_date || job.dueDate
                  ? new Date(job.job_due_date || job.dueDate).toLocaleDateString("en-GB")
                  : undefined,
                completedDate: jobStatus === "completed" ? (() => {
                  const raw = job.updated_at || job.completed_at || job.completed_date;
                  try {
                  return raw ? new Date(raw).toLocaleDateString("en-GB") : "Unknown";
                  } catch {
                    return typeof raw === "string" && raw ? raw : "Unknown";
                  }
                })() : undefined,
                offers: job.offers?.length || job.offer_count || 0,
                posted_by: job.posted_by || job.postedBy || job.user_name || "Unknown",
                category: job.job_category || job.category || "general",
                images: job.images && Array.isArray(job.images) && job.images.length > 0
                  ? job.images.map((url: string, index: number) => ({
                      id: `img${index + 1}`,
                      url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url,
                      alt: `Job image ${index + 1}`,
                    }))
                  : job.job_images?.urls?.length
                  ? job.job_images.urls.map((url: string, index: number) => ({
                      id: `img${index + 1}`,
                      url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url,
                      alt: `Job image ${index + 1}`,
                    }))
                  : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
                deletion_status: job.deletion_status || false,
                cancel_status: job.cancel_status ?? false,
                assignedToMe,
                _posterIsMe: posterIsMe,
                confirmed_bid_id: job.confirmed_bid_id, // Store for direct check in filter
                user_ref_id: job.user_ref_id, // Store for direct check in filter
                role: job.role, // Store API role field ("poster" or "tasker")
              } as Task;
            });

            // Log all tasks for debugging
            console.log("📊 All tasks breakdown:", {
              total: tasks.length,
              completed: tasks.filter(t => t.status === "completed").length,
              assignedToMe: tasks.filter(t => t.assignedToMe).length,
              postedByMe: tasks.filter(t => t._posterIsMe).length,
              completedAndAssigned: tasks.filter(t => t.status === "completed" && t.assignedToMe).length,
              completedAndPosted: tasks.filter(t => t.status === "completed" && t._posterIsMe).length,
              completedTasks: tasks.filter(t => t.status === "completed").map(t => ({
                id: t.id,
                title: t.title,
                assignedToMe: t.assignedToMe,
                _posterIsMe: t._posterIsMe
              }))
            });

            // Include ONLY completed tasks that were assigned to me (tasker completed tasks)
            // Exclude tasks posted by me (taskmaster tasks) - those belong in "My Tasks" tab
            // Use VERY lenient filter: show everything except tasks where we're CERTAIN user is ONLY poster
            console.log("🔍 Filtering completed tasks. Total tasks:", tasks.length);
            console.log("🔍 User ID:", userId);
            console.log("🔍 All tasks from endpoint with full details:", tasks.map(t => ({
              id: t.id,
              title: t.title,
              status: t.status,
              job_completion_status: t.job_completion_status,
              assignedToMe: t.assignedToMe,
              _posterIsMe: t._posterIsMe
            })));
            
            // TEMPORARY: Show ALL completed tasks from endpoint to debug
            // The endpoint /fetch-completed-tasks/ returns tasks where user is poster OR tasker
            // So if a task is in the response, user is involved - show it unless we're CERTAIN it's only a poster task
            console.log("🔍 DEBUG: Showing all tasks from endpoint (temporary for debugging)");
            
            // Filter: Show only tasks where user is the TASKER (not poster)
            // The endpoint returns tasks where user is EITHER poster OR tasker
            // We only want tasks where confirmed_bid_id === user_id (user is tasker)
            console.log("🔍 Filtering completed tasks - showing only tasker tasks");
            console.log("🔍 Total tasks from API:", tasks.length);
            console.log("🔍 User ID:", userId);
            console.log("🔍 All tasks details:", tasks.map(t => ({
              id: t.id,
              title: t.title,
              status: t.status,
              job_completion_status: t.job_completion_status,
              confirmed_bid_id: t.confirmed_bid_id,
              user_ref_id: t.user_ref_id,
              role: t.role,
              assignedToMe: t.assignedToMe,
              _posterIsMe: t._posterIsMe
            })));
            
            const normalizedUserId = userId != null ? String(userId).trim() : "";
            
            completedForMe = tasks.filter((t) => {
              // Check if task is completed
              const isCompleted = 
                t.status === "completed" || 
                t.status === "Completed" ||
                t.job_completion_status === "1" ||
                t.job_completion_status === "Completed";
              
              if (!isCompleted) {
                console.log("⚠️ Task not marked as completed, excluding:", {
                  id: t.id,
                  title: t.title,
                  status: t.status,
                  job_completion_status: t.job_completion_status
                });
                return false;
              }
              
              // STANDARD FILTER: Only show tasks where user is the TASKER
              // Check confirmed_bid_id - if it matches user_id, user is the tasker
              const isTasker = t.confirmed_bid_id && String(t.confirmed_bid_id).trim() === normalizedUserId;
              
              if (isTasker) {
                console.log("✅ Including completed task (user is tasker - confirmed_bid_id matches):", {
                  id: t.id,
                  title: t.title,
                  confirmed_bid_id: t.confirmed_bid_id,
                  user_ref_id: t.user_ref_id,
                  role: t.role,
                  userId: normalizedUserId
                });
                return true;
              }
              
              // Exclude tasks where user is only the poster (not tasker)
              console.log("⚠️ Excluding completed task (user is only poster, not tasker):", {
                id: t.id,
                title: t.title,
                confirmed_bid_id: t.confirmed_bid_id,
                user_ref_id: t.user_ref_id,
                role: t.role,
                userId: normalizedUserId,
                reason: "confirmed_bid_id doesn't match - user is poster, not tasker"
              });
              return false;
            });
            
            console.log("📊 ========== COMPLETED TASKS FILTER SUMMARY ==========");
            console.log("📊 User:", userId);
            console.log("📊 Total tasks from API:", jobsArray.length);
            console.log("📊 Tasks marked as completed:", tasks.filter(t => {
              const isCompleted = t.status === "completed" || t.status === "Completed" || t.job_completion_status === "1" || t.job_completion_status === "Completed";
              return isCompleted;
            }).length);
            console.log("📊 Tasks after filter:", completedForMe.length);
            console.log("📊 Tasks included:", completedForMe.map(t => ({
              id: t.id,
              title: t.title,
              status: t.status,
              confirmed_bid_id: t.confirmed_bid_id,
              user_ref_id: t.user_ref_id,
              assignedToMe: t.assignedToMe,
              _posterIsMe: t._posterIsMe,
              reason: t.confirmed_bid_id && String(t.confirmed_bid_id).trim() === String(userId).trim() 
                ? "confirmed_bid_id matches (tasker)" 
                : t.assignedToMe === true 
                ? "assignedToMe=true (tasker)" 
                : t._posterIsMe === false 
                ? "not posted by me (tasker)" 
                : "other reason"
            })));
            console.log("📊 Tasks excluded:", tasks.filter(t => {
              const isCompleted = t.status === "completed" || t.status === "Completed" || t.job_completion_status === "1" || t.job_completion_status === "Completed";
              if (!isCompleted) return false;
              return !completedForMe.some(ct => ct.id === t.id);
            }).map(t => ({
              id: t.id,
              title: t.title,
              confirmed_bid_id: t.confirmed_bid_id,
              user_ref_id: t.user_ref_id,
              assignedToMe: t.assignedToMe,
              _posterIsMe: t._posterIsMe,
              reason: t.user_ref_id && String(t.user_ref_id).trim() === String(userId).trim() && !(t.confirmed_bid_id && String(t.confirmed_bid_id).trim() === String(userId).trim())
                ? "only poster (not tasker)"
                : "unknown reason"
            })));
            console.log("📊 ====================================================");
            
            // If no tasks found, log warning and try fallback
            if (completedForMe.length === 0 && jobsArray.length > 0) {
              console.warn("⚠️ No completed tasks passed filter! All tasks were filtered out:", {
                totalTasks: jobsArray.length,
                completedTasks: tasks.filter(t => {
                  const isCompleted = t.status === "completed" || t.status === "Completed" || t.job_completion_status === "1" || t.job_completion_status === "Completed";
                  return isCompleted;
                }).length,
                filteredOut: tasks.length - completedForMe.length,
                userId: userId,
                tasksDetails: tasks.map(t => ({
                  id: t.id,
                  title: t.title,
                  role: t.role,
                  confirmed_bid_id: t.confirmed_bid_id,
                  user_ref_id: t.user_ref_id,
                  assignedToMe: t.assignedToMe,
                  _posterIsMe: t._posterIsMe
                }))
              });
            }
            
            // FALLBACK: If endpoint returned 0 tasks OR only poster tasks, try to find old tasker completed tasks
            // by checking assigned tasks that are completed
            if (completedForMe.length === 0) {
              console.log("🔄 Trying fallback: checking assigned tasks for old completed ones...");
              try {
                const fallbackToken = localStorage.getItem('token');
                const fallbackController = new AbortController();
                const fallbackTimeout = setTimeout(() => fallbackController.abort(), 30000);
                
                const fallbackResponse = await fetch(`${API_BASE}/get-user-assigned-bids/${userId}/`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${fallbackToken}`,
                    'Content-Type': 'application/json',
                  },
                  credentials: 'omit',
                  signal: fallbackController.signal
                });
                
                clearTimeout(fallbackTimeout);
                
                if (fallbackResponse.ok) {
                  const fallbackResult = await fallbackResponse.json();
                  console.log("📋 Fallback assigned tasks response:", fallbackResult);
                  
                  // Process fallback response to find completed tasks where user is tasker
                  if (fallbackResult.data?.jobs || fallbackResult.jobs || Array.isArray(fallbackResult.data)) {
                    const fallbackJobs = fallbackResult.data?.jobs || fallbackResult.jobs || fallbackResult.data || [];
                    console.log(`📋 Found ${fallbackJobs.length} assigned tasks in fallback`);
                    
                    const fallbackCompleted = fallbackJobs
                      .filter((job: any) => {
                        const isCompleted = 
                          job.job_completion_status === "1" || 
                          job.job_completion_status === "Completed" ||
                          job.status === "completed" ||
                          job.status === "Completed";
                        const isTasker = job.confirmed_bid_id && String(job.confirmed_bid_id).trim() === String(userId).trim();
                        return isCompleted && isTasker;
                      })
                      .map((job: any) => {
                        // Map to Task format
                        return {
                          id: job.job_id?.toString() || job.id?.toString() || String(Math.random()),
                          title: job.job_title || job.title || "Untitled",
                          description: job.job_description || job.description || "",
                          budget: Number(job.job_budget || job.budget || 0),
                          location: job.job_location || job.location || "Unknown",
                          status: "completed",
                          postedAt: job.created_at || job.posted_at || new Date().toISOString(),
                          postedAtSortValue: job.created_at ? new Date(job.created_at).getTime() : Date.now(),
                          postedAtISO: job.created_at || new Date().toISOString(),
                          offers: 0,
                          posted_by: job.posted_by || "Unknown",
                          category: job.job_category_name || job.category || "Uncategorized",
                          job_completion_status: "1",
                          assignedToMe: true,
                          _posterIsMe: false,
                          confirmed_bid_id: job.confirmed_bid_id,
                          user_ref_id: job.user_ref_id,
                          role: "tasker", // Mark as tasker for filter
                        } as Task;
                      });
                    
                    if (fallbackCompleted.length > 0) {
                      console.log(`✅ Found ${fallbackCompleted.length} old completed tasker tasks from fallback!`);
                      completedForMe = [...completedForMe, ...fallbackCompleted];
                    }
                  }
                }
              } catch (fallbackErr: any) {
                if (fallbackErr?.name !== 'AbortError') {
                  console.warn("Fallback check failed:", fallbackErr);
                }
              }
            }
            
            console.log(`✅ Found ${completedForMe.length} completed tasks from API (assigned: ${tasks.filter(t => t.status === "completed" && t.assignedToMe).length}, posted: ${tasks.filter(t => t.status === "completed" && t._posterIsMe).length})`);
          }
        } else {
          console.warn("Fetch completed tasks failed with status:", fetchResponse.status);
          if (fetchResponse.status === 404) {
            console.warn("⚠️ Endpoint /fetch-completed-tasks/ not found. Falling back to /get-user-jobs/");
            // Fallback: try the old endpoint
            try {
              const fallbackResponse = await fetch(`${API_BASE}/get-user-jobs/${userId}/`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                credentials: 'omit',
                signal: controller.signal
              });
              if (fallbackResponse.ok) {
                const fallbackResult = await fallbackResponse.json();
                console.log("✅ Using fallback endpoint /get-user-jobs/");
                // Process the same way (will be handled by the code below)
                const result = fallbackResult;
                // Continue with existing processing logic...
              }
            } catch (fallbackErr) {
              console.error("Fallback endpoint also failed:", fallbackErr);
            }
          } else if (fetchResponse.status >= 500) {
            toast.error("Server error. Please try again.");
          }
        }
      } catch (fetchErr: any) {
        if (fetchErr?.name === 'AbortError') {
          // Handle AbortError separately (don't show error for timeouts)
          console.log("⏰ Fetch completed tasks was aborted (timeout after 90s) - backend may be slow");
          // Don't show toast - just log it. The user can still see their existing completed tasks.
        } else {
          console.error("Failed to fetch completed tasks:", fetchErr);
          toast.error("Failed to load completed tasks. Please try again.");
        }
      }

      // Merge API data with existing completed tasks to preserve optimistic updates
      // This ensures tasks don't disappear if API hasn't updated yet
      setCompletedTasks((prevCompletedTasks) => {
      const mergedWithReviews = applyLocalPosterReviews(completedForMe);
        
        // Create a map of API tasks by ID for quick lookup
        const apiTaskMap = new Map(mergedWithReviews.map(t => [String(t.id), t]));
        
        // Keep existing tasks that aren't in API response (optimistic updates)
        // Only if they were completed recently (within last 5 minutes)
        const now = Date.now();
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        
        const existingTasksToKeep = prevCompletedTasks.filter((existingTask) => {
          const taskId = String(existingTask.id);
          const isInApiResponse = apiTaskMap.has(taskId);
          
          // If task is in API response, use API version (more up-to-date)
          if (isInApiResponse) {
            const apiTask = apiTaskMap.get(taskId);
            // Double-check API task is actually completed
            const apiIsCompleted = apiTask?.status === "completed" || 
                                  apiTask?.status === "Completed" ||
                                  apiTask?.job_completion_status === "1";
            if (apiIsCompleted) {
              // API says completed, but check if it passed the filter
              // If API version has role="poster" but optimistic has assignedToMe=true, keep optimistic
              const apiRoleIsPoster = apiTask?.role === "poster" || apiTask?.role === "Poster";
              const optimisticIsTasker = existingTask.assignedToMe === true && existingTask._posterIsMe === false;
              
              if (apiRoleIsPoster && optimisticIsTasker) {
                // API incorrectly says poster, but we know user is tasker - keep optimistic version
                console.log("⚠️ API returned task as poster but user is tasker, keeping optimistic version:", {
                  taskId,
                  apiRole: apiTask?.role,
                  optimisticAssignedToMe: existingTask.assignedToMe,
                  optimisticPosterIsMe: existingTask._posterIsMe
                });
                return true; // Keep optimistic version
              }
              
              // API version passed filter and is completed - use it
              return false; // Will be replaced by API version
            } else {
              // API says not completed, but we have it as completed - keep our version
              console.log("⚠️ API task not marked as completed, keeping optimistic version:", taskId);
              return true;
            }
          }
          
          // If task is not in API response, keep it if:
          // 1. It's marked as completed (any form)
          // 2. It was assigned to me (tasker task) OR flags are unclear
          // 3. It's not posted by me (or unclear)
          const isCompleted = existingTask.status === "completed" || 
                             existingTask.status === "Completed" ||
                             existingTask.job_completion_status === "1";
          
          if (isCompleted) {
            // Keep if assigned to me, or if flags are unclear (better to show than hide)
            const shouldKeep = (existingTask.assignedToMe === true) || 
                              (existingTask.assignedToMe !== false && existingTask._posterIsMe !== true);
            
            if (shouldKeep) {
              console.log("📌 Keeping optimistic completed task (not yet in API):", {
                id: existingTask.id,
                title: existingTask.title,
                status: existingTask.status,
                assignedToMe: existingTask.assignedToMe,
                _posterIsMe: existingTask._posterIsMe
              });
              return true;
            }
          }
          
          return false;
        });
        
        // Combine API tasks with kept optimistic tasks
        const allTasks = [...mergedWithReviews, ...existingTasksToKeep];
        
        // Remove duplicates (in case API now includes a task we kept optimistically)
        const uniqueTasks = Array.from(
          new Map(allTasks.map(t => [String(t.id), t])).values()
        );
        
        console.log("📊 Merged completed tasks:", {
          fromApi: mergedWithReviews.length,
          keptOptimistic: existingTasksToKeep.length,
          total: uniqueTasks.length
        });
        
        return uniqueTasks;
      });
      
    } catch (err) {
      console.error("Failed to fetch completed tasks:", err);
      toast.error("Failed to load completed tasks. Please try again.");
    } finally {
      setCompletedTasksLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !userId) return;
    fetchCompletedTasks();
  }, [user, userId, taskOrders, refetchCompletedTrigger]);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completeReviewTask, setCompleteReviewTask] = useState<Task | null>(null);
  const [completeReviewAsTaskmaster, setCompleteReviewAsTaskmaster] = useState(false);

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
        const payload: any = (result as any).data || {};
        const fullyCompleted =
          payload?.job_completion_status === 1 ||
          payload?.job_completion_status === "1";
        const updatedTaskerCompleted =
          payload?.tasker_completed !== undefined
            ? payload.tasker_completed
            : true;
        const updatedTaskmasterCompleted =
          payload?.taskmaster_completed !== undefined
            ? payload.taskmaster_completed
            : false;

        if (fullyCompleted) {
          toast.success("Task marked as complete!");
          const t = assignedTasks.find((task) => task.id === jobId);
          addNotifications([{
            id: `complete-tasker-${jobId}-${Date.now()}`,
            type: "system",
            title: "Task completed",
            description: t ? `"${t.title}" is complete.` : "Task marked as complete.",
            createdAt: new Date().toISOString(),
            read: false,
            link: `/tasks/${jobId}`,
          }]);
        } else {
          toast.success(
            "You marked this task as completed. Waiting for taskmaster confirmation."
          );
        }
        
        // Update assigned tasks: mark tasker_completed and, only when BOTH sides confirmed,
        // move the card to Completed tab.
        const completedTask = assignedTasks.find((task) => task.id === jobId);
        if (completedTask) {
          if (fullyCompleted) {
            // Remove from Assigned and add to Completed
            setAssignedTasks((prev) =>
              prev.filter((task) => String(task.id) !== String(jobId))
            );
            const newCompleted = {
              ...completedTask,
              status: "completed",
              job_completion_status:
                payload?.job_completion_status ?? "1",
              completedDate: new Date().toLocaleDateString("en-GB"),
              postedAtSortValue: completedTask.postedAtSortValue ?? Date.now(),
              assignedToMe: true,
              _posterIsMe: false,
              confirmed_bid_id: userId,
              role: "tasker",
              tasker_completed: updatedTaskerCompleted,
              taskmaster_completed: updatedTaskmasterCompleted,
            } as Task;

            console.log("✅ Moving task to completed (both confirmed):", {
              id: newCompleted.id,
              title: newCompleted.title,
            });

            setCompletedTasks((prev) => {
              const exists = prev.some((t) => String(t.id) === String(jobId));
              if (exists) {
                return prev.map((t) =>
                  String(t.id) === String(jobId) ? newCompleted : t
                );
              }
              return [...prev, newCompleted];
            });

            // Refresh completed tasks from API after marking as complete
            setTimeout(() => {
              fetchCompletedTasks();
            }, 2000);

            // Switch to Completed tab only when fully completed
            setActiveTab("completed");
          } else {
            // Only tasker has confirmed so far – keep card in Assigned tab
            setAssignedTasks((prev) =>
              prev.map((task) =>
                task.id === jobId
                  ? {
                      ...task,
                      tasker_completed: updatedTaskerCompleted,
                      taskmaster_completed: updatedTaskmasterCompleted,
                      job_completion_status:
                        payload?.job_completion_status ??
                        task.job_completion_status,
                    }
                  : task
              )
            );
          }
        }
        // Refetch assigned list so UI stays in sync with backend
        setTimeout(() => setRefetchAssignedTrigger((t) => t + 1), 600);
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
      
      const response = await axiosInstance.put<APIResponse<any>>(`/mark-complete-by-taskmaster/${jobId}/`);

      if (response.data.status_code === 200) {
        toast.dismiss(`my-complete-${jobId}`);
        const payload = (response.data as any)?.data || {};
        const fullyCompleted = payload.job_completion_status === 1 || payload.job_completion_status === "1";

        if (fullyCompleted) {
          toast.success("Task marked as complete!");
          const t = postedTasks.find((task) => task.id === jobId);
          addNotifications([{
            id: `complete-taskmaster-${jobId}-${Date.now()}`,
            type: "system",
            title: "Task completed",
            description: t ? `"${t.title}" is complete.` : "Task marked as complete.",
            createdAt: new Date().toISOString(),
            read: false,
            link: `/tasks/${jobId}`,
          }]);
        } else {
          toast.success("Your confirmation recorded. Task will show as completed once the tasker has also marked it complete.");
        }

        // Find the task
        const completedTask = postedTasks.find((task) => task.id === jobId);
        if (completedTask) {
          const updatedTask = {
            ...completedTask,
            tasker_completed: payload.tasker_completed ?? completedTask.tasker_completed,
            taskmaster_completed: payload.taskmaster_completed ?? true,
            job_completion_status: payload.job_completion_status ?? completedTask.job_completion_status,
            status: fullyCompleted ? "completed" : completedTask.status,
            completedDate: fullyCompleted ? new Date().toLocaleDateString("en-GB") : completedTask.completedDate,
            _posterIsMe: true,
          } as Task;

          if (fullyCompleted) {
            setCompletedTasks((prev) => {
              const exists = prev.some(t => String(t.id) === String(jobId));
              if (exists) {
                return prev.map(t => String(t.id) === String(jobId) ? updatedTask : t);
              }
              return [...prev, updatedTask];
            });
            setTimeout(() => fetchCompletedTasks(), 1000);
          }
        }

        setPostedTasks((prev) =>
          prev.map((task) =>
            task.id === jobId
              ? {
                  ...task,
                  tasker_completed: payload.tasker_completed ?? task.tasker_completed,
                  taskmaster_completed: payload.taskmaster_completed ?? true,
                  job_completion_status: payload.job_completion_status ?? task.job_completion_status,
                  status: fullyCompleted ? "completed" : task.status,
                  completedDate: fullyCompleted ? new Date().toLocaleDateString("en-GB") : task.completedDate,
                }
              : task
          )
        );
        try {
          localStorage.removeItem(`user_tasks_${userId || effectiveUserId}`);
        } catch {}
        setTimeout(() => setRefetchPostedTrigger((t) => t + 1), 600);
      } else {
        toast.dismiss(`my-complete-${jobId}`);
        toast.error(response.data.message || "Failed to mark task as complete");
      }
    } catch (error: any) {
      toast.dismiss(`my-complete-${jobId}`);
      console.error("Error marking task as complete:", error);
      toast.error(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "An error occurred while marking the task as complete"
      );
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleCompleteReviewSubmit = async (rating: number, comment: string) => {
    if (!completeReviewTask) return;
    const jobId = completeReviewTask.id;
    try {
      setCompletingTaskId(jobId);
      const reviewBody = { rating, comment };
      const token = typeof window !== "undefined" && (localStorage.getItem("token") || sessionStorage.getItem("token"));
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["X-Access-Token"] = token;
      }
      if (completeReviewAsTaskmaster) {
        await axiosInstance.put(`/mark-complete-by-taskmaster/${jobId}/`, reviewBody, { headers });
      } else {
        await axiosInstance.put(`/mark-complete/${jobId}/`, reviewBody, { headers });
      }
      toast.success("Task marked complete and review submitted!");
      setCompleteReviewTask(null);
      if (completeReviewAsTaskmaster) {
        const payload = { job_completion_status: 1, tasker_completed: true, taskmaster_completed: true };
        const completedTask = postedTasks.find((t) => t.id === jobId);
        if (completedTask) {
          const updated = { ...completedTask, ...payload, status: "completed", postedAtSortValue: completedTask.postedAtSortValue ?? Date.now() } as Task;
          setCompletedTasks((prev) => [...prev.filter((t) => String(t.id) !== String(jobId)), updated]);
        }
        setPostedTasks((prev) =>
          prev.map((t) =>
            t.id === jobId ? { ...t, ...payload, status: "completed" as const } : t
          )
        );
      } else {
        const completedTask = assignedTasks.find((t) => t.id === jobId);
        if (completedTask) {
          setAssignedTasks((prev) => prev.filter((t) => String(t.id) !== String(jobId)));
          setCompletedTasks((prev) => [...prev, { ...completedTask, status: "completed", postedAtSortValue: completedTask.postedAtSortValue ?? Date.now() } as Task]);
          setActiveTab("completed");
        }
      }
      setTimeout(() => {
        setRefetchPostedTrigger((t) => t + 1);
        setRefetchAssignedTrigger((t) => t + 1);
        setRefetchCompletedTrigger((t) => t + 1);
      }, 500);
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        "Failed to complete. Please try again.";
      console.error("Mark complete error:", { status: error?.response?.status, data: error?.response?.data });
      toast.error(errMsg);
      throw error;
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

  const handlePermanentDelete = async (taskId: string) => {
    if (!confirm('⚠️ Are you sure? This action cannot be undone!')) {
      return;
    }

    try {
      const response = await axiosInstance.delete(
        `/admin/permanent-delete-task/${taskId}`
      );
      
      if (response.data.status_code === 200) {
        toast.success('Task permanently deleted');
        // Remove from posted tasks list immediately
        setPostedTasks((prev) => prev.filter((task) => task.id !== taskId));
        // Refresh the task list to ensure consistency
        // The useEffect will automatically refetch when dependencies change
      } else {
        toast.error(response.data.message || 'Failed to delete task');
      }
    } catch (error: any) {
      console.error("Permanent delete error:", error);
      toast.error(error.response?.data?.message || 'Failed to delete task');
    }
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

    // Check if cancellation reason is provided
    if (!cancellationReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    setCancelConfirmOpen(false);

    try {
      // Use the new user-cancel endpoint with query parameters
      const currentUserId = user?.id || userId;
      const reason = encodeURIComponent(cancellationReason.trim());
      
      const response = await axiosInstance.put(
        `/user-cancel-job/${selectedJobId}/?user_id=${currentUserId}&role=taskmaster&cancellation_reason=${reason}`
      );
      
      if (response.data.status_code === 200 || response.status === 200) {
        const refundMessage = response.data.refund_message || "";
        const cancellationData = response.data.data || {};
        
        console.log("✅ Cancellation successful:", {
          jobId: selectedJobId,
          refundMessage,
          cancellationData,
          responseData: response.data
        });
        
        toast.success(`Task canceled successfully! ${refundMessage}`);
        
        // Clear cache to force fresh data fetch
        const cacheKey = `user_tasks_${currentUserId}`;
        localStorage.removeItem(cacheKey);
        try { sessionStorage.removeItem("postedTasks"); } catch {}
        
        // Update local state immediately (optimistic update)
        // For both pre-payment and post-payment cancellations
        setPostedTasks((prev) => {
          const updated = prev.map((task) => {
            if (task.id === selectedJobId) {
              return { 
                ...task, 
                cancel_status: true, 
                status: "canceled",
                // Ensure it's marked as cancelled regardless of payment status
                cancelled: true,
                cancellation_reason: cancellationData.cancellation_reason || cancellationReason.trim(),
                cancelled_at: cancellationData.cancelled_at || new Date().toISOString(),
                cancelled_by_role: "taskmaster" as const
              };
            }
            return task;
          });
          console.log("📝 Updated posted tasks after cancellation:", updated.filter(t => t.id === selectedJobId));
          return updated;
        });
        
        // Refresh tasks from backend after a short delay to ensure backend has processed
        setTimeout(async () => {
          try {
            const token = localStorage.getItem('token');
            const fetchResponse = await fetch(`${API_BASE}/get-user-jobs/${currentUserId}/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'omit',
            });

            if (fetchResponse.ok) {
              const result = await fetchResponse.json();
              if (result.status_code === 200 && result.data?.jobs) {
                const userJobs = result.data.jobs.filter((job: any) => {
                  const jobUserId = job.user_ref_id || job.posted_by_id || job.user_id;
                  return jobUserId === currentUserId?.toString();
                });
                
                const tasks: Task[] = userJobs.map((job: any) => {
                  let jobStatus = "open";
                  
                  // Check cancellation status FIRST (for both pre-payment and post-payment)
                  // Backend may return cancel_status as boolean, string, or in status field
                  const isCancelled = 
                    job.cancel_status === true || 
                    job.cancel_status === "true" || 
                    job.cancel_status === 1 ||
                    job.status === "cancelled" || 
                    job.status === "Cancelled" ||
                    job.status === "canceled" ||
                    job.status === "Canceled" ||
                    job.cancelled === true ||
                    job.cancelled === "true";
                  
                  if (isCancelled) {
                    jobStatus = "canceled";
                    console.log(`✅ Task ${job.job_id} marked as cancelled (pre or post payment):`, {
                      cancel_status: job.cancel_status,
                      status: job.status,
                      cancelled: job.cancelled
                    });
                  } else if (job.job_completion_status === 1) {
                    jobStatus = "completed";
                  } else if (job.deletion_status) {
                    jobStatus = "deleted";
                  } else if (job.status === "in_progress" || job.status === "working" || job.status === "assigned") {
                    jobStatus = "in_progress";
                  }
                  
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
                    offers: job.offers || 0,
                    posted_by: job.posted_by || "Unknown",
                    category: job.job_category || "general",
                    job_completion_status: job.job_completion_status === 1 || job.job_completion_status === "1" ? "1" : String(job.job_completion_status ?? ""),
                    tasker_completed: Boolean((job as any).tasker_completed),
                    taskmaster_completed: Boolean((job as any).taskmaster_completed),
                    deletion_status: job.deletion_status || false,
                    cancel_status: isCancelled || (job.cancel_status ?? false), // Ensure it's set correctly
                    cancelled_by_role: job.cancelled_by_role || job.cancelled_by || undefined,
                    cancellation_reason: job.cancellation_reason || job.cancellationReason || undefined,
                    cancelled_at: job.cancelled_at || job.cancelledAt || undefined,
                    cancelled: isCancelled,
                    images: job.job_images?.urls?.length
                      ? job.job_images.urls.map((url: string, index: number) => ({
                          id: `img${index + 1}`,
                          url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url,
                          alt: `Job image ${index + 1}`,
                        }))
                      : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
                    assignedToMe: false,
                  };
                });
                
                console.log("🔄 Refreshed tasks after cancellation:", {
                  totalTasks: tasks.length,
                  cancelledTasks: tasks.filter(t => t.status === "canceled" || t.cancel_status).length,
                  cancelledTaskIds: tasks.filter(t => t.status === "canceled" || t.cancel_status).map(t => t.id)
                });
                
                setPostedTasks(tasks);
                try { sessionStorage.setItem("postedTasks", JSON.stringify(tasks)); } catch {}
                localStorage.setItem(cacheKey, JSON.stringify({
                  tasks: tasks,
                  timestamp: Date.now()
                }));
              }
            }
          } catch (refreshError) {
            console.error("Error refreshing tasks after cancellation:", refreshError);
          }
        }, 1000); // Wait 1 second for backend to process
      } else {
        toast.error(response.data.message || "Failed to cancel task");
      }
    } catch (error: any) {
      console.error("Taskmaster cancel error:", error);
      const errMsg = error.response?.data?.detail || error.response?.data?.message || "An error occurred while canceling the task";
      toast.error(errMsg);
    } finally {
      setSelectedJobId(null);
      setCancellationReason(""); // Reset reason
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
    
    try {
      // Use the new user-cancel endpoint with query parameters
      const currentUserId = user?.id || userId;
      const reason = encodeURIComponent(cancellationReason.trim());
      
      const response = await axiosInstance.put(
        `/user-cancel-job/${selectedAssignedId}/?user_id=${currentUserId}&role=tasker&cancellation_reason=${reason}`
      );
      
      if (response.data.status_code === 200 || response.status === 200) {
        const refundMessage = response.data.refund_message || "";
        const cancellationFee = response.data.cancellation_fee || "";
        const cancellationData = response.data.data || {};
        
        toast.success(`Task cancelled successfully! ${cancellationFee ? `Fee: ${cancellationFee}. ` : ''}${refundMessage}`);
        
        // Update task in assigned tasks list - mark as cancelled but keep it visible
        setAssignedTasks((prev) =>
          prev.map((task) =>
            task.id === selectedAssignedId
              ? {
                  ...task,
                  cancel_status: true,
                  status: "canceled",
                  cancelled: true,
                  cancelled_by_role: "tasker" as const,
                  cancellation_reason: cancellationData.cancellation_reason || cancellationReason.trim(),
                  cancelled_at: cancellationData.cancelled_at || new Date().toISOString(),
                }
              : task
          )
        );
      } else {
        toast.error(response.data.message || "Failed to cancel task");
      }
    } catch (error: any) {
      console.error("Tasker cancel error:", error);
      const errMsg = error.response?.data?.detail || error.response?.data?.message || "An error occurred while canceling the task";
      toast.error(errMsg);
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

  // Sort available tasks by selected option (newest, oldest, highest budget, lowest budget)
  const sortedAvailableTasks = useMemo(() => {
    const copy = [...filteredTasks];
    copy.sort((a, b) => {
      if (availableSortBy === "newest") {
        const aVal = a.postedAtSortValue ?? 0;
        const bVal = b.postedAtSortValue ?? 0;
        return bVal - aVal;
      }
      if (availableSortBy === "oldest") {
        const aVal = a.postedAtSortValue ?? 0;
        const bVal = b.postedAtSortValue ?? 0;
        return aVal - bVal;
      }
      if (availableSortBy === "highest") {
        const aBudget = typeof a.budget === "number" ? a.budget : 0;
        const bBudget = typeof b.budget === "number" ? b.budget : 0;
        return bBudget - aBudget;
      }
      if (availableSortBy === "lowest") {
        const aBudget = typeof a.budget === "number" ? a.budget : 0;
        const bBudget = typeof b.budget === "number" ? b.budget : 0;
        return aBudget - bBudget;
      }
      const aVal = a.postedAtSortValue ?? 0;
      const bVal = b.postedAtSortValue ?? 0;
      return bVal - aVal;
    });
    return copy;
  }, [filteredTasks, availableSortBy]);

  // Sort completed tasks by selected option (newest, oldest)
  const sortedCompletedTasks = useMemo(() => {
    const copy = [...completedTasks];
    copy.sort((a, b) => {
      const aVal = a.postedAtSortValue ?? 0;
      const bVal = b.postedAtSortValue ?? 0;
      return completedSortBy === "newest" ? bVal - aVal : aVal - bVal;
    });
    return copy;
  }, [completedTasks, completedSortBy]);

  // Sort My Tasks (posted) by newest/oldest
  const sortedPostedTasksForMyTasks = useMemo(() => {
    const filtered = postedTasks
      .filter((t) => {
        if (myTasksFilter === "all") return true;
        if (myTasksFilter === "in_progress") return t.status === "in_progress" && !t.deletion_status && !t.cancel_status;
        if (myTasksFilter === "open") return t.status === "open" && !t.deletion_status && !t.cancel_status;
        if (myTasksFilter === "completed") return t.status === "completed";
        return true;
      })
      .filter((t) => {
        const q = myTasksQuery.trim().toLowerCase();
        if (!q) return true;
        return (
          String(t.title || "").toLowerCase().includes(q) ||
          String(t.description || "").toLowerCase().includes(q) ||
          String(t.location || "").toLowerCase().includes(q)
        );
      })
      .filter((t) => {
        if (!dateRange?.from && !dateRange?.to) return true;
        const d = t.postedAt ? new Date(t.postedAt.split("/").reverse().join("-")) : undefined;
        if (!d || isNaN(d as unknown as number)) return true;
        if (dateRange?.from && d < new Date(dateRange.from.toDateString())) return false;
        if (dateRange?.to && d > new Date(dateRange.to.toDateString())) return false;
        return true;
      });
    const copy = [...filtered];
    copy.sort((a, b) => {
      const aTop = a.status === "in_progress" && !a.deletion_status && !a.cancel_status;
      const bTop = b.status === "in_progress" && !b.deletion_status && !b.cancel_status;
      if (aTop && !bTop) return -1;
      if (bTop && !aTop) return 1;
      if (a.deletion_status && !b.deletion_status) return 1;
      if (!a.deletion_status && b.deletion_status) return -1;
      if (a.cancel_status && !b.cancel_status) return 1;
      if (!a.cancel_status && b.cancel_status) return -1;
      const aVal = a.postedAtSortValue ?? 0;
      const bVal = b.postedAtSortValue ?? 0;
      return myTasksSortBy === "newest" ? bVal - aVal : aVal - bVal;
    });
    return copy;
  }, [postedTasks, myTasksFilter, myTasksQuery, dateRange, myTasksSortBy]);

  // Sort assigned tasks by newest/oldest
  const sortedAssignedTasks = useMemo(() => {
    const copy = [...assignedTasks];
    copy.sort((a, b) => {
      const aVal = a.postedAtSortValue ?? 0;
      const bVal = b.postedAtSortValue ?? 0;
      return assignedSortBy === "newest" ? bVal - aVal : aVal - bVal;
    });
    return copy;
  }, [assignedTasks, assignedSortBy]);

  // Sort My Bids by newest/oldest
  const sortedRequestedTasks = useMemo(() => {
    const copy = [...requestedTasks];
    copy.sort((a, b) => {
      const aVal = a.created_at_sort_value ?? 0;
      const bVal = b.created_at_sort_value ?? 0;
      return myBidsSortBy === "newest" ? bVal - aVal : aVal - bVal;
    });
    return copy;
  }, [requestedTasks, myBidsSortBy]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleRefresh = useCallback(async () => {
    setRefetchPostedTrigger((t) => t + 1);
    setRefetchAvailableTrigger((t) => t + 1);
    setRefetchAssignedTrigger((t) => t + 1);
    setRefetchCompletedTrigger((t) => t + 1);
    setRefetchBidsTrigger((t) => t + 1);
  }, []);

  const handleRequestUndeleteClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setRequestUndeleteOpen(true);
  };

  if (loading) {
    return <DashboardSkeleton isMobile={!!mobile} />;
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
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950 overflow-x-hidden">
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
      
      <main className="flex-1 w-full max-w-none mx-auto py-3 md:py-10 px-4 md:px-8 lg:px-12 pb-28 md:pb-10">
        <PullToRefresh onRefresh={handleRefresh}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-8 gap-3 md:gap-4 animate-fade-in-up">
          {/* Move profile block up on mobile */}
          {mobile && (
            <div className="w-full">
              <div className="flex items-center justify-end">
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md dark:hover:bg-slate-700/80"
                  >
                    <div className="relative">
                      {(resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image) ? (
                        <img 
                          src={resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image} 
                          alt={safeUser.name || "Profile"} 
                          className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold border-2 border-gray-200">
                          {safeUser.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-gray-900 dark:text-slate-100">{safeUser.name || "User"}</span>
                        {user?.verification_status >= 3 && (
                          <span title="Verified Account">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-slate-400">Online</span>
                    </div>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 max-w-[80vw] bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 py-2 z-50 animate-fade-in-up">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          {(resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image) ? (
                            <img 
                              src={resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image || ""} 
                              alt={safeUser.name || "Profile"} 
                              className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-lg font-semibold border-2 border-gray-200">
                              {(safeUser.name ? safeUser.name.charAt(0) : "U")}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-gray-900 dark:text-slate-100 text-sm truncate">
                                {safeUser.name || "User"}
                              </p>
                              {user?.verification_status >= 3 && (
                                <span title="Verified Account">
                                  <CheckCircle className="h-4 w-4 text-blue-600" />
                                </span>
                              )}
                            </div>
                            {safeUser.email && (
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400 break-all">
                                {safeUser.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                          <div className="p-2 rounded-lg bg-[#eff6ff]">
                            <User className="h-4 w-4 text-[#2563eb]" />
                          </div>
                          <span className="text-gray-800 dark:text-slate-200 font-medium">My Profile</span>
                        </Link>
                        <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                          <div className="p-2 rounded-lg bg-gray-100">
                            <Settings className="h-4 w-4 text-gray-600" />
                          </div>
                          <span className="text-gray-800 dark:text-slate-200 font-medium">Settings</span>
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
                <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">Dashboard</h1>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">Tasks and bids</p>
              </div>
            </div>
          )}
          {!isMobile && (
            <div className="animate-slide-in-right">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Manage your tasks and bids</p>
            </div>
          )}
          <div className="hidden md:flex items-center gap-4 animate-slide-in-right">
            <ThemeToggle />
            {/* Enhanced Notifications with proper clickable functionality */}
            <div className="relative">
              <NotificationBar />
            </div>
            
            {/* Premium Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 px-5 py-3 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md dark:hover:bg-slate-700/80"
              >
                <div className="relative">
                  {(resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image) ? (
                    <img 
                      src={resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image} 
                      alt={safeUser.name || "Profile"} 
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-lg font-semibold border-2 border-gray-200">
                      {safeUser.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex items-center gap-1.5">
                <span className="text-lg">{safeUser.name || "User"}</span>
                  {user?.verification_status >= 3 && (
                    <span title="Verified Account">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </span>
                  )}
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-700 py-2 z-50 animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {(resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image) ? (
                        <img 
                          src={resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image} 
                          alt={safeUser.name || "Profile"} 
                          className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xl font-semibold border-2 border-gray-200">
                          {safeUser.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                        <p className="font-medium text-gray-900 dark:text-slate-100 text-lg">{safeUser.name || "User"}</p>
                          {user?.verification_status >= 3 && (
                            <span title="Verified Account">
                              <CheckCircle className="h-5 w-5 text-blue-600" />
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{safeUser.email || ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700 dark:text-slate-200 font-medium">My Profile</span>
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Settings className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-gray-700 dark:text-slate-200 font-medium">Settings</span>
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
                  {(resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image) ? (
                    <img 
                      src={resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image} 
                      alt={safeUser.name || "Profile"} 
                      className="h-8 w-8 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-sm font-semibold border-2 border-gray-200">
                      {safeUser.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">{safeUser.name || "User"}</span>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 py-3 z-50 animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      {safeUser && (resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image) ? (
                        <img 
                          src={resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image || ""} 
                          alt={(safeUser.name) || "Profile"} 
                          className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-lg font-semibold border-2 border-gray-200">
                          {(safeUser.name ? safeUser.name.charAt(0) : "U")}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{safeUser.name || "User"}</p>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{safeUser.email || ""}</p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2">
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700 dark:text-slate-200 font-medium">My Profile</span>
                    </Link>
                    <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Settings className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-gray-700 dark:text-slate-200 font-medium">Settings</span>
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
            <ThemeToggle />
            <Link href="/post-task" className="flex-1">
              <Button className="w-full h-10 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium shadow-md transition-all duration-200">
                Post a Task
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNotifications((s) => !s)}
                className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className={`h-5 w-5 text-gray-700 dark:text-slate-300 ${bellAnimating ? "animate-bell-ring" : ""}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[10px] font-medium bg-emerald-600 text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Premium Post Task Button */}
        {/* Hide big CTA bar on small screens to avoid duplicate name/header block */}
        <div className="hidden md:flex justify-start mb-8 animate-fade-in-up">
          <div className="flex items-center justify-between w-full gap-4">
            <button
              onClick={() => setShowNotifications((s) => !s)}
              className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className={`h-5 w-5 text-gray-700 ${bellAnimating ? "animate-bell-ring" : ""}`} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full text-[10px] font-medium bg-emerald-600 text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <Link href="/post-task" passHref className="ml-auto">
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium px-6 py-3 rounded-xl shadow-md transition-all duration-200">
                Post a Task
              </Button>
            </Link>
          </div>
        </div>

        {showNotifications && (
          <div className="fixed right-6 top-24 z-50 w-[340px] max-w-[92vw] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="font-semibold text-gray-800">Notifications</div>
              <button
                className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-gray-100"
                onClick={() => setShowNotifications(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              {notificationItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-slate-400 text-sm">No notifications yet</div>
              ) : (
                notificationItems.map((n) => {
                  const href = n.link || "/notifications";
                  const Icon = n.type === "bid" ? Gavel : n.type === "message" ? MessageSquare : Bell;
                  const iconBg = n.type === "bid" ? "bg-amber-500" : n.type === "message" ? "bg-blue-500" : "bg-purple-500";
                  const createdAt = n.created_at ?? (n as any).createdAt ?? new Date().toISOString();
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!n.read) markAsRead(parseInt(String(n.id), 10));
                        // Keep notification visible for a moment before navigating
                        setTimeout(() => {
                          setShowNotifications(false);
                          router.push(href);
                        }, 800);
                      }}
                      className="block px-4 py-3 flex items-start gap-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white flex-shrink-0 ${iconBg}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className={`font-medium truncate ${!n.read ? "text-gray-900 dark:text-slate-100" : "text-gray-600 dark:text-slate-400"}`}>{n.title}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">{formatTimeAgo(createdAt)}</div>
                        </div>
                        {n.description && (
                          <div className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2 mt-0.5">{n.description}</div>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
            <div className="px-4 py-3 border-t bg-gray-50 flex gap-2">
              <Button variant="outline" className="h-9 px-3 border-gray-300" onClick={() => { markAsRead(null); setShowNotifications(false); }}>
                Mark all read
              </Button>
              <Link href="/notifications" onClick={() => setShowNotifications(false)}>
                <Button className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700">View all</Button>
              </Link>
            </div>
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            setActiveTab(value);
            if (value === "my-tasks") {
              try {
                localStorage.removeItem(`user_tasks_${userId || effectiveUserId}`);
              } catch {}
              setRefetchPostedTrigger((t) => t + 1);
            } else if (value === "available") {
              setRefetchAvailableTrigger((t) => t + 1);
            } else if (value === "assigned") {
              setRefetchAssignedTrigger((t) => t + 1);
            } else if (value === "completed") {
              setRefetchCompletedTrigger((t) => t + 1);
            } else if (value === "my-bids") {
              setRefetchBidsTrigger((t) => t + 1);
            }
          }}
          className="w-full"
        >
          <TabsList className={
            isMobile
              ? "flex w-full p-2.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm z-20 gap-1.5 min-h-[56px] overflow-x-auto overflow-y-hidden flex-nowrap justify-start sticky top-[calc(env(safe-area-inset-top)+48px)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              : "flex w-full bg-gray-100 dark:bg-slate-800 p-2 rounded-2xl gap-2"
          }>
            <TabsTrigger value="my-tasks" className={
              isMobile 
                ? "flex flex-col items-center justify-center gap-1 px-3 py-2 flex-shrink-0 rounded-xl text-xs font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-[#3b82f6]/30 data-[state=active]:text-[#2563eb] data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-slate-400 transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
                : "px-5 py-2.5 rounded-xl text-sm font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-[#3b82f6]/30 data-[state=active]:text-[#2563eb] data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-slate-400 whitespace-nowrap transition-all duration-200 active:scale-[0.98]"
            }>
              <Briefcase className="h-4 w-4 md:hidden shrink-0" />
              <span>My Tasks</span>
            </TabsTrigger>
            <TabsTrigger value="available" className={
              isMobile 
                ? "flex flex-col items-center justify-center gap-1 px-3 py-2 flex-shrink-0 rounded-xl text-xs font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-[#3b82f6]/30 data-[state=active]:text-[#2563eb] data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-slate-400 transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
                : "px-5 py-2.5 rounded-xl text-sm font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-[#3b82f6]/30 data-[state=active]:text-[#2563eb] data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-slate-400 whitespace-nowrap transition-all duration-200 active:scale-[0.98]"
            }>
              <Search className="h-4 w-4 md:hidden shrink-0" />
              <span>Available</span>
            </TabsTrigger>
            <TabsTrigger value="assigned" className={
              isMobile 
                ? "flex flex-col items-center justify-center gap-1 px-3 py-2 flex-shrink-0 rounded-xl text-xs font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-[#3b82f6]/30 data-[state=active]:text-[#2563eb] data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-slate-400 transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
                : "px-5 py-2.5 rounded-xl text-sm font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-[#3b82f6]/30 data-[state=active]:text-[#2563eb] data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-slate-400 whitespace-nowrap transition-all duration-200 active:scale-[0.98]"
            }>
              <CheckCircle className="h-4 w-4 md:hidden shrink-0" />
              <span>Assigned</span>
            </TabsTrigger>
            <TabsTrigger value="completed" className={
              isMobile 
                ? "flex flex-col items-center justify-center gap-1 px-3 py-2 flex-shrink-0 rounded-xl text-xs font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-[#3b82f6]/30 data-[state=active]:text-[#2563eb] data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-slate-400 transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
                : "px-5 py-2.5 rounded-xl text-sm font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-[#3b82f6]/30 data-[state=active]:text-[#2563eb] data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-slate-400 whitespace-nowrap transition-all duration-200 active:scale-[0.98]"
            }>
              <Star className="h-4 w-4 md:hidden shrink-0" />
              <span>Completed</span>
            </TabsTrigger>
            <TabsTrigger value="my-bids" className={
              isMobile 
                ? "flex flex-col items-center justify-center gap-1 px-3 py-2 flex-shrink-0 rounded-xl text-xs font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-[#3b82f6]/30 data-[state=active]:text-[#2563eb] data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-slate-400 transition-all duration-200 active:scale-[0.98] whitespace-nowrap"
                : "px-5 py-2.5 rounded-xl text-sm font-medium data-[state=active]:bg-white data-[state=active]:dark:bg-slate-700 data-[state=active]:shadow-md data-[state=active]:ring-1 data-[state=active]:ring-[#3b82f6]/30 data-[state=active]:text-[#2563eb] data-[state=inactive]:text-gray-600 data-[state=inactive]:dark:text-slate-400 whitespace-nowrap transition-all duration-200 active:scale-[0.98]"
            }>
              <IndianRupee className="h-4 w-4 md:hidden shrink-0" />
              <span className="hidden md:inline">My Bids</span>
              <span className="md:hidden">My Bids</span>
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
                    <select value={availableSortBy} onChange={e=>setAvailableSortBy(e.target.value)} className="w-full bg-transparent text-gray-700">
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="highest">Budget: High to Low</option>
                      <option value="lowest">Budget: Low to High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgb(156_163_175)_rgb(243_244_246)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
                      <SelectItem value="all">All Categories</SelectItem>
                      {categoriesLoading ? (
                        <SelectItem value="loading" disabled>Loading categories...</SelectItem>
                      ) : categories.length === 0 ? (
                        <SelectItem value="no-categories" disabled>No categories available</SelectItem>
                      ) : (
                        categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))
                      )}
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-[#2563eb]" />Tasks You've Posted</h2>
            {/* Premium Toolbar */}
            <div className={`mb-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 shadow-sm transition-all duration-200`}> 
              <div className={`flex ${isMobile ? "flex-col gap-2" : "items-center gap-3"}`}>
              <div className={`relative ${isMobile ? "w-full" : "w-80"}`}>
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder="Search your tasks..."
                  value={myTasksQuery}
                  onChange={(e) => setMyTasksQuery(e.target.value)}
                  className={`pl-9 ${isMobile ? "h-10" : "h-9"}`}
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={myTasksFilter} onValueChange={(v) => setMyTasksFilter(v as any)}>
                  <SelectTrigger className={`${isMobile ? "h-10" : "h-9"} w-44`}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={myTasksSortBy} onValueChange={setMyTasksSortBy}>
                  <SelectTrigger className={`${isMobile ? "h-10" : "h-9"} w-40`}>
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className={`${isMobile ? "h-10" : "h-9"} border-gray-300`} onClick={() => { setMyTasksFilter("all"); setMyTasksQuery(""); }}>Clear</Button>
              </div>
              {!isMobile && (
                <div className="ml-auto hidden md:flex items-center gap-2 pr-1">
                  <span className="text-xs text-gray-500">Counts:</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">In Progress {myTasksSummary.inProgress}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">Open {myTasksSummary.open}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Completed {myTasksSummary.completed}</span>
                </div>
              )}
              </div>
            </div>
            {postedTasks.length === 0 ? (
                  <Card className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground mb-4">
                    You haven't posted any tasks yet
                  </p>
                  <Link href="/post-task">
                    <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white shadow-md">Post Your First Task</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className={`grid gap-4 dashboard-card-stagger ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                {sortedPostedTasksForMyTasks.map((task) => (
                    <Card
                      key={task.id}
                      className={`relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl overflow-hidden group border-l-4 border-l-[#3b82f6]/50 ${
                        task.deletion_status || task.cancel_status ? "opacity-60 cursor-not-allowed" : ""
                      }`}
                    >
                      {/* In Progress Task Banner */}
                      {task.status === "in_progress" && !task.cancel_status && (
                        <div className="w-full bg-emerald-700 text-white text-center py-1.5 px-3 font-semibold text-xs">
                          🚀 In Progress — Bid Accepted
                        </div>
                      )}
                      
                      {/* Tasker Cancellation Banner */}
                      {task.cancel_status && task.cancelled_by_role === "tasker" && (
                        <div className="w-full bg-orange-600 text-white text-center py-2 px-3 font-semibold text-xs">
                          ⚠️ Tasker Cancelled This Task
                        </div>
                      )}
                      
                      {/* Mobile-optimized layout */}
                      <div className={`${isMobile ? "p-4" : "p-6"} ${task.cancel_status && task.cancelled_by_role === "tasker" ? "opacity-70" : ""}`}>
                        {/* Header with title and status */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold ${task.cancel_status && task.cancelled_by_role === "tasker" ? "text-gray-500" : "text-gray-900"} line-clamp-2 ${isMobile ? "text-base" : "text-lg"}`}>
                              {task.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className={`text-xs ${task.cancel_status && task.cancelled_by_role === "tasker" ? "text-gray-400" : "text-gray-500"}`}>{task.postedAt}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 ml-3">
                            <Badge
                              variant="outline"
                              className={`font-medium text-xs px-2 py-1 rounded-full ${
                                task.cancel_status && task.cancelled_by_role === "tasker"
                                  ? "border-orange-300 text-orange-700 bg-orange-50"
                                  : task.cancel_status
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
                              {task.cancel_status && task.cancelled_by_role === "tasker"
                                ? "⚠️ Tasker Cancelled"
                                : task.cancel_status
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
                        <p className={`text-sm ${task.cancel_status && task.cancelled_by_role === "tasker" ? "text-gray-400" : "text-gray-600"} line-clamp-2 mb-3`}>
                          {task.description}
                        </p>

                        {/* Tasker Cancellation Message */}
                        {task.cancel_status && task.cancelled_by_role === "tasker" && (
                          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800 font-medium mb-1">
                              ⚠️ Tasker cancelled this task
                            </p>
                            <p className="text-xs text-orange-700">
                              {task.cancellation_reason && (
                                <span className="block mb-1"><strong>Reason:</strong> {task.cancellation_reason}</span>
                              )}
                              Please repost the task to find a new tasker. You will receive a refund if payment was made, otherwise no refund is needed.
                            </p>
                            <Link href="/post-task" className="mt-2 inline-block">
                              <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white text-xs">
                                Repost Task
                              </Button>
                            </Link>
                          </div>
                        )}

                        {/* Mobile-optimized info row */}
                        <div className={`flex items-center justify-between ${isMobile ? "flex-col gap-2" : "gap-4"}`}>
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 ${task.cancel_status && task.cancelled_by_role === "tasker" ? "bg-gray-200" : "bg-blue-100"} px-2 py-1 rounded-lg`}>
                              <IndianRupee className={`h-4 w-4 ${task.cancel_status && task.cancelled_by_role === "tasker" ? "text-gray-500" : "text-blue-600"} font-bold`} />
                              <span className={`font-bold ${task.cancel_status && task.cancelled_by_role === "tasker" ? "text-gray-500" : "text-blue-800"}`}>{task.budget}</span>
                            </div>
                            <div className={`flex items-center gap-1 ${task.cancel_status && task.cancelled_by_role === "tasker" ? "text-gray-400" : "text-gray-500"}`}>
                              <MapPin className="h-3 w-3" />
                              <span className="text-xs">{task.location}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className={`flex gap-2 mt-4 ${isMobile ? "flex-col" : "flex-row"}`}>
                          {task.cancel_status && task.cancelled_by_role === "tasker" ? (
                            <div className="flex gap-2 w-full">
                              <Link href="/post-task" className="flex-1">
                                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                  Repost Task
                                </Button>
                              </Link>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handlePermanentDelete(task.id)}
                              >
                                Delete Permanently
                              </Button>
                            </div>
                          ) : task.deletion_status || task.cancel_status ? (
                            <div className="flex gap-2 w-full">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleRequestUndeleteClick(task.id)}
                              >
                                Request Access
                              </Button>
                              <Button
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handlePermanentDelete(task.id)}
                              >
                                Delete Permanently
                              </Button>
                            </div>
                          ) : task.status === "in_progress" ? (
                            <>
                              <div className="flex flex-wrap gap-2 w-full items-center">
                                <Link href={`/tasks/${task.id}`} className="shrink-0">
                                  <Button
                                    variant="outline"
                                    className={`w-auto border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 font-semibold rounded-md shadow transition-all duration-200 ${isMobile ? "py-2 px-3 text-sm" : "py-2 px-4 text-sm"}`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-base">👁️</span>
                                      <span>View Details</span>
                                    </div>
                                  </Button>
                                </Link>
                                {task.job_completion_status !== 1 && task.job_completion_status !== "1" && !task.taskmaster_completed && (
                                  <Button
                                    className="shrink-0 w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-all duration-200"
                                    onClick={() => {
                                      setCompleteReviewTask(task);
                                      setCompleteReviewAsTaskmaster(true);
                                    }}
                                    disabled={completingTaskId === task.id}
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="text-base shrink-0">✅</span>
                                      <span className="truncate">{completingTaskId === task.id ? "Updating..." : isMobile ? "Confirm (you)" : "Confirm completion (Taskmaster)"}</span>
                                    </div>
                                  </Button>
                                )}
                                {(task.tasker_completed && !task.taskmaster_completed) && (
                                  <span className="text-xs text-muted-foreground">Tasker marked done — confirm above to complete</span>
                                )}
                              </div>
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
            <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-[#2563eb]" />Available Tasks</h2>
            <div className={`grid gap-6 ${isMobile ? "grid-cols-1" : "md:grid-cols-4"}`} style={{zIndex:1, position:'relative'}}>
              <div className={`${isMobile ? "hidden" : "md:col-span-1"} space-y-6`}>
                <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gray-50 border-b border-gray-200 p-6">
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#2563eb] shadow-sm">
                        <Filter className="w-4 h-4 text-white" />
                      </div>
                      Filters
                    </CardTitle>
                    <CardDescription className="text-gray-600 font-medium">Refine your search</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4">
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
                            <SelectContent className="rounded-lg border border-gray-200 shadow-lg max-h-[300px] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgb(156_163_175)_rgb(243_244_246)] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-gray-500">
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
                      className="bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-2.5 rounded-lg"
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
                    {sortedAvailableTasks.length} tasks found
                  </p>
                  <Select value={availableSortBy} onValueChange={setAvailableSortBy}>
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

                {sortedAvailableTasks.length === 0 ? (
                  <div className="min-h-[400px] flex items-center justify-center">
                <EmptyState
                  icon={Search}
                  title="No tasks found"
                  description="No tasks match your current filters. Try adjusting them."
                  action={{
                    label: "Clear filters",
                    onClick: () => {
                      setSearchTerm("");
                      setCategory("all");
                      setPriceRange([0, 50000]);
                      setLocation("");
                    },
                  }}
                />
                  </div>
                ) : (
                  <div className={`grid gap-4 dashboard-card-stagger ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                    {sortedAvailableTasks.map((task) => {
                      const hasUserBid = requestedTasks.some(bid => bid.task_id === task.id);
                      
                      return (
                        <Card key={task.id} className="flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl overflow-hidden border-l-4 border-l-[#3b82f6]/50">
                          {/* Mobile-optimized layout */}
                          <div className={isMobile ? "p-4" : "p-6"}>
                            {/* Header with title and status */}
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-gray-900 dark:text-slate-100 line-clamp-2 ${isMobile ? "text-base" : "text-lg"} leading-tight`}>
                                  {task.title}
                                </h3>
                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span>Posted: {task.postedAt}</span>
                                  {task.dueDate && task.dueDate !== "Unknown" && (
                                    <>
                                      <span className="mx-1 text-gray-300">•</span>
                                      <span>Due: {task.dueDate}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge variant="outline" className="border-slate-200 text-slate-600 font-medium text-xs px-2 py-1">
                                {task.status === "open" ? "🔓 Open" : 
                                 task.status === "completed" ? "✅ Completed" :
                                 task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </Badge>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-gray-600 dark:text-slate-400 line-clamp-2 mb-3">
                              {task.description}
                            </p>

                            {/* Mobile-optimized info row */}
                            <div className={`flex items-center justify-between ${isMobile ? "flex-col gap-2" : "gap-4"}`}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex items-center gap-1 bg-[#eff6ff] dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-[#3b82f6]/30 dark:border-slate-600">
                                  <IndianRupee className="h-4 w-4 text-[#2563eb] dark:text-[#60a5fa]" />
                                  <span className="font-semibold text-[#1d4ed8] dark:text-[#93c5fd]">{task.budget}</span>
                                </div>
                                <div className="flex items-center gap-1 text-gray-500 dark:text-slate-400 min-w-0">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="text-xs truncate" title={task.location}>{shortLocation(task.location)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#eff6ff]/80 dark:bg-slate-700/80 border border-[#3b82f6]/20 dark:border-slate-600/50">
                                <Avatar className="h-6 w-6 shrink-0">
                                  {(() => {
                                    const raw = (task as any).posted_by_profile_image || posterProfileCache[String((task as any).posted_by_id)];
                                    const url = raw ? (resolveProfileImageUrl(raw) || raw) : undefined;
                                    return url ? <AvatarImage src={url} alt="" /> : null;
                                  })()}
                                  <AvatarFallback className="text-[10px] bg-[#2563eb] text-white font-semibold">
                                    {task.posted_by?.charAt(0)?.toUpperCase() || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium text-gray-800 dark:text-slate-200 truncate">{task.posted_by || "Unknown"}</span>
                              </div>
                            </div>

                            {/* Action button */}
                            <div className="mt-4">
                              <Link href={`/tasks/${task.id}`} className="w-full">
                                <Button variant="outline" className={`w-full border-[#3b82f6]/50 dark:border-slate-600 text-[#2563eb] dark:text-[#60a5fa] hover:bg-[#eff6ff] dark:hover:bg-slate-700 font-medium rounded-xl transition-all duration-200 ${isMobile ? "py-2 text-sm" : "py-3 px-4"}`}>
                                  <span>{hasUserBid ? "View Offer" : "Make an Offer"}</span>
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

          <TabsContent value="assigned" forceMount className="space-y-6 mt-6 animate-fade-in-up min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-[#2563eb]" />Tasks Assigned to You</h2>
              {assignedTasks.length > 0 && (
                <Select value={assignedSortBy} onValueChange={setAssignedSortBy}>
                  <SelectTrigger className="w-[160px] sm:w-[180px] border-gray-200 dark:border-slate-600">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {assignedTasks.length === 0 ? (
              <div className="min-h-[400px] flex items-center justify-center">
                <EmptyState
                  icon={Briefcase}
                  title="No assigned tasks"
                  description="You don't have any tasks assigned yet. Browse available tasks to submit bids."
                  action={{ label: "Browse tasks", onClick: () => setActiveTab("available") }}
                  secondaryAction={{ label: "My tasks", onClick: () => setActiveTab("my-tasks") }}
                />
              </div>
            ) : (
              <div className={`grid gap-4 dashboard-card-stagger ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                {sortedAssignedTasks.map((task) => {
                  const isCancelled = task.cancel_status || task.cancelled || task.status === "canceled" || task.status === "cancelled";
                  const cancelledByTasker = task.cancelled_by_role === "tasker";
                  const cancelledByTaskmaster = task.cancelled_by_role === "taskmaster";
                  const waitingForTaskmaster = !isCancelled && task.tasker_completed && !task.taskmaster_completed && task.job_completion_status !== 1 && task.job_completion_status !== "1";
                  
                  return (
                  <Card key={task.id} className={`flex flex-col bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-md hover:shadow-lg transition-all duration-200 rounded-2xl overflow-hidden border-l-4 border-l-[#3b82f6]/50 ${isCancelled ? 'opacity-60' : ''}`}>
                    {/* Mobile-optimized layout */}
                    <div className={isMobile ? "p-4" : "p-6"}>
                      {/* Header with title and status */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold ${isCancelled ? 'text-gray-500 line-through' : 'text-gray-900'} line-clamp-2 ${isMobile ? "text-base" : "text-lg"}`}>
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className={`h-3 w-3 ${isCancelled ? 'text-gray-400' : 'text-gray-400'}`} />
                            <span className={`text-xs ${isCancelled ? 'text-gray-400' : 'text-gray-500'}`}>{task.postedAt}</span>
                            {isCancelled && cancelledByTasker && (
                              <Badge variant="outline" className="text-xs border-gray-400 text-gray-600">
                                ❌ Cancelled by you
                              </Badge>
                            )}
                            {isCancelled && cancelledByTaskmaster && (
                              <Badge variant="outline" className="text-xs border-orange-400 text-orange-600 bg-orange-50">
                                ⚠️ Cancelled by Taskmaster
                              </Badge>
                            )}
                            {isCancelled && !cancelledByTasker && !cancelledByTaskmaster && (
                              <Badge variant="outline" className="text-xs border-gray-400 text-gray-600">
                                ❌ Cancelled
                              </Badge>
                            )}
                          </div>
                        </div>
                        {(() => {
                          // Debug logging
                          if (isCancelled) {
                            console.log(`🔍 Task ${task.id} is cancelled:`, {
                              cancel_status: task.cancel_status,
                              cancelled: task.cancelled,
                              status: task.status,
                              cancelled_by_role: task.cancelled_by_role,
                              isCancelled
                            });
                          }
                          return waitingForTaskmaster ? (
                            <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-2 py-1">
                              ⏳ Waiting for taskmaster
                            </Badge>
                          ) : !isCancelled ? (
                        <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-2 py-1">
                          🚀 In Progress
                        </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-400 text-gray-600 font-semibold text-xs px-2 py-1">
                              ❌ Cancelled
                            </Badge>
                          );
                        })()}
                      </div>

                      {/* Description */}
                      <p className={`text-sm ${isCancelled ? 'text-gray-400 line-through' : 'text-gray-600'} line-clamp-2 mb-3`}>
                        {task.description}
                      </p>

                      {/* Cancellation reason if cancelled */}
                      {isCancelled && task.cancellation_reason && (
                        <div className={`mb-3 p-2 rounded text-xs ${cancelledByTaskmaster ? 'bg-orange-100 border border-orange-300 text-orange-800' : 'bg-gray-200 text-gray-600'}`}>
                          <strong>{cancelledByTaskmaster ? 'Taskmaster\'s Reason:' : cancelledByTasker ? 'Your Reason:' : 'Reason:'}</strong> {task.cancellation_reason}
                        </div>
                      )}

                      {/* Mobile-optimized info row */}
                      <div className={`flex items-center justify-between ${isMobile ? "flex-col gap-2" : "gap-4"}`}>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 ${isCancelled ? 'bg-gray-200' : 'bg-orange-100'} px-2 py-1 rounded-lg`}>
                            <IndianRupee className={`h-4 w-4 ${isCancelled ? 'text-gray-500' : 'text-orange-600'} font-bold`} />
                            <span className={`font-bold ${isCancelled ? 'text-gray-500' : 'text-orange-800'}`}>{task.budget}</span>
                          </div>
                          <div className={`flex items-center gap-1 ${isCancelled ? 'text-gray-400' : 'text-gray-500'}`}>
                            <MapPin className="h-3 w-3" />
                            <span className="text-xs">{task.location}</span>
                          </div>
                        </div>
                        <div className={`flex items-center gap-1 ${isCancelled ? 'text-gray-400' : 'text-gray-500'}`}>
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs">
                              {task.posted_by?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs">{task.posted_by}</span>
                        </div>
                      </div>

                      {/* Waiting for taskmaster message */}
                      {waitingForTaskmaster && (
                        <div className="mb-3 p-3 rounded-lg bg-blue-100 border border-blue-300 text-blue-800 text-sm">
                          <span className="font-medium">✓ You marked this complete.</span> Waiting for the task owner to confirm. The task will move to Completed once they confirm.
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className={`flex flex-wrap items-center gap-2 mt-4`}>
                        {isCancelled ? (
                          <>
                            <Button
                              variant="destructive"
                              className={`shrink-0 w-auto border-2 border-red-500 hover:border-red-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ${isMobile ? "py-2 px-3 text-sm" : "py-2 px-4 text-sm"}`}
                              onClick={() => {
                                if (confirm('⚠️ Are you sure you want to permanently delete this cancelled task? This action cannot be undone.')) {
                                  setAssignedTasks((prev) => prev.filter((t) => t.id !== task.id));
                                  toast.success("Task removed from your list");
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🗑️</span>
                                <span>Delete Permanently</span>
                              </div>
                            </Button>
                          </>
                        ) : waitingForTaskmaster ? (
                          <>
                        <Link href={`/tasks/${task.id}`} className="shrink-0" onClick={() => { try { sessionStorage.setItem("nav_from_assigned","1"); } catch {} }}>
                          <Button variant="outline" className={`w-auto border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ${isMobile ? "py-2 px-3 text-sm" : "py-2 px-4 text-sm"}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">👁️</span>
                            <span>View Details</span>
                          </div>
                        </Button>
                        </Link>
                        <div className="shrink-0 w-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 border-2 border-blue-300 text-blue-800 font-semibold text-sm cursor-default">
                          <span className="text-lg">✅</span>
                          <span>Marked complete — waiting for taskmaster</span>
                        </div>
                          </>
                        ) : (
                          <>
                        <Link href={`/tasks/${task.id}`} className="shrink-0" onClick={() => { try { sessionStorage.setItem("nav_from_assigned","1"); } catch {} }}>
                          <Button variant="outline" className={`w-auto border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-800 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ${isMobile ? "py-2 px-3 text-sm" : "py-2 px-4 text-sm"}`}>
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👁️</span>
                              <span>View Details</span>
                            </div>
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className={`shrink-0 w-auto border-2 border-red-300 hover:border-red-400 text-red-600 hover:text-red-700 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ${isMobile ? "py-2 px-3 text-sm" : "py-2 px-4 text-sm"}`}
                          onClick={() => handleAssignedCancelClick(task.id)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">❌</span>
                            <span>Cancel</span>
                          </div>
                        </Button>
                        <Button
                          className={`shrink-0 w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 ${isMobile ? "py-2 px-3 text-sm" : "py-2 px-4 text-sm"}`}
                          onClick={() => {
                            setCompleteReviewTask(task);
                            setCompleteReviewAsTaskmaster(false);
                          }}
                          disabled={completingTaskId === task.id}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">✅</span>
                            <span>{completingTaskId === task.id ? "Updating..." : "Mark as complete (Tasker)"}</span>
                          </div>
                        </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" forceMount className="space-y-6 mt-6 animate-fade-in-up min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-[#2563eb]" />Completed</h2>
              {completedTasks.length > 0 && (
                <Select value={completedSortBy} onValueChange={setCompletedSortBy}>
                  <SelectTrigger className="w-[160px] sm:w-[180px] border-gray-200 dark:border-slate-600">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
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
              <EmptyState
                icon={CheckCircle}
                title="No completed tasks"
                description="You haven't completed any tasks yet. Complete your assigned tasks to see them here."
                action={{ label: "View Assigned Tasks", onClick: () => setActiveTab("assigned") }}
              />
            ) : (
              <div className={`grid gap-4 dashboard-card-stagger ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                {sortedCompletedTasks.map((task) => (
                  <Card key={task.id} className="bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 dark:from-emerald-950/40 dark:via-slate-800/60 dark:to-slate-800/40 border-l-4 border-l-emerald-500 dark:border-l-emerald-400 shadow-lg shadow-slate-200/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 rounded-2xl overflow-hidden">
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

                    {task.review_comment && (
                      <p className="mt-3 text-sm text-gray-700 italic border-l-4 border-green-200 pl-3">
                        “{task.review_comment}”
                      </p>
                    )}

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

          <TabsContent value="my-bids" forceMount className="space-y-6 mt-6 animate-fade-in-up min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-[#2563eb]" />My Bids</h2>
              {requestedTasks.length > 0 && (
                <Select value={myBidsSortBy} onValueChange={setMyBidsSortBy}>
                  <SelectTrigger className="w-[160px] sm:w-[180px] border-gray-200 dark:border-slate-600">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            {requestedTasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No bids placed"
                description="You haven't placed any bids yet. Browse available tasks and submit your first bid to get started."
                action={{ label: "Browse Available Tasks", onClick: () => setActiveTab("available") }}
              />
            ) : (
              <div className={`grid gap-4 dashboard-card-stagger ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}>
                {sortedRequestedTasks.map((bid) => (
                  <Card key={bid.bid_id} className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-800/80 dark:via-slate-800/60 dark:to-indigo-900/30 border-l-4 border-l-blue-500 dark:border-l-indigo-400 shadow-lg shadow-slate-200/40 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 rounded-2xl overflow-hidden">
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
        <Dialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cancel Posted Task</DialogTitle>
              <DialogDescription>
                Canceling this task may incur a 4%+GST cancellation fee (if payment was made). Please provide a reason for cancellation.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="taskmaster-cancellation-reason" className="text-sm font-medium">
                  Cancellation Reason *
                </label>
                <Textarea
                  id="taskmaster-cancellation-reason"
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
                  setCancelConfirmOpen(false);
                  setCancellationReason("");
                  setSelectedJobId(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleConfirmCancel}
                variant="destructive"
              >
                Submit Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

        <CompletionReviewModal
          open={!!completeReviewTask}
          onOpenChange={(open) => !open && setCompleteReviewTask(null)}
          revieweeName={
            completeReviewAsTaskmaster
              ? "the tasker"
              : completeReviewTask?.posted_by || "the taskmaster"
          }
          onSubmit={handleCompleteReviewSubmit}
          isTaskmasterReviewingTasker={completeReviewAsTaskmaster}
        />

        {/* Floating Post a Task (mobile only) */}
        <div className="md:hidden fixed right-4 bottom-[calc(env(safe-area-inset-bottom)+84px)] z-40">
          <Link href="/post-task">
            <Button className="rounded-full h-12 w-12 p-0 shadow-lg bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 transition-all duration-200">
              <span className="text-2xl leading-none">+</span>
            </Button>
          </Link>
        </div>
        </PullToRefresh>
      </main>
    </div>
  );
}