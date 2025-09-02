"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  Star,
  Briefcase,
  CheckCircle,
  Search,
  Filter,
  Trash2,
  IndianRupee,
  X,
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import axiosInstance from "@/lib/axiosInstance";
import useStore from "@/lib/Zustand";
import { toast } from "sonner";
import Header from "@/components/Header";
import { ConfirmDialog } from "@/components/ConfirmDialog";

// // Interfaces
// interface User {
//   id: string;
//   name: string;
//   email: string;
//   accountType: string;
//   isLoggedIn: boolean;
// }

// interface UserProfile {
//   profile_id: string;
//   name: string;
//   email: string;
//   phone: string;
//   avatar: string;
//   joinDate: string;
// }

// interface Task {
//   id: string;
//   user_ref_id?: string;
//   title: string;
//   description: string;
//   budget: number;
//   location: string;
//   status: string;
//   deletion_status?: boolean;
//   postedAt: string;
//   offers?: number;
//   assignedTo?: string;
//   posted_by?: string;
//   dueDate?: string;
//   completedDate?: string;
//   rating?: number;
//   category?: string;
// }

// interface Bid {
//   id: string;
//   task_id: string;
//   task_title: string;
//   bid_amount: number;
//   status: string;
//   created_at: string;
//   task_location: string;
//   task_description: string;
//   posted_by: string;
// }

// interface BidRequest {
//   bid_id: number;
//   task_id: string;
//   task_title: string;
//   bid_amount: number;
//   bid_description: string;
//   status: string;
//   created_at: string;
//   task_location: string;
//   task_description: string;
//   posted_by: string;
//   job_due_date: string;
//   job_budget: number;
//   job_category: string;
//   category_name: string;
// }

// interface Category {
//   id: string;
//   name: string;
// }

// interface APIResponse<T> {
//   status_code: number;
//   message: string;
//   timestamp: string;
//   data: T;
// }

// export default function DashboardPage() {
//   const router = useRouter();
//   const { userId, logout } = useStore();
//   const [user, setUser] = useState<User | null>(null);
//   const [userProfile, setUserProfile] = useState<UserProfile>({
//     profile_id: "",
//     name: "",
//     email: "",
//     phone: "",
//     avatar: "/images/placeholder.svg?height=128&width=128",
//     joinDate: "",
//   });
//   const [loading, setLoading] = useState(true);
//   const [postedTasks, setPostedTasks] = useState<Task[]>([]);
//   const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
//   const [bids, setBids] = useState<Bid[]>([]);
//   const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
//   const [requestedTasks, setRequestedTasks] = useState<BidRequest[]>([]);
//   const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
//   const [confirmOpen, setConfirmOpen] = useState(false);
//   const [requestUndeleteOpen, setRequestUndeleteOpen] = useState(false);
//   const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

//   // Available Tasks Filters State
//   const [searchTerm, setSearchTerm] = useState("");
//   const [category, setCategory] = useState("all");
//   const [priceRange, setPriceRange] = useState([0, 2000]);
//   const [location, setLocation] = useState("");
//   const [showFilters, setShowFilters] = useState(false);
//   const [categories, setCategories] = useState<Category[]>([]);

//   // Check authentication and fetch user from localStorage
//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");
//     if (storedUser) {
//       try {
//         const parsedUser: User = JSON.parse(storedUser);
//         setUser(parsedUser);
//         console.log("Logged-in user ID:", parsedUser.id);
//       } catch (error) {
//         console.error("Failed to parse user from localStorage:", error);
//         router.push("/signin");
//       }
//     } else {
//       router.push("/signin");
//     }
//   }, [router]);

//   // Fetch user profile data
//   useEffect(() => {
//     const fetchProfile = async () => {
//       if (!userId) {
//         return;
//       }

//       try {
//         setLoading(true);
//         const response = await axiosInstance.get(`/profile?user_id=${userId}`);
//         const data = response.data;
//         setUserProfile({
//           profile_id: data.profile_id || "",
//           name: data.name || "",
//           email: data.email || "",
//           phone: data.phone_number || "",
//           avatar:
//             data.profile_img || "/images/placeholder.svg?height=128&width=128",
//           joinDate: data.tstamp
//             ? new Date(data.tstamp).toLocaleDateString()
//             : "",
//         });
//       } catch (err: any) {
//         console.error("Failed to fetch profile:", err);
//         if (err.response?.status === 401) {
//           logout();
//           router.push("/signin");
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProfile();
//   }, [userId, logout, router]);

//   // Fetch categories
//   useEffect(() => {
//     const fetchCategories = async () => {
//       try {
//         const response = await axiosInstance.get("/get-all-categories/");
//         if (response.data?.data) {
//           const fetchedCategories = response.data.data.map(
//             (category: { category_id: string; category_name: string }) => ({
//               id: category.category_id,
//               name: category.category_name,
//             })
//           );
//           setCategories(fetchedCategories);
//           console.log("Categories fetched:", fetchedCategories);
//         } else {
//           console.warn("No categories found");
//         }
//       } catch (error) {
//         console.error("Error fetching categories:", error);
//         toast.error("Failed to load categories. Please try again.");
//       }
//     };

//     fetchCategories();
//   }, []);

//   // Fetch user's posted tasks
//   useEffect(() => {
//     if (!user || !userId) return;

//     const fetchTasks = async () => {
//       setLoading(true);
//       try {
//         const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>(
//           `/get-user-jobs/${userId}/`
//         );
//         const result = response.data;

//         if (result.status_code === 200 && result.data?.jobs) {
//           const tasks: Task[] = result.data.jobs.map((job) => {
//             let jobStatus = "open";
//             if (job.job_completion_status === 1) {
//               jobStatus = "completed";
//             } else if (job.status === true) {
//               jobStatus = "assigned";
//             }

//             return {
//               id: job.job_id.toString(),
//               title: job.job_title || "Untitled",
//               description: job.job_description || "No description provided.",
//               budget: Number(job.job_budget) || 0,
//               location: job.job_location || "Unknown",
//               status: jobStatus,
//               deletion_status: job.deletion_status,
//               postedAt: job.job_due_date
//                 ? new Date(job.job_due_date).toLocaleDateString("en-GB")
//                 : "Unknown",
//               offers: job.offers || 0,
//               posted_by: job.posted_by || "Unknown",
//               category: job.job_category || "general",
//             };
//           });
//           setPostedTasks(tasks);
//         } else {
//           console.warn("No jobs found or API error:", result.message);
//         }
//       } catch (err) {
//         console.error("Failed to fetch tasks:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTasks();
//   }, [user, userId]);

//   // Fetch all available tasks
//   useEffect(() => {
//     if (!user || !userId) return;

//     const fetchAllTasks = async () => {
//       setLoading(true);
//       try {
//         const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>(
//           `/get-all-jobs/`
//         );
//         const result = response.data;
//         console.log("Raw API response for /get-all-jobs/:", result);

//         if (result.status_code === 200 && result.data?.jobs) {
//           const tasks: Task[] = result.data.jobs
//             .filter((job) => job.user_ref_id !== userId)
//             .map((job) => {
//               let jobStatus = "open";
//               if (job.job_completion_status === 1) {
//                 jobStatus = "completed";
//               } else if (job.status === true) {
//                 jobStatus = "assigned";
//               }

//               return {
//                 id: job.job_id.toString(),
//                 title: job.job_title || "Untitled",
//                 description: job.job_description || "No description provided.",
//                 budget: Number(job.job_budget) || 0,
//                 location: job.job_location || "Unknown",
//                 status: jobStatus,
//                 postedAt: job.job_due_date
//                   ? new Date(job.job_due_date).toLocaleDateString("en-GB")
//                   : "Unknown",
//                 offers: job.offers || 0,
//                 posted_by: job.posted_by || "Unknown",
//                 category: job.job_category || "general",
//                 job_completion_status:
//                   job.job_completion_status === 1
//                     ? "Completed"
//                     : "Not Completed",
//                 deletion_status: job.deletion_status || "active",
//               };
//             });

//           setAvailableTasks(tasks);
//           console.log("Available tasks after mapping:", tasks);
//         } else {
//           console.warn("No jobs found or API error:", result.message);
//         }
//       } catch (err) {
//         console.error("Failed to fetch all tasks:", err);
//         toast.error("An error occurred while fetching available tasks.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchAllTasks();
//   }, [user, userId]);

//   // Fetch user's bids
//   useEffect(() => {
//     if (!user || !userId) return;

//     const fetchBids = async () => {
//       try {
//         const response = await axiosInstance.get<APIResponse<{ bids: any[] }>>(
//           `/get-user-bids/${userId}/`
//         );
//         const result = response.data;

//         if (result.status_code === 200 && result.data?.bids) {
//           const userBids: Bid[] = result.data.bids.map((bid) => ({
//             id: bid.bid_id.toString(),
//             task_id: bid.task_id.toString(),
//             task_title: bid.task_title || "Untitled",
//             bid_amount: Number(bid.bid_amount) || 0,
//             status: bid.status || "pending",
//             created_at: bid.created_at
//               ? new Date(bid.created_at).toLocaleDateString("en-GB")
//               : "Unknown",
//             task_location: bid.task_location || "Unknown",
//             task_description:
//               bid.task_description || "No description provided.",
//             posted_by: bid.posted_by || "Unknown",
//           }));
//           setBids(userBids);
//         } else {
//           console.warn("No bids found or API error:", result.message);
//         }
//       } catch (err) {
//         console.error("Failed to fetch bids:", err);
//       }
//     };

//     fetchBids();
//   }, [user, userId]);

//   // Fetch assigned tasks
//   useEffect(() => {
//     if (!user || !userId) return;

//     const fetchAssignedBids = async () => {
//       try {
//         const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>(
//           `/get-user-assigned-bids/${userId}/`
//         );
//         const result = response.data;

//         if (result.status_code === 200 && Array.isArray(result.data?.jobs)) {
//           const tasks: Task[] = result.data.jobs.map((job) => ({
//             id: job.job_id.toString(),
//             title: job.job_title || "Untitled",
//             description: job.job_description || "No description provided.",
//             budget: Number(job.job_budget) || 0,
//             location: job.job_location || "Unknown",
//             status: job.status ? "assigned" : "open",
//             postedAt: job.created_at
//               ? new Date(job.created_at).toLocaleDateString("en-GB")
//               : "Unknown",
//             dueDate: job.job_due_date
//               ? new Date(job.job_due_date).toLocaleDateString("en-GB")
//               : "Unknown",
//             offers: job.offers?.length || 0,
//             posted_by: job.posted_by || "Unknown",
//             category: job.job_category || "general",
//           }));
//           setAssignedTasks(tasks);
//         } else {
//           console.warn("No assigned tasks found or API error:", result.message);
//         }
//       } catch (err) {
//         console.error("Failed to fetch assigned tasks:", err);
//       }
//     };

//     fetchAssignedBids();
//   }, [user, userId]);

//   // Fetch requested bids
//   useEffect(() => {
//     if (!user || !userId) return;

//     const fetchRequestedBids = async () => {
//       try {
//         const response = await axiosInstance.get<
//           APIResponse<{ bids: BidRequest[] }>
//         >(`/get-user-requested-bids/${userId}/`);
//         const result = response.data;

//         if (result.status_code === 200 && Array.isArray(result.data?.bids)) {
//           const bids: BidRequest[] = result.data.bids.map((bid) => ({
//             bid_id: bid.bid_id,
//             task_id: bid.task_id.toString(),
//             task_title: bid.task_title || "Untitled",
//             bid_amount: Number(bid.bid_amount) || 0,
//             bid_description: bid.bid_description || "No description provided.",
//             status: bid.status || "pending",
//             created_at: bid.created_at
//               ? new Date(bid.created_at).toLocaleDateString("en-GB")
//               : "Unknown",
//             task_location: bid.task_location || "Unknown",
//             task_description:
//               bid.task_description || "No description provided.",
//             posted_by: bid.posted_by || "Unknown",
//             job_due_date: bid.job_due_date
//               ? new Date(bid.job_due_date).toLocaleDateString("en-GB")
//               : "Unknown",
//             job_budget: Number(bid.job_budget) || 0,
//             job_category: bid.job_category || "general",
//             category_name: bid.category_name || "Unknown",
//           }));
//           setRequestedTasks(bids);
//         } else {
//           console.warn("No requested bids found or API error:", result.message);
//         }
//       } catch (err) {
//         console.error("Failed to fetch requested bids:", err);
//       }
//     };

//     fetchRequestedBids();
//   }, [user, userId]);

//   // Fetch completed tasks
//   useEffect(() => {
//     if (!user || !userId) return;

//     const fetchCompletedTasks = async () => {
//       setLoading(true);
//       try {
//         const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>(
//           `/fetch-completed-tasks/${userId}/`
//         );
//         const result = response.data;

//         if (result.status_code === 200 && result.data?.jobs) {
//           const tasks: Task[] = result.data.jobs.map((job) => ({
//             id: job.job_id.toString(),
//             title: job.job_title || "Untitled",
//             description: job.job_description || "No description provided.",
//             budget: Number(job.job_budget) || 0,
//             location: job.job_location || "Unknown",
//             status: "completed",
//             postedAt: job.job_due_date
//               ? new Date(job.job_due_date).toLocaleDateString("en-GB")
//               : "Unknown",
//             completedDate: job.completed_date
//               ? new Date(job.completed_date).toLocaleDateString("en-GB")
//               : "Unknown",
//             rating: job.rating || 0,
//             offers: job.offers || 0,
//             posted_by: job.posted_by || "Unknown",
//             category: job.job_category || "general",
//           }));
//           setCompletedTasks(tasks);
//         } else {
//           console.warn(
//             "No completed tasks found or API error:",
//             result.message
//           );
//         }
//       } catch (err) {
//         console.error("Failed to fetch completed tasks:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCompletedTasks();
//   }, [user, userId]);

//   const handleComplete = async (jobId: string) => {
//     try {
//       const response = await axiosInstance.put<APIResponse<any>>(
//         `/mark-complete/${jobId}/`
//       );

//       if (response.data.status_code === 200) {
//         toast.success("Task marked as complete!");
//         setAssignedTasks((prev) => prev.filter((task) => task.id !== jobId));
//         setCompletedTasks((prev) => [
//           ...prev,
//           {
//             ...assignedTasks.find((task) => task.id === jobId)!,
//             status: "completed",
//             completedDate: new Date().toLocaleDateString("en-GB"),
//           },
//         ]);

//         router.push(`/tasks/${jobId}/complete`);
//       } else {
//         console.error("Error marking task as complete:", response.data.message);
//       }
//     } catch (error) {
//       console.error("Error marking task as complete:", error);
//     }
//   };

//   const handleDeleteClick = (jobId: string) => {
//     setSelectedJobId(jobId);
//     setConfirmOpen(true);
//   };

//   const handleConfirmDelete = async () => {
//     if (!selectedJobId) return;

//     setConfirmOpen(false);

//     try {
//       const response = await axiosInstance.put(`/delete-job/${selectedJobId}/`);
//       if (response.data.status_code === 200) {
//         toast.success("Task deleted successfully!");
//         // Update the deletion_status of the task in postedTasks
//         setPostedTasks((prev) =>
//           prev.map((task) =>
//             task.id === selectedJobId
//               ? { ...task, deletion_status: true }
//               : task
//           )
//         );
//       } else {
//         toast.error(response.data.message || "Failed to delete task");
//       }
//     } catch (error) {
//       toast.error("An error occurred while deleting the task");
//     } finally {
//       setSelectedJobId(null); // Clear selectedJobId
//     }
//   };

// const handleConfirmUndelete = async () => {
//   if (!selectedJobId) return;

//   // Display the toast notification directly
//   toast.success("Your request has been sent to admin");

//   // Optionally update the task state to reflect the request (if needed)
//   setPostedTasks((prev) =>
//     prev.map((task) =>
//       task.id === selectedJobId
//         ? { ...task, deletion_status: true }
//         : task
//     )
//   );

//   // Clear selected job and close the dialog
//   setSelectedJobId(null);
//   setRequestUndeleteOpen(false);
// };

//   const handleSignOut = () => {
//     localStorage.removeItem("user");
//     logout();
//     router.push("/");
//   };

//   // Filter tasks for Available Tasks tab
//   const filteredTasks = availableTasks.filter((task) => {
//     const matchesSearch =
//       searchTerm === "" ||
//       task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       task.description.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesCategory = category === "all" || task.category === category;
//     const matchesPrice =
//       task.budget >= priceRange[0] && task.budget <= priceRange[1];
//     const matchesLocation =
//       location === "" ||
//       task.location.toLowerCase().includes(location.toLowerCase());

//     console.log(`Task ${task.id} filter check:`, {
//       matchesSearch,
//       matchesCategory,
//       matchesPrice,
//       matchesLocation,
//       taskBudget: task.budget,
//       priceRange,
//       taskCategory: task.category,
//       selectedCategory: category,
//       taskLocation: task.location,
//       searchTerm,
//     });

//     return matchesSearch && matchesCategory && matchesPrice && matchesLocation;
//   });

//   console.log("Filtered tasks:", filteredTasks);

//   const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     console.log("Searching for:", searchTerm);
//   };

//   const handleRequestUndeleteClick = (jobId: string) => {
//     setSelectedJobId(jobId);
//     setRequestUndeleteOpen(true); // Open the dialog
//   };
//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         Loading...
//       </div>
//     );
//   }

//   if (!user) {
//     return null;
//   }

//   return (
//     <div className="flex min-h-screen flex-col">
//       <Header user={userProfile} onSignOut={handleSignOut} />
//       <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
//           <div>
//             <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
//             <p className="text-muted-foreground">Manage your tasks and bids</p>
//           </div>
//           <Link href="/post-task" passHref>
//             <Button>+ Post a Task</Button>
//           </Link>
//         </div>

//         <Tabs defaultValue="available" className="w-full">
//           <TabsList className="grid w-full grid-cols-5">
//             <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
//             <TabsTrigger value="available">Available Tasks</TabsTrigger>
//             <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
//             <TabsTrigger value="completed">Completed</TabsTrigger>
//             <TabsTrigger value="my-bids">My Bids</TabsTrigger>
//           </TabsList>

//           <TabsContent value="my-tasks" className="space-y-4 mt-6">
//             <h2 className="text-xl font-semibold">Tasks You've Posted</h2>
//             {postedTasks.length === 0 ? (
//               <Card>
//                 <CardContent className="flex flex-col items-center justify-center py-10">
//                   <p className="text-muted-foreground mb-4">
//                     You haven't posted any tasks yet
//                   </p>
//                   <Link href="/post-task">
//                     <Button>Post Your First Task</Button>
//                   </Link>
//                 </CardContent>
//               </Card>
//             ) : (
//               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//                 {postedTasks.map((task) => {
//                   // Debug: Log deletion_status for each task
//                   console.log(
//                     `Task ${task.id} deletion_status:`,
//                     task.deletion_status
//                   );

//                   return (
//                     <Card
//                       key={task.id}
//                       className={`relative ${
//                         task.deletion_status
//                           ? "opacity-50 bg-gray-100 border-gray-300 cursor-not-allowed"
//                           : ""
//                       }`}
//                     >
//                       {!task.deletion_status && task.status === "open" && (
//                         <button
//                           onClick={() => handleDeleteClick(task.id)}
//                           className="absolute top-2 right-2 text-red-500 hover:text-red-700"
//                           aria-label="Delete task"
//                         >
//                           <Trash2 className="h-5 w-5" />
//                         </button>
//                       )}
//                       <CardHeader className="pb-2">
//                         <div className="flex justify-between items-start">
//                           <CardTitle className="text-lg">
//                             {task.title}
//                           </CardTitle>
//                           <Badge
//                             variant={
//                               task.deletion_status
//                                 ? "destructive"
//                                 : task.status === "open"
//                                 ? "outline"
//                                 : "secondary"
//                             }
//                           >
//                             {task.deletion_status
//                               ? "Deleted"
//                               : task.status.charAt(0).toUpperCase() +
//                                 task.status.slice(1)}
//                           </Badge>
//                         </div>
//                         <CardDescription className="flex items-center gap-1">
//                           <Clock className="h-3 w-3" />
//                           <span>{task.postedAt}</span>
//                         </CardDescription>
//                       </CardHeader>
//                       <CardContent>
//                         <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
//                           {task.description}
//                         </p>
//                         <div className="flex flex-col gap-2 text-sm">
//                           <div className="flex items-center gap-2">
//                             <IndianRupee className="h-4 w-4 text-muted-foreground" />
//                             <span>{task.budget}</span>
//                           </div>
//                           <div className="flex items-center gap-2">
//                             <MapPin className="h-4 w-4 text-muted-foreground" />
//                             <span>{task.location}</span>
//                           </div>
//                           <div className="flex items-center gap-2">
//                             <Briefcase className="h-4 w-4 text-muted-foreground" />
//                             <span>{task.offers || 0} offers</span>
//                           </div>
//                         </div>
//                       </CardContent>
//                       <CardFooter>
//                         {task.deletion_status ? (
//                           <Button
//                             variant="outline"
//                             className="w-full"
//                             onClick={() => handleRequestUndeleteClick(task.id)}
//                           >
//                             Request Access
//                           </Button>
//                         ) : (
//                           <Link href={`/tasks/${task.id}`} className="w-full">
//                             <Button variant="outline" className="w-full">
//                               View Details
//                             </Button>
//                           </Link>
//                         )}
//                       </CardFooter>
//                     </Card>
//                   );
//                 })}
//               </div>
//             )}
//           </TabsContent>

//           <TabsContent value="available" className="space-y-4 mt-6">
//             <h2 className="text-xl font-semibold">Available Tasks</h2>
//             <div className="grid gap-6 md:grid-cols-4">
//               <div className="md:col-span-1 space-y-6">
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="text-lg">Filters</CardTitle>
//                     <CardDescription>Refine your search</CardDescription>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <div className="space-y-2">
//                       <label className="text-sm font-medium">Category</label>
//                       <Select value={category} onValueChange={setCategory}>
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select a category" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="all">All Categories</SelectItem>
//                           {categories.length > 0 ? (
//                             categories.map((cat) => (
//                               <SelectItem key={cat.id} value={cat.id}>
//                                 {cat.name}
//                               </SelectItem>
//                             ))
//                           ) : (
//                             <SelectItem value="loading" disabled>
//                               Loading categories...
//                             </SelectItem>
//                           )}
//                         </SelectContent>
//                       </Select>
//                     </div>
//                     <div className="space-y-2">
//                       <label className="text-sm font-medium">Price Range</label>
//                       <div className="pt-4">
//                         <Slider
//                           defaultValue={[0, 2000]}
//                           max={2000}
//                           step={10}
//                           value={priceRange}
//                           onValueChange={setPriceRange}
//                         />
//                         <div className="flex justify-between mt-2 text-sm text-muted-foreground">
//                           <span>₹{priceRange[0]}</span>
//                           <span>₹{priceRange[1]}</span>
//                         </div>
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <label className="text-sm font-medium">Location</label>
//                       <Input
//                         placeholder="Any location"
//                         value={location}
//                         onChange={(e) => setLocation(e.target.value)}
//                       />
//                     </div>
//                   </CardContent>
//                 </Card>
//               </div>

//               <div className="md:col-span-3 space-y-6">
//                 <div className="flex flex-col sm:flex-row gap-4">
//                   <form onSubmit={handleSearch} className="flex-1 flex gap-2">
//                     <div className="relative flex-1">
//                       <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//                       <Input
//                         type="search"
//                         placeholder="Search tasks..."
//                         className="pl-8"
//                         value={searchTerm}
//                         onChange={(e) => setSearchTerm(e.target.value)}
//                       />
//                     </div>
//                     <Button type="submit">Search</Button>
//                   </form>
//                   <Button
//                     variant="outline"
//                     className="sm:hidden"
//                     onClick={() => setShowFilters(!showFilters)}
//                   >
//                     <Filter className="mr-2 h-4 w-4" />
//                     Filters
//                   </Button>
//                 </div>

//                 {showFilters && (
//                   <Card className="sm:hidden">
//                     <CardHeader>
//                       <CardTitle className="text-lg">Filters</CardTitle>
//                     </CardHeader>
//                     <CardContent className="space-y-4">
//                       <div className="space-y-2">
//                         <label className="text-sm font-medium">Category</label>
//                         <Select value={category} onValueChange={setCategory}>
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select a category" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             <SelectItem value="all">All Categories</SelectItem>
//                             {categories.length > 0 ? (
//                               categories.map((cat) => (
//                                 <SelectItem key={cat.id} value={cat.id}>
//                                   {cat.name}
//                                 </SelectItem>
//                               ))
//                             ) : (
//                               <SelectItem value="loading" disabled>
//                                 Loading categories...
//                               </SelectItem>
//                             )}
//                           </SelectContent>
//                         </Select>
//                       </div>
//                       <div className="space-y-2">
//                         <label className="text-sm font-medium">
//                           Price Range
//                         </label>
//                         <div className="pt-4">
//                           <Slider
//                             defaultValue={[0, 2000]}
//                             max={2000}
//                             step={10}
//                             value={priceRange}
//                             onValueChange={setPriceRange}
//                           />
//                           <div className="flex justify-between mt-2 text-sm text-muted-foreground">
//                             <span>${priceRange[0]}</span>
//                             <span>${priceRange[1]}</span>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="space-y-2">
//                         <label className="text-sm font-medium">Location</label>
//                         <Input
//                           placeholder="Any location"
//                           value={location}
//                           onChange={(e) => setLocation(e.target.value)}
//                         />
//                       </div>
//                     </CardContent>
//                   </Card>
//                 )}

//                 <div className="flex justify-between items-center">
//                   <p className="text-sm text-muted-foreground">
//                     {filteredTasks.length} tasks found
//                   </p>
//                   <Select defaultValue="newest">
//                     <SelectTrigger className="w-[180px]">
//                       <SelectValue placeholder="Sort by" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="newest">Newest first</SelectItem>
//                       <SelectItem value="oldest">Oldest first</SelectItem>
//                       <SelectItem value="highest">Highest budget</SelectItem>
//                       <SelectItem value="lowest">Lowest budget</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>

//                 {filteredTasks.length === 0 ? (
//                   <Card>
//                     <CardContent className="flex flex-col items-center justify-center py-10">
//                       <p className="text-muted-foreground mb-4">
//                         No tasks found matching your criteria
//                       </p>
//                       <Button
//                         onClick={() => {
//                           setSearchTerm("");
//                           setCategory("all");
//                           setPriceRange([0, 2000]);
//                           setLocation("");
//                         }}
//                       >
//                         Clear Filters
//                       </Button>
//                     </CardContent>
//                   </Card>
//                 ) : (
//                   <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//                     {filteredTasks.map((task) => (
//                       <Card key={task.id} className="flex flex-col">
//                         <CardHeader className="pb-2">
//                           <div className="flex justify-between items-start">
//                             <CardTitle className="text-lg">
//                               {task.title}
//                             </CardTitle>
//                             <Badge variant="outline">
//                               {task.status.charAt(0).toUpperCase() +
//                                 task.status.slice(1)}
//                             </Badge>
//                           </div>
//                           <CardDescription className="flex items-center gap-1">
//                             <Clock className="h-3 w-3" />
//                             <span>{task.postedAt}</span>
//                           </CardDescription>
//                         </CardHeader>
//                         <CardContent className="flex-1">
//                           <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
//                             {task.description}
//                           </p>
//                           <div className="flex flex-col gap-2 text-sm">
//                             <div className="flex items-center gap-2">
//                               <IndianRupee className="h-4 w-4 text-muted-foreground" />
//                               <span>{task.budget}</span>
//                             </div>
//                             <div className="flex items-center gap-2">
//                               <MapPin className="h-4 w-4 text-muted-foreground" />
//                               <span>{task.location}</span>
//                             </div>
//                             <div className="flex items-center gap-2">
//                               <Avatar className="h-4 w-4">
//                                 <AvatarFallback>
//                                   {task.posted_by?.charAt(0) || "?"}
//                                 </AvatarFallback>
//                               </Avatar>
//                               <span>{task.posted_by || "Unknown"}</span>
//                             </div>
//                           </div>
//                         </CardContent>
//                         <CardFooter>
//                           <Link href={`/tasks/${task.id}`} className="w-full">
//                             <Button className="w-full">Make an Offer</Button>
//                           </Link>
//                         </CardFooter>
//                       </Card>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </TabsContent>

//           <TabsContent value="assigned" className="space-y-4 mt-6">
//             <h2 className="text-xl font-semibold">Tasks Assigned to You</h2>
//             {assignedTasks.length === 0 ? (
//               <Card>
//                 <CardContent className="flex flex-col items-center justify-center py-10">
//                   <p className="text-muted-foreground">
//                     You don't have any assigned tasks
//                   </p>
//                 </CardContent>
//               </Card>
//             ) : (
//               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//                 {assignedTasks.map((task) => (
//                   <Card key={task.id}>
//                     <CardHeader className="pb-2">
//                       <div className="flex justify-between items-start">
//                         <CardTitle className="text-lg">{task.title}</CardTitle>
//                         <Badge>In Progress</Badge>
//                       </div>
//                       <CardDescription className="flex items-center gap-1">
//                         <Clock className="h-3 w-3" />
//                         <span>Due: {task.dueDate}</span>
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
//                         {task.description}
//                       </p>
//                       <div className="flex flex-col gap-2 text-sm">
//                         <div className="flex items-center gap-2">
//                           <IndianRupee className="h-4 w-4 text-muted-foreground" />
//                           <span>{task.budget}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <MapPin className="h-4 w-4 text-muted-foreground" />
//                           <span>{task.location}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Avatar className="h-4 w-4">
//                             <AvatarFallback>
//                               {task.posted_by?.charAt(0) || "?"}
//                             </AvatarFallback>
//                           </Avatar>
//                           <span>{task.posted_by}</span>
//                         </div>
//                       </div>
//                     </CardContent>
//                     <CardFooter className="flex gap-2">
//                       <Link href={`/tasks/${task.id}`} className="flex-1">
//                         <Button variant="outline" className="w-full">
//                           View Details
//                         </Button>
//                       </Link>
//                       <Button
//                         className="flex-1"
//                         onClick={() => handleComplete(task.id)}
//                       >
//                         Mark Complete
//                       </Button>
//                     </CardFooter>
//                   </Card>
//                 ))}
//               </div>
//             )}
//           </TabsContent>

//           <TabsContent value="completed" className="space-y-4 mt-6">
//             <h2 className="text-xl font-semibold">Completed Tasks</h2>
//             {completedTasks.length === 0 ? (
//               <Card>
//                 <CardContent className="flex flex-col items-center justify-center py-10">
//                   <p className="text-muted-foreground">
//                     You don't have any completed tasks
//                   </p>
//                 </CardContent>
//               </Card>
//             ) : (
//               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//                 {completedTasks.map((task) => (
//                   <Card key={task.id}>
//                     <CardHeader className="pb-2">
//                       <div className="flex justify-between items-start">
//                         <CardTitle className="text-lg">{task.title}</CardTitle>
//                         <Badge variant="secondary">Completed</Badge>
//                       </div>
//                       <CardDescription className="flex items-center gap-1">
//                         <CheckCircle className="h-3 w-3" />
//                         <span>Completed: {task.completedDate}</span>
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
//                         {task.description}
//                       </p>
//                       <div className="flex flex-col gap-2 text-sm">
//                         <div className="flex items-center gap-2">
//                           <IndianRupee className="h-4 w-4 text-muted-foreground" />
//                           <span>{task.budget}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <MapPin className="h-4 w-4 text-muted-foreground" />
//                           <span>{task.location}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
//                           <span>Rating: {task.rating || "Not rated"}/5</span>
//                         </div>
//                       </div>
//                     </CardContent>
//                     <CardFooter>
//                       <Link href={`/tasks/${task.id}`} className="w-full">
//                         <Button variant="outline" className="w-full">
//                           View Details
//                         </Button>
//                       </Link>
//                     </CardFooter>
//                   </Card>
//                 ))}
//               </div>
//             )}
//           </TabsContent>

//           <TabsContent value="my-bids" className="space-y-4 mt-6">
//             <h2 className="text-xl font-semibold">My Bids</h2>
//             {requestedTasks.length === 0 ? (
//               <Card>
//                 <CardContent className="flex flex-col items-center justify-center py-10">
//                   <p className="text-muted-foreground mb-4">
//                     You haven't placed any bids yet
//                   </p>
//                   <Link href="/browse">
//                     <Button>Browse Available Tasks</Button>
//                   </Link>
//                 </CardContent>
//               </Card>
//             ) : (
//               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
//                 {requestedTasks.map((bid) => (
//                   <Card key={bid.bid_id}>
//                     <CardHeader className="pb-2">
//                       <div className="flex justify-between items-start">
//                         <CardTitle className="text-lg">
//                           {bid.task_title}
//                         </CardTitle>
//                         <Badge
//                           variant={
//                             bid.status === "pending"
//                               ? "outline"
//                               : bid.status === "accepted"
//                               ? "default"
//                               : "destructive"
//                           }
//                         >
//                           {bid.status.charAt(0).toUpperCase() +
//                             bid.status.slice(1)}
//                         </Badge>
//                       </div>
//                       <CardDescription className="flex items-center gap-1">
//                         <Clock className="h-3 w-3" />
//                         <span>Bid placed: {bid.created_at}</span>
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
//                         {bid.task_description}
//                       </p>
//                       <div className="flex flex-col gap-2 text-sm">
//                         <div className="flex items-center gap-2">
//                           <IndianRupee className="h-4 w-4 text-muted-foreground" />
//                           <span>Your bid: {bid.bid_amount}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <MapPin className="h-4 w-4 text-muted-foreground" />
//                           <span>{bid.task_location}</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <Avatar className="h-4 w-4">
//                             <AvatarFallback>
//                               {bid.posted_by?.charAt(0) || "?"}
//                             </AvatarFallback>
//                           </Avatar>
//                           <span>{bid.posted_by}</span>
//                         </div>
//                       </div>
//                     </CardContent>
//                     <CardFooter>
//                       <Link href={`/tasks/${bid.task_id}`} className="w-full">
//                         <Button variant="outline" className="w-full">
//                           View Task Details
//                         </Button>
//                       </Link>
//                     </CardFooter>
//                   </Card>
//                 ))}
//               </div>
//             )}
//           </TabsContent>
//         </Tabs>
//         <ConfirmDialog
//           open={requestUndeleteOpen}
//           onOpenChange={setRequestUndeleteOpen}
//           onConfirm={handleConfirmUndelete} // Updated to new confirm handler
//           title="Request Undelete Task"
//           description="This task has been deleted. Would you like to send a request to the admin to undelete it?"
//           confirmText="Send Request"
//           cancelText="Cancel"
//         />
//         <ConfirmDialog
//           open={confirmOpen}
//           onOpenChange={setConfirmOpen}
//           onConfirm={handleConfirmDelete}
//           title="Delete Task"
//           description="Are you sure you want to delete this task? This action cannot be undone."
//           confirmText="Delete"
//           cancelText="Cancel"
//         />
//       </main>
//     </div>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MapPin,
  Star,
  Briefcase,
  CheckCircle,
  Search,
  Filter,
  Trash2,
  IndianRupee,
  X
} from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

import axiosInstance from "@/lib/axiosInstance";
import useStore from "@/lib/Zustand";
import { toast } from "sonner";
import Header from "@/components/Header"; // Import the Header component
import { ConfirmDialog } from "@/components/ConfirmDialog"; // Import the ConfirmDialog component

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  accountType: string;
  isLoggedIn: boolean;
}

interface UserProfile {
  profile_id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
}

interface Task {
  cancel_status: boolean;
  id: string;
  user_ref_id?: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  status: string;
  deletion_status?: boolean;
  postedAt: string;
  offers?: number;
  assignedTo?: string;
  posted_by?: string;
  dueDate?: string;
  completedDate?: string;
  rating?: number;
  category?: string;
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
  bid_id: number;
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
  timestamp: string;
  data: T;
}

export default function DashboardPage() {
  const router = useRouter();
  const { userId, logout } = useStore();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    profile_id: "",
    name: "",
    email: "",
    phone: "",
    avatar: "/images/placeholder.svg?height=128&width=128",
    joinDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [requestedTasks, setRequestedTasks] = useState<BidRequest[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [requestUndeleteOpen, setRequestUndeleteOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Available Tasks Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [location, setLocation] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // Check authentication and fetch user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("Logged-in user ID:", parsedUser.id);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        router.push("/signin");
      }
    } else {
      router.push("/signin");
    }
  }, [router]);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(`/profile?user_id=${userId}`);
        const data = response.data;
        setUserProfile({
          profile_id: data.profile_id || "",
          name: data.name || "",
          email: data.email || "",
          phone: data.phone_number || "",
          avatar:
            data.profile_img || "/images/placeholder.svg?height=128&width=128",
          joinDate: data.tstamp
            ? new Date(data.tstamp).toLocaleDateString()
            : "",
        });
      } catch (err: any) {
        console.error("Failed to fetch profile:", err);
        if (err.response?.status === 401) {
          logout();
          router.push("/signin");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, logout, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get("/get-all-categories/");
        if (response.data?.data) {
          const fetchedCategories = response.data.data.map(
            (category: { category_id: string; category_name: string }) => ({
              id: category.category_id,
              name: category.category_name,
            })
          );
          setCategories(fetchedCategories);
          console.log("Categories fetched:", fetchedCategories);
        } else {
          console.warn("No categories found");
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories. Please try again.");
      }
    };

    fetchCategories();
  }, []);

  // Fetch user's posted tasks
  useEffect(() => {
    if (!user || !userId) return;

    const fetchTasks = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>(
          `/get-user-jobs/${userId}/`
        );
        const result = response.data;

        if (result.status_code === 200 && result.data?.jobs) {
          const tasks: Task[] = result.data.jobs.map((job) => {
            let jobStatus = "open";
            if (job.job_completion_status === 1) {
              jobStatus = "completed";
            } else if (job.status === true) {
              jobStatus = "assigned";
            }

            return {
              id: job.job_id.toString(),
              title: job.job_title || "Untitled",
              description: job.job_description || "No description provided.",
              budget: Number(job.job_budget) || 0,
              location: job.job_location || "Unknown",
              status: jobStatus,
              deletion_status: job.deletion_status,
              cancel_status: job.cancel_status ?? false, // Add cancel_status
              postedAt: job.job_due_date
                ? new Date(job.job_due_date).toLocaleDateString("en-GB")
                : "Unknown",
              offers: job.offers || 0,
              posted_by: job.posted_by || "Unknown",
              category: job.job_category || "general",
            };
          });
          setPostedTasks(tasks);
        } else {
          console.warn("No jobs found or API error:", result.message);
        }
      } catch (err) {
        console.error("Failed to fetch tasks:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user, userId]);

  // Fetch all available tasks
  useEffect(() => {
    if (!user || !userId) return;

    const fetchAllTasks = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>(
          `/get-all-jobs/`
        );
        const result = response.data;
        console.log("Raw API response for /get-all-jobs/:", result);

        if (result.status_code === 200 && result.data?.jobs) {
          const tasks: Task[] = result.data.jobs
            .filter((job) => job.user_ref_id !== userId)
            .map((job) => {
              let jobStatus = "open";
              if (job.job_completion_status === 1) {
                jobStatus = "completed";
              } else if (job.status === true) {
                jobStatus = "assigned";
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
                job_completion_status:
                  job.job_completion_status === 1
                    ? "Completed"
                    : "Not Completed",
                deletion_status: job.deletion_status || "active",
                cancel_status: job.cancel_status ?? false,
              };
            });

          setAvailableTasks(tasks);
          console.log("Available tasks after mapping:", tasks);
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
        const response = await axiosInstance.get<APIResponse<{ bids: any[] }>>(
          `/get-user-bids/${userId}/`
        );
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
            task_description:
              bid.task_description || "No description provided.",
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
        const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>(
          `/get-user-assigned-bids/${userId}/`
        );
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
        const response = await axiosInstance.get<
          APIResponse<{ bids: BidRequest[] }>
        >(`/get-user-requested-bids/${userId}/`);
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
            task_description:
              bid.task_description || "No description provided.",
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
        const response = await axiosInstance.get<APIResponse<{ jobs: any[] }>>(
          `/fetch-completed-tasks/${userId}/`
        );
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
          }));
          setCompletedTasks(tasks);
        } else {
          console.warn(
            "No completed tasks found or API error:",
            result.message
          );
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
      const response = await axiosInstance.put<APIResponse<any>>(
        `/mark-complete/${jobId}/`
      );

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
        // Update the deletion_status of the task in postedTasks
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
      setSelectedJobId(null); // Clear selectedJobId
    }
  };

const handleConfirmUndelete = async () => {
  if (!selectedJobId) return;

  // Display the toast notification directly
  toast.success("Your request has been sent to admin");

  // Optionally update the task state to reflect the request (if needed)
  setPostedTasks((prev) =>
    prev.map((task) =>
      task.id === selectedJobId
        ? { ...task, deletion_status: true }
        : task
    )
  );

  // Clear selected job and close the dialog
  setSelectedJobId(null);
  setRequestUndeleteOpen(false);
};

  const handleSignOut = () => {
    localStorage.removeItem("user");
    logout();
    router.push("/");
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
            ? { ...task, cancel_status: true } // Update cancel_status
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
    const isNotCanceled = !task.cancel_status; // Exclude canceled tasks  

    console.log(`Task ${task.id} filter check:`, {
      matchesSearch,
      matchesCategory,
      matchesPrice,
      matchesLocation,
      taskBudget: task.budget,
      priceRange,
      taskCategory: task.category,
      selectedCategory: category,
      taskLocation: task.location,
      searchTerm,
    });

    return matchesSearch && matchesCategory && matchesPrice && matchesLocation;
  });

  console.log("Filtered tasks:", filteredTasks);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Searching for:", searchTerm);
  };

  const handleRequestUndeleteClick = (jobId: string) => {
    setSelectedJobId(jobId);
    setRequestUndeleteOpen(true); // Open the dialog
  };
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={userProfile} onSignOut={handleSignOut} />
      <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Manage your tasks and bids</p>
          </div>
          <Link href="/post-task" passHref>
            <Button>+ Post a Task</Button>
          </Link>
        </div>

        <Tabs defaultValue="available" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="available">Available Tasks</TabsTrigger>
            <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="my-bids">My Bids</TabsTrigger>
          </TabsList>

        <TabsContent value="my-tasks" className="space-y-4 mt-6">
  <h2 className="text-xl font-semibold">Tasks You've Posted</h2>
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
      {postedTasks.map((task) => {
        console.log(
          `Task ${task.id} deletion_status: ${task.deletion_status}, cancel_status: ${task.cancel_status}`
        );

        return (
          <Card
            key={task.id}
            className={`relative ${
              task.deletion_status || task.cancel_status
                ? "opacity-50 bg-gray-100 border-gray-300 cursor-not-allowed"
                : ""
            }`}
          >
            {!task.deletion_status && !task.cancel_status && task.status === "open" && (
              <>
                <button
                  onClick={() => handleDeleteClick(task.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  aria-label="Delete task"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleCancelClick(task.id)}
                  className="absolute top-2 right-10 text-yellow-500 hover:text-yellow-700"
                  aria-label="Cancel task"
                >
                  <X className="h-5 w-5" />
                </button>
              </>
            )}
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">
                  {task.title}
                </CardTitle>
                <Badge
                  variant={
                    task.cancel_status
                      ? "destructive"
                      : task.deletion_status
                      ? "destructive"
                      : task.status === "open"
                      ? "outline"
                      : "secondary"
                  }
                >
                  {task.cancel_status
                    ? "Canceled"
                    : task.deletion_status
                    ? "Deleted"
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
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  <span>{task.budget}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{task.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>{task.offers || 0} offers</span>
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
        );
      })}
    </div>
  )}
</TabsContent>

          <TabsContent value="available" className="space-y-4 mt-6">
  <h2 className="text-xl font-semibold">Available Tasks</h2>
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

      {showFilters && (
        <Card className="sm:hidden">
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
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
      )}

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
          {filteredTasks.map((task) => (
            <Card key={task.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <Badge variant="outline">
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{task.postedAt}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {task.description}
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    <span>{task.budget}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{task.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback>
                        {task.posted_by?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{task.posted_by || "Unknown"}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/tasks/${task.id}`} className="w-full">
                  <Button className="w-full">Make an Offer</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  </div>
</TabsContent>

          <TabsContent value="assigned" className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">Tasks Assigned to You</h2>
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
                  <Card key={task.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge>In Progress</Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Due: {task.dueDate}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {task.description}
                      </p>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span>{task.budget}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{task.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-4 w-4">
                            <AvatarFallback>
                              {task.posted_by?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <span>{task.posted_by}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Link href={`/tasks/${task.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      <Button
                        className="flex-1"
                        onClick={() => handleComplete(task.id)}
                      >
                        Mark Complete
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">Completed Tasks</h2>
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
                  <Card key={task.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Completed: {task.completedDate}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {task.description}
                      </p>
                      <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          <span>{task.budget}</span>
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

          <TabsContent value="my-bids" className="space-y-4 mt-6">
            <h2 className="text-xl font-semibold">My Bids</h2>
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
                  <Card key={bid.bid_id}>
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
                        >
                          {bid.status.charAt(0).toUpperCase() +
                            bid.status.slice(1)}
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
          onConfirm={handleConfirmUndelete} // Updated to new confirm handler
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