
"use client";

import { useEffect, useMemo, useState, useCallback, useRef, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CompletionReviewModal } from "@/components/CompletionReviewModal";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { 
  Clock, 
  MapPin, 
  MapPinOff,
  Loader2,
  IndianRupee, 
  Briefcase, 
  Star, 
  CheckCircle, 
  Search, 
  Filter, 
  X,
  User,
  HelpCircle,
  LogOut,
  ChevronDown,
  Bell,
  Gavel,
  MessageSquare,
  ClipboardList,
  Home,
  LayoutList,
  Plus,
  Wallet,
  Sparkles,
  RotateCcw,
  SlidersHorizontal,
  CalendarDays,
  Ban,
  Trash2,
  Eye,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { fetchRecentOpenJobsQuick } from "@/lib/homeJobsCache";
import {
  TASK_PRICE_FILTER_DEFAULT,
  TASK_PRICE_FILTER_MAX,
  isDefaultTaskPriceFilter,
} from "@/lib/taskPriceFilter";
import { isCoercedTruthy, isJobCompletedFlag, isOpenForAvailableList } from "@/lib/jobStatusNormalize";
import { jobIdVariants } from "@/lib/jobIdVariants";
import useStore from "@/lib/Zustand";
import { DESKTOP_MIN_WIDTH } from "@/lib/breakpoints";
import { formatJobPostedTimestamp, getJobPostedTimestampRaw } from "@/lib/jobPostedAt";
import { formatDateWithTime } from "@/lib/utils";
import { dueDisplayForListCard } from "@/lib/taskDueDisplay";
import { resolveProfileImageUrl } from "@/lib/profileImage";
import { warmTaskDetailNavigation } from "@/lib/taskNavCache";
import { paymentsRouteFromSession } from "@/lib/paymentNavigation";
import { useNotifications } from "@/lib/useNotifications";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { EmptyState } from "@/components/EmptyState";
import { SearchEmptyIllustration, BriefcaseEmptyIllustration } from "@/components/empty-state-illustrations";
import { ShareTaskButton } from "@/components/ShareTaskButton";
import { TaskOfferCtaButton, TaskOfferSubmittedBadge } from "@/components/TaskOfferCtaButton";
import {
  DashboardTaskSummaryCard,
  type DashboardTaskCardAccent,
  type DashboardTaskSummaryStatusTone,
} from "@/components/dashboard/DashboardTaskSummaryCard";
import { TaskDueSummaryRow } from "@/components/dashboard/TaskDueSummaryRow";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { TrustBadges } from "@/components/TrustBadges";
import { analytics } from "@/lib/analytics";
import {
  getPayoutEligibilityStats,
} from "@/lib/payoutProfileCompletion";
import { PayoutProfileProgress } from "@/components/PayoutProfileProgress";
import { hasCompletedAppGuide } from "@/lib/appFeatureGuide";
import { useAppFeatureGuideStore } from "@/lib/appFeatureGuideStore";
import { APP_TOUR_RESUME_KEY } from "@/lib/appTourTargets";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Load Leaflet map client-only to avoid mobile crashes
const TaskLocationMap = dynamic(
  () => import("@/components/TaskLocationMap").then((m) => ({ default: m.TaskLocationMap })),
  { ssr: false }
);
const NotificationBar = dynamic(() => import("@/components/NotificationBar"), { ssr: false });

function CancelReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  reason: string;
  onReasonChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={() => { onOpenChange(false); onCancel(); }}
      onCancel={() => { onOpenChange(false); onCancel(); }}
      className="fixed inset-0 z-50 m-auto max-h-[90vh] w-full max-w-md rounded-lg border bg-white p-6 shadow-lg [&::backdrop]:bg-black/50 dark:bg-slate-900 dark:border-slate-700"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <div className="mt-4">
        <label htmlFor="cancel-reason" className="text-sm font-medium">Cancellation Reason *</label>
        <Textarea
          id="cancel-reason"
          placeholder="Please explain why you need to cancel this task..."
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          className="mt-2 min-h-[100px]"
        />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={() => { onOpenChange(false); onCancel(); }}>Cancel</Button>
        <Button variant="destructive" onClick={onConfirm}>Submit Cancellation</Button>
      </div>
    </dialog>
  );
}

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
  dueDateFlexible?: boolean;
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
  latitude?: number;
  longitude?: number;
  distance_km?: number; // from jobs-nearby when Near me is on
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
  latitude?: number;
  longitude?: number;
}

interface Category {
  id: string;
  name: string;
}

function isRealJobImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  const u = String(url);
  return !u.includes("placeholder.svg") && !u.includes("placeholder.com");
}

function filterRealJobImages(images?: Image[] | null): Image[] {
  if (!images?.length) return [];
  return images.filter((img) => isRealJobImageUrl(img?.url));
}

function warmDashboardTaskNav(task: Task) {
  try {
    warmTaskDetailNavigation({
      id: String(task.id),
      title: task.title,
      description: task.description,
      budget: task.budget,
      location: task.location,
      status: task.status,
      posted_by: task.posted_by,
      posted_by_id: task.posted_by_id ?? task.user_ref_id,
      posted_by_profile_image: task.posted_by_profile_image,
      category: task.category,
      dueDate: task.dueDate,
      postedAt: task.postedAt,
      images: task.images?.map((img) => ({ id: img.id, url: img.url, alt: img.alt })),
    });
  } catch {
    /* ignore */
  }
}

function warmDashboardBidNav(bid: BidRequest) {
  try {
    const imgs = filterRealJobImages(bid.images);
    warmTaskDetailNavigation({
      id: String(bid.task_id),
      title: bid.task_title,
      description: bid.task_description,
      budget: bid.job_budget ?? 0,
      location: bid.task_location,
      posted_by: bid.posted_by,
      category: bid.category_name || bid.job_category,
      images: imgs.length ? imgs : undefined,
    });
  } catch {
    /* ignore */
  }
}

/** Centered strip under card title — real photos only (no placeholder). */
function DashboardCardThumbnails({ images, className }: { images?: Image[]; className?: string }) {
  const real = filterRealJobImages(images);
  /** Reserve one thumbnail row so cards with/without photos align in the grid. */
  const slotMin = "min-h-[4.5rem] sm:min-h-[5rem]";
  if (real.length === 0) {
    return <div className={cn("flex w-full justify-center", slotMin, className)} aria-hidden />;
  }
  return (
    <div className={cn("mt-2 flex w-full justify-center sm:mt-2.5", slotMin, className)}>
      <div className="grid w-full max-w-[200px] grid-cols-3 gap-1.5 sm:max-w-[240px] sm:gap-2">
        {real.slice(0, 3).map((img) => (
          <div
            key={img.id}
            className="relative aspect-square overflow-hidden rounded-lg border border-slate-200/70 shadow-sm dark:border-slate-600/70 sm:rounded-xl"
          >
            <Image
              src={img.url}
              alt={img.alt || "Task photo"}
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 28vw, 88px"
            />
          </div>
        ))}
      </div>
    </div>
  );
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
  return formatJobPostedTimestamp(raw);
}

// Deduplicate tasks by id (API may return same job twice)
function dedupeTasksById<T extends { id: string }>(tasks: T[]): T[] {
  const seen = new Set<string>();
  return tasks.filter((t) => {
    const id = String(t.id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

// Deduplicate by content (same title+description = likely duplicate from double submit or API)
// Prefer task_X format id – backend get-bids expects job_id like task_147; numeric id breaks offers
function dedupeTasksByContent(tasks: Task[]): Task[] {
  const byKey = new Map<string, Task>();
  const prefersTaskFormat = (t: Task) => String(t.id || "").startsWith("task_");
  for (const t of tasks) {
    const key = `${(t.title || "").trim().toLowerCase()}|${(t.description || "").trim().toLowerCase()}|${t.budget ?? 0}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, t);
    } else {
      const existingHasTaskId = prefersTaskFormat(existing);
      const currHasTaskId = prefersTaskFormat(t);
      // Prefer task_X format – ensures /tasks/task_147 and get-bids work (offers show)
      if (currHasTaskId && !existingHasTaskId) {
        byKey.set(key, t);
      } else if (existingHasTaskId && !currHasTaskId) {
        // keep existing (has task_X)
      } else {
        // Both same format – keep the one with a valid date, or higher id (newer)
        const existingHasDate = (existing.postedAtSortValue ?? 0) > 0 || (existing.postedAt && existing.postedAt !== "—" && existing.postedAt !== "Unknown");
        const currHasDate = (t.postedAtSortValue ?? 0) > 0 || (t.postedAt && t.postedAt !== "—" && t.postedAt !== "Unknown");
        if (currHasDate && !existingHasDate) {
          byKey.set(key, t);
        } else if (existingHasDate && !currHasDate) {
          // keep existing
        } else if (Number(t.id) > Number(existing.id)) {
          byKey.set(key, t); // prefer higher id (newer)
        }
      }
    }
  }
  return Array.from(byKey.values());
}

// Fetch get-job for posted tasks — get-user-jobs omits created_at and may only have due_date.
function fillMissingDatesFromGetJob(
  tasks: Task[],
  setter: React.Dispatch<React.SetStateAction<Task[]>>,
  API_BASE: string
) {
  if (tasks.length === 0) return;
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return;
  const batch = tasks.slice(0, 20);
  Promise.all(
    batch.map((t) =>
      fetch(`${API_BASE}/get-job/${t.id}/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "omit",
      }).then((r) => (r.ok ? r.json() : null))
    )
  )
    .then((responses) => {
      const updates: Array<{ id: string; postedAt: string; postedAtSortValue: number; postedAtISO: string }> = [];
      responses.forEach((res, i) => {
        const task = batch[i];
        if (!res || res.status_code !== 200 || !res.data) return;
        const job = res.data;
        const raw =
          getJobPostedTimestampRaw(job as Record<string, unknown>) ??
          job.tstamp ??
          job.timestamp ??
          job.created_at ??
          job.job_tstamp;
        const meta = formatTimestampValue(raw);
        if (meta.formatted !== "—") {
          updates.push({ id: task.id, postedAt: meta.formatted, postedAtSortValue: meta.sortValue, postedAtISO: meta.iso });
        }
      });
      if (updates.length > 0) {
        setter((prev) => {
          const next = prev.map((t) => {
            const u = updates.find((u) => u.id === t.id);
            if (u) return { ...t, postedAt: u.postedAt, postedAtSortValue: u.postedAtSortValue, postedAtISO: u.postedAtISO };
            return t;
          });
          try {
            sessionStorage.setItem("postedTasks", JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    })
    .catch(() => {});
}

// Get displayed postedAt for a task card - use cache if list has no date (get-job has full data)
function getCardPostedAt(task: { id: string; postedAt: string }): string {
  let raw = task.postedAt;
  if (!raw || raw === "—" || raw === "Unknown") {
    try {
      const cached = typeof window !== "undefined" ? localStorage.getItem(`task_${task.id}`) : null;
      if (cached) {
        const data = JSON.parse(cached);
        raw = data?.task?.postedAt || raw;
      }
    } catch {}
  }
  if (!raw || raw === "—" || raw === "Unknown") {
    return "Recently";
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(String(raw).trim())) {
    return String(raw).trim();
  }
  const formatted = formatDateWithTime(raw || undefined);
  if (!formatted || formatted === "—" || formatted === "Invalid date" || formatted.toLowerCase().includes("invalid")) {
    return "Recently";
  }
  return formatted;
}

/** Mobile task picker + URL `?tab=` — keep ids in sync with `activeTab` state. */
const DASHBOARD_TASK_TAB_KEYS = ["my-tasks", "available", "assigned", "completed", "my-bids"] as const;
type DashboardTaskTabKey = (typeof DASHBOARD_TASK_TAB_KEYS)[number];

const DASHBOARD_TASK_VIEW_OPTIONS: {
  id: DashboardTaskTabKey;
  title: string;
  description: string;
}[] = [
  { id: "my-tasks", title: "Tasks I posted", description: "Jobs you created on JobPool." },
  { id: "available", title: "Available tasks", description: "Open tasks you can send an offer on." },
  { id: "assigned", title: "Assigned to me", description: "Work you are doing right now." },
  { id: "completed", title: "Completed", description: "Finished tasks." },
  { id: "my-bids", title: "My offers", description: "Offers and bids you have sent." },
];

function dashboardTaskViewTitle(tab: string): string {
  return DASHBOARD_TASK_VIEW_OPTIONS.find((o) => o.id === tab)?.title ?? "Tasks";
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userId, isAuthenticated, logout, addNotifications, updateUserProfileImage, checkAuth } = useStore();
  const { items: notificationItems, unreadCount, markAsRead, clearOldKeepLatest, clearAll, bellAnimating } = useNotifications(!!isAuthenticated);
  /** Recent preview in the bell panel (not unread-only, so "View all" / read items still make sense). */
  const bellPreviewItems = useMemo(() => {
    return [...notificationItems]
      .sort(
        (a, b) =>
          new Date((b as { created_at?: string }).created_at ?? (b as { createdAt?: string }).createdAt ?? 0).getTime() -
          new Date((a as { created_at?: string }).created_at ?? (a as { createdAt?: string }).createdAt ?? 0).getTime()
      )
      .slice(0, 20);
  }, [notificationItems]);
  // Inline mobile detection to avoid useIsMobile (potential React #310 cause on desktop)
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
  useEffect(() => {
    setMounted(true);
    setIsMobile(typeof window !== "undefined" && window.innerWidth < DESKTOP_MIN_WIDTH);
    const onResize = () => setIsMobile(window.innerWidth < DESKTOP_MIN_WIDTH);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const [authHydrated, setAuthHydrated] = useState(false);
  useEffect(() => {
    checkAuth();
    // Allow one tick for Zustand to update from localStorage before checking auth
    const t = setTimeout(() => setAuthHydrated(true), 50);
    return () => clearTimeout(t);
  }, [checkAuth]);

  useEffect(() => {
    if (authHydrated && isAuthenticated) analytics.viewDashboard();
  }, [authHydrated, isAuthenticated]);

  // First-time app feature tour (replay from profile menu or Settings)
  useEffect(() => {
    if (!authHydrated || !isAuthenticated || !effectiveUserId) return;
    let resume = false;
    try {
      resume = sessionStorage.getItem(APP_TOUR_RESUME_KEY) === "1";
      if (resume) sessionStorage.removeItem(APP_TOUR_RESUME_KEY);
    } catch {
      /* ignore */
    }
    if (!resume && hasCompletedAppGuide()) return;
    const delay = resume ? 500 : 1400;
    const t = window.setTimeout(() => {
      useAppFeatureGuideStore.getState().openGuide();
    }, delay);
    return () => window.clearTimeout(t);
  }, [authHydrated, isAuthenticated, effectiveUserId]);
  const mobile = mounted && isMobile;
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1";
  const [loading, setLoading] = useState(true);
  
  // Task states
  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]); // Tasker Completed
  const [completedTasksLoading, setCompletedTasksLoading] = useState<boolean>(false);
  const [availableTasksLoading, setAvailableTasksLoading] = useState(true);
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
  const [priceRange, setPriceRange] = useState<[number, number]>([...TASK_PRICE_FILTER_DEFAULT]);
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  /** Mobile Available tab: show keyword search field (header uses icon only). */
  const [availableSearchOpen, setAvailableSearchOpen] = useState(false);
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
  const [nearMeMode, setNearMeMode] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearMeError, setNearMeError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  /** True when any Available-tab filter/search differs from defaults (mobile badge + Clear all). */
  const availableFiltersActive = useMemo(() => {
    if (searchTerm.trim() !== "") return true;
    if (category !== "all") return true;
    if (!isDefaultTaskPriceFilter(priceRange)) return true;
    if (location.trim() !== "") return true;
    if (nearMeMode) return true;
    if (!onlyOpen) return true;
    if (withImages) return true;
    return false;
  }, [searchTerm, category, priceRange, location, nearMeMode, onlyOpen, withImages]);

  const clearAvailableFilters = useCallback(() => {
    setSearchTerm("");
    setCategory("all");
    setPriceRange([...TASK_PRICE_FILTER_DEFAULT]);
    setLocation("");
    setNearMeMode(false);
    setNearMeError(null);
    setOnlyOpen(true);
    setWithImages(false);
    setAvailableSearchOpen(false);
  }, []);

  const availableSortMenuLabel = useMemo(() => {
    switch (availableSortBy) {
      case "nearest":
        return "Nearest first";
      case "oldest":
        return "Oldest first";
      case "highest":
        return "Highest budget";
      case "lowest":
        return "Lowest budget";
      default:
        return "Newest first";
    }
  }, [availableSortBy]);

  const selectDashboardTaskTab = useCallback(
    (value: string) => {
      setActiveTab(value);
      if (value === "my-tasks") {
        try {
          localStorage.removeItem(`user_tasks_${userId || effectiveUserId}`);
        } catch {
          /* ignore */
        }
        setRefetchPostedTrigger((t) => t + 1);
      } else if (value === "available") setRefetchAvailableTrigger((t) => t + 1);
      else if (value === "assigned") setRefetchAssignedTrigger((t) => t + 1);
      else if (value === "completed") setRefetchCompletedTrigger((t) => t + 1);
      else if (value === "my-bids") setRefetchBidsTrigger((t) => t + 1);
      if (searchParams.get("tab") !== value) {
        router.replace(`/dashboard?tab=${encodeURIComponent(value)}`, { scroll: false });
      }
    },
    [router, searchParams, userId, effectiveUserId]
  );

  useEffect(() => {
    const t = searchParams.get("tab");
    if (!t) return;
    if ((DASHBOARD_TASK_TAB_KEYS as readonly string[]).includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

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
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window === "undefined") return "available";
    try {
      const t = new URLSearchParams(window.location.search).get("tab");
      if (t && (DASHBOARD_TASK_TAB_KEYS as readonly string[]).includes(t)) return t;
    } catch {
      /* ignore */
    }
    return "available";
  });
  const [taskViewPickerOpen, setTaskViewPickerOpen] = useState(false);
  const [refetchAssignedTrigger, setRefetchAssignedTrigger] = useState(0);
  const [refetchPostedTrigger, setRefetchPostedTrigger] = useState(0);
  const [refetchAvailableTrigger, setRefetchAvailableTrigger] = useState(0);
  const [refetchCompletedTrigger, setRefetchCompletedTrigger] = useState(0);
  const [refetchBidsTrigger, setRefetchBidsTrigger] = useState(0);
  const [posterProfileCache, setPosterProfileCache] = useState<Record<string, string>>({});
  const fetchedPosterIds = useRef<Set<string>>(new Set());
  const [payoutSetupStats, setPayoutSetupStats] = useState<ReturnType<
    typeof getPayoutCompletionStats
  > | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [completeReviewTask, setCompleteReviewTask] = useState<Task | null>(null);
  const [completeReviewAsTaskmaster, setCompleteReviewAsTaskmaster] = useState(false);

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

  const handleNearMeToggle = useCallback(() => {
    if (nearMeMode) {
      setNearMeMode(false);
      setUserCoords(null);
      setNearMeError(null);
      setRefetchAvailableTrigger((t) => t + 1);
      return;
    }
    if (typeof navigator?.geolocation?.getCurrentPosition !== "function") {
      toast.error("Location is not supported by your browser");
      return;
    }
    setIsRequestingLocation(true);
    setNearMeError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setNearMeMode(true);
        setIsRequestingLocation(false);
        setRefetchAvailableTrigger((t) => t + 1);
      },
      () => {
        toast.error("Could not get your location");
        setNearMeError("Location denied or unavailable");
        setIsRequestingLocation(false);
      },
      { timeout: 10000, maximumAge: 300000, enableHighAccuracy: true }
    );
  }, [nearMeMode]);

  useEffect(() => {
    if (activeTab !== "available") {
      setAvailableSearchOpen(false);
      setShowFilters(false);
    }
  }, [activeTab]);

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
            // Don't show warning when API fails - avoid false "verification pending" on cold start
            return;
          }
          
          // Only show warning if pendingVerification exists (payment not verified) 
          // AND we couldn't confirm payment completion from backend
          if (pendingVerification) {
            console.warn("⚠️ Payment verification pending for task:", data.taskId);
            toast.error("⚠️ Payment pending! Please complete payment to confirm the task assignment.", {
              duration: 6000,
              action: {
                label: "Complete Payment",
                onClick: () => router.push(paymentsRouteFromSession()),
              },
            });
          }
        }
      } catch (e) {
        console.error("Error checking pending payment:", e);
      }
    };
    
    // Run check after a short delay; re-run when tasks load so we can clear from local state
    const timeoutId = setTimeout(checkPendingPayment, 1500);
    return () => clearTimeout(timeoutId);
  }, [effectiveUserId, router, postedTasks, assignedTasks]);

  // Fetch profile image on load (API uses profile_img; login may not return it)
  useEffect(() => {
    if (!effectiveUserId || !updateUserProfileImage) return;
    const controller = new AbortController();
    (async () => {
      try {
        const res = await axiosInstance.get(`/profile?user_id=${effectiveUserId}`, { signal: controller.signal });
        const payload = res.data?.data ?? res.data;
        const raw = payload?.profile_img ?? payload?.profile_image ?? payload?.avatar ?? "";
        const img = typeof raw === "string" ? raw.trim() : "";
        if (img) updateUserProfileImage(img);
      } catch {}
    })();
    return () => controller.abort();
  }, [effectiveUserId, updateUserProfileImage]);

  // Wallet / payout readiness (same rules as Wallet page)
  useEffect(() => {
    if (!effectiveUserId) {
      setPayoutSetupStats(null);
      return;
    }
    const controller = new AbortController();
    (async () => {
      try {
        const [profRes, walRes] = await Promise.all([
          axiosInstance.get(`/profile?user_id=${effectiveUserId}`, { signal: controller.signal }),
          axiosInstance.get(`/wallet?user_id=${effectiveUserId}&limit=1`, { signal: controller.signal }),
        ]);
        const payload = profRes.data?.data ?? profRes.data;
        const wd = walRes.data?.data ?? walRes.data;
        const stats = getPayoutEligibilityStats(wd, payload);
        setPayoutSetupStats(stats);
      } catch {
        setPayoutSetupStats(null);
      }
    })();
    return () => controller.abort();
  }, [effectiveUserId, user?.verification_status, user?.profile_image]);

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
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        refreshActiveTab();
        try {
          if (sessionStorage.getItem("refresh_tasks") === "1") {
            sessionStorage.removeItem("refresh_tasks");
            setRefetchPostedTrigger((t) => t + 1);
            setRefetchAssignedTrigger((t) => t + 1);
            setRefetchCompletedTrigger((t) => t + 1);
            try { localStorage.removeItem(`user_tasks_${userId || effectiveUserId}`); } catch {}
          }
        } catch {}
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [activeTab, userId, effectiveUserId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (sessionStorage.getItem("refresh_tasks") === "1") {
        sessionStorage.removeItem("refresh_tasks");
        try { sessionStorage.removeItem("completedTasks"); } catch {}
        setRefetchPostedTrigger((t) => t + 1);
        setRefetchAssignedTrigger((t) => t + 1);
        setRefetchCompletedTrigger((t) => t + 1);
        try { localStorage.removeItem(`user_tasks_${userId || effectiveUserId}`); } catch {}
      }
    } catch {}
  }, [userId, effectiveUserId]);

  useEffect(() => {
    // Hydrate from session to reduce flicker on tab switches
    try {
      const a = sessionStorage.getItem("assignedTasks");
      if (a) setAssignedTasks(JSON.parse(a));
    } catch {}
    try {
      const p = sessionStorage.getItem("postedTasks");
      if (p) {
        const tasks = dedupeTasksByContent(dedupeTasksById(JSON.parse(p) as Task[]));
        setPostedTasks(tasks);
        fillMissingDatesFromGetJob(tasks, setPostedTasks, API_BASE);
      }
    } catch {}
    try {
      const r = sessionStorage.getItem("requestedTasks");
      if (r) setRequestedTasks(JSON.parse(r));
    } catch {}
    try {
      const c = sessionStorage.getItem("completedTasks");
      if (c) setCompletedTasks(JSON.parse(c) as Task[]);
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
    if (!authHydrated) return; // Wait for checkAuth to restore session from localStorage
    if (!isAuthenticated || !user || !(userId || effectiveUserId)) {
      router.push("/signin");
      return;
    }
    setLoading(false);
    fetchTaskOrders(); // Fetch task orders when user is authenticated
  }, [authHydrated, isAuthenticated, user, userId, effectiveUserId, router]);

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
            const cachedTasks = dedupeTasksByContent(dedupeTasksById(cachedData.tasks as Task[]));
            setPostedTasks(cachedTasks);
            fillMissingDatesFromGetJob(cachedTasks, setPostedTasks, API_BASE);
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

            // Use creation date for "posted" - check all known API date fields (get-user-jobs may use different names)
            const postedMeta = formatTimestampValue(getJobPostedTimestampRaw(job as Record<string, unknown>));
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

          const deduped = dedupeTasksByContent(dedupeTasksById(tasks));
          setPostedTasks(deduped);
          try { sessionStorage.setItem("postedTasks", JSON.stringify(deduped)); } catch {}

          // Cache the user tasks
          localStorage.setItem(cacheKey, JSON.stringify({
            tasks: deduped,
            timestamp: Date.now()
          }));

          // If get-user-jobs didn't return dates, fetch get-job for each (backend returns full data)
          fillMissingDatesFromGetJob(deduped, setPostedTasks, API_BASE);
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
              const tasks = dedupeTasksByContent(dedupeTasksById(JSON.parse(cachedTasks) as Task[]));
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

  // Load available tasks from localStorage (instant paint after login / revisit)
  useEffect(() => {
    const loadCachedTasks = () => {
      try {
        const cachedTasks = localStorage.getItem("availableTasks");
        const timestamp = localStorage.getItem("availableTasksTimestamp");
        if (!cachedTasks || !timestamp) return;

        const age = Date.now() - parseInt(timestamp, 10);
        const maxAge = 6 * 60 * 60 * 1000; // 6h — show while network refreshes
        if (Number.isNaN(age) || age >= maxAge) {
          localStorage.removeItem("availableTasks");
          localStorage.removeItem("availableTasksTimestamp");
          return;
        }

        const tasks = dedupeTasksByContent(dedupeTasksById(JSON.parse(cachedTasks) as Task[]));
        if (tasks.length > 0) {
          setAvailableTasks((prev) => (prev.length > 0 ? prev : tasks));
          const uid = (userId || effectiveUserId)?.toString();
          const cachedData = localStorage.getItem("all_jobs_data");
          if (cachedData && uid) {
            localStorage.setItem(`all_jobs_data_${uid}`, cachedData);
          }
        }
      } catch (error) {
        console.error("Error loading cached tasks:", error);
      }
    };

    loadCachedTasks();
  }, [userId, effectiveUserId]);

  // Fetch all available tasks (jobs-nearby when Near me on, else get-all-jobs)
  useEffect(() => {
    if (!user || !(userId || effectiveUserId)) return;

    const quickFetchController = new AbortController();
    let fullAvailableFetchSettled = false;

    const mapJobToTask = (job: any): Task => {
      const j = job as Record<string, unknown>;
      const completed = isJobCompletedFlag(j);
      const deleted = isCoercedTruthy(job.deletion_status);
      const cancelled = isCoercedTruthy(job.cancel_status) || isCoercedTruthy(job.cancelled);
      const jobStatus = completed ? "completed" : deleted ? "deleted" : cancelled ? "canceled" : "open";
      const postedMeta = formatTimestampValue(getJobPostedTimestampRaw(job as Record<string, unknown>));
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
          : undefined,
        dueDateFlexible: job.due_date_flexible === true,
        offers: job.offers || 0,
        posted_by: job.posted_by || "Unknown",
        posted_by_profile_image: job.posted_by_profile_image || job.taskmanager_profile_image || job.taskmanager_profile_img || job.poster?.profile_img || job.profile_img || job.user_profile_img,
        posted_by_id: job.user_ref_id || job.posted_by_id || job.user_id,
        category: job.job_category || "general",
        job_completion_status: completed ? "Completed" : "Not Completed",
        deletion_status: deleted,
        cancel_status: cancelled,
        images: job.job_images?.urls?.length ? job.job_images.urls.map((url: string, index: number) => ({ id: `img${index + 1}`, url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url, alt: `Job image ${index + 1}` })) : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
        latitude: typeof job.latitude === "number" ? job.latitude : undefined,
        longitude: typeof job.longitude === "number" ? job.longitude : undefined,
        distance_km: typeof job.distance_km === "number" ? job.distance_km : undefined,
      };
    };

    const uid = (userId || effectiveUserId)?.toString();
    void fetchRecentOpenJobsQuick(56, quickFetchController.signal).then((raw) => {
      if (quickFetchController.signal.aborted || fullAvailableFetchSettled || raw.length === 0) return;
      try {
        const quickTasks = raw
          .filter((job: any) => isOpenForAvailableList(job as Record<string, unknown>, uid))
          .map(mapJobToTask);
        if (quickTasks.length > 0) {
          setAvailableTasks(dedupeTasksByContent(dedupeTasksById(quickTasks)));
        }
      } catch {
        /* ignore */
      }
    });

    const fetchAllTasks = async () => {
      setAvailableTasksLoading(true);
      const hydrateAvailableFromLocalCache = () => {
        try {
          const cachedTasks = localStorage.getItem("availableTasks");
          const timestamp = localStorage.getItem("availableTasksTimestamp");
          if (!cachedTasks || !timestamp) return;
          const age = Date.now() - parseInt(timestamp, 10);
          if (Number.isNaN(age) || age > 6 * 60 * 60 * 1000) return;
          const tasks = dedupeTasksByContent(dedupeTasksById(JSON.parse(cachedTasks) as Task[]));
          if (tasks.length > 0) {
            setAvailableTasks((prev) => (prev.length > 0 ? prev : tasks));
          }
        } catch {
          /* ignore */
        }
      };

      hydrateAvailableFromLocalCache();

      try {
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45_000);
        const uid = (userId || effectiveUserId)?.toString();

        // When Near me is on, use jobs-nearby (returns lat/lng → maps show)
        if (nearMeMode && userCoords) {
          try {
            const url = `${API_BASE}/jobs-nearby/?lat=${userCoords.lat}&lng=${userCoords.lng}&radius_km=${radiusKm}&limit=100`;
            const res = await fetch(url, {
              method: 'GET',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              credentials: 'omit',
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (res.ok) {
              const data = await res.json();
              if (data?.status_code === 200 && Array.isArray(data?.data?.jobs)) {
                const tasks: Task[] = data.data.jobs
                  .filter((j: any) => isOpenForAvailableList(j as Record<string, unknown>, uid))
                  .map(mapJobToTask);
                const deduped = dedupeTasksByContent(dedupeTasksById(tasks));
                setAvailableTasks(deduped);
                localStorage.setItem('availableTasks', JSON.stringify(deduped));
                localStorage.setItem('availableTasksTimestamp', Date.now().toString());
                return;
              }
            }
          } catch {
            setNearMeError("Nearby search unavailable");
          }
        }

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
              const tasks = dedupeTasksByContent(dedupeTasksById(JSON.parse(cachedTasks) as Task[]));
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
          const currentUserId = (userId || effectiveUserId)?.toString();
          const tasks: Task[] = result.data.jobs
            .filter((job: any) => isOpenForAvailableList(job as Record<string, unknown>, currentUserId || ""))
            .map((job: any) => {
              let jobStatus = "open";
              const jr = job as Record<string, unknown>;
              if (isJobCompletedFlag(jr)) {
                jobStatus = "completed";
              } else if (isCoercedTruthy(job.deletion_status)) {
                jobStatus = "deleted";
              } else if (isCoercedTruthy(job.cancel_status) || isCoercedTruthy(job.cancelled)) {
                jobStatus = "canceled";
              }
              // All other tasks remain "open" for bidding
              
              // Posted date: use creation timestamp only (not job_due_date – that's when task is due)
              const postedMeta = formatTimestampValue(getJobPostedTimestampRaw(job as Record<string, unknown>));

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
                  : undefined,
                dueDateFlexible: job.due_date_flexible === true,
                offers: job.offers || 0, // Use original offers field as fallback
                posted_by: job.posted_by || "Unknown",
                posted_by_profile_image: job.posted_by_profile_image || job.taskmanager_profile_image || job.taskmanager_profile_img || job.poster?.profile_img || job.poster?.profile_image || job.profile_img || job.user_profile_img,
                posted_by_id: job.user_ref_id || job.posted_by_id || job.user_id,
                category: job.job_category || "general",
                job_completion_status: isJobCompletedFlag(jr) ? "Completed" : "Not Completed",
                deletion_status: isCoercedTruthy(job.deletion_status),
                cancel_status: isCoercedTruthy(job.cancel_status) || isCoercedTruthy(job.cancelled),
                distance_km: typeof job.distance_km === "number" ? job.distance_km : undefined,
                images: job.job_images?.urls?.length
                  ? job.job_images.urls.map((url: string, index: number) => ({
                      id: `img${index + 1}`,
                      url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url,
                      alt: `Job image ${index + 1}`,
                    }))
                  : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
                latitude: typeof job.latitude === "number" ? job.latitude : undefined,
                longitude: typeof job.longitude === "number" ? job.longitude : undefined,
              };
            });

          const availableTasksWithBidCounts = dedupeTasksByContent(dedupeTasksById(tasks));
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
        // Handle AbortError separately (don't show error toast)
        if ((err as any)?.name === 'AbortError') {
          console.log("⏰ Fetch all tasks was aborted (timeout)");
          try {
            const cachedTasks = localStorage.getItem("availableTasks");
            if (cachedTasks) {
              const tasks = dedupeTasksByContent(dedupeTasksById(JSON.parse(cachedTasks) as Task[]));
              if (tasks.length > 0) setAvailableTasks(tasks);
            }
          } catch {
            /* ignore */
          }
          return;
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
        fullAvailableFetchSettled = true;
        setAvailableTasksLoading(false);
        console.log("🔍 fetchAllTasks completed");
        // avoid global loader flicker
      }
    };

    fetchAllTasks();
    return () => {
      quickFetchController.abort();
    };
  }, [user, userId, refetchAvailableTrigger, nearMeMode, userCoords, radiusKm]);

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
              
              const postedMeta = formatTimestampValue(getJobPostedTimestampRaw(job as Record<string, unknown>));
              let postedAtFormatted = postedMeta.formatted === "—" ? "Recently" : postedMeta.formatted;
              let postedAtSortValue = postedMeta.sortValue;
              let postedAtISO = postedMeta.iso;

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
                dueDate: job.job_due_date || job.dueDate || undefined,
                dueDateFlexible: job.due_date_flexible === true,
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
                latitude: typeof job.latitude === "number" ? job.latitude : undefined,
                longitude: typeof job.longitude === "number" ? job.longitude : undefined,
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
                  const postedMeta = formatTimestampValue(getJobPostedTimestampRaw(job as Record<string, unknown>));
                  let postedAtFormatted = postedMeta.formatted === "—" ? "Recently" : postedMeta.formatted;
                  let postedAtSortValue = postedMeta.sortValue;
                  let postedAtISO = postedMeta.iso;

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
                    dueDate: job.job_due_date || job.dueDate || undefined,
                    dueDateFlexible: job.due_date_flexible === true,
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
            latitude: typeof bid.latitude === "number" ? bid.latitude : undefined,
            longitude: typeof bid.longitude === "number" ? bid.longitude : undefined,
          }));
          // Enrich each bid with task cancel status, lat/lng, and filter out cancelled tasks
          try {
            const results = await Promise.allSettled(
              bids.map(async (b) => {
                const r = await axiosInstance.get(`/get-job/${b.task_id}/`);
                const job = r.data?.data?.job || r.data?.job || {};
                const isCancelled = job?.status === true || job?.cancel_status === true || job?.status === "Cancelled" || job?.status === "cancelled";
                const isDeleted = job?.deletion_status === true || job?.deletion_status === 1 || job?.status === "Deleted" || job?.status === "deleted";
                const lat = typeof job?.latitude === "number" ? job.latitude : undefined;
                const lng = typeof job?.longitude === "number" ? job.longitude : undefined;
                return { id: b.bid_id, task_id: b.task_id, cancelled: !!isCancelled, deleted: !!isDeleted, latitude: lat, longitude: lng };
              })
            );
            const cancelledMap: Record<string, boolean> = {};
            const deletedMap: Record<string, boolean> = {};
            const latLngMap: Record<string, { lat: number; lng: number }> = {};
            for (const res of results) {
              if (res.status === 'fulfilled') {
                cancelledMap[res.value.task_id] = res.value.cancelled;
                deletedMap[res.value.task_id] = res.value.deleted;
                if (res.value.latitude != null && res.value.longitude != null) {
                  latLngMap[res.value.task_id] = { lat: res.value.latitude, lng: res.value.longitude };
                }
              }
            }
            const enriched = bids
              .map((b) => ({
                ...b,
                task_cancelled: cancelledMap[b.task_id] ?? false,
                task_deleted: deletedMap[b.task_id] ?? false,
                latitude: latLngMap[b.task_id]?.lat ?? b.latitude,
                longitude: latLngMap[b.task_id]?.lng ?? b.longitude,
              }));
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
                ...(() => {
                  const postedMeta = formatTimestampValue(getJobPostedTimestampRaw(job as Record<string, unknown>));
                  return {
                    postedAt: postedMeta.formatted === "—" ? "" : postedMeta.formatted,
                    postedAtSortValue: postedMeta.sortValue,
                    postedAtISO: postedMeta.iso,
                  };
                })(),
                dueDate: job.job_due_date || job.dueDate || undefined,
                dueDateFlexible: job.due_date_flexible === true,
                completedDate: jobStatus === "completed" ? (job.updated_at || job.completed_at || job.completed_date || undefined) : undefined,
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
                        const postedMeta = formatTimestampValue(getJobPostedTimestampRaw(job as Record<string, unknown>));
                        return {
                          id: job.job_id?.toString() || job.id?.toString() || String(Math.random()),
                          title: job.job_title || job.title || "Untitled",
                          description: job.job_description || job.description || "",
                          budget: Number(job.job_budget || job.budget || 0),
                          location: job.job_location || job.location || "Unknown",
                          status: "completed",
                          postedAt: postedMeta.formatted === "—" ? "Recently" : postedMeta.formatted,
                          postedAtSortValue: postedMeta.sortValue || Date.now(),
                          postedAtISO: postedMeta.iso || new Date().toISOString(),
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
  }, [user, userId, refetchCompletedTrigger]);

  // Persist completed tasks to sessionStorage for fast hydration on next visit
  useEffect(() => {
    try {
      if (completedTasks.length > 0) {
        sessionStorage.setItem("completedTasks", JSON.stringify(completedTasks));
      }
    } catch {}
  }, [completedTasks]);

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
              completedDate: new Date().toISOString(),
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
            selectDashboardTaskTab("completed");
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
                  completedDate: fullyCompleted ? new Date().toISOString() : task.completedDate,
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
      const path = completeReviewAsTaskmaster
        ? "mark-complete-by-taskmaster"
        : "mark-complete";
      const tryIds = jobIdVariants(jobId);
      let resp: Awaited<ReturnType<typeof axiosInstance.put>> | null = null;
      let lastErr: unknown = null;
      for (let i = 0; i < tryIds.length; i++) {
        const jid = tryIds[i];
        try {
          resp = await axiosInstance.put(`/${path}/${jid}/`, reviewBody, { headers });
          break;
        } catch (e: unknown) {
          lastErr = e;
          const st = (e as { response?: { status?: number } })?.response?.status;
          const more = i < tryIds.length - 1;
          if (more && (st === 404 || st === 500)) continue;
          throw e;
        }
      }
      if (!resp && lastErr) throw lastErr;
      if (!resp) throw new Error("No response from mark complete");
      const payload = (resp?.data as any)?.data ?? resp?.data ?? {};
      const fullyCompleted =
        payload?.job_completion_status === 1 || payload?.job_completion_status === "1";
      const updatedTaskerCompleted =
        payload?.tasker_completed !== undefined
          ? payload.tasker_completed
          : !completeReviewAsTaskmaster;
      const updatedTaskmasterCompleted =
        payload?.taskmaster_completed !== undefined
          ? payload.taskmaster_completed
          : completeReviewAsTaskmaster;

      toast.success(
        fullyCompleted
          ? "Task marked complete and review submitted!"
          : completeReviewAsTaskmaster
          ? "Your confirmation was saved. Waiting for tasker to mark complete."
          : "Your completion was saved. Waiting for task owner confirmation."
      );
      if (completeReviewAsTaskmaster) {
        const completedTask = postedTasks.find((t) => t.id === jobId);
        if (completedTask) {
          const updated = {
            ...completedTask,
            tasker_completed: updatedTaskerCompleted,
            taskmaster_completed: updatedTaskmasterCompleted,
            job_completion_status:
              payload?.job_completion_status ?? completedTask.job_completion_status,
            status: fullyCompleted ? "completed" : completedTask.status,
            postedAtSortValue: completedTask.postedAtSortValue ?? Date.now(),
          } as Task;
          if (fullyCompleted) {
            setCompletedTasks((prev) => [
              ...prev.filter((t) => String(t.id) !== String(jobId)),
              updated,
            ]);
          }
        }
        setPostedTasks((prev) =>
          prev.map((t) =>
            t.id === jobId
              ? {
                  ...t,
                  tasker_completed: updatedTaskerCompleted,
                  taskmaster_completed: updatedTaskmasterCompleted,
                  job_completion_status:
                    payload?.job_completion_status ?? t.job_completion_status,
                  status: fullyCompleted ? ("completed" as const) : t.status,
                }
              : t
          )
        );
      } else {
        const completedTask = assignedTasks.find((t) => t.id === jobId);
        if (completedTask) {
          if (fullyCompleted) {
            setAssignedTasks((prev) => prev.filter((t) => String(t.id) !== String(jobId)));
            setCompletedTasks((prev) => [
              ...prev,
              {
                ...completedTask,
                status: "completed",
                postedAtSortValue: completedTask.postedAtSortValue ?? Date.now(),
                tasker_completed: updatedTaskerCompleted,
                taskmaster_completed: updatedTaskmasterCompleted,
                job_completion_status:
                  payload?.job_completion_status ?? completedTask.job_completion_status,
              } as Task,
            ]);
            selectDashboardTaskTab("completed");
          } else {
            setAssignedTasks((prev) =>
              prev.map((t) =>
                String(t.id) === String(jobId)
                  ? {
                      ...t,
                      tasker_completed: updatedTaskerCompleted,
                      taskmaster_completed: updatedTaskmasterCompleted,
                      job_completion_status:
                        payload?.job_completion_status ?? t.job_completion_status,
                    }
                  : t
              )
            );
          }
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
                  
                  const postedMeta = formatTimestampValue(getJobPostedTimestampRaw(job as Record<string, unknown>));
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
                
                const dedupedRefresh = dedupeTasksByContent(dedupeTasksById(tasks));
                setPostedTasks(dedupedRefresh);
                try { sessionStorage.setItem("postedTasks", JSON.stringify(dedupedRefresh)); } catch {}
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

  // Sort available tasks by selected option (newest, oldest, highest budget, lowest budget, nearest)
  const sortedAvailableTasks = useMemo(() => {
    const deduped = dedupeTasksByContent(dedupeTasksById(filteredTasks));
    const copy = [...deduped];
    copy.sort((a, b) => {
      if (availableSortBy === "nearest") {
        const aDist = typeof (a as any).distance_km === "number" ? (a as any).distance_km : Infinity;
        const bDist = typeof (b as any).distance_km === "number" ? (b as any).distance_km : Infinity;
        return aDist - bDist; // ascending: nearest first
      }
      if (availableSortBy === "newest") {
        const aVal = a.postedAtSortValue ?? 0;
        const bVal = b.postedAtSortValue ?? 0;
        return bVal - aVal; // descending: larger (newer) timestamps first
      }
      if (availableSortBy === "oldest") {
        const aVal = a.postedAtSortValue ?? 0;
        const bVal = b.postedAtSortValue ?? 0;
        return aVal - bVal; // ascending: smaller (older) timestamps first
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
        const sortVal = t.postedAtSortValue ?? (t.postedAtISO ? new Date(t.postedAtISO).getTime() : 0);
        if (!sortVal) return true;
        if (dateRange?.from) {
          const fromStart = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()).getTime();
          if (sortVal < fromStart) return false;
        }
        if (dateRange?.to) {
          const toEnd = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate(), 23, 59, 59, 999).getTime();
          if (sortVal > toEnd) return false;
        }
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

  // Always use unified dashboard; remove dummy MobileDashboard on mobile

  const counts = {
    my: postedTasks.length,
    available: availableTasks.length,
    assigned: assignedTasks.length,
    completed: completedTasks.length,
    bids: bids.length,
  };

  return (
    <div className="flex min-h-0 flex-col bg-gradient-to-b from-slate-50/90 via-white to-slate-50/70 overflow-x-hidden md:min-h-screen">
      <main className="flex-1 w-full max-w-none mx-auto py-3 md:py-10 px-4 md:px-8 lg:px-12 pb-6 md:pb-10">
        <div className="contents">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 md:mb-8 gap-3 md:gap-4 animate-fade-in-up">
          {!isMobile && (
            <div className="animate-slide-in-right">
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-slate-100">
                Dashboard
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">Manage your tasks and bids</p>
            </div>
          )}
          <div className="hidden lg:flex items-center gap-4 animate-slide-in-right">
            <Link
              href="/"
              data-tour="tour-desktop-home"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-colors font-medium text-sm"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link
              href="/messages"
              data-tour="tour-desktop-messages"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-colors font-medium text-sm"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>
            <Link
              href="/profile/offerings/new"
              data-tour="tour-desktop-create-listing"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700/80 transition-colors font-medium text-sm"
              title="Create a service listing"
            >
              <Plus className="h-4 w-4" />
              Create listing
            </Link>
            {/* Enhanced Notifications with proper clickable functionality */}
            <div className="relative">
              <NotificationBar />
            </div>
            
            {/* Premium Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                data-tour="tour-dashboard-profile"
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
                <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-lg truncate max-w-[140px]">{safeUser.name || "User"}</span>
                  {user?.verification_status >= 2 && <VerifiedBadge size="md" />}
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {profileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700/80 overflow-hidden z-50 animate-fade-in-up ring-1 ring-slate-900/5">
                  <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-4">
                      {(resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image) ? (
                        <img 
                          src={resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image} 
                          alt={safeUser.name || "Profile"} 
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-md"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xl font-semibold ring-2 ring-white dark:ring-slate-800 shadow-md">
                          {safeUser.name?.charAt(0) || "U"}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-nowrap min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-base truncate" title={safeUser.name || "User"}>
                            {safeUser.name || "User"}
                          </p>
                          {user?.verification_status >= 2 && <VerifiedBadge size="md" />}
                        </div>
                        {safeUser.email && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5" title={safeUser.email}>
                            {safeUser.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="py-1.5">
                    <Link href="/" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <Home className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">Go to Home</span>
                    </Link>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">My Profile</span>
                    </Link>
                    <Link
                      href="/profile?tab=listings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                    >
                      <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-900/20">
                        <LayoutList className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">My listings</span>
                    </Link>
                    <Link href="/messages" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-900/20">
                        <MessageSquare className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">Messages</span>
                    </Link>
                    <Link href="/wallet" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">Wallet</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        useAppFeatureGuideStore.getState().openGuide();
                      }}
                      className="flex w-[calc(100%-1rem)] items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150 text-left"
                    >
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">App tour</span>
                    </button>
                    <Link href="/supportpage" className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <HelpCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">Contact Support</span>
                    </Link>
                    <div className="border-t border-slate-100 dark:border-slate-700/50 my-1.5" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-150 w-[calc(100%-1rem)] text-left"
                    >
                      <div className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20">
                        <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-red-600 dark:text-red-400 font-medium text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Compact mobile header (disabled to avoid duplicate profile chip) */}
        {false && (
          <div className="lg:hidden -mt-1 mb-3 flex items-center justify-end">
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
                <div className="absolute right-0 mt-3 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-700/80 overflow-hidden py-3 z-50 animate-fade-in-up ring-1 ring-slate-900/5">
                  <div className="px-5 py-4 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border-b border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-4">
                      {safeUser && (resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image) ? (
                        <img 
                          src={resolveProfileImageUrl(safeUser.profile_image) || safeUser.profile_image || ""} 
                          alt={(safeUser.name) || "Profile"} 
                          className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-slate-800 shadow-md"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-lg font-semibold ring-2 ring-white dark:ring-slate-800 shadow-md">
                          {(safeUser.name ? safeUser.name.charAt(0) : "U")}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-nowrap">
                          <p className="font-semibold text-slate-900 dark:text-slate-100 text-base truncate" title={safeUser.name || "User"}>{safeUser.name || "User"}</p>
                          {user?.verification_status >= 2 && <VerifiedBadge size="sm" />}
                        </div>
                        {safeUser.email && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5" title={safeUser.email}>{safeUser.email}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="py-1.5">
                    <Link href="/" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <Home className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">Go to Home</span>
                    </Link>
                    <Link href="/profile" className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">My Profile</span>
                    </Link>
                    <Link
                      href="/profile?tab=listings"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                    >
                      <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-900/20">
                        <LayoutList className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">My listings</span>
                    </Link>
                    <Link href="/messages" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-900/20">
                        <MessageSquare className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">Messages</span>
                    </Link>
                    <Link href="/wallet" onClick={() => setProfileDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                        <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">Wallet</span>
                    </Link>
                    <Link href="/supportpage" className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <HelpCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <span className="text-slate-700 dark:text-slate-200 font-medium text-sm">Contact Support</span>
                    </Link>
                    <div className="border-t border-slate-100 dark:border-slate-700/50 my-1.5" />
                    <button 
                      onClick={handleSignOut} 
                      className="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors duration-150 w-[calc(100%-1rem)] text-left"
                    >
                      <div className="p-2 rounded-xl bg-red-50 dark:bg-red-900/20">
                        <LogOut className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-red-600 dark:text-red-400 font-medium text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Premium Post Task Button */}
        {/* Hide big CTA bar on small screens to avoid duplicate name/header block */}
        <div className="hidden lg:flex justify-start mb-8 animate-fade-in-up">
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
            <Link href="/post-task" passHref className="ml-auto" data-tour="tour-desktop-post-task">
              <Button className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-medium px-6 py-3 rounded-xl shadow-md transition-all duration-200">
                Post a Task
              </Button>
            </Link>
          </div>
        </div>

        {/* Trust badges for unverified users */}
        {user && (user.verification_status == null || Number(user.verification_status) < 2) && (
          <div className="mb-4">
            <TrustBadges
              heading="Your details are safe"
              subtext="Encrypted, compliant & protected"
              variant="strip"
            />
          </div>
        )}

        {payoutSetupStats && payoutSetupStats.remaining > 0 && (
          <div className="mb-4 max-w-md">
            <PayoutProfileProgress variant="dashboard" {...payoutSetupStats} />
          </div>
        )}

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
              {bellPreviewItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-slate-400 text-sm">
                  No notifications yet
                </div>
              ) : (
                bellPreviewItems.map((n) => {
                  const href = n.link || "/notifications";
                  const Icon = n.type === "bid" ? Gavel : n.type === "message" ? MessageSquare : Bell;
                  const iconBg = n.type === "bid" ? "bg-amber-500" : n.type === "message" ? "bg-blue-500" : "bg-purple-500";
                  const createdAt = n.created_at ?? (n as any).createdAt ?? new Date().toISOString();
                  return (
                    <Link
                      key={String(n.id)}
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
            <div className="px-4 py-3 border-t bg-gray-50 flex flex-wrap gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" className="h-9 px-3 border-gray-300" onClick={() => { void markAsRead(null); setShowNotifications(false); }}>
                  Mark all read
                </Button>
              )}
              {notificationItems.length > 10 && (
                <Button
                  variant="outline"
                  className="h-9 px-3 border-gray-300"
                  title="Keeps the 10 newest on this device only. Older items stay hidden until you close the app — nothing is deleted on the server."
                  onClick={() => {
                    clearOldKeepLatest();
                    setShowNotifications(false);
                  }}
                >
                  Clear old
                </Button>
              )}
              {notificationItems.length > 0 && (
                <Button
                  variant="outline"
                  className="h-9 px-3 border-gray-300"
                  title="Clears this list on this device; new items will appear again after the next refresh from the server."
                  onClick={() => {
                    clearAll();
                    setShowNotifications(false);
                  }}
                >
                  Clear all
                </Button>
              )}
              <Link href="/notifications" onClick={() => setShowNotifications(false)}>
                <Button className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700">View all</Button>
              </Link>
            </div>
          </div>
        )}

        <div className="w-full">
          {isMobile ? (
            <Sheet open={taskViewPickerOpen} onOpenChange={setTaskViewPickerOpen}>
              <div className="sticky z-20 -mx-4 mb-0 border-b border-slate-200/70 bg-slate-50/98 px-4 pb-1 pt-0 backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-950/98 top-0">
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    onClick={() => setTaskViewPickerOpen(true)}
                    className="flex min-h-[44px] min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-left shadow-sm transition active:scale-[0.99] dark:border-slate-600 dark:bg-slate-800"
                    aria-expanded={taskViewPickerOpen}
                    aria-haspopup="dialog"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Task lists
                      </span>
                      <span className="block truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                        {dashboardTaskViewTitle(activeTab)}
                      </span>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-slate-500 transition-transform dark:text-slate-400",
                        taskViewPickerOpen && "rotate-180"
                      )}
                      aria-hidden
                    />
                  </button>
                  {activeTab === "available" ? (
                    <button
                      type="button"
                      onClick={() => setAvailableSearchOpen((o) => !o)}
                      className={cn(
                        "flex w-11 shrink-0 items-center justify-center self-stretch rounded-xl border border-slate-200/90 bg-white text-slate-600 shadow-sm transition active:scale-[0.99] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300",
                        availableSearchOpen && "border-blue-300/80 bg-blue-50/90 text-blue-800 ring-2 ring-blue-500/20 dark:border-blue-700 dark:bg-blue-950/50 dark:text-blue-200"
                      )}
                      aria-label={availableSearchOpen ? "Hide search" : "Search tasks"}
                      aria-expanded={availableSearchOpen}
                    >
                      <Search className="h-[1.125rem] w-[1.125rem]" aria-hidden />
                    </button>
                  ) : null}
                </div>
              </div>
              {activeTab === "available" && availableSearchOpen ? (
                <div className="-mx-4 border-b border-slate-200/70 bg-slate-50/98 px-4 pb-2 pt-1 dark:border-slate-700/70 dark:bg-slate-950/98">
                  <form onSubmit={handleSearch} className="relative">
                    <label htmlFor="dashboard-available-search" className="sr-only">
                      Search tasks
                    </label>
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      id="dashboard-available-search"
                      type="search"
                      placeholder="Search…"
                      enterKeyHint="search"
                      autoComplete="off"
                      className="h-9 w-full rounded-full border border-slate-200/90 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-sm dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </form>
                </div>
              ) : null}
              <SheetContent
                side="bottom"
                className={cn(
                  "max-h-[85vh] overflow-y-auto rounded-t-2xl border-slate-200 p-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 dark:border-slate-700",
                  "[&>button.absolute]:right-3 [&>button.absolute]:top-3"
                )}
              >
                <SheetHeader className="space-y-1 px-4 pb-2 text-left">
                  <SheetTitle className="text-lg">Choose a list</SheetTitle>
                  <SheetDescription>Show tasks and offers for this account.</SheetDescription>
                </SheetHeader>
                <div className="px-2 pb-2">
                  <div className="flex flex-col gap-1">
                    {DASHBOARD_TASK_VIEW_OPTIONS.map((opt) => {
                      const active = activeTab === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            selectDashboardTaskTab(opt.id);
                            setTaskViewPickerOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors active:bg-slate-100 dark:active:bg-slate-800",
                            active
                              ? "bg-blue-50/90 ring-1 ring-blue-200/80 dark:bg-blue-950/40 dark:ring-blue-800/60"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/80"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{opt.title}</div>
                            <div className="mt-0.5 text-xs leading-snug text-slate-500 dark:text-slate-400">
                              {opt.description}
                            </div>
                          </div>
                          {active ? (
                            <CheckCircle
                              className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400"
                              aria-hidden
                            />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <SheetFooter className="border-t border-slate-100 px-3 pb-1 pt-3 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => setTaskViewPickerOpen(false)}
                  >
                    Cancel
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          ) : (
            (() => {
              const tabCls = (v: string) => {
                const active = activeTab === v;
                const base =
                  "inline-flex items-center justify-center gap-1.5 rounded-xl whitespace-nowrap transition-all duration-200 active:scale-[0.98]";
                const activeCls =
                  "bg-white dark:bg-slate-700 shadow-md ring-2 ring-[#3b82f6]/35 text-[#1d4ed8] dark:text-blue-300 font-bold";
                const inactiveCls =
                  "text-slate-800 dark:text-slate-100 font-semibold bg-white/55 dark:bg-slate-700/55 ring-1 ring-slate-200/70 dark:ring-slate-600/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]";
                const desktopCls = "px-4 py-2 text-sm font-semibold";
                return `${base} ${desktopCls} ${active ? activeCls : inactiveCls}`;
              };
              return (
                <div className="flex w-full gap-1 rounded-xl border border-slate-200/80 bg-slate-100/90 p-1.5 dark:border-slate-700 dark:bg-slate-800/95">
                  <button type="button" onClick={() => selectDashboardTaskTab("my-tasks")} className={tabCls("my-tasks")}>
                    <Briefcase className="hidden h-4 w-4 shrink-0 md:inline" />
                    <span>My Tasks</span>
                  </button>
                  <button
                    type="button"
                    data-tour="tour-desktop-tasks"
                    onClick={() => selectDashboardTaskTab("available")}
                    className={tabCls("available")}
                  >
                    <Search className="hidden h-4 w-4 shrink-0 md:inline" />
                    <span>Available</span>
                  </button>
                  <button type="button" onClick={() => selectDashboardTaskTab("assigned")} className={tabCls("assigned")}>
                    <CheckCircle className="hidden h-4 w-4 shrink-0 md:inline" />
                    <span>Assigned</span>
                  </button>
                  <button type="button" onClick={() => selectDashboardTaskTab("completed")} className={tabCls("completed")}>
                    <Star className="hidden h-4 w-4 shrink-0 md:inline" />
                    <span>Completed</span>
                  </button>
                  <button type="button" onClick={() => selectDashboardTaskTab("my-bids")} className={tabCls("my-bids")}>
                    <IndianRupee className="hidden h-4 w-4 shrink-0 md:inline" />
                    <span>My offers</span>
                  </button>
                </div>
              );
            })()
          )}

          {/* Slim gap under task list switcher on mobile */}
          <div className="md:hidden h-1" aria-hidden />

          {/* Active filter chips (mobile) - removed per request */}

          {activeTab === "my-tasks" && (
          <div className="space-y-3 md:space-y-6 mt-2 md:mt-8 animate-fade-in-up min-h-[500px]">
            <h2 className="text-lg md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-[#2563eb]" />Tasks You've Posted</h2>
            {/* Toolbar: minimal on mobile, classic on desktop */}
            <div
              className={
                isMobile
                  ? "mb-2 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 px-2.5 py-2.5 border-0 shadow-none"
                  : "mb-3 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 shadow-sm transition-all duration-200"
              }
            >
              <div className={`flex ${isMobile ? "flex-col gap-2" : "items-center gap-3"}`}>
              <div className={`relative ${isMobile ? "w-full" : "w-80"}`}>
                <Search className={`h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 ${isMobile ? "text-slate-400" : "text-gray-400"}`} />
                <Input
                  placeholder="Search your tasks..."
                  value={myTasksQuery}
                  onChange={(e) => setMyTasksQuery(e.target.value)}
                  className={
                    isMobile
                      ? "pl-9 h-9 rounded-full border border-slate-200/90 dark:border-slate-600 bg-white dark:bg-slate-900/80 text-sm shadow-none placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-500/30"
                      : "pl-9 h-9"
                  }
                />
              </div>
              <div className={`flex items-center gap-2 ${isMobile ? "w-full" : "flex-wrap"}`}>
                <select
                  value={myTasksFilter}
                  onChange={(e) => setMyTasksFilter(e.target.value as any)}
                  className={
                    isMobile
                      ? "flex-1 min-w-0 h-9 rounded-xl border-0 bg-white dark:bg-slate-900/90 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 ring-1 ring-slate-200/80 dark:ring-slate-600 shadow-none"
                      : "h-9 w-44 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700"
                  }
                >
                  <option value="all">All</option>
                  <option value="in_progress">In Progress</option>
                  <option value="open">Open</option>
                  <option value="completed">Completed</option>
                </select>
                <select
                  value={myTasksSortBy}
                  onChange={(e) => setMyTasksSortBy(e.target.value)}
                  className={
                    isMobile
                      ? "flex-1 min-w-0 h-9 rounded-xl border-0 bg-white dark:bg-slate-900/90 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 ring-1 ring-slate-200/80 dark:ring-slate-600 shadow-none"
                      : "h-9 w-40 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700"
                  }
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
                {isMobile ? (
                  <button
                    type="button"
                    aria-label="Clear search and filters"
                    onClick={() => {
                      setMyTasksFilter("all");
                      setMyTasksQuery("");
                    }}
                    className="shrink-0 h-9 w-9 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                ) : (
                  <Button variant="outline" className="h-9 border-gray-300" onClick={() => { setMyTasksFilter("all"); setMyTasksQuery(""); }}>
                    Clear
                  </Button>
                )}
              </div>
              {!isMobile && (
                <div className="ml-auto hidden lg:flex items-center gap-2 pr-1">
                  <span className="text-xs text-gray-500">Counts:</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">In Progress {myTasksSummary.inProgress}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">Open {myTasksSummary.open}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Completed {myTasksSummary.completed}</span>
                </div>
              )}
              </div>
            </div>
            {postedTasks.length === 0 ? (
              <div className="min-h-[400px] flex items-center justify-center">
                <EmptyState
                  icon={ClipboardList}
                  title="No tasks posted yet"
                  description="Post a task to find help from local taskers on JobPool."
                  illustration={<BriefcaseEmptyIllustration />}
                  action={{
                    label: "Post your first task",
                    onClick: () => router.push("/post-task"),
                  }}
                />
              </div>
            ) : (
              <div
                className={`grid items-stretch gap-2.5 dashboard-card-stagger ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}
              >
                {sortedPostedTasksForMyTasks.map((task) => {
                  let accent: DashboardTaskCardAccent = "blue";
                  if (task.cancel_status || task.deletion_status) accent = "rose";
                  else if (task.status === "completed") accent = "emerald";

                  /** Status is shown once in `belowTitle` (outline badge); omit footer `statusLabel` to avoid duplicate “Open”, etc. */
                  const metaRowsMy: { key: string; icon: ReactNode; text: string }[] = [];
                  metaRowsMy.push({
                    key: "posted",
                    icon: <Clock className="h-4 w-4" aria-hidden />,
                    text: `Posted ${getCardPostedAt(task)}`,
                  });
                  if (task.dueDate || task.dueDateFlexible) {
                    const dueRow = dueDisplayForListCard(task.dueDate, task.dueDateFlexible);
                    const dueText =
                      dueRow.showDaysBadge && task.dueDate?.trim()
                        ? formatDateWithTime(task.dueDate.trim())
                        : dueRow.display;
                    metaRowsMy.push({
                      key: "due",
                      icon: <CalendarDays className="h-4 w-4" aria-hidden />,
                      text: dueText,
                    });
                  }
                  if (task.location) {
                    metaRowsMy.push({
                      key: "loc",
                      icon: <MapPin className="h-4 w-4" aria-hidden />,
                      text: task.location,
                    });
                  }

                  return (
                    <DashboardTaskSummaryCard
                      key={task.id}
                      className={task.deletion_status || task.cancel_status ? "cursor-not-allowed opacity-60" : ""}
                      accent={accent}
                      density="compact"
                      isMobile={!!isMobile}
                      lead={
                        <>
                          {task.status === "in_progress" && !task.cancel_status ? (
                            <div
                              className={cn(
                                "mx-2.5 mt-2 rounded-xl px-3 py-1.5 text-center text-xs font-semibold text-white sm:mx-3 sm:mt-3 md:mx-4 md:mt-4",
                                task.taskmaster_completed &&
                                  !task.tasker_completed &&
                                  task.job_completion_status !== 1 &&
                                  task.job_completion_status !== "1"
                                  ? "bg-amber-600"
                                  : "bg-emerald-600",
                              )}
                            >
                              {task.taskmaster_completed &&
                              !task.tasker_completed &&
                              task.job_completion_status !== 1 &&
                              task.job_completion_status !== "1"
                                ? "✓ Confirmed by you · waiting for tasker"
                                : "🚀 In progress · bid accepted"}
                            </div>
                          ) : null}
                          {task.cancel_status && task.cancelled_by_role === "tasker" ? (
                            <div className="w-full bg-orange-600 px-3 py-2 text-center text-xs font-semibold text-white">
                              ⚠️ Tasker Cancelled This Task
                            </div>
                          ) : null}
                        </>
                      }
                      title={task.title}
                      titleClassName={cn(
                        "line-clamp-3",
                        task.cancel_status && task.cancelled_by_role === "tasker" ? "text-gray-500 line-through" : "",
                      )}
                      price={`₹${task.budget}`}
                      priceClassName={task.cancel_status && task.cancelled_by_role === "tasker" ? "text-gray-500" : undefined}
                      share={
                        <ShareTaskButton
                          taskId={String(task.id)}
                          title={task.title}
                          description={task.description}
                          budget={task.budget}
                          variant="icon"
                        />
                      }
                      bodyClassName={task.cancel_status && task.cancelled_by_role === "tasker" ? "opacity-70" : undefined}
                      belowTitle={
                        <>
                          <DashboardCardThumbnails images={task.images} className="mt-1 sm:mt-1.5" />
                          <div className="mt-1.5 flex flex-col gap-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "w-fit rounded-lg px-2.5 py-1 text-[11px] font-semibold sm:text-xs",
                                task.cancel_status && task.cancelled_by_role === "tasker"
                                  ? "border-orange-200 bg-orange-50/50 text-orange-600"
                                  : task.cancel_status
                                    ? "border-red-200 bg-red-50/50 text-red-600"
                                    : task.deletion_status
                                      ? "border-red-200 bg-red-50/50 text-red-600"
                                      : task.status === "in_progress"
                                        ? "border-emerald-200 bg-emerald-50/50 text-emerald-700"
                                        : task.status === "completed"
                                          ? "border-slate-200 bg-slate-50/50 text-slate-600"
                                          : "border-slate-200 bg-slate-50/50 text-slate-600",
                              )}
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
                            {!task.deletion_status && !task.cancel_status ? (
                              <div className="flex flex-wrap gap-2">
                                {(task.status === "open" || task.status === "in_progress") && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl border-amber-200/90 bg-gradient-to-b from-amber-50/95 to-white px-3 text-xs font-semibold text-amber-900 shadow-sm ring-1 ring-amber-600/10 hover:border-amber-300 hover:from-amber-100 hover:to-amber-50/90 dark:border-amber-800/50 dark:from-amber-950/35 dark:to-slate-900 dark:text-amber-100 dark:ring-amber-500/20 sm:h-10 sm:text-[13px]"
                                    onClick={() => handleCancelClick(task.id)}
                                  >
                                    <Ban className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                                    Cancel task
                                  </Button>
                                )}
                                {task.status === "open" && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 rounded-xl border-red-200/90 bg-gradient-to-b from-red-50/95 to-white px-3 text-xs font-semibold text-red-900 shadow-sm ring-1 ring-red-600/10 hover:border-red-300 hover:from-red-100 hover:to-red-50/90 dark:border-red-900/40 dark:from-red-950/30 dark:to-slate-900 dark:text-red-100 sm:h-10 sm:text-[13px]"
                                    onClick={() => handleDeleteClick(task.id)}
                                  >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                                    Delete task
                                  </Button>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </>
                      }
                      metaRows={metaRowsMy}
                      extra={
                        task.cancel_status && task.cancelled_by_role === "tasker" ? (
                          <div className="rounded-lg border border-orange-200/60 bg-orange-50/80 p-3 dark:border-orange-800/40 dark:bg-orange-950/30">
                            <p className="mb-1 text-sm font-medium text-orange-800 dark:text-orange-200">
                              ⚠️ Tasker cancelled this task
                            </p>
                            <p className="text-xs text-orange-700 dark:text-orange-300">
                              {task.cancellation_reason ? (
                                <span className="mb-1 block">
                                  <strong>Reason:</strong> {task.cancellation_reason}
                                </span>
                              ) : null}
                              Please repost the task to find a new tasker.
                            </p>
                            <Link href="/post-task" className="mt-2 inline-block">
                              <Button size="sm" className="bg-orange-600 text-xs text-white hover:bg-orange-700">
                                Repost Task
                              </Button>
                            </Link>
                          </div>
                        ) : null
                      }
                      actionsWrapperClassName={cn(
                        "border-t border-slate-100 dark:border-slate-700/60",
                        isMobile ? "mt-1.5 pt-1.5" : "mt-2 pt-2",
                      )}
                      actions={
                        task.cancel_status && task.cancelled_by_role === "tasker" ? (
                          <div className="flex w-full gap-2">
                            <Link href="/post-task" className="flex-1">
                              <Button className="w-full rounded-xl bg-orange-600 py-1.5 text-sm text-white hover:bg-orange-700 sm:py-2">
                                Repost Task
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              className="flex-1 rounded-xl border-red-200 py-1.5 text-sm text-red-600 hover:bg-red-50 sm:py-2"
                              onClick={() => handlePermanentDelete(task.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : task.deletion_status || task.cancel_status ? (
                          <div className="flex w-full gap-2">
                            <Button
                              variant="outline"
                              className="flex-1 rounded-xl py-1.5 text-sm sm:py-2"
                              onClick={() => handleRequestUndeleteClick(task.id)}
                            >
                              Request Access
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 rounded-xl border-red-200 py-1.5 text-sm text-red-600 hover:bg-red-50 sm:py-2"
                              onClick={() => handlePermanentDelete(task.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        ) : task.status === "in_progress" ? (
                          <div className="flex w-full flex-wrap gap-2">
                            <Link
                              href={`/tasks/${task.id}`}
                              className="min-w-0 flex-1"
                              onClick={() => warmDashboardTaskNav(task)}
                              onMouseEnter={() => warmDashboardTaskNav(task)}
                              onTouchStart={() => warmDashboardTaskNav(task)}
                            >
                              <Button
                                variant="outline"
                                className="w-full rounded-xl border-slate-200/90 bg-white py-1.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-900/5 hover:border-slate-300 hover:bg-slate-50/90 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:ring-slate-600/30 sm:py-2"
                              >
                                <span className="flex items-center justify-center gap-2">
                                  <Eye className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
                                  View details
                                </span>
                              </Button>
                            </Link>
                            {task.job_completion_status !== 1 && task.job_completion_status !== "1" && !task.taskmaster_completed ? (
                              <Button
                                className="min-w-0 flex-1 rounded-xl bg-blue-600 py-1.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 sm:py-2"
                                onClick={() => {
                                  setCompleteReviewTask(task);
                                  setCompleteReviewAsTaskmaster(true);
                                }}
                                disabled={completingTaskId === task.id}
                              >
                                ✅ {completingTaskId === task.id ? "Updating..." : "Confirm work done"}
                              </Button>
                            ) : null}
                            {task.tasker_completed && !task.taskmaster_completed ? (
                              <span className="w-full text-xs text-slate-500">Tasker marked done. Confirm above.</span>
                            ) : null}
                            {task.taskmaster_completed && !task.tasker_completed ? (
                              <span className="w-full text-xs text-slate-500">Waiting for tasker to mark work done.</span>
                            ) : null}
                          </div>
                        ) : (
                          <Link
                            href={`/tasks/${task.id}`}
                            className="min-w-0 flex-1"
                            onClick={() => warmDashboardTaskNav(task)}
                            onMouseEnter={() => warmDashboardTaskNav(task)}
                            onTouchStart={() => warmDashboardTaskNav(task)}
                          >
                            <Button
                              variant="outline"
                              className="w-full rounded-xl border-slate-200/90 bg-white py-1.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-900/5 hover:border-slate-300 hover:bg-slate-50/90 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:ring-slate-600/30 sm:py-2"
                            >
                              <span className="flex items-center justify-center gap-2">
                                <Eye className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
                                View details
                              </span>
                            </Button>
                          </Link>
                        )
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
          )}

          {activeTab === "available" && (
          <div className={`${isMobile ? "space-y-1.5 mt-1" : "space-y-4 mt-4"} animate-fade-in-up min-h-[500px]`}>
            {!isMobile && (
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <span className="w-1 h-5 rounded-full bg-[#2563eb]" />
                Available Tasks
              </h2>
            )}
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
                      <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full border-0 focus:ring-0 text-gray-700 bg-transparent">
                              <option value="all">All Categories</option>
                          {categories.length > 0 ? (
                            categories.map((cat) => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))
                          ) : (
                                <option value="loading" disabled>Loading categories...</option>
                          )}
                      </select>
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
                            defaultValue={[...TASK_PRICE_FILTER_DEFAULT]}
                            max={TASK_PRICE_FILTER_MAX}
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
                        <p className="text-[11px] text-gray-500 mt-1">Text filter for area. &quot;Near me&quot; below uses GPS.</p>
                      </div>

                      {/* Near me - uses jobs-nearby API so maps show in task cards */}
                      <div className="group">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">Near me</label>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant={nearMeMode ? "default" : "outline"} size="sm" onClick={handleNearMeToggle} disabled={isRequestingLocation}>
                            {isRequestingLocation ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : nearMeMode ? <MapPin className="h-4 w-4 mr-1" /> : <MapPinOff className="h-4 w-4 mr-1" />}
                            {isRequestingLocation ? "Getting…" : nearMeMode ? "On" : "Off"}
                          </Button>
                          {nearMeMode && (
                            <select value={String(radiusKm)} onChange={e=>setRadiusKm(Number(e.target.value))} className="w-24 rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700">
                              <option value="5">5 km</option>
                              <option value="10">10 km</option>
                              <option value="25">25 km</option>
                              <option value="50">50 km</option>
                            </select>
                          )}
                        </div>
                        {nearMeError && <p className="text-xs text-amber-600 mt-1">{nearMeError}</p>}
                      </div>

                      {/* Clear Filters Button */}
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          onClick={clearAvailableFilters}
                          className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium py-2 rounded-lg transition-all duration-200"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className={`${isMobile ? "col-span-1" : "md:col-span-3"} ${isMobile ? "space-y-1.5" : "space-y-6"}`}>
                {isMobile ? (
                  <div className="-mx-4 border-b border-slate-200/70 bg-[#F7F8FA] px-4 pb-2 pt-0 dark:border-slate-700/70 dark:bg-slate-950/40">
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setShowFilters((v) => !v)}
                        aria-expanded={showFilters}
                        aria-controls="available-mobile-filters"
                        className={cn(
                          "relative flex min-h-[40px] items-center gap-1.5 py-0.5 text-[14px] font-semibold tracking-tight text-[#1A1F4C] transition-colors active:opacity-80 dark:text-slate-100",
                          showFilters && "text-blue-700 dark:text-blue-400"
                        )}
                      >
                        <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
                        Filter
                        {availableFiltersActive ? (
                          <span
                            className="absolute -right-1 -top-0.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-[#F7F8FA] dark:bg-blue-500 dark:ring-slate-950"
                            aria-hidden
                          />
                        ) : null}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="flex min-h-[40px] items-center gap-1 py-0.5 text-[14px] font-semibold tracking-tight text-[#1A1F4C] dark:text-slate-100"
                          >
                            Sort
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                            <span className="sr-only">Current: {availableSortMenuLabel}</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[11.5rem]">
                          {nearMeMode ? (
                            <DropdownMenuItem onClick={() => setAvailableSortBy("nearest")}>
                              Nearest first
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem onClick={() => setAvailableSortBy("newest")}>
                            Newest first
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAvailableSortBy("oldest")}>
                            Oldest first
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAvailableSortBy("highest")}>
                            Highest budget
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setAvailableSortBy("lowest")}>
                            Lowest budget
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div
                      id="available-mobile-filters"
                      className={cn(
                        "grid transition-[grid-template-rows] duration-300 ease-out",
                        showFilters ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      )}
                    >
                      <div className="min-h-0 overflow-hidden">
                        <div className="space-y-3 border-t border-slate-200/60 pb-0.5 pt-2 dark:border-slate-700/60">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                              Category
                            </label>
                            <div className="rounded-lg border border-gray-200 bg-white p-2 dark:border-slate-600 dark:bg-slate-900">
                              <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-transparent text-gray-700 dark:text-slate-200"
                              >
                                <option value="all">All Categories</option>
                                {categoriesLoading ? (
                                  <option value="loading" disabled>
                                    Loading categories...
                                  </option>
                                ) : categories.length === 0 ? (
                                  <option value="no-categories" disabled>
                                    No categories available
                                  </option>
                                ) : (
                                  categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))
                                )}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                              Price range
                            </label>
                            <div className="rounded-lg border bg-gray-50 px-2 py-3 dark:border-slate-600 dark:bg-slate-900/80">
                              <Slider value={priceRange} onValueChange={setPriceRange} max={TASK_PRICE_FILTER_MAX} step={500} />
                              <div className="mt-2 flex justify-between text-sm text-gray-700 dark:text-slate-300">
                                <span>₹{priceRange[0].toLocaleString()}</span>
                                <span>₹{priceRange[1].toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                              Location
                            </label>
                            <Input
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="e.g., Mumbai"
                              className="dark:border-slate-600 dark:bg-slate-900"
                            />
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              Text search for area. &quot;Near me&quot; uses GPS instead.
                            </p>
                          </div>
                          <div>
                            <div className="mb-1 flex items-center justify-between">
                              <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Near me</label>
                              <Button
                                type="button"
                                variant={nearMeMode ? "default" : "outline"}
                                size="sm"
                                onClick={handleNearMeToggle}
                                disabled={isRequestingLocation}
                              >
                                {isRequestingLocation ? (
                                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                ) : nearMeMode ? (
                                  <MapPin className="mr-1 h-4 w-4" />
                                ) : (
                                  <MapPinOff className="mr-1 h-4 w-4" />
                                )}
                                {isRequestingLocation ? "Getting…" : nearMeMode ? "On" : "Off"}
                              </Button>
                            </div>
                            {nearMeMode ? (
                              <select
                                value={String(radiusKm)}
                                onChange={(e) => setRadiusKm(Number(e.target.value))}
                                className="mt-1 w-full rounded-lg border border-gray-200 bg-white p-2 text-gray-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                              >
                                <option value="5">5 km</option>
                                <option value="10">10 km</option>
                                <option value="25">25 km</option>
                                <option value="50">50 km</option>
                              </select>
                            ) : null}
                            {nearMeError ? (
                              <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">{nearMeError}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={onlyOpen}
                                onChange={(e) => setOnlyOpen(e.target.checked)}
                              />{" "}
                              Only open
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={withImages}
                                onChange={(e) => setWithImages(e.target.checked)}
                              />{" "}
                              With images
                            </label>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <Button type="button" variant="outline" className="flex-1" onClick={clearAvailableFilters}>
                              Clear
                            </Button>
                            <Button type="button" className="flex-1" onClick={() => setShowFilters(false)}>
                              Done
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <form onSubmit={handleSearch} className="flex-1 flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="search"
                          placeholder="Search tasks by keyword…"
                          enterKeyHint="search"
                          className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-gray-400 focus:ring-0 text-gray-700 placeholder:text-gray-400 transition-all duration-200"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Button
                        type="submit"
                        size="icon"
                        className="h-[42px] w-[42px] shrink-0 rounded-lg bg-[#2563eb] hover:bg-[#1d4ed8] text-white"
                        aria-label="Search"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                )}

                <div className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-2 ${isMobile ? "mt-2 pt-0.5" : "mt-1"}`}>
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {sortedAvailableTasks.length} task{sortedAvailableTasks.length === 1 ? "" : "s"}
                    </p>
                    {availableFiltersActive ? (
                      <button
                        type="button"
                        onClick={clearAvailableFilters}
                        className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline underline-offset-2 decoration-slate-300"
                      >
                        Clear all
                      </button>
                    ) : null}
                  </div>
                  {!isMobile ? (
                    <select
                      value={availableSortBy}
                      onChange={(e) => setAvailableSortBy(e.target.value)}
                      className="w-full max-w-[11rem] shrink-0 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 sm:w-[180px]"
                    >
                      {nearMeMode && <option value="nearest">Nearest first</option>}
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="highest">Highest budget</option>
                      <option value="lowest">Lowest budget</option>
                    </select>
                  ) : null}
                </div>

                {availableTasksLoading && sortedAvailableTasks.length === 0 ? (
                  <div className="min-h-[400px] flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-9 w-9 animate-spin text-[#2563eb]" aria-hidden />
                    <p className="text-sm font-medium">Loading available tasks…</p>
                  </div>
                ) : sortedAvailableTasks.length === 0 ? (
                  <div className="min-h-[400px] flex items-center justify-center">
                <EmptyState
                  icon={Search}
                  title="No tasks found"
                  description={
                    availableFiltersActive
                      ? "No tasks match your current filters. Try adjusting them."
                      : "No open tasks right now. Check back soon or post one yourself."
                  }
                  illustration={<SearchEmptyIllustration />}
                  action={
                    availableFiltersActive
                      ? {
                          label: "Clear filters",
                          onClick: clearAvailableFilters,
                        }
                      : undefined
                  }
                />
                  </div>
                ) : (
                  <div
                    className={`grid items-stretch gap-2.5 dashboard-card-stagger ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}
                  >
                    {sortedAvailableTasks.map((task) => {
                      const hasUserBid = requestedTasks.some(
                        (bid) => String(bid.task_id) === String(task.id),
                      );
                      const statusLabel =
                        hasUserBid && task.status === "open"
                          ? undefined
                          : task.status === "open"
                            ? "Open"
                            : task.status === "in_progress"
                              ? "In progress"
                              : "Completed";
                      const statusTone: DashboardTaskSummaryStatusTone =
                        task.status === "open"
                          ? "open"
                          : task.status === "in_progress"
                            ? "progress"
                            : "success";
                      const metaRows: { key: string; icon: ReactNode; text: string }[] = [];
                      if (task.location) {
                        metaRows.push({
                          key: "loc",
                          icon: <MapPin className="h-4 w-4" aria-hidden />,
                          text: task.location,
                        });
                      }

                      return (
                        <DashboardTaskSummaryCard
                          key={task.id}
                          accent="blue"
                          density="compact"
                          isMobile={!!isMobile}
                          title={task.title}
                          titleClassName="line-clamp-3"
                          price={`₹${task.budget}`}
                          share={
                            <ShareTaskButton
                              taskId={String(task.id)}
                              title={task.title}
                              description={task.description}
                              budget={task.budget}
                              variant="icon"
                            />
                          }
                          belowTitle={
                            <DashboardCardThumbnails images={task.images} className="mt-1 sm:mt-1.5" />
                          }
                          metaRows={metaRows}
                          extra={
                            <TaskDueSummaryRow dueDate={task.dueDate} dueDateFlexible={task.dueDateFlexible} />
                          }
                          statusPrefix={hasUserBid ? <TaskOfferSubmittedBadge /> : undefined}
                          statusLabel={statusLabel}
                          statusTone={statusTone}
                          footerTrailing={
                            task.posted_by ? (
                              <Avatar
                                className={cn(
                                  "border border-slate-200 dark:border-slate-600",
                                  isMobile ? "h-6 w-6" : "h-7 w-7 sm:h-8 sm:w-8",
                                )}
                              >
                                <AvatarFallback className="text-[10px] font-medium text-slate-600 dark:text-slate-300 sm:text-[11px] sm:text-xs">
                                  {task.posted_by.charAt(0) || "?"}
                                </AvatarFallback>
                              </Avatar>
                            ) : null
                          }
                          actions={
                            <Link
                              href={`/tasks/${task.id}`}
                              className="block w-full"
                              onClick={() => warmDashboardTaskNav(task)}
                              onMouseEnter={() => warmDashboardTaskNav(task)}
                              onTouchStart={() => warmDashboardTaskNav(task)}
                            >
                              <TaskOfferCtaButton hasOffer={hasUserBid} />
                            </Link>
                          }
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {activeTab === "assigned" && (
          <div className="space-y-6 mt-6 animate-fade-in-up min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-[#2563eb]" />Tasks Assigned to You</h2>
              {assignedTasks.length > 0 && (
                <select value={assignedSortBy} onChange={e=>setAssignedSortBy(e.target.value)} className="w-[160px] sm:w-[180px] rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-slate-200">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              )}
            </div>
            {assignedTasks.length === 0 ? (
              <div className="min-h-[400px] flex items-center justify-center">
                <EmptyState
                  icon={Briefcase}
                  title="No assigned tasks"
                  description="You don't have any tasks assigned yet. Browse available tasks to submit bids."
                  illustration={<BriefcaseEmptyIllustration />}
                  action={{ label: "Browse tasks", onClick: () => selectDashboardTaskTab("available") }}
                  secondaryAction={{ label: "My tasks", onClick: () => selectDashboardTaskTab("my-tasks") }}
                />
              </div>
            ) : (
              <div
                className={`grid items-stretch gap-2.5 dashboard-card-stagger ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}
              >
                {sortedAssignedTasks.map((task) => {
                  const isCancelled = task.cancel_status || task.cancelled || task.status === "canceled" || task.status === "cancelled";
                  const cancelledByTasker = task.cancelled_by_role === "tasker";
                  const cancelledByTaskmaster = task.cancelled_by_role === "taskmaster";
                  const waitingForTaskmaster = !isCancelled && task.tasker_completed && !task.taskmaster_completed && task.job_completion_status !== 1 && task.job_completion_status !== "1";
                  const waitingForTasker = !isCancelled && task.taskmaster_completed && !task.tasker_completed && task.job_completion_status !== 1 && task.job_completion_status !== "1";
                  
                  const assignedMeta: { key: string; icon: ReactNode; text: string }[] = [
                    {
                      key: "posted",
                      icon: <Clock className="h-4 w-4" aria-hidden />,
                      text: `Posted ${getCardPostedAt(task)}`,
                    },
                  ];
                  if (task.dueDate || task.dueDateFlexible) {
                    const dueRow = dueDisplayForListCard(task.dueDate, task.dueDateFlexible);
                    const dueText =
                      dueRow.showDaysBadge && task.dueDate?.trim()
                        ? formatDateWithTime(task.dueDate.trim())
                        : dueRow.display;
                    assignedMeta.push({
                      key: "due",
                      icon: <CalendarDays className="h-4 w-4" aria-hidden />,
                      text: dueText,
                    });
                  }
                  if (task.location) {
                    assignedMeta.push({
                      key: "loc",
                      icon: <MapPin className="h-4 w-4" aria-hidden />,
                      text: task.location,
                    });
                  }

                  /** Status lives in `belowTitle` badges; footer row is poster only (+ “Posted by” in card). */
                  return (
                    <DashboardTaskSummaryCard
                      key={task.id}
                      className={isCancelled ? "opacity-60" : ""}
                      accent={isCancelled ? "rose" : "blue"}
                      density="compact"
                      isMobile={!!isMobile}
                      title={task.title}
                      titleClassName={isCancelled ? "text-gray-500 line-through" : undefined}
                      price={`₹${task.budget}`}
                      priceClassName={isCancelled ? "text-gray-500" : undefined}
                      share={
                        <ShareTaskButton
                          taskId={String(task.id)}
                          title={task.title}
                          description={task.description}
                          budget={task.budget}
                          variant="icon"
                        />
                      }
                      belowTitle={
                        <>
                          <DashboardCardThumbnails images={task.images} className="mt-1 sm:mt-1.5" />
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            {isCancelled && cancelledByTasker ? (
                              <Badge
                                variant="outline"
                                className="w-fit rounded-lg border-slate-200/90 bg-slate-50/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200"
                              >
                                ❌ Cancelled by you
                              </Badge>
                            ) : null}
                            {isCancelled && cancelledByTaskmaster ? (
                              <Badge
                                variant="outline"
                                className="w-fit rounded-lg border-orange-200/90 bg-orange-50/70 px-2.5 py-1 text-[11px] font-semibold text-orange-800 dark:border-orange-800/50 dark:bg-orange-950/30 dark:text-orange-100"
                              >
                                ⚠️ Cancelled by Taskmaster
                              </Badge>
                            ) : null}
                            {isCancelled && !cancelledByTasker && !cancelledByTaskmaster ? (
                              <Badge
                                variant="outline"
                                className="w-fit rounded-lg border-slate-200/90 bg-slate-50/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-200"
                              >
                                ❌ Cancelled
                              </Badge>
                            ) : null}
                            {!isCancelled && waitingForTaskmaster ? (
                              <Badge
                                variant="outline"
                                className="w-fit rounded-lg border-blue-200/90 bg-blue-50/80 px-2.5 py-1 text-[11px] font-semibold text-blue-900 shadow-sm dark:border-blue-800/50 dark:bg-blue-950/35 dark:text-blue-100"
                              >
                                ⏳ Waiting for taskmaster
                              </Badge>
                            ) : null}
                            {!isCancelled && waitingForTasker ? (
                              <Badge
                                variant="outline"
                                className="w-fit rounded-lg border-emerald-200/90 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-100"
                              >
                                ✓ Task owner confirmed
                              </Badge>
                            ) : null}
                            {!isCancelled && !waitingForTaskmaster && !waitingForTasker ? (
                              <Badge
                                variant="outline"
                                className="w-fit rounded-lg border-amber-200/90 bg-amber-50/70 px-2.5 py-1 text-[11px] font-semibold text-amber-950 shadow-sm dark:border-amber-800/45 dark:bg-amber-950/25 dark:text-amber-100"
                              >
                                🚀 In progress
                              </Badge>
                            ) : null}
                          </div>
                        </>
                      }
                      metaRows={assignedMeta}
                      extra={
                        <>
                          {isCancelled && task.cancellation_reason ? (
                            <div
                              className={cn(
                                "rounded p-2 text-xs",
                                cancelledByTaskmaster
                                  ? "border border-orange-300 bg-orange-100 text-orange-800"
                                  : "bg-gray-200 text-gray-600",
                              )}
                            >
                              <strong>
                                {cancelledByTaskmaster
                                  ? "Taskmaster's Reason:"
                                  : cancelledByTasker
                                    ? "Your Reason:"
                                    : "Reason:"}
                              </strong>{" "}
                              {task.cancellation_reason}
                            </div>
                          ) : null}
                          {task.latitude != null && task.longitude != null && !isMobile ? (
                            <div className="my-2">
                              <TaskLocationMap
                                latitude={task.latitude}
                                longitude={task.longitude}
                                location={task.location}
                                height={100}
                                variant="card"
                              />
                            </div>
                          ) : null}
                          {waitingForTaskmaster ? (
                            <div className="rounded-lg border border-blue-300 bg-blue-100 p-3 text-sm text-blue-800">
                              <span className="font-medium">✓ You marked this complete.</span> Waiting for the task owner to
                              confirm. The task will move to Completed once they confirm.
                            </div>
                          ) : null}
                          {waitingForTasker ? (
                            <div className="rounded-lg border border-emerald-300 bg-emerald-100 p-3 text-sm text-emerald-800">
                              <span className="font-medium">✓ Task owner has confirmed.</span> Mark your work as done above to
                              close this task.
                            </div>
                          ) : null}
                        </>
                      }
                      footerTrailing={
                        task.posted_by ? (
                          <div className="flex max-w-[10rem] items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 sm:gap-2 sm:text-sm">
                            <Avatar
                              className={cn(
                                "shrink-0 border border-slate-200 dark:border-slate-600",
                                isMobile ? "h-6 w-6" : "h-8 w-8",
                              )}
                            >
                              <AvatarFallback className="text-[10px] sm:text-xs">
                                {task.posted_by.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">{task.posted_by}</span>
                          </div>
                        ) : null
                      }
                      actions={
                        isCancelled ? (
                          <Button
                            variant="outline"
                            className="w-full rounded-xl border-red-200/90 bg-gradient-to-b from-red-50/95 to-white py-1.5 text-sm font-semibold text-red-900 shadow-sm ring-1 ring-red-600/10 hover:border-red-300 hover:from-red-100 hover:to-red-50/90 dark:border-red-900/40 dark:from-red-950/30 sm:py-2"
                            onClick={() => {
                              if (confirm("⚠️ Delete this cancelled task?")) {
                                setAssignedTasks((prev) => prev.filter((t) => t.id !== task.id));
                                toast.success("Task removed");
                              }
                            }}
                          >
                            <span className="flex items-center justify-center gap-2">
                              <Trash2 className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                              Remove from list
                            </span>
                          </Button>
                        ) : waitingForTaskmaster ? (
                          <div className={cn("flex gap-2.5", isMobile ? "flex-col" : "flex-row flex-wrap")}>
                            <Link
                              href={`/tasks/${task.id}`}
                              className={cn("min-w-0", isMobile ? "w-full" : "flex-1")}
                              onClick={() => {
                                try {
                                  sessionStorage.setItem("nav_from_assigned", "1");
                                } catch {}
                                warmDashboardTaskNav(task);
                              }}
                              onMouseEnter={() => warmDashboardTaskNav(task)}
                              onTouchStart={() => warmDashboardTaskNav(task)}
                            >
                              <Button
                                variant="outline"
                                className="w-full rounded-xl border-slate-200/90 bg-white py-1.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-900/5 hover:border-slate-300 hover:bg-slate-50/90 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:ring-slate-600/30 sm:py-2"
                              >
                                <span className="flex items-center justify-center gap-2">
                                  <Eye className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
                                  View details
                                </span>
                              </Button>
                            </Link>
                            <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200/80 bg-gradient-to-b from-blue-50/95 to-white px-3 py-2 text-center text-xs font-semibold text-blue-900 shadow-sm ring-1 ring-blue-600/10 dark:border-blue-800/50 dark:from-blue-950/40 dark:to-slate-900 dark:text-blue-100 sm:text-sm">
                              <CheckCircle className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                              Waiting for task owner
                            </div>
                          </div>
                        ) : (
                          <div className={cn("flex gap-2.5", isMobile ? "flex-col" : "flex-row flex-wrap items-stretch")}>
                            <Link
                              href={`/tasks/${task.id}`}
                              className={cn("min-w-0", isMobile ? "w-full" : "min-w-[8rem] flex-1")}
                              onClick={() => {
                                try {
                                  sessionStorage.setItem("nav_from_assigned", "1");
                                } catch {}
                                warmDashboardTaskNav(task);
                              }}
                              onMouseEnter={() => warmDashboardTaskNav(task)}
                              onTouchStart={() => warmDashboardTaskNav(task)}
                            >
                              <Button
                                variant="outline"
                                className="w-full rounded-xl border-slate-200/90 bg-white py-1.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-900/5 hover:border-slate-300 hover:bg-slate-50/90 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:ring-slate-600/30 sm:py-2"
                              >
                                <span className="flex items-center justify-center gap-2">
                                  <Eye className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
                                  View details
                                </span>
                              </Button>
                            </Link>
                            <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                "rounded-xl border-amber-200/90 bg-gradient-to-b from-amber-50/95 to-white px-3 text-xs font-semibold text-amber-900 shadow-sm ring-1 ring-amber-600/10 hover:border-amber-300 hover:from-amber-100 hover:to-amber-50/90 dark:border-amber-800/50 dark:from-amber-950/35 dark:to-slate-900 dark:text-amber-100 dark:ring-amber-500/20 sm:text-sm h-9 sm:h-10",
                                isMobile ? "w-full" : "shrink-0",
                              )}
                              onClick={() => handleAssignedCancelClick(task.id)}
                            >
                              <span className="flex items-center justify-center gap-2">
                                <Ban className="h-3.5 w-3.5 shrink-0 opacity-90 sm:h-4 sm:w-4" aria-hidden />
                                Cancel task
                              </span>
                            </Button>
                            <Button
                              type="button"
                              className={cn(
                                "rounded-xl bg-blue-600 py-1.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-colors hover:bg-blue-700 sm:py-2",
                                isMobile ? "w-full" : "min-w-0 flex-1",
                              )}
                              onClick={() => {
                                setCompleteReviewTask(task);
                                setCompleteReviewAsTaskmaster(false);
                              }}
                              disabled={completingTaskId === task.id}
                            >
                              <span className="flex items-center justify-center gap-2">
                                <CheckCircle className="h-4 w-4 shrink-0 opacity-95" aria-hidden />
                                {completingTaskId === task.id ? "Updating…" : "Mark as complete"}
                              </span>
                            </Button>
                          </div>
                        )
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
          )}

          {activeTab === "completed" && (
          <div className="space-y-6 mt-6 animate-fade-in-up min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-[#2563eb]" />Completed</h2>
              {completedTasks.length > 0 && (
                <select value={completedSortBy} onChange={e=>setCompletedSortBy(e.target.value)} className="w-[160px] sm:w-[180px] rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-slate-200">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
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
                action={{ label: "View Assigned Tasks", onClick: () => selectDashboardTaskTab("assigned") }}
              />
            ) : (
              <div
                className={`grid items-stretch gap-2.5 dashboard-card-stagger ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}
              >
                {sortedCompletedTasks.map((task) => {
                  const completedMeta: { key: string; icon: ReactNode; text: string }[] = [
                    {
                      key: "done",
                      icon: <Clock className="h-4 w-4" aria-hidden />,
                      text: task.completedDate
                        ? `Completed ${formatDateWithTime(task.completedDate)}`
                        : "Task completed successfully",
                    },
                  ];
                  if (task.location) {
                    completedMeta.push({
                      key: "loc",
                      icon: <MapPin className="h-4 w-4" aria-hidden />,
                      text: task.location,
                    });
                  }

                  return (
                    <DashboardTaskSummaryCard
                      key={task.id}
                      accent="emerald"
                      density="compact"
                      isMobile={!!isMobile}
                      title={task.title}
                      titleClassName="line-clamp-2"
                      price={`₹${task.budget}`}
                      share={
                        <ShareTaskButton
                          taskId={String(task.id)}
                          title={task.title}
                          description={task.description}
                          budget={task.budget}
                          variant="icon"
                        />
                      }
                      belowTitle={<DashboardCardThumbnails images={task.images} className="mt-1 sm:mt-1.5" />}
                      metaRows={completedMeta}
                      extra={
                        task.review_comment ? (
                          <p className="border-l-4 border-green-200 pl-3 text-sm italic text-gray-700 dark:text-slate-300">
                            “{task.review_comment}”
                          </p>
                        ) : null
                      }
                      statusLabel="Completed"
                      statusTone="success"
                      footerTrailing={
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden />
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {task.rating ?? "—"}/5
                          </span>
                        </div>
                      }
                      actions={
                        <Link
                          href={`/tasks/${task.id}`}
                          className="min-w-0 flex-1"
                          onClick={() => warmDashboardTaskNav(task)}
                          onMouseEnter={() => warmDashboardTaskNav(task)}
                          onTouchStart={() => warmDashboardTaskNav(task)}
                        >
                          <Button
                            variant="outline"
                            className="w-full rounded-xl border-slate-200/90 bg-white py-1.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-900/5 hover:border-slate-300 hover:bg-slate-50/90 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:ring-slate-600/30 sm:py-2"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <Eye className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
                              View details
                            </span>
                          </Button>
                        </Link>
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
          )}

          {activeTab === "my-bids" && (
          <div className="space-y-6 mt-6 animate-fade-in-up min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2"><span className="w-1 h-5 rounded-full bg-[#2563eb]" />My offers</h2>
              {requestedTasks.length > 0 && (
                <select value={myBidsSortBy} onChange={e=>setMyBidsSortBy(e.target.value)} className="w-[160px] sm:w-[180px] rounded-md border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-700 dark:text-slate-200">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                </select>
              )}
            </div>
            {requestedTasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No bids placed"
                description="You haven't placed any bids yet. Browse available tasks and submit your first bid to get started."
                action={{ label: "Browse Available Tasks", onClick: () => selectDashboardTaskTab("available") }}
              />
            ) : (
              <div
                className={`grid items-stretch gap-2.5 dashboard-card-stagger ${isMobile ? "grid-cols-1" : "md:grid-cols-2 lg:grid-cols-3"}`}
              >
                {sortedRequestedTasks.map((bid) => {
                  const bidMeta: { key: string; icon: ReactNode; text: string }[] = [
                    {
                      key: "placed",
                      icon: <Clock className="h-4 w-4" aria-hidden />,
                      text: `Bid placed: ${bid.created_at}`,
                    },
                  ];
                  if (bid.task_location) {
                    bidMeta.push({
                      key: "loc",
                      icon: <MapPin className="h-4 w-4" aria-hidden />,
                      text: bid.task_location,
                    });
                  }

                  return (
                    <DashboardTaskSummaryCard
                      key={bid.bid_id}
                      accent={bid.task_deleted || bid.task_cancelled ? "rose" : "amber"}
                      density="compact"
                      isMobile={!!isMobile}
                      title={bid.task_title}
                      titleClassName="line-clamp-3"
                      price={`₹${bid.job_budget ?? 0}`}
                      share={
                        <ShareTaskButton
                          taskId={String(bid.task_id)}
                          title={bid.task_title}
                          description={bid.task_description}
                          budget={bid.job_budget}
                          variant="icon"
                        />
                      }
                      belowTitle={
                        <>
                          <DashboardCardThumbnails images={bid.images} className="mt-1 sm:mt-1.5" />
                          <div className="mt-1.5 flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              {bid.task_deleted ? (
                                <Badge className="rounded-lg border-0 bg-slate-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                                  Task removed
                                </Badge>
                              ) : null}
                              {bid.task_cancelled ? (
                                <Badge className="rounded-lg border-0 bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                                  Task cancelled
                                </Badge>
                              ) : null}
                              {!bid.task_deleted && !bid.task_cancelled ? (
                                <Badge
                                  variant="outline"
                                  className="rounded-lg border-blue-200/90 bg-blue-50/80 px-2.5 py-1 text-[11px] font-semibold text-blue-800 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-100"
                                >
                                  {String(bid.status || "pending").toLowerCase() === "pending"
                                    ? "Bid pending"
                                    : `Bid · ${bid.status}`}
                                </Badge>
                              ) : null}
                            </div>
                          </div>
                        </>
                      }
                      metaRows={bidMeta}
                      extra={
                        bid.latitude != null && bid.longitude != null && !isMobile ? (
                          <div className="my-2">
                            <TaskLocationMap
                              latitude={bid.latitude}
                              longitude={bid.longitude}
                              location={bid.task_location}
                              height={100}
                              variant="card"
                            />
                          </div>
                        ) : null
                      }
                      footer={
                        <div className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50/90 to-white px-3 py-2.5 shadow-sm ring-1 ring-slate-900/[0.04] dark:border-slate-600/70 dark:from-slate-900/50 dark:to-slate-900/30 dark:ring-slate-600/20">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1 text-left">
                              <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Your bid
                              </p>
                              <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100 sm:text-xl">
                                ₹{bid.bid_amount}
                              </p>
                            </div>
                            <div className="flex max-w-[10rem] shrink-0 flex-col items-end gap-0.5 text-right text-xs text-slate-500 dark:text-slate-400 sm:max-w-[11rem] sm:text-sm">
                              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                Poster
                              </span>
                              <div className="flex items-center gap-1.5">
                                <Avatar
                                  className={cn(
                                    "border border-slate-200 dark:border-slate-600",
                                    isMobile ? "h-6 w-6" : "h-7 w-7 sm:h-8 sm:w-8",
                                  )}
                                >
                                  <AvatarFallback className="text-[10px] sm:text-xs">
                                    {bid.posted_by?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="truncate font-medium text-slate-700 dark:text-slate-200">{bid.posted_by}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                      actions={
                        <Link
                          href={`/tasks/${bid.task_id}`}
                          className="block w-full"
                          onClick={() => warmDashboardBidNav(bid)}
                          onMouseEnter={() => warmDashboardBidNav(bid)}
                          onTouchStart={() => warmDashboardBidNav(bid)}
                        >
                          <Button
                            variant="outline"
                            className="w-full rounded-xl border-slate-200/90 bg-white py-1.5 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-900/5 hover:border-slate-300 hover:bg-slate-50/90 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-100 dark:ring-slate-600/30 sm:py-2"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <Eye className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
                              View task details
                            </span>
                          </Button>
                        </Link>
                      }
                    />
                  );
                })}
                  </div>
            )}
          </div>
          )}
        </div>

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
        <CancelReasonDialog
          open={cancelConfirmOpen}
          onOpenChange={setCancelConfirmOpen}
          title="Cancel Posted Task"
          description="Canceling this task may incur a 4%+GST cancellation fee (if payment was made). Please provide a reason for cancellation."
          reason={cancellationReason}
          onReasonChange={setCancellationReason}
          onConfirm={handleConfirmCancel}
          onCancel={() => {
            setCancellationReason("");
            setSelectedJobId(null);
          }}
        />
        <CancelReasonDialog
          open={assignedCancelOpen}
          onOpenChange={setAssignedCancelOpen}
          title="Cancel Assigned Task"
          description="Please provide a reason for cancelling this task. The admin will be notified with your reason."
          reason={cancellationReason}
          onReasonChange={setCancellationReason}
          onConfirm={handleAssignedConfirmCancel}
          onCancel={() => {
            setCancellationReason("");
            setSelectedAssignedId(null);
          }}
        />

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

        </div>
      </main>
    </div>
  );
}