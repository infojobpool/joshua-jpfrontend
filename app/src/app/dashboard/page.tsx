"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  ChevronDown
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import useStore from "@/lib/Zustand";

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
            console.log(`🔍 Task ${job.job_id} status debug:`, {
              job_completion_status: job.job_completion_status,
              deletion_status: job.deletion_status,
              cancel_status: job.cancel_status,
              status: job.status,
              allKeys: Object.keys(job)
            });
            
            if (job.job_completion_status === 1) {
              jobStatus = "completed";
            } else if (job.deletion_status) {
              jobStatus = "deleted";
            } else if (job.cancel_status) {
              jobStatus = "canceled";
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
              offers: 0, // We'll update this with real bid count
              posted_by: job.posted_by || "Unknown",
              category: job.job_category || "general",
              job_completion_status: job.job_completion_status === 1 ? "Completed" : "Not Completed",
              deletion_status: job.deletion_status || false,
              cancel_status: job.cancel_status ?? false,
            };
          });

          // Now fetch the actual bid count for each task
          console.log('🔍 Starting to fetch bid counts for tasks...');
          const tasksWithBidCounts = await Promise.all(
            tasks.map(async (task) => {
              try {
                console.log(`🔍 Fetching bids for task ${task.id} (${task.title})...`);
                const bidResponse = await axiosInstance.get<APIResponse<{ bids: any[] }>>(`/get-bids/${task.id}/`);
                console.log(`🔍 Bid response for task ${task.id}:`, bidResponse.data);
                
                if (bidResponse.data.status_code === 200 && bidResponse.data.data?.bids) {
                  console.log(`✅ Task ${task.id} has ${bidResponse.data.data.bids.length} bids`);
                  return {
                    ...task,
                    offers: bidResponse.data.data.bids.length
                  };
                } else {
                  console.log(`⚠️ Task ${task.id} - No bids data or API error:`, bidResponse.data);
                }
              } catch (error) {
                console.error(`❌ Error fetching bids for task ${task.id}:`, error);
              }
              return task;
            })
          );

          console.log('📊 Tasks with bid counts:', tasksWithBidCounts.map(t => ({ id: t.id, title: t.title, offers: t.offers })));
          setPostedTasks(tasksWithBidCounts);
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
  }, [user, userId]);

  // Fetch all available tasks
  useEffect(() => {
    if (!user || !userId) return;

    const fetchAllTasks = async () => {
      setLoading(true);
      try {
        console.log('🔍 fetchAllTasks - Debug Info:', {
          userId,
          user: user?.id,
          isAuthenticated
        });
        
        const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>("/get-all-jobs");
        const result = response.data;

        if (result.status_code === 200 && result.data?.jobs) {
          const tasks: Task[] = result.data.jobs
            .filter((job) => {
              // Debug: Log the full job object to see what fields are available
              console.log(`🔍 Full job object for ${job.job_id}:`, {
                job_id: job.job_id,
                posted_by: job.posted_by,
                posted_by_id: job.posted_by_id,
                user_id: job.user_id,
                user_ref_id: job.user_ref_id,
                posted_by_user_id: job.posted_by_user_id,
                // Log all keys to see what's available
                allKeys: Object.keys(job)
              });
              
              // Try to find the actual user ID field - check multiple possible properties
              const jobPostedById = job.posted_by_id || job.user_id || job.user_ref_id || job.posted_by_user_id || job.posted_by;
              const currentUserId = userId?.toString();
              const userFromStore = user?.id?.toString();
              
              console.log(`Filtering job ${job.job_id}:`, {
                jobPostedById,
                currentUserId,
                userFromStore,
                shouldExclude: jobPostedById === currentUserId || jobPostedById === userFromStore
              });
              
              // Check against both userId from store and user.id from user object
              return jobPostedById !== currentUserId && jobPostedById !== userFromStore;
            })
            .map((job) => {
              let jobStatus = "open";
              if (job.job_completion_status === 1) {
                jobStatus = "completed";
              } else if (job.deletion_status) {
                jobStatus = "deleted";
              } else if (job.cancel_status) {
                jobStatus = "canceled";
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
                offers: 0, // We'll update this with real bid count
                posted_by: job.posted_by || "Unknown",
                category: job.job_category || "general",
                job_completion_status: job.job_completion_status === 1 ? "Completed" : "Not Completed",
                deletion_status: job.deletion_status || false,
                cancel_status: job.cancel_status ?? false,
              };
            });

          // Now fetch the actual bid count for each available task
          console.log('🔍 Starting to fetch bid counts for available tasks...');
          const availableTasksWithBidCounts = await Promise.all(
            tasks.map(async (task) => {
              try {
                console.log(`🔍 Fetching bids for available task ${task.id} (${task.title})...`);
                const bidResponse = await axiosInstance.get<APIResponse<{ bids: any[] }>>(`/get-bids/${task.id}/`);
                console.log(`🔍 Bid response for available task ${task.id}:`, bidResponse.data);
                
                if (bidResponse.data.status_code === 200 && bidResponse.data.data?.bids) {
                  console.log(`✅ Available task ${task.id} has ${bidResponse.data.data.bids.length} bids`);
                  return {
                    ...task,
                    offers: bidResponse.data.data.bids.length
                  };
                } else {
                  console.log(`⚠️ Available task ${task.id} - No bids data or API error:`, bidResponse.data);
                }
              } catch (error) {
                console.error(`❌ Error fetching bids for available task ${task.id}:`, error);
              }
              return task;
            })
          );

          console.log('📊 Available tasks with bid counts:', availableTasksWithBidCounts.map(t => ({ id: t.id, title: t.title, offers: t.offers })));
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
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-blue-200 mx-auto"></div>
            <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent border-t-blue-600 mx-auto absolute top-0 left-0"></div>
            <div className="animate-ping rounded-full h-8 w-8 bg-blue-600 mx-auto absolute top-12 left-12"></div>
          </div>
          <p className="mt-6 text-xl font-semibold text-gray-700">Loading your dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 max-w-7xl mx-auto py-6 md:py-10 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">Manage your tasks and bids efficiently</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Profile Dropdown - Now in top right edge */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 text-blue-700 hover:text-blue-800 font-semibold px-4 py-3 rounded-full shadow-md transition-all duration-300 hover:scale-105"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <span>{user?.name || "User"}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                  <Link href="/profile" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700 font-medium">My Profile</span>
                  </Link>
                  <Link href="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors duration-200">
                    <Settings className="h-4 w-4 text-gray-600" />
                    <span className="text-gray-700 font-medium">Settings</span>
                  </Link>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors duration-200 w-full text-left"
                  >
                    <LogOut className="h-4 w-4 text-red-600" />
                    <span className="text-red-600 font-medium">Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post Task Button - Now below the header */}
        <div className="flex justify-start mb-6">
          <Link href="/post-task" passHref>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
              + Post a Task
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="flex w-full bg-gray-100 p-1 rounded-full shadow-inner">
            <TabsTrigger 
              value="my-tasks" 
              className="flex-1 rounded-full transition-all duration-300 hover:bg-white/50 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
            >
              My Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="available" 
              className="flex-1 rounded-full transition-all duration-300 hover:bg-white/50 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
            >
              Available Tasks
            </TabsTrigger>
            <TabsTrigger 
              value="assigned" 
              className="flex-1 rounded-full transition-all duration-300 hover:bg-white/50 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
            >
              Assigned to Me
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="flex-1 rounded-full transition-all duration-300 hover:bg-white/50 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
            >
              Completed
            </TabsTrigger>
            <TabsTrigger 
              value="my-bids" 
              className="flex-1 rounded-full transition-all duration-300 hover:bg-white/50 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:border-b-2 data-[state=active]:border-blue-500"
            >
              My Bids
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-tasks" className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-blue-200 pb-2">Tasks You've Posted</h2>
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
                  .sort((a, b) => {
                    // Sort "Working" (accepted bids + paid) tasks to the top
                    if (a.status === "in_progress" && b.status !== "in_progress") return -1;
                    if (b.status === "in_progress" && a.status !== "in_progress") return 1;
                    
                    // Sort tasks with offers (potential bids) to top
                    if (a.offers > 0 && b.offers === 0) return -1;
                    if (b.offers > 0 && a.offers === 0) return 1;
                    
                    // Sort by number of offers (more offers = higher priority)
                    if (a.offers !== b.offers) return b.offers - a.offers;
                    
                    // Sort "Deleted" tasks to the bottom
                    if (a.deletion_status && !b.deletion_status) return 1;
                    if (!a.deletion_status && b.deletion_status) return -1;
                    
                    // Sort "Canceled" tasks to the bottom
                    if (a.cancel_status && !b.cancel_status) return 1;
                    if (!a.cancel_status && b.cancel_status) return -1;
                    
                    return 0;
                  })
                  .map((task) => (
                                    <Card
                    key={task.id}
                    className={`relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 rounded-xl overflow-hidden ${
                      task.deletion_status || task.cancel_status
                        ? "opacity-50 bg-gray-100 border-gray-300 cursor-not-allowed"
                        : task.status === "in_progress"
                        ? "shadow-xl hover:shadow-2xl border-0 bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100 border-l-4 border-l-emerald-600 ring-2 ring-emerald-200"
                        : "shadow-lg hover:shadow-2xl border-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-l-4 border-l-blue-500"
                    }`}
                  >
                    {/* Working Task Banner */}
                    {task.status === "in_progress" && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-600 to-green-600 text-white text-center py-2 px-4 rounded-t-xl font-semibold text-sm shadow-lg z-10">
                        🚀 TASK IN PROGRESS - WORKING
                      </div>
                    )}
                    
                    {/* Offers Notification Banner */}
                    {task.offers > 0 && task.status !== "in_progress" && (
                      <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center py-2 px-4 rounded-t-xl font-semibold text-sm shadow-lg z-10">
                        💼 {task.offers} OFFER{task.offers > 1 ? 'S' : ''} RECEIVED
                      </div>
                    )}
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
                          variant={
                            task.cancel_status
                              ? "destructive"
                              : task.deletion_status
                              ? "destructive"
                              : task.status === "in_progress"
                              ? "default"
                              : task.status === "open"
                              ? "outline"
                              : "secondary"
                          }
                          className={
                            task.status === "in_progress"
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-3 py-1 shadow-lg"
                              : ""
                          }
                        >
                          {task.cancel_status
                            ? "Canceled"
                            : task.deletion_status
                            ? "Deleted"
                            : task.status === "in_progress"
                            ? "🔄 Working"
                            : task.status.charAt(0).toUpperCase() +
                              task.status.slice(1)}
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
                        <div className="flex items-center gap-2 bg-blue-100 px-3 py-2 rounded-lg">
                          <IndianRupee className="h-5 w-5 text-blue-600 font-bold" />
                          <span className="text-lg font-bold text-blue-800">₹{task.budget}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{task.location}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-orange-50 px-3 py-2 rounded-lg border border-orange-200">
                          <Briefcase className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-800">
                            {task.offers > 0 ? (
                              <span className="flex items-center gap-2">
                                <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  {task.offers}
                                </span>
                                offers received
                              </span>
                            ) : (
                              "0 offers"
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {task.deletion_status || task.cancel_status ? (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => handleRequestUndeleteClick(task.id)}
                        >
                          Request Access
                        </Button>
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

          <TabsContent value="available" className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-green-200 pb-2">Available Tasks</h2>
            <div className="grid gap-6 md:grid-cols-4">
              <div className="md:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                    <CardDescription>Refine your search</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categories.length > 0 ? (
                            categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="loading" disabled>
                              Loading categories...
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Price Range</label>
                      <div className="pt-4">
                        <Slider
                          defaultValue={[0, 50000]}
                          max={50000}
                          step={10}
                          value={priceRange}
                          onValueChange={setPriceRange}
                        />
                        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                          <span>₹{priceRange[0]}</span>
                          <span>₹{priceRange[1]}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        placeholder="Any location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="md:col-span-3 space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="search"
                        placeholder="Search tasks..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <Button type="submit">Search</Button>
                  </form>
                  <Button
                    variant="outline"
                    className="sm:hidden"
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

          <TabsContent value="assigned" className="space-y-6 mt-8">
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

          <TabsContent value="completed" className="space-y-6 mt-8">
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

          <TabsContent value="my-bids" className="space-y-6 mt-8">
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
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">
                          {bid.task_title}
                        </CardTitle>
                        <Badge
                          variant={
                            bid.status === "pending"
                              ? "outline"
                              : bid.status === "accepted"
                              ? "default"
                              : "destructive"
                          }
                          className={
                            bid.status === "accepted"
                              ? "bg-green-600 hover:bg-green-700 text-white font-semibold"
                              : bid.status === "pending"
                              ? "border-blue-500 text-blue-600"
                              : ""
                          }
                        >
                          {bid.status === "accepted" ? "✅ Accepted" : 
                           bid.status === "pending" ? "⏳ Pending" :
                           bid.status.charAt(0).toUpperCase() + bid.status.slice(1)}
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