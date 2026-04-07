"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MoreHorizontal,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  ImagePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";
import { ConfirmDialog } from "@/components/ConfirmDialog"; // Import ConfirmDialog
import { useCanAdminWrite } from "@/lib/adminAuth";

interface User {
  id: string;
  name: string;
  avatar?: string;
}

interface Job {
  job_id: string;
  posted_by: string;
  user_ref_id: string;
  job_title: string;
  job_description: string;
  job_category: string;
  job_category_name: string;
  custom_category_name?: string | null;
  tasker_id?: string;
  tasker_name?: string;
  job_budget: number;
  confirmed_bid_amount?: number;
  bid_amount?: number;
  job_location: string;
  job_due_date: string;
  due_date_flexible?: boolean;
  // Prefer backend timestamps when available so we can sort/filter by recency
  created_at?: string;
  updated_at?: string;
  job_images: { urls: string[] };
  status: boolean;
  deletion_status: boolean;
  job_completion_status: number;
  cancelled_by_user_id?: string;
  cancelled_by_role?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  refund_status?: string;
  refund_date?: string;
  tasker_completed?: boolean;
  taskmaster_completed?: boolean;
  cancel_status?: boolean;
}

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  customCategoryName?: string | null;
  status: "Open" | "Assigned" | "In Progress" | "Completed" | "Cancelled" | "Taskmaster confirmed" | "Tasker confirmed";
  location: string;
  dueDate: string;
  dueDateFlexible?: boolean;
  budget: number;
  paidAmount?: number;
  razorpayPaymentAmount?: number;
  remote: boolean;
  createdAt: string;
  tasker_name?: string;
  taskmaster: User;
  tasker: User | null;
  offers: number;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledByUserId?: string;
  cancelledByRole?: string;
  refundStatus?: string;
  refundDate?: string;
  deletion_status: boolean;
  /** From job_images.urls for admin edit / replace / delete */
  imageUrls?: string[];
}

const MAX_TASK_IMAGES_ADMIN = 10;

function jobImageUrlsFromJob(job: Job | Record<string, unknown>): string[] {
  const ji = (job as Job).job_images as { urls?: string[] } | string[] | undefined;
  if (!ji) return [];
  const urls = Array.isArray(ji) ? ji : ji.urls;
  if (!Array.isArray(urls)) return [];
  return urls.filter((u): u is string => typeof u === "string" && u.trim() !== "");
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "this_week" | "custom">(
    "all"
  );
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] =
    useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
  const [taskToReset, setTaskToReset] = useState<string | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState<boolean>(false);
  const [promotingTaskId, setPromotingTaskId] = useState<string | null>(null);
  /** Staged removals / new files while edit dialog is open */
  const [editRemovedImageUrls, setEditRemovedImageUrls] = useState<Set<string>>(() => new Set());
  const [editNewImageFiles, setEditNewImageFiles] = useState<File[]>([]);
  const canWrite = useCanAdminWrite();

  const formatDate = (isoString: string): string => {
    if (!isoString || typeof isoString !== "string" || isoString.trim() === "") return "—";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to determine task status based on job data
  // Uses tasker_completed, taskmaster_completed, job_completion_status, cancel_status from backend
  const getTaskStatus = (job: Job): Task["status"] => {
    if (job.job_completion_status === 1) return "Completed";
    if (job.cancel_status === true) return "Cancelled";
    const taskerDone = Boolean(job.tasker_completed);
    const taskmasterDone = Boolean(job.taskmaster_completed);
    if (taskmasterDone && !taskerDone) return "Taskmaster confirmed";
    if (taskerDone && !taskmasterDone) return "Tasker confirmed";
    if (job.tasker_id) return "Assigned";
    return "Open";
  };

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/get-all-jobs-admin/");
      if (response.data.status_code === 200) {
        const jobs: Job[] = response.data.data.jobs;
        const mappedTasks: Task[] = jobs.map((job: Job) => ({
          id: job.job_id,
          title: job.job_title,
          description: job.job_description,
          category: job.job_category_name,
          customCategoryName: job.custom_category_name || null,
          status: getTaskStatus(job),
          location: job.job_location,
          dueDate: job.job_due_date,
          dueDateFlexible: job.due_date_flexible === true,
          budget: job.job_budget,
          paidAmount: job.confirmed_bid_amount || job.bid_amount || undefined,
          remote: false,
          // Use backend timestamps when available so "recent" filters work correctly
          createdAt:
            job.updated_at ||
            job.created_at ||
            job.job_due_date ||
            new Date().toISOString(),
          taskmaster: {
            id: job.user_ref_id,
            name: job.posted_by,
            avatar: undefined,
          },
          tasker: job.tasker_id
            ? {
                id: job.tasker_id,
                name: job.tasker_name || "Unknown",
                avatar: undefined,
              }
            : null,
          offers: 0,
          completedAt: job.job_completion_status === 1 ? new Date().toISOString() : undefined,
          cancelledAt: job.cancel_status ? (job.cancelled_at || new Date().toISOString()) : undefined,
          cancellationReason: job.cancellation_reason,
          cancelledByUserId: job.cancelled_by_user_id,
          cancelledByRole: job.cancelled_by_role,
          refundStatus: job.refund_status,
          refundDate: job.refund_date,
          deletion_status: job.deletion_status || false,
          imageUrls: jobImageUrlsFromJob(job),
        }));
        // Show all tasks including cancelled ones
        setTasks(mappedTasks);
        // Fetch bid counts for each task (non-blocking for initial render)
        // Limit to first 20 tasks to reduce API load
        try {
          const limitedTasks = mappedTasks.slice(0, 20);
          const results = await Promise.allSettled(
            limitedTasks.map(async (t) => {
              try {
                const r = await axiosInstance.get(`/get-bids/${t.id}/`);
                const data = r.data;
                let rows: any[] = [];
                if (Array.isArray(data?.data?.bids)) rows = data.data.bids;
                else if (Array.isArray(data?.data)) rows = data.data;
                else if (Array.isArray(data)) rows = data;
                return { id: t.id, count: rows.length };
              } catch (error: any) {
                console.warn(`Failed to fetch bids for task ${t.id}:`, error.message);
                return { id: t.id, count: 0 };
              }
            })
          );
          const idToCount: Record<string, number> = {};
          for (const res of results) {
            if (res.status === "fulfilled") {
              idToCount[res.value.id] = res.value.count;
            }
          }
          setTasks((prev) => prev.map((t) => ({ ...t, offers: idToCount[t.id] ?? t.offers })));
        } catch {}
      } else {
        toast.error(response.data.message || "Failed to fetch tasks");
      }
    } catch {
      toast.error("An error occurred while fetching tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      await fetchTasks();
      // After initial fetch, if we recently saved a job, fetch its fresh copy and merge
      try {
        const lastId = sessionStorage.getItem("adminLastUpdatedJobId");
        if (lastId) {
          const fresh = await axiosInstance.get(`/get-job/${lastId}/`);
          const job: any = fresh.data?.data?.job || fresh.data?.job || null;
          if (job) {
            const updatedTask: Task = {
              id: job.job_id,
              title: job.job_title,
              description: job.job_description,
              category: job.job_category_name || job.job_category,
              customCategoryName: job.custom_category_name || null,
              status: getTaskStatus(job),
              location: job.job_location,
              dueDate: job.job_due_date,
              dueDateFlexible: job.due_date_flexible === true,
              budget: Number(job.job_budget ?? 0),
              remote: false,
              createdAt: new Date().toISOString(),
              taskmaster: {
                id: job.user_ref_id,
                name: job.posted_by,
                avatar: undefined,
              },
              tasker: job.tasker_id
                ? { id: job.tasker_id, name: job.tasker_name || "Unknown", avatar: undefined }
                : null,
              offers: 0,
              completedAt: job.job_completion_status === 1 ? new Date().toISOString() : undefined,
              cancelledAt: job.cancel_status ? (job.cancelled_at || new Date().toISOString()) : undefined,
              cancellationReason: job.cancellation_reason,
              cancelledByUserId: job.cancelled_by_user_id,
              cancelledByRole: job.cancelled_by_role,
              refundStatus: job.refund_status,
              refundDate: job.refund_date,
              deletion_status: job.deletion_status || false,
              imageUrls: jobImageUrlsFromJob(job),
            };
            setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
          }
          sessionStorage.removeItem("adminLastUpdatedJobId");
        }
      } catch {}
    };
    run();
  }, []);

  // Get unique categories for filter
  const categories = Array.from(new Set(tasks.map((task) => task.category)));

  // Filter tasks based on search term, filters and date range
  const filteredTasks = tasks.filter((task: Task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.taskmaster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.tasker &&
        task.tasker.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      categoryFilter === "all" || task.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter;

    // Date-based filters use createdAt so we can talk about "recent" tasks
    let matchesDate = true;
    if (dateFilter !== "all") {
      const created = new Date(task.createdAt);
      if (!isNaN(created.getTime())) {
        const startOfToday = new Date();
        startOfToday.setHours(23, 59, 59, 999);

        if (dateFilter === "this_week") {
          // Last 7 days including today
          const startOfWeek = new Date(startOfToday);
          startOfWeek.setDate(startOfWeek.getDate() - 6);
          startOfWeek.setHours(0, 0, 0, 0);
          matchesDate = created >= startOfWeek && created <= startOfToday;
        } else if (dateFilter === "custom" && (dateFrom || dateTo)) {
          let fromOk = true;
          let toOk = true;
          if (dateFrom) {
            const from = new Date(dateFrom);
            from.setHours(0, 0, 0, 0);
            fromOk = created >= from;
          }
          if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            toOk = created <= to;
          }
          matchesDate = fromOk && toOk;
        }
      } else {
        // If we cannot parse the date and a date filter is active, hide the task
        matchesDate = false;
      }
    }

    return matchesSearch && matchesCategory && matchesStatus && matchesDate;
  });

  // Always show most recently updated/created tasks first
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const aDate = new Date(a.createdAt);
    const bDate = new Date(b.createdAt);
    const aTime = isNaN(aDate.getTime()) ? 0 : aDate.getTime();
    const bTime = isNaN(bDate.getTime()) ? 0 : bDate.getTime();
    return bTime - aTime;
  });

  // Refund management handler
  const handleRefund = async (taskId: string, refundStatus: "approved" | "denied") => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    try {
      await axiosInstance.patch(`/job-refund-status/${taskId}/?refund_status=${refundStatus}`);
      toast.success(`Refund ${refundStatus === "approved" ? "approved" : "denied"} successfully`);
      // Refresh tasks
      await fetchTasks();
    } catch (error: any) {
      console.error("Failed to update refund status:", error);
      toast.error(error.response?.data?.message || "Failed to update refund status");
    }
  };

  // Calculate statistics
  const openTasks = tasks.filter((t) => t.status === "Open").length;
  const cancelledTasks = tasks.filter((t) => t.status === "Cancelled").length;
  const inProgressTasks = tasks.filter((t) =>
    ["In Progress", "Taskmaster confirmed", "Tasker confirmed"].includes(t.status)
  ).length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const totalBudget = tasks.reduce((sum, t) => sum + t.budget, 0);

  const handleUpdateTaskStatus = async (
    taskId: string,
    newStatus: Task["status"]
  ) => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    try {
      setIsLoading(true);
      // Use dedicated API for cancellation; avoid mis-mapping boolean status
      const response =
        newStatus === "Cancelled"
          ? await axiosInstance.put(`/cancel-job/${taskId}/`)
          : await axiosInstance.put(`/update-job/${taskId}/`, {});

      if (response.data.status_code === 200) {
        toast.success(`Task status updated to ${newStatus}`);
        setTasks(
          tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: newStatus,
                  cancelledAt:
                    newStatus === "Cancelled"
                      ? new Date().toISOString()
                      : undefined,
                  completedAt:
                    newStatus === "Completed"
                      ? new Date().toISOString()
                      : undefined,
                }
              : task
          )
        );
        setIsDetailsDialogOpen(false);
      } else {
        toast.error(response.data.message || "Failed to update task status");
      }
    } catch {
      toast.error("An error occurred while updating task status");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetTask = async (taskId: string) => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    try {
      setIsLoading(true);
      const response = await axiosInstance.put(`/reset-job/${taskId}/`, {
        deletion_status: false,
      });

      if (response.data.status_code === 200) {
        toast.success("Task reset successfully");
        setTasks(
          tasks.map((task) =>
            task.id === taskId ? { ...task, deletion_status: false } : task
          )
        );
        setIsDetailsDialogOpen(false);
      } else {
        toast.error(response.data.message || "Failed to reset task");
      }
    } catch {
      toast.error("An error occurred while resetting task");
    } finally {
      setIsLoading(false);
      setIsResetDialogOpen(false);
      setTaskToReset(null);
    }
  };

  // Promote custom_category_name to official category (and update task)
  const handlePromoteCustomCategory = async (taskId: string) => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    try {
      setPromotingTaskId(taskId);
      const response = await axiosInstance.post(
        `/promote-custom-category/${taskId}/?update_job=true`
      );
      const data = response.data?.data || response.data;
      if (response.data?.status_code === 200 || response.status === 200) {
        const categoryName = data?.category_name || "Category";
        toast.success(`"${categoryName}" promoted and task updated`);
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  category: categoryName,
                  customCategoryName: null,
                }
              : t
          )
        );
        if (selectedTask?.id === taskId) {
          setSelectedTask((prev) =>
            prev
              ? {
                  ...prev,
                  category: categoryName,
                  customCategoryName: undefined,
                }
              : null
          );
        }
      } else {
        toast.error(response.data?.message || "Failed to promote category");
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.detail ||
        "Failed to promote category";
      toast.error(msg);
    } finally {
      setPromotingTaskId(null);
    }
  };

  // Permanently delete a task
  const handleHardDelete = async (taskId: string) => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    if (!confirm('⚠️ Are you sure? This action cannot be undone!')) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.delete(
        `/admin/permanent-delete-task/${taskId}`
      );
      
      if (response.data.status_code === 200) {
        toast.success("Task permanently deleted");
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setIsDetailsDialogOpen(false);
      } else {
        toast.error(response.data.message || "Failed to delete task");
      }
    } catch (error: any) {
      console.error("Permanent delete error:", error);
      toast.error(error.response?.data?.message || "An error occurred while deleting the task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTask = async () => {
    if (!editTask) return;
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }

    try {
      console.log("[admin] handleSaveTask start", editTask);
      toast.message("Saving task...", { description: `Updating ${editTask.title}` });
      setIsLoading(true);
      // Use the same payload format as the user app (proven to persist on backend)
      // Preserve DD/MM/YYYY if entered that way (list shows DD/MM/YYYY);
      // only pass-through if already in another format
      const normalizeDate = (d: string) => {
        if (!d) return d;
        // If user enters DD/MM/YYYY keep it as-is
        if (d.includes("/")) return d;
        return d; // fallback: leave untouched (e.g., YYYY-MM-DD)
      };
      const normalizedDate = normalizeDate(editTask.dueDate);
      const keptUrls = (editTask.imageUrls ?? []).filter((u) => !editRemovedImageUrls.has(u));
      const totalImages = keptUrls.length + editNewImageFiles.length;
      if (totalImages > MAX_TASK_IMAGES_ADMIN) {
        toast.error(`At most ${MAX_TASK_IMAGES_ADMIN} images allowed (kept + new)`);
        setIsLoading(false);
        return;
      }
      // Build multipart form-data with ALL canonical job_* fields
      const fd = new FormData();
      fd.append("job_id", editTask.id);
      fd.append("job_title", editTask.title);
      fd.append("job_description", editTask.description);
      // Send both name and generic key to satisfy backend variants
      fd.append("job_category_name", editTask.category);
      fd.append("job_category", editTask.category);
      if (editTask.customCategoryName) {
        fd.append("custom_category_name", editTask.customCategoryName);
      }
      fd.append("job_budget", String(editTask.budget));
      fd.append("job_location", editTask.location);
      fd.append("job_due_date", normalizedDate);
      // Legacy duplicate keys for compatibility with alternate serializers
      fd.append("title", editTask.title);
      fd.append("description", editTask.description);
      fd.append("category_name", editTask.category);
      fd.append("budget", String(editTask.budget));
      fd.append("location", editTask.location);
      fd.append("due_date", normalizedDate);
      editRemovedImageUrls.forEach((url) => {
        fd.append("remove_image_urls", url);
      });
      editNewImageFiles.forEach((file) => {
        fd.append("images", file);
      });
      // Debug: log payload keys/values so we can verify what was sent
      try {
        const debugEntries: Record<string, string> = {};
        // @ts-ignore
        for (const [k, v] of fd.entries()) {
          debugEntries[k] = typeof v === 'string' ? v : '[binary]';
        }
        console.log('[admin] PUT /update-job payload', debugEntries);
      } catch {}
      const response = await axiosInstance.put(
        `/update-job/${editTask.id}/`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (response.data.status_code === 200) {
        console.log('[admin] PUT /update-job response', response.data);
        toast.success("Task updated successfully");
        // Optimistic local update
        setTasks(
          tasks.map((task) =>
            task.id === editTask.id
              ? {
                  ...editTask,
                  cancelledAt:
                    editTask.status === "Cancelled"
                      ? new Date().toISOString()
                      : undefined,
                  completedAt:
                    editTask.status === "Completed"
                      ? new Date().toISOString()
                      : undefined,
                }
              : task
          )
        );
        // Fetch the single updated job and merge (works even if bulk list is stale)
        try {
          const fresh = await axiosInstance.get(`/get-job/${editTask.id}/`);
          const job: any = fresh.data?.data?.job || fresh.data?.job || null;
          if (job) {
            const updatedTask: Task = {
              id: job.job_id,
              title: job.job_title,
              description: job.job_description,
              category: job.job_category_name || job.job_category || editTask.category,
              customCategoryName: job.custom_category_name ?? editTask.customCategoryName ?? null,
              status: getTaskStatus(job),
              location: job.job_location,
              dueDate: job.job_due_date || editTask.dueDate,
              dueDateFlexible: job.due_date_flexible ?? editTask.dueDateFlexible,
              budget: Number(job.job_budget ?? editTask.budget),
              remote: false,
              createdAt: new Date().toISOString(),
              taskmaster: {
                id: job.user_ref_id,
                name: job.posted_by,
                avatar: undefined,
              },
              tasker: job.tasker_id
                ? {
                    id: job.tasker_id,
                    name: job.tasker_name || "Unknown",
                    avatar: undefined,
                  }
                : null,
              offers: 0,
              completedAt: job.job_completion_status === 1 ? new Date().toISOString() : undefined,
              cancelledAt: job.cancel_status ? (job.cancelled_at || new Date().toISOString()) : undefined,
              cancellationReason: job.cancellation_reason,
              cancelledByUserId: job.cancelled_by_user_id,
              cancelledByRole: job.cancelled_by_role,
              refundStatus: job.refund_status,
              refundDate: job.refund_date,
              deletion_status: job.deletion_status || false,
              imageUrls: jobImageUrlsFromJob(job),
            };
            setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
          }
        } catch {
          // ignore; optimistic state already applied
        }
        setIsEditDialogOpen(false);
        setEditTask(null);
        setEditRemovedImageUrls(new Set());
        setEditNewImageFiles([]);
        try { sessionStorage.setItem("adminLastUpdatedJobId", editTask.id); } catch {}
      } else {
        toast.error(response.data.message || "Failed to update task");
      }
    } catch {
      toast.error("An error occurred while updating task");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (
    status: Task["status"]
  ): "outline" | "secondary" | "default" | "destructive" => {
    switch (status) {
      case "Open":
        return "outline";
      case "Assigned":
        return "secondary";
      case "In Progress":
      case "Taskmaster confirmed":
      case "Tasker confirmed":
        return "default";
      case "Completed":
        return "default";
      case "Cancelled":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "Open":
      case "Assigned":
        return null;
      case "In Progress":
      case "Taskmaster confirmed":
      case "Tasker confirmed":
        return <Clock className="h-4 w-4 mr-1" />;
      case "Completed":
        return <CheckCircle className="h-4 w-4 mr-1" />;
      case "Cancelled":
        return <AlertCircle className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Tasks Management</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cancelledTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalBudget.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search tasks..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Assigned">Assigned</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Taskmaster confirmed">Taskmaster confirmed</SelectItem>
              <SelectItem value="Tasker confirmed">Tasker confirmed</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {/* New: Date filters for recent / range */}
          <Select
            value={dateFilter}
            onValueChange={(value: "all" | "this_week" | "custom") =>
              setDateFilter(value)
            }
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="this_week">Recent (This Week)</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {dateFilter === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                className="w-[150px]"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                disabled={isLoading}
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="date"
                className="w-[150px]"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Taskmaster</TableHead>
              <TableHead className="hidden md:table-cell">Tasker</TableHead>
              <TableHead className="hidden md:table-cell">Posted</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              <TableHead className="hidden md:table-cell">Offers</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-8 text-muted-foreground"
                >
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              sortedTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1 md:hidden">
                      {task.taskmaster.name} • {task.dueDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    {task.customCategoryName ? (
                      <Badge
                        variant="outline"
                        className="border-blue-300 bg-blue-50 text-blue-700 font-medium gap-1"
                        title="User suggested category"
                      >
                        <Pencil className="h-3 w-3" />
                        {task.customCategoryName}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-gray-200 text-gray-700">
                        {task.category}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                    <Badge
                      variant={getStatusBadgeVariant(task.status)}
                      className="flex items-center w-fit"
                    >
                      {getStatusIcon(task.status)}
                      {task.status}
                    </Badge>
                      {task.status === "Cancelled" && task.refundStatus && (
                        <Badge
                          variant={
                            task.refundStatus === "approved"
                              ? "default"
                              : task.refundStatus === "denied"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs capitalize w-fit"
                        >
                          Refund: {task.refundStatus}
                        </Badge>
                      )}
                      {task.status === "Cancelled" && !task.refundStatus && task.cancelledByRole && task.cancelledByRole !== "admin" && (
                        <Badge
                          variant="outline"
                          className="text-xs w-fit text-muted-foreground"
                        >
                          No refund (before payment)
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {task.taskmaster.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{task.taskmaster.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {task.tasker ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {task.tasker.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.tasker.name}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        Unassigned
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{formatDate(task.createdAt)}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{task.dueDateFlexible || !task.dueDate ? "Flexible" : formatDate(task.dueDate)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline">{task.offers}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">₹{task.budget}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog
                      open={isDetailsDialogOpen && selectedTask?.id === task.id}
                      onOpenChange={(open) => {
                        setIsDetailsDialogOpen(open);
                        if (!open) setSelectedTask(null);
                      }}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isLoading}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={async () => {
                              setSelectedTask(task);
                              setIsDetailsDialogOpen(true);
                              // Fetch payment information when opening task details
                              if (task.id && task.refundStatus) {
                                try {
                                  setIsLoadingPayment(true);
                                  const paymentResponse = await axiosInstance.get("/get-all-task-orders/");
                                  if (paymentResponse.data.status_code === 200) {
                                    const taskOrder = paymentResponse.data.data.task_orders.find(
                                      (order: any) => order.job_id === task.id
                                    );
                                    if (taskOrder) {
                                      // payable_amount is the total amount paid through Razorpay
                                      const razorpayAmount = Number(taskOrder.payable_amount) || Number(taskOrder.bid_amount) || 0;
                                      setSelectedTask((prev) => 
                                        prev ? { ...prev, razorpayPaymentAmount: razorpayAmount } : prev
                                      );
                                    }
                                  }
                                } catch (error) {
                                  console.error("Failed to fetch payment amount:", error);
                                } finally {
                                  setIsLoadingPayment(false);
                                }
                              }
                            }}
                          >
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              window.location.href = `/tasks/${task.id}`;
                            }}
                          >
                            View Offers
                          </DropdownMenuItem>
                          {canWrite && (
                            <>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditRemovedImageUrls(new Set());
                              setEditNewImageFiles([]);
                              setEditTask(task);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            Edit Task
                          </DropdownMenuItem>
                          {task.customCategoryName && (
                            <DropdownMenuItem
                              onClick={() => handlePromoteCustomCategory(task.id)}
                              disabled={!!promotingTaskId}
                            >
                              {promotingTaskId === task.id ? "Promoting…" : "Promote to category"}
                            </DropdownMenuItem>
                          )}
                          {task.deletion_status && (
                            <DropdownMenuItem
                              onClick={() => {
                                setTaskToReset(task.id);
                                setIsResetDialogOpen(true);
                              }}
                            >
                              Reset Task
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {task.status === "Open" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateTaskStatus(task.id, "Assigned")
                              }
                            >
                              Mark as Assigned
                            </DropdownMenuItem>
                          )}
                          {(task.status === "Open" ||
                            task.status === "Assigned") && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateTaskStatus(task.id, "In Progress")
                              }
                            >
                              Mark as In Progress
                            </DropdownMenuItem>
                          )}
                          {(task.status === "In Progress" ||
                            task.status === "Taskmaster confirmed" ||
                            task.status === "Tasker confirmed") && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleUpdateTaskStatus(task.id, "Completed")
                              }
                            >
                              Mark as Completed
                            </DropdownMenuItem>
                          )}
                          {task.status !== "Completed" &&
                            task.status !== "Cancelled" && (
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() =>
                                  handleUpdateTaskStatus(task.id, "Cancelled")
                                }
                              >
                                Cancel Task
                              </DropdownMenuItem>
                            )}
                          {task.status === "Cancelled" && task.refundStatus === "pending" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleRefund(task.id, "approved")}
                              >
                                ✓ Approve Refund
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleRefund(task.id, "denied")}
                              >
                                ✗ Deny Refund
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleHardDelete(task.id)}
                          >
                            Delete Permanently
                          </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Task Details</DialogTitle>
                          <DialogDescription>
                            Complete information about this task.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedTask && (
                          <div className="space-y-6 py-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h2 className="text-xl font-semibold mb-1">
                                  {selectedTask.title}
                                </h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {selectedTask.customCategoryName ? (
                                    <Badge
                                      variant="outline"
                                      className="border-blue-300 bg-blue-50 text-blue-700 font-medium gap-1"
                                    >
                                      <Pencil className="h-3 w-3" />
                                      {selectedTask.customCategoryName}
                                      <span className="text-blue-500/80 text-xs font-normal">(suggested)</span>
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">{selectedTask.category}</Badge>
                                  )}
                                  {selectedTask.customCategoryName && canWrite && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePromoteCustomCategory(selectedTask.id)}
                                      disabled={!!promotingTaskId}
                                    >
                                      {promotingTaskId === selectedTask.id ? "Promoting…" : "Promote to category"}
                                    </Button>
                                  )}
                                  <Badge
                                    variant={getStatusBadgeVariant(
                                      selectedTask.status
                                    )}
                                  >
                                    {selectedTask.status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-lg">
                                  ₹{selectedTask.budget}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Created on{" "}
                                  {new Date(
                                    selectedTask.createdAt
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Description</Label>
                              <div className="p-4 bg-muted rounded-md">
                                {selectedTask.description}
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                              <div className="space-y-4">
                                <div>
                                  <Label>Taskmaster</Label>
                                  <div className="flex items-center gap-3 mt-2">
                                    <Avatar>
                                      <AvatarFallback>
                                        {selectedTask.taskmaster.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">
                                        {selectedTask.taskmaster.name}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        ID: {selectedTask.taskmaster.id}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label>Tasker</Label>
                                  {selectedTask.tasker ? (
                                    <div className="flex items-center gap-3 mt-2">
                                      <Avatar>
                                        <AvatarFallback>
                                          {selectedTask.tasker.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium">
                                          {selectedTask.tasker.name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          ID: {selectedTask.tasker.id}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground mt-2">
                                      Not assigned yet
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <Label>Location</Label>
                                  <div className="flex items-center gap-2 mt-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedTask.location}</span>
                                    {selectedTask.remote && (
                                      <Badge variant="outline">Remote</Badge>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <Label>Due Date</Label>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {formatDate(selectedTask.dueDate)}
                                    </span>
                                  </div>
                                </div>

                                <div>
                                  <Label>Offers</Label>
                                  <div className="mt-2">
                                    <span className="font-medium">
                                      {selectedTask.offers}
                                    </span>{" "}
                                    <span className="text-muted-foreground">
                                      offers received
                                    </span>
                                  </div>
                                </div>

                                {selectedTask.status === "Completed" &&
                                  selectedTask.completedAt && (
                                    <div>
                                      <Label>Completed On</Label>
                                      <div className="flex items-center gap-2 mt-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span>{selectedTask.completedAt}</span>
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </div>

                                {selectedTask.status === "Cancelled" &&
                                  selectedTask.cancelledAt && (
                                    <div className="space-y-4 p-5 border-2 border-red-200 rounded-lg bg-gradient-to-br from-red-50 to-orange-50">
                                      <div className="flex items-center gap-2 pb-3 border-b border-red-200">
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                        <Label className="text-base font-semibold text-red-900">Cancellation Details</Label>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                          <Label className="text-sm font-medium text-gray-700">Cancelled On</Label>
                                          <div className="flex items-center gap-2 mt-1.5">
                                            <Calendar className="h-4 w-4 text-gray-500" />
                                            <span className="text-sm font-medium">{formatDate(selectedTask.cancelledAt)}</span>
                                      </div>
                                        </div>

                                        {selectedTask.cancelledByRole && (
                                          <div>
                                            <Label className="text-sm font-medium text-gray-700">Cancelled By</Label>
                                            <div className="mt-1.5 flex items-center gap-2">
                                              <Badge variant="outline" className="capitalize font-medium">
                                                {selectedTask.cancelledByRole}
                                              </Badge>
                                              {selectedTask.cancelledByUserId && (
                                                <span className="text-xs text-gray-600">
                                                  ID: {selectedTask.cancelledByUserId}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {selectedTask.cancellationReason && (
                                        <div>
                                          <Label className="text-sm font-medium text-gray-700">Cancellation Reason</Label>
                                          <div className="mt-1.5 text-sm p-3 bg-white rounded-md border border-gray-200 shadow-sm">
                                          {selectedTask.cancellationReason}
                                          </div>
                                        </div>
                                      )}

                                      {/* Refund Amount Calculation */}
                                      {selectedTask.refundStatus && selectedTask.refundStatus !== "denied" && (
                                        <div className="mt-4 p-4 bg-white rounded-lg border-2 border-green-200 shadow-sm">
                                          <Label className="text-sm font-semibold text-gray-800 mb-3 block">Refund Amount Calculation</Label>
                                          {isLoadingPayment ? (
                                            <div className="p-3 text-center">
                                              <div className="inline-block h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                              <p className="text-xs text-gray-600 mt-2">Loading payment information...</p>
                                            </div>
                                          ) : selectedTask.razorpayPaymentAmount ? (
                                            <div className="space-y-2 text-sm">
                                              <div className="flex justify-between items-center py-1">
                                                <span className="text-gray-600">Amount Paid (Razorpay):</span>
                                                <span className="font-semibold">₹{selectedTask.razorpayPaymentAmount.toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center py-1 border-t border-gray-100">
                                                <span className="text-gray-600">Cancellation Fee (4%):</span>
                                                <span className="font-medium text-orange-600">-₹{(selectedTask.razorpayPaymentAmount * 0.04).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center py-1">
                                                <span className="text-gray-600">GST (18% on fee):</span>
                                                <span className="font-medium text-orange-600">-₹{(selectedTask.razorpayPaymentAmount * 0.04 * 0.18).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center py-2 mt-2 pt-2 border-t-2 border-green-300">
                                                <span className="font-semibold text-gray-800">Total Refund Amount:</span>
                                                <span className="font-bold text-lg text-green-600">
                                                  ₹{(selectedTask.razorpayPaymentAmount - (selectedTask.razorpayPaymentAmount * 0.04) - (selectedTask.razorpayPaymentAmount * 0.04 * 0.18)).toFixed(2)}
                                                </span>
                                              </div>
                                            </div>
                                          ) : selectedTask.paidAmount ? (
                                            <div className="space-y-2 text-sm">
                                              <div className="flex justify-between items-center py-1">
                                                <span className="text-gray-600">Paid Amount (Confirmed Bid):</span>
                                                <span className="font-semibold">₹{selectedTask.paidAmount.toFixed(2)}</span>
                                              </div>
                                              <div className="text-xs text-amber-600 italic py-1">
                                                Note: Using confirmed bid amount. Razorpay payment amount not available.
                                              </div>
                                              <div className="flex justify-between items-center py-1 border-t border-gray-100">
                                                <span className="text-gray-600">Cancellation Fee (4%):</span>
                                                <span className="font-medium text-orange-600">-₹{(selectedTask.paidAmount * 0.04).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center py-1">
                                                <span className="text-gray-600">GST (18% on fee):</span>
                                                <span className="font-medium text-orange-600">-₹{(selectedTask.paidAmount * 0.04 * 0.18).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center py-2 mt-2 pt-2 border-t-2 border-green-300">
                                                <span className="font-semibold text-gray-800">Total Refund Amount:</span>
                                                <span className="font-bold text-lg text-green-600">
                                                  ₹{(selectedTask.paidAmount - (selectedTask.paidAmount * 0.04) - (selectedTask.paidAmount * 0.04 * 0.18)).toFixed(2)}
                                                </span>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                              <p className="text-sm text-amber-800 font-medium">
                                                ⚠️ Payment amount not available. Cannot calculate refund amount.
                                              </p>
                                              <p className="text-xs text-amber-700 mt-1">
                                                The refund calculation requires the actual Razorpay payment amount or confirmed bid amount.
                                              </p>
                                    </div>
                                  )}
                              </div>
                                      )}

                                      <div className="flex items-center gap-3 pt-2 border-t border-red-200">
                                        <Label className="text-sm font-medium text-gray-700">Refund Status:</Label>
                                        {selectedTask.refundStatus ? (
                                          <Badge
                                            variant={
                                              selectedTask.refundStatus === "approved"
                                                ? "default"
                                                : selectedTask.refundStatus === "denied"
                                                ? "destructive"
                                                : "secondary"
                                            }
                                            className="capitalize font-medium"
                                          >
                                            {selectedTask.refundStatus === "approved" && "✓ "}
                                            {selectedTask.refundStatus === "denied" && "✗ "}
                                            {selectedTask.refundStatus}
                                          </Badge>
                                        ) : selectedTask.cancelledByRole && selectedTask.cancelledByRole !== "admin" ? (
                                          <Badge variant="outline" className="text-muted-foreground">
                                            No refund needed (cancelled before payment)
                                          </Badge>
                                        ) : null}
                            </div>

                                      {selectedTask.refundDate && (
                                        <div>
                                          <Label className="text-sm font-medium text-gray-700">Refund Decision Date</Label>
                                          <div className="mt-1.5 text-sm font-medium">
                                            {formatDate(selectedTask.refundDate)}
                                          </div>
                                        </div>
                                      )}

                                      {selectedTask.refundStatus === "pending" && canWrite && (
                                        <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t-2 border-red-300">
                                          <Button
                                            size="sm"
                                            onClick={() => handleRefund(selectedTask.id, "approved")}
                                            disabled={isLoading}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium h-10"
                                          >
                                            ✓ Approve Refund
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => handleRefund(selectedTask.id, "denied")}
                                            disabled={isLoading}
                                            className="flex-1 h-10"
                                          >
                                            ✗ Deny Refund
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsDetailsDialogOpen(false)}
                            disabled={isLoading}
                          >
                            Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog
                      open={isEditDialogOpen && editTask?.id === task.id}
                      onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) {
                          setEditTask(null);
                          setEditRemovedImageUrls(new Set());
                          setEditNewImageFiles([]);
                        }
                      }}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Task</DialogTitle>
                          <DialogDescription>
                            Update fields, replace photos, or remove images. Saves use the same{" "}
                            <code className="text-xs">update-job</code> API as the user app.
                          </DialogDescription>
                        </DialogHeader>
                        {editTask && (
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="title">Title</Label>
                              <Input
                                id="title"
                                value={editTask.title}
                                onChange={(e) =>
                                  setEditTask({
                                    ...editTask,
                                    title: e.target.value,
                                  })
                                }
                                disabled={isLoading || !canWrite}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="description">Description</Label>
                              <Textarea
                                id="description"
                                rows={4}
                                value={editTask.description}
                                onChange={(e) =>
                                  setEditTask({
                                    ...editTask,
                                    description: e.target.value,
                                  })
                                }
                                disabled={isLoading || !canWrite}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                  value={editTask.category}
                                  onValueChange={(value) =>
                                    setEditTask({
                                      ...editTask,
                                      category: value,
                                    })
                                  }
                                  disabled={isLoading || !canWrite}
                                >
                                  <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map((category) => (
                                      <SelectItem
                                        key={category}
                                        value={category}
                                      >
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                  value={editTask.status}
                                  onValueChange={(value: Task["status"]) =>
                                    setEditTask({ ...editTask, status: value })
                                  }
                                  disabled={isLoading || !canWrite}
                                >
                                  <SelectTrigger id="status">
                                    <SelectValue placeholder="Select status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="Assigned">
                                      Assigned
                                    </SelectItem>
                                    <SelectItem value="In Progress">
                                      In Progress
                                    </SelectItem>
                                    <SelectItem value="Taskmaster confirmed">
                                      Taskmaster confirmed
                                    </SelectItem>
                                    <SelectItem value="Tasker confirmed">
                                      Tasker confirmed
                                    </SelectItem>
                                    <SelectItem value="Completed">
                                      Completed
                                    </SelectItem>
                                    <SelectItem value="Cancelled">
                                      Cancelled
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="grid gap-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                  id="location"
                                  value={editTask.location}
                                  onChange={(e) =>
                                    setEditTask({
                                      ...editTask,
                                      location: e.target.value,
                                    })
                                  }
                                  disabled={isLoading || !canWrite}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="budget">Budget (₹)</Label>
                                <Input
                                  id="budget"
                                  type="number"
                                  value={editTask.budget}
                                  onChange={(e) =>
                                    setEditTask({
                                      ...editTask,
                                      budget: Number(e.target.value),
                                    })
                                  }
                                  disabled={isLoading || !canWrite}
                                />
                              </div>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="dueDate">Due Date</Label>
                              <Input
                                id="dueDate"
                                type="date"
                                value={editTask.dueDate}
                                onChange={(e) =>
                                  setEditTask({
                                    ...editTask,
                                    dueDate: e.target.value,
                                  })
                                }
                                disabled={isLoading || !canWrite}
                              />
                            </div>
                            <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                              <div className="flex items-center gap-2">
                                <ImagePlus className="h-4 w-4 text-slate-600" />
                                <Label className="text-base">Task images</Label>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Remove current photos or add new files (max {MAX_TASK_IMAGES_ADMIN} total after save).
                                URLs marked removed are sent as{" "}
                                <code className="rounded bg-white px-0.5">remove_image_urls</code>; new files as{" "}
                                <code className="rounded bg-white px-0.5">images</code>.
                              </p>
                              {(editTask.imageUrls ?? []).filter((u) => !editRemovedImageUrls.has(u)).length === 0 &&
                              editNewImageFiles.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No images on this task yet.</p>
                              ) : null}
                              <div className="flex flex-wrap gap-2">
                                {(editTask.imageUrls ?? [])
                                  .filter((u) => !editRemovedImageUrls.has(u))
                                  .map((url) => (
                                    <div
                                      key={url}
                                      className="relative h-20 w-20 overflow-hidden rounded-md border bg-white shadow-sm"
                                    >
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={url} alt="" className="h-full w-full object-cover" />
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="destructive"
                                        className="absolute bottom-1 right-1 h-7 w-7"
                                        disabled={isLoading || !canWrite}
                                        title="Remove image"
                                        onClick={() =>
                                          setEditRemovedImageUrls((prev) => new Set(prev).add(url))
                                        }
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  ))}
                              </div>
                              {editRemovedImageUrls.size > 0 ? (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="w-fit text-xs"
                                  disabled={isLoading || !canWrite}
                                  onClick={() => setEditRemovedImageUrls(new Set())}
                                >
                                  Undo all removals ({editRemovedImageUrls.size})
                                </Button>
                              ) : null}
                              {editNewImageFiles.length > 0 ? (
                                <ul className="space-y-1 text-sm">
                                  {editNewImageFiles.map((f, i) => (
                                    <li
                                      key={`${f.name}-${i}`}
                                      className="flex items-center justify-between gap-2 rounded border bg-white px-2 py-1"
                                    >
                                      <span className="truncate">{f.name}</span>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="shrink-0 h-7 px-2"
                                        disabled={isLoading || !canWrite}
                                        onClick={() =>
                                          setEditNewImageFiles((prev) => prev.filter((_, j) => j !== i))
                                        }
                                      >
                                        Remove
                                      </Button>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                              <div>
                                <Label htmlFor={`task-images-${task.id}`} className="sr-only">
                                  Add images
                                </Label>
                                <Input
                                  id={`task-images-${task.id}`}
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  disabled={isLoading || !canWrite}
                                  className="cursor-pointer text-xs file:mr-2"
                                  onChange={(e) => {
                                    const files = e.target.files;
                                    if (!files?.length) return;
                                    const kept =
                                      (editTask.imageUrls ?? []).filter((u) => !editRemovedImageUrls.has(u))
                                        .length + editNewImageFiles.length;
                                    const room = MAX_TASK_IMAGES_ADMIN - kept;
                                    if (room <= 0) {
                                      toast.error(`Maximum ${MAX_TASK_IMAGES_ADMIN} images`);
                                      e.target.value = "";
                                      return;
                                    }
                                    const next = Array.from(files).slice(0, room);
                                    if (files.length > next.length) {
                                      toast.message(`Only ${next.length} more image(s) allowed`);
                                    }
                                    setEditNewImageFiles((prev) => [...prev, ...next]);
                                    e.target.value = "";
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditDialogOpen(false);
                              setEditTask(null);
                              setEditRemovedImageUrls(new Set());
                              setEditNewImageFiles([]);
                            }}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveTask}
                            disabled={!editTask || isLoading || !canWrite}
                            title={!canWrite ? "Read-only role" : undefined}
                          >
                            {isLoading ? "Saving..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <ConfirmDialog
                      open={isResetDialogOpen}
                      onOpenChange={(open) => {
                        setIsResetDialogOpen(open);
                        if (!open) setTaskToReset(null);
                      }}
                      onConfirm={async () => {
                        if (taskToReset) {
                          await handleResetTask(taskToReset);
                        }
                      }}
                      title="Confirm Task Reset"
                      description="Are you sure you want to reset this task? This will restore the task to an active state."
                      confirmText="Confirm"
                      cancelText="Cancel"
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}