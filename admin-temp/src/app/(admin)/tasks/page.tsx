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
  tasker_id?: string;
  tasker_name?: string;
  job_budget: number;
  job_location: string;
  job_due_date: string;
  job_images: { urls: string[] };
  status: boolean;
  deletion_status: boolean;
  job_completion_status: number;
}

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "Open" | "Assigned" | "In Progress" | "Completed" | "Cancelled";
  location: string;
  dueDate: string;
  budget: number;
  remote: boolean;
  createdAt: string;
  tasker_name?: string;
  taskmaster: User;
  tasker: User | null;
  offers: number;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  deletion_status: boolean;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] =
    useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
  const [taskToReset, setTaskToReset] = useState<string | null>(null);

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Function to determine task status based on job data
  const getTaskStatus = (job: Job): Task["status"] => {
    // Treat explicit completion first
    if (job.job_completion_status === 1) {
      return "Completed";
    }
    // Backend exposes boolean `status` as cancelled in our API shape
    // Fallback: if other cancel flags ever exist, check them too
    // @ts-ignore - tolerate optional fields from API variants
    if (job.status === true || job["cancel_status"] === true) {
      return "Cancelled";
    }
    if (job.tasker_id) {
      return "Assigned";
    }
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
          status: getTaskStatus(job),
          location: job.job_location,
          dueDate: job.job_due_date,
          budget: job.job_budget,
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
          cancelledAt: job.status ? new Date().toISOString() : undefined,
          cancellationReason: undefined,
          deletion_status: job.deletion_status || false,
        }));
        // Exclude cancelled tasks from the main Tasks list (shown in separate page)
        const visibleTasks = mappedTasks.filter((t) => t.status !== "Cancelled");
        setTasks(visibleTasks);
        // Fetch bid counts for each task (non-blocking for initial render)
        try {
          const results = await Promise.allSettled(
            visibleTasks.map(async (t) => {
              const r = await axiosInstance.get(`/get-bids/${t.id}/`);
              const data = r.data;
              let rows: any[] = [];
              if (Array.isArray(data?.data?.bids)) rows = data.data.bids;
              else if (Array.isArray(data?.data)) rows = data.data;
              else if (Array.isArray(data)) rows = data;
              return { id: t.id, count: rows.length };
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
              status: getTaskStatus(job),
              location: job.job_location,
              dueDate: job.job_due_date,
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
              cancelledAt: job.status ? new Date().toISOString() : undefined,
              cancellationReason: undefined,
              deletion_status: job.deletion_status || false,
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

  // Filter tasks based on search term and filters
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

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate statistics
  const openTasks = tasks.filter((t) => t.status === "Open").length;
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress").length;
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const cancelledTasks = tasks.filter((t) => t.status === "Cancelled").length;
  const totalBudget = tasks.reduce((sum, t) => sum + t.budget, 0);

  const handleUpdateTaskStatus = async (
    taskId: string,
    newStatus: Task["status"]
  ) => {
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

  // Permanently delete a task
  const handleHardDelete = async (taskId: string) => {
    try {
      setIsLoading(true);
      // Backend expects PUT for delete-job; use that first, fallback to DELETE if needed
      let response;
      try {
        response = await axiosInstance.put(`/delete-job/${taskId}/`, { hard_delete: true });
      } catch (err: any) {
        // If server rejects PUT with 405, try DELETE
        if (err?.response?.status === 405) {
          response = await axiosInstance.delete(`/delete-job/${taskId}/`);
        } else {
          throw err;
        }
      }
      if (response.data.status_code === 200) {
        toast.success("Task deleted permanently");
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setIsDetailsDialogOpen(false);
      } else {
        toast.error(response.data.message || "Failed to delete task");
      }
    } catch {
      toast.error("An error occurred while deleting the task");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTask = async () => {
    if (!editTask) return;

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
      // Build multipart form-data with ALL canonical job_* fields
      const fd = new FormData();
      fd.append("job_id", editTask.id);
      fd.append("job_title", editTask.title);
      fd.append("job_description", editTask.description);
      // Send both name and generic key to satisfy backend variants
      fd.append("job_category_name", editTask.category);
      fd.append("job_category", editTask.category);
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
              status: getTaskStatus(job),
              location: job.job_location,
              dueDate: job.job_due_date || editTask.dueDate,
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
              cancelledAt: job.status ? new Date().toISOString() : undefined,
              cancellationReason: undefined,
              deletion_status: job.deletion_status || false,
            };
            setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
          }
        } catch {
          // ignore; optimistic state already applied
        }
        setIsEditDialogOpen(false);
        setEditTask(null);
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
        <div className="flex items-center gap-2 w-full md:w-auto">
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
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
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
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No tasks found
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1 md:hidden">
                      {task.taskmaster.name} • {task.dueDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{task.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(task.status)}
                      className="flex items-center w-fit"
                    >
                      {getStatusIcon(task.status)}
                      {task.status}
                    </Badge>
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
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(task.dueDate)}</span>
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
                            onClick={() => {
                              setSelectedTask(task);
                              setIsDetailsDialogOpen(true);
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
                          <DropdownMenuItem
                            onClick={() => {
                              setEditTask(task);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            Edit Task
                          </DropdownMenuItem>
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
                          {task.status === "In Progress" && (
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
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleHardDelete(task.id)}
                          >
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Task Details</DialogTitle>
                          <DialogDescription>
                            Complete information about this task.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedTask && (
                          <div className="grid gap-6 py-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h2 className="text-xl font-semibold mb-1">
                                  {selectedTask.title}
                                </h2>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {selectedTask.category}
                                  </Badge>
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

                            <div className="grid md:grid-cols-2 gap-6">
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

                                {selectedTask.status === "Cancelled" &&
                                  selectedTask.cancelledAt && (
                                    <div>
                                      <Label>Cancelled On</Label>
                                      <div className="flex items-center gap-2 mt-2">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        <span>{selectedTask.cancelledAt}</span>
                                      </div>
                                      {selectedTask.cancellationReason && (
                                        <div className="mt-1 text-sm text-muted-foreground">
                                          Reason:{" "}
                                          {selectedTask.cancellationReason}
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>
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
                        if (!open) setEditTask(null);
                      }}
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Task</DialogTitle>
                          <DialogDescription>
                            Make changes to the task details.
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
                                disabled={isLoading}
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
                                disabled={isLoading}
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
                                  disabled={isLoading}
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
                                  disabled={isLoading}
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
                                  disabled={isLoading}
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
                                  disabled={isLoading}
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
                                disabled={isLoading}
                              />
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleSaveTask}
                            disabled={!editTask || isLoading}
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