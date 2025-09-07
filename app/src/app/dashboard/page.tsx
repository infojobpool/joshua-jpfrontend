"use client";

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
  const [loading, setLoading] = useState(true);
  
  // Task states
  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [requestedTasks, setRequestedTasks] = useState<BidRequest[]>([]);
  // Local filter for My Tasks summary chips
  const [myTasksFilter, setMyTasksFilter] = useState<"all" | "in_progress" | "open" | "completed">("all");
  // Store task orders to check payment status
  const [taskOrders, setTaskOrders] = useState<any[]>([]);
  
  // Fetch task orders to check payment status
  const fetchTaskOrders = async () => {
    try {
      const response = await axiosInstance.get("/get-all-task-orders/");
      if (response.data.status_code === 200 && response.data.data?.task_orders) {
        setTaskOrders(response.data.data.task_orders);
        console.log("📋 Task orders fetched:", response.data.data.task_orders);
        console.log("📋 Total orders:", response.data.data.task_orders.length);
        console.log("📋 Sample order structure:", response.data.data.task_orders[0]);
        console.log("📋 All order statuses:", response.data.data.task_orders.map(order => ({
          order_id: order.order_id,
          job_id: order.job_id,
          status: order.status,
          tasker_id: order.tasker_id,
          poster_id: order.taskmanager_id
        })));
      }
    } catch (error) {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Dialog states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [requestUndeleteOpen, setRequestUndeleteOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);


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
    if (!isAuthenticated || !user || !userId) {
        router.push("/signin");
        return;
      }
    setLoading(false);
    fetchTaskOrders(); // Fetch task orders when user is authenticated
  }, [isAuthenticated, user, userId, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get<APIResponse<{ categories: Category[] }>>("/get-all-categories");
        const result = response.data;
        
        if (result.status_code === 200 && result.data?.categories) {
          setCategories(result.data.categories);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch user's posted tasks
  useEffect(() => {
    if (!user || !userId) return;

    const fetchUserTasks = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>(`/get-user-jobs/${userId}/`);
        const result = response.data;


        if (result.status_code === 200 && result.data?.jobs) {
          // First, get the basic task data
          const tasks: Task[] = result.data.jobs.map((job) => {
            let jobStatus = "open";
            
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
                      job.status === "accepted" || job.status === "paid" || job.status === "active") {
              jobStatus = "in_progress";
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
                    url,
                    alt: `Job image ${index + 1}`,
                  }))
                : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
            };
          });

          setPostedTasks(tasks);
        } else {
          console.warn("No jobs found or API error:", result.message);
        }
      } catch (err) {
        console.error("Failed to fetch user tasks:", err);
        toast.error("An error occurred while fetching your tasks.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserTasks();
  }, [user, userId, taskOrders]);

  // Fetch all available tasks
  useEffect(() => {
    if (!user || !userId) return;

    const fetchAllTasks = async () => {
      setLoading(true);
      try {
        
        const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>("/get-all-jobs");
        const result = response.data;

        if (result.status_code === 200 && result.data?.jobs) {
          const tasks: Task[] = result.data.jobs
            .filter((job) => {
              // Debug: Log the full job object to see what fields are available
              
              // Try to find the actual user ID field - check multiple possible properties
              const jobPostedById = job.posted_by_id || job.user_id || job.user_ref_id || job.posted_by_user_id || job.posted_by;
              const currentUserId = userId?.toString();
              const userFromStore = user?.id?.toString();
              
              
              // Check against both userId from store and user.id from user object
              return jobPostedById !== currentUserId && jobPostedById !== userFromStore;
            })
            .map((job) => {
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
                      url,
                      alt: `Job image ${index + 1}`,
                    }))
                  : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
              };
            });

          // Skip bid count fetching for now to avoid API errors
          const availableTasksWithBidCounts = tasks;

          setAvailableTasks(availableTasksWithBidCounts);
        } else {
          console.warn("No jobs found or API error:", result.message);
        }
      } catch (err) {
        console.error("Failed to fetch all tasks:", err);
        toast.error("An error occurred while fetching available tasks.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllTasks();
  }, [user, userId]);

  // Fetch user's bids
  useEffect(() => {
    if (!user || !userId) return;

    const fetchBids = async () => {
      try {
        const response = await axiosInstance.get<APIResponse<{ bids: any[] }>>(`/get-user-bids/${userId}/`);
        const result = response.data;

        if (result.status_code === 200 && result.data?.bids) {
          const userBids: Bid[] = result.data.bids.map((bid) => ({
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
        const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>(`/get-user-assigned-bids/${userId}/`);
        const result = response.data;

        if (result.status_code === 200 && Array.isArray(result.data?.jobs)) {
          const tasks: Task[] = result.data.jobs.map((job) => ({
            id: job.job_id.toString(),
            title: job.job_title || "Untitled",
            description: job.job_description || "No description provided.",
            budget: Number(job.job_budget) || 0,
            location: job.job_location || "Unknown",
            status: job.status ? "assigned" : "open",
            postedAt: job.created_at
              ? new Date(job.created_at).toLocaleDateString("en-GB")
              : "Unknown",
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
                  url,
                  alt: `Job image ${index + 1}`,
                }))
              : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
          }));
          setAssignedTasks(tasks);
        } else {
          console.warn("No assigned tasks found or API error:", result.message);
        }
      } catch (err) {
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
        const response = await axiosInstance.get<APIResponse<{ bids: BidRequest[] }>>(`/get-user-requested-bids/${userId}/`);
        const result = response.data;

        if (result.status_code === 200 && Array.isArray(result.data?.bids)) {
          const bids: BidRequest[] = result.data.bids.map((bid) => ({
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
          }));
          setRequestedTasks(bids);
        } else {
          console.warn("No requested bids found or API error:", result.message);
        }
      } catch (err) {
        console.error("Failed to fetch requested bids:", err);
      }
    };

    fetchRequestedBids();
  }, [user, userId]);

  // Fetch completed tasks
  useEffect(() => {
    if (!user || !userId) return;

    const fetchCompletedTasks = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>(`/fetch-completed-tasks/${userId}/`);
        const result = response.data;

        if (result.status_code === 200 && result.data?.jobs) {
          const tasks: Task[] = result.data.jobs.map((job) => ({
            id: job.job_id.toString(),
            title: job.job_title || "Untitled",
            description: job.job_description || "No description provided.",
            budget: Number(job.job_budget) || 0,
            location: job.job_location || "Unknown",
            status: "completed",
            postedAt: job.job_due_date
              ? new Date(job.job_due_date).toLocaleDateString("en-GB")
              : "Unknown",
            completedDate: job.completed_date
              ? new Date(job.completed_date).toLocaleDateString("en-GB")
              : "Unknown",
            rating: job.rating || 0,
            offers: job.offers || 0,
            posted_by: job.posted_by || "Unknown",
            category: job.job_category || "general",
            deletion_status: job.deletion_status || false,
            cancel_status: job.cancel_status ?? false,
            images: job.job_images?.urls?.length
              ? job.job_images.urls.map((url: string, index: number) => ({
                  id: `img${index + 1}`,
                  url,
                  alt: `Job image ${index + 1}`,
                }))
              : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
          }));
          setCompletedTasks(tasks);
        } else {
          console.warn("No completed tasks found or API error:", result.message);
        }
      } catch (err) {
        console.error("Failed to fetch completed tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedTasks();
  }, [user, userId]);

  const handleComplete = async (jobId: string) => {
    try {
      const response = await axiosInstance.put<APIResponse<any>>(`/mark-complete/${jobId}/`);

      if (response.data.status_code === 200) {
        toast.success("Task marked as complete!");
        setAssignedTasks((prev) => prev.filter((task) => task.id !== jobId));
        setCompletedTasks((prev) => [
          ...prev,
          {
            ...assignedTasks.find((task) => task.id === jobId)!,
            status: "completed",
            completedDate: new Date().toLocaleDateString("en-GB"),
          },
        ]);

        router.push(`/tasks/${jobId}/complete`);
      } else {
        console.error("Error marking task as complete:", response.data.message);
      }
    } catch (error) {
      console.error("Error marking task as complete:", error);
    }
  };

  // Handle marking My Tasks as complete
  const handleMyTaskComplete = async (jobId: string) => {
    try {
      const response = await axiosInstance.put<APIResponse<any>>(`/mark-complete/${jobId}/`);

      if (response.data.status_code === 200) {
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
        toast.error(response.data.message || "Failed to mark task as complete");
      }
    } catch (error) {
      console.error("Error marking task as complete:", error);
      toast.error("An error occurred while marking the task as complete");
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
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
        <style jsx>{`
          @keyframes gentle-pulse {
            0%, 100% { 
              opacity: 0.6;
              transform: scale(1);
            }
            50% { 
              opacity: 1;
              transform: scale(1.05);
            }
          }
          @keyframes smooth-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes fade-in-out {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
          .animate-gentle-pulse {
            animation: gentle-pulse 2s ease-in-out infinite;
          }
          .animate-smooth-spin {
            animation: smooth-spin 3s linear infinite;
          }
          .animate-fade-in-out {
            animation: fade-in-out 2s ease-in-out infinite;
          }
        `}</style>
        <div className="text-center">
          {/* Simple elegant loading animation */}
          <div className="relative mb-8">
            <div className="w-16 h-16 mx-auto">
              <div className="w-full h-full border-3 border-gray-200 rounded-full"></div>
              <div className="absolute top-0 left-0 w-full h-full border-3 border-transparent border-t-blue-500 rounded-full animate-smooth-spin"></div>
          </div>
          </div>
          
          {/* Clean loading text */}
          <div className="space-y-3">
            <h2 className="text-xl font-medium text-gray-700 animate-gentle-pulse">
              Loading Dashboard
            </h2>
            <div className="flex items-center justify-center space-x-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-fade-in-out"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-fade-in-out" style={{animationDelay: '0.3s'}}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-fade-in-out" style={{animationDelay: '0.6s'}}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const NotificationBar = dynamic(() => import("@/components/NotificationBar"), { ssr: false });

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
      
      <main className="flex-1 max-w-7xl mx-auto py-6 md:py-10 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-fade-in-up">
          <div className="animate-slide-in-right">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>
            <p className="text-xl text-gray-600 mt-3 font-medium">Manage your tasks and bids efficiently</p>
          </div>
          <div className="flex items-center gap-6 animate-slide-in-right">
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
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <span className="text-lg">{user?.name || "User"}</span>
                <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-fade-in-up">
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">My Profile</span>
                  </Link>
                  <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">Settings</span>
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                <button
                onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors duration-200 w-full text-left"
                  >
                    <LogOut className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Premium Post Task Button */}
        <div className="flex justify-start mb-8 animate-fade-in-up">
          <Link href="/post-task" passHref>
            <Button className="group bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 text-lg">
              <span className="flex items-center gap-3">
                <span className="text-xl group-hover:rotate-90 transition-transform duration-300">+</span>
                Post a Task
              </span>
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="flex w-full bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <TabsTrigger 
              value="my-tasks" 
              className="flex-1 rounded-xl transition-all duration-300 hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 font-medium py-3"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">📋</span>
              My Tasks
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="available" 
              className="flex-1 rounded-xl transition-all duration-300 hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 font-medium py-3"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">🔍</span>
              Available Tasks
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="assigned" 
              className="flex-1 rounded-xl transition-all duration-300 hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 font-medium py-3"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">👤</span>
              Assigned to Me
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="flex-1 rounded-xl transition-all duration-300 hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 font-medium py-3"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">✅</span>
              Completed
              </span>
            </TabsTrigger>
            <TabsTrigger 
              value="my-bids" 
              className="flex-1 rounded-xl transition-all duration-300 hover:bg-white data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:border data-[state=active]:border-gray-200 font-medium py-3"
            >
              <span className="flex items-center gap-2">
                <span className="text-sm">📝</span>
              My Bids
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="space-y-6 mt-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">Tasks You've Posted</h2>
            {/* Premium Summary strip */}
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setMyTasksFilter("in_progress")}
                className={`rounded-lg p-4 bg-white border text-center transition-all duration-200 hover:shadow-md ${
                  myTasksFilter === "in_progress" ? "border-gray-400 bg-gray-50 shadow-sm" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-medium text-gray-600 mb-1">In Progress</div>
                <div className="text-2xl font-bold text-gray-900">{myTasksSummary.inProgress}</div>
              </button>
              <button
                onClick={() => setMyTasksFilter("open")}
                className={`rounded-lg p-4 bg-white border text-center transition-all duration-200 hover:shadow-md ${
                  myTasksFilter === "open" ? "border-gray-400 bg-gray-50 shadow-sm" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-medium text-gray-600 mb-1">Open</div>
                <div className="text-2xl font-bold text-gray-900">{myTasksSummary.open}</div>
              </button>
              <button
                onClick={() => setMyTasksFilter("completed")}
                className={`rounded-lg p-4 bg-white border text-center transition-all duration-200 hover:shadow-md ${
                  myTasksFilter === "completed" ? "border-gray-400 bg-gray-50 shadow-sm" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="text-sm font-medium text-gray-600 mb-1">Completed</div>
                <div className="text-2xl font-bold text-gray-900">{myTasksSummary.completed}</div>
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                    className={`relative transition-all duration-300 hover:shadow-lg hover:-translate-y-1 rounded-xl overflow-hidden group border ${
                      task.deletion_status || task.cancel_status
                        ? "opacity-50 bg-gray-50 border-gray-200 cursor-not-allowed"
                        : task.status === "in_progress"
                        ? "shadow-md border-gray-200 bg-white hover:border-gray-300"
                        : task.status === "completed"
                        ? "shadow-sm border-gray-200 bg-gray-50"
                        : "shadow-sm border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    {/* In Progress Task Banner */}
                    {task.status === "in_progress" && (
                      <div className="absolute top-0 left-0 right-0 bg-gray-800 text-white text-center py-2 px-4 rounded-t-xl font-semibold text-sm z-10">
                        🚀 In Progress — Bid Accepted
                      </div>
                    )}
                    
                    {/* Task Image */}
                    <div className="p-3 pb-0">
                      <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={task.images?.[0]?.url || "/images/placeholder.svg"}
                          alt={task.images?.[0]?.alt || "Task image"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    </div>

                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <div className="flex gap-2">
                          {!task.deletion_status && !task.cancel_status && task.status === "open" && (
                            <>
                              <button
                                onClick={() => handleCancelClick(task.id)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-full shadow-lg transition-all duration-200 hover:scale-110 font-medium text-sm"
                                aria-label="Cancel task"
                                title="Cancel task"
                              >
                                ❌ Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteClick(task.id)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-full shadow-lg transition-all duration-200 hover:scale-110 font-medium text-sm"
                                aria-label="Delete task"
                                title="Delete task"
                              >
                                🗑️ Delete
                </button>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <Badge
                          variant="outline"
                          className={`font-medium text-sm px-3 py-1 ${
                            task.cancel_status
                              ? "border-red-200 text-red-600 bg-red-50"
                              : task.deletion_status
                              ? "border-red-200 text-red-600 bg-red-50"
                              : task.status === "in_progress"
                              ? "border-gray-300 text-gray-700 bg-gray-100"
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
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{task.postedAt}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {task.description}
                      </p>
                      <div className="flex flex-col gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                          <IndianRupee className="h-4 w-4 text-gray-600" />
                          <span className="text-lg font-semibold text-gray-800">₹{task.budget}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{task.location}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2">
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
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                          >
                            ✅ Mark as Complete
                          </Button>
                          <Link href={`/tasks/${task.id}`} className="w-full">
                            <Button variant="outline" className="w-full">
                              View Details
                            </Button>
                          </Link>
                        </>
                      ) : (
                        <Link href={`/tasks/${task.id}`} className="w-full">
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" className="space-y-6 mt-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-3">Available Tasks</h2>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="md:col-span-1 space-y-6">
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

              <div className="md:col-span-3 space-y-6">
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
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-10">
                      <p className="text-muted-foreground mb-4">
                        No tasks found matching your criteria
                      </p>
                      <Button
                        onClick={() => {
                          setSearchTerm("");
                          setCategory("all");
                          setPriceRange([0, 50000]);
                          setLocation("");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTasks.map((task) => {
                      const hasUserBid = requestedTasks.some(bid => bid.task_id === task.id);
                      
                      return (
                                                <Card key={task.id} className="flex flex-col bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 border-l-4 border-l-pink-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
                          {/* Task Image */}
                          <div className="p-3 pb-0">
                            <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                              <Image
                                src={task.images?.[0]?.url || "/images/placeholder.svg"}
                                alt={task.images?.[0]?.alt || "Task image"}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                            </div>
                          </div>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{task.title}</CardTitle>
                              <Badge variant="outline" className="border-pink-500 text-pink-600 font-medium">
                                {task.status === "open" ? "🔓 Open" : 
                                 task.status === "completed" ? "✅ Completed" :
                                 task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                              </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{task.postedAt}</span>
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                              {task.description}
                            </p>
                            <div className="flex flex-col gap-3 text-sm">
                              <div className="flex items-center gap-2 bg-pink-100 px-3 py-2 rounded-lg">
                                <IndianRupee className="h-5 w-5 text-pink-700 font-bold" />
                                <span className="text-lg font-bold text-pink-800">₹{task.budget}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span>{task.location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-xs">
                                    {task.posted_by?.charAt(0) || "?"}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{task.posted_by || "Unknown"}</span>
      </div>
                </div>
                          </CardContent>
                          <CardFooter>
                            <Link href={`/tasks/${task.id}`} className="w-full">
                              <Button variant="outline" className="w-full">
                                {hasUserBid ? "View Offer" : "Make an Offer"}
                              </Button>
                            </Link>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assigned" className="space-y-6 mt-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-orange-200 pb-2">Tasks Assigned to You</h2>
            {assignedTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground">
                    You don't have any assigned tasks
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {assignedTasks.map((task) => (
                  <Card key={task.id} className="bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
                    {/* Task Image */}
                    <div className="p-3 pb-0">
                      <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={task.images?.[0]?.url || "/images/placeholder.svg"}
                          alt={task.images?.[0]?.alt || "Task image"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                          🚀 In Progress
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{task.postedAt}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {task.description}
                      </p>
                      <div className="flex flex-col gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-orange-100 px-3 py-2 rounded-lg">
                          <IndianRupee className="h-5 w-5 text-orange-600 font-bold" />
                          <span className="text-lg font-bold text-orange-800">₹{task.budget}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{task.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-xs">
                              {task.posted_by?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{task.posted_by}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="flex gap-2 w-full">
                        <Link href={`/tasks/${task.id}`} className="flex-1">
                          <Button variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          className="flex-1"
                          onClick={() => handleComplete(task.id)}
                        >
                          Complete
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-6 mt-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-green-200 pb-2">Completed Tasks</h2>
            {completedTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground">
                    You don't have any completed tasks
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedTasks.map((task) => (
                  <Card key={task.id} className="bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 border-l-4 border-l-emerald-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
                    {/* Task Image */}
                    <div className="p-4 pb-0">
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={task.images?.[0]?.url || "/images/placeholder.svg"}
                          alt={task.images?.[0]?.alt || "Task image"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                          ✅ Completed
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Completed: {task.completedDate}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {task.description}
                      </p>
                      <div className="flex flex-col gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-lg">
                          <IndianRupee className="h-5 w-5 text-green-600 font-bold" />
                          <span className="text-lg font-bold text-green-800">₹{task.budget}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{task.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span>Rating: {task.rating || "Not rated"}/5</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/tasks/${task.id}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-bids" className="space-y-6 mt-8 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-purple-200 pb-2">My Bids</h2>
            {requestedTasks.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <p className="text-muted-foreground mb-4">
                    You haven't placed any bids yet
                  </p>
                  <Link href="/browse">
                    <Button>Browse Available Tasks</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {requestedTasks.map((bid) => (
                  <Card key={bid.bid_id} className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl overflow-hidden">
                    {/* Task Image */}
                    <div className="p-3 pb-0">
                      <div className="relative w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={bid.images?.[0]?.url || "/images/placeholder.svg"}
                          alt={bid.images?.[0]?.alt || "Task image"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {bid.task_title}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className="border-purple-500 text-purple-600 bg-purple-50"
                        >
                          📝 Requested
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Bid placed: {bid.created_at}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {bid.task_description}
                      </p>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span>Your bid: {bid.bid_amount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{bid.task_location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback>
                              {bid.posted_by?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{bid.posted_by}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/tasks/${bid.task_id}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          View Task Details
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
                  </div>
            )}
          </TabsContent>
        </Tabs>

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
      </main>
    </div>
  );
}