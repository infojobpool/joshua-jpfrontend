// "use client";

// import { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import Image from "next/image";
// import Link from "next/link";
// import { Input } from "../../../components/ui/input";
// import { Button } from "../../../components/ui/button";
// import { Card, CardContent } from "../../../components/ui/card";
// // import {
// //   Avatar,
// //   AvatarFallback,
// //   AvatarImage,
// // } from "../../../components/ui/avatar";
// import { Badge } from "../../../components/ui/badge";
// import {
//   MapPin,
//   Clock,
//   IndianRupee,
//   Search,
//   ChevronDown,
//   Calendar,
//   ArrowUpDown,
//   Loader2,
//   Star,
// } from "lucide-react";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../../../components/ui/select";
// import { Slider } from "../../../components/ui/slider";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "../../../components/ui/dropdown-menu";
// import { Checkbox } from "../../../components/ui/checkbox";
// import axiosInstance from "../../../lib/axiosInstance";
// import { toast } from "sonner";

// interface Task {
//   id: string;
//   user_ref_id?: string;
//   title: string;
//   description: string;
//   budget: number;
//   location: string;
//   status: boolean;
//   deletion_status?: boolean;
//   postedAt: string;
//   offers?: number;
//   assignedTo?: string;
//   posted_by: string;
//   dueDate?: string;
//   completedDate?: string;
//   rating?: number;
//   category: string;
//   category_name: string;
//   job_images?: { urls: string[] };
// }

// interface Category {
//   category_id: string;
//   category_name: string;
//   status: boolean;
//   created_at: string;
// }

// export function BrowseTasksPage() {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showFilters, setShowFilters] = useState(false);
//   const [priceRange, setPriceRange] = useState([0, 100000]);
//   const [sortBy, setSortBy] = useState("newest");
//   const [isLoading, setIsLoading] = useState(false);
//   const [jobs, setJobs] = useState<Task[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
//   const [selectedLocation, setSelectedLocation] = useState<string>("all");
//   const [selectedDateRange, setSelectedDateRange] = useState<string>("any");

//   const formatDate = (dateString?: string): string => {
//     if (!dateString) return "No due date";
//     try {
//       return new Date(dateString).toLocaleDateString("en-US", {
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//       });
//     } catch {
//       return "Invalid date";
//     }
//   };

//   const fetchJobs = async () => {
//     try {
//       setIsLoading(true);
//       const response = await axiosInstance.get("/get-all-jobs/");
//       if (response.data.status_code === 200) {
//         const mappedJobs = response.data.data.jobs.map((job: any) => ({
//           id: job.job_id,
//           user_ref_id: job.user_ref_id,
//           title: job.job_title,
//           description: job.job_description,
//           budget: job.job_budget,
//           location: job.job_location,
//           status: job.status,
//           deletion_status: job.deletion_status,
//           posted_by: job.posted_by,
//           dueDate: job.job_due_date,
//           category: job.job_category,
//           category_name: job.job_category_name,
//           job_images: job.job_images,
//           postedAt: job.created_at,
//         }));
//         setJobs(mappedJobs);
//       } else {
//         toast.error(response.data.message || "Failed to fetch jobs");
//       }
//     } catch {
//       toast.error("An error occurred while fetching jobs");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchCategories = async () => {
//     try {
//       setIsLoading(true);
//       const response = await axiosInstance.get("get-all-categories/");
//       if (response.data.status_code === 200) {
//         setCategories(response.data.data);
//       } else {
//         toast.error(response.data.message || "Failed to fetch categories");
//       }
//     } catch {
//       toast.error("An error occurred while fetching categories");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchJobs();
//     fetchCategories();
//   }, []);

//   const handleCategoryChange = (categoryId: string) => {
//     setSelectedCategories((prev) =>
//       prev.includes(categoryId)
//         ? prev.filter((id) => id !== categoryId)
//         : [...prev, categoryId]
//     );
//   };

//   const isDateInRange = (
//     dueDate: string | undefined,
//     range: string
//   ): boolean => {
//     if (!dueDate || range === "any") return true;

//     const jobDate = new Date(dueDate);
//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Normalize to start of day

//     const isSameDay = (d1: Date, d2: Date) =>
//       d1.getFullYear() === d2.getFullYear() &&
//       d1.getMonth() === d2.getMonth() &&
//       d1.getDate() === d2.getDate();

//     switch (range) {
//       case "today":
//         return isSameDay(jobDate, today);
//       case "tomorrow":
//         const tomorrow = new Date(today);
//         tomorrow.setDate(today.getDate() + 1);
//         return isSameDay(jobDate, tomorrow);
//       case "this-week": {
//         const weekEnd = new Date(today);
//         weekEnd.setDate(today.getDate() + 6);
//         return jobDate >= today && jobDate <= weekEnd;
//       }
//       case "this-weekend": {
//         const nextSaturday = new Date(today);
//         nextSaturday.setDate(today.getDate() + (6 - today.getDay()));
//         const nextSunday = new Date(nextSaturday);
//         nextSunday.setDate(nextSaturday.getDate() + 1);
//         return jobDate >= nextSaturday && jobDate <= nextSunday;
//       }
//       case "next-week": {
//         const nextWeekStart = new Date(today);
//         nextWeekStart.setDate(today.getDate() + 7);
//         const nextWeekEnd = new Date(nextWeekStart);
//         nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
//         return jobDate >= nextWeekStart && jobDate <= nextWeekEnd;
//       }
//       default:
//         return true;
//     }
//   };

//   // const filteredTasks = jobs
//   //   .filter(
//   //     (job) =>
//   //       (job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//   //         job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
//   //         job.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//   //         job.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
//   //       (selectedCategories.length === 0 ||
//   //         selectedCategories.includes(job.category)) &&
//   //       (selectedLocation === "all" ||
//   //         job.location
//   //           .toLowerCase()
//   //           .includes(selectedLocation.toLowerCase())) &&
//   //       isDateInRange(job.dueDate, selectedDateRange)
//   //   )
//   //   .filter(
//   //     (task) => task.budget >= priceRange[0] && task.budget <= priceRange[1]
//   //   );
//   const filteredTasks = jobs
//     .filter(
//       (job) =>
//         (job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
//           job.category_name
//             .toLowerCase()
//             .includes(searchQuery.toLowerCase())) &&
//         (selectedCategories.length === 0 ||
//           selectedCategories.includes(job.category)) &&
//         isDateInRange(job.dueDate, selectedDateRange)
//     )
//     .filter(
//       (task) => task.budget >= priceRange[0] && task.budget <= priceRange[1]
//     );

//   const sortedTasks = [...filteredTasks].sort((a, b) => {
//     if (sortBy === "newest") {
//       return a.id < b.id ? 1 : -1;
//     } else if (sortBy === "oldest") {
//       return a.id > b.id ? 1 : -1;
//     } else if (sortBy === "price-high") {
//       return a.budget < b.budget ? 1 : -1;
//     } else if (sortBy === "price-low") {
//       return a.budget > b.budget ? 1 : -1;
//     }
//     return 0;
//   });

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1,
//         delayChildren: 0.3,
//       },
//     },
//   };

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//       transition: { type: "spring", stiffness: 100, damping: 10 },
//     },
//   };

//   return (
//     <>
//       {isLoading ? (
//         <div className="flex justify-center items-center py-12">
//           <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
//           <span className="ml-2 text-gray-500">Loading tasks...</span>
//         </div>
//       ) : (
//         <>
//           <section className="bg-slate-50 py-12 md:py-20">
//             <div className="container px-4 md:px-6">
//               <motion.div
//                 className="max-w-3xl mx-auto text-center"
//                 initial={{ opacity: 0, y: -20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5 }}
//               >
//                 <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
//                   Browse Tasks
//                 </h1>
//                 <p className="mt-4 text-xl text-gray-500">
//                   Find tasks near you and start earning
//                 </p>
//                 <div className="mt-8 flex items-center max-w-md mx-auto">
//                   <Input
//                     type="text"
//                     placeholder="Search tasks..."
//                     className="flex-1"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                   />
//                   <Button className="ml-2 bg-blue-600 hover:bg-blue-700">
//                     <Search className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </motion.div>
//             </div>
//           </section>

//           <section className="py-16">
//             <div className="container px-4 md:px-6">
//               <div className="flex flex-col md:flex-row gap-8">
//                 {/* Filters sidebar */}
//                 <div className="w-full md:w-1/4">
//                   <div className="sticky top-20">
//                     <div className="bg-white rounded-xl shadow-md p-6 mb-6">
//                       <div className="flex justify-between items-center mb-6">
//                         <h2 className="text-xl font-bold">Filters</h2>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => setShowFilters(!showFilters)}
//                           className="md:hidden"
//                         >
//                           {showFilters ? "Hide" : "Show"}
//                           <ChevronDown
//                             className={`ml-1 h-4 w-4 transition-transform ${
//                               showFilters ? "rotate-180" : ""
//                             }`}
//                           />
//                         </Button>
//                       </div>

//                       <div
//                         className={`space-y-6 ${
//                           showFilters ? "block" : "hidden md:block"
//                         }`}
//                       >
//                         <div>
//                           <h3 className="font-medium mb-3">Categories</h3>
//                           <div className="space-y-2">
//                             {categories.map((category) => (
//                               <div
//                                 key={category.category_id}
//                                 className="flex items-center"
//                               >
//                                 <Checkbox
//                                   id={`category-${category.category_id}`}
//                                   checked={selectedCategories.includes(
//                                     category.category_id
//                                   )}
//                                   onCheckedChange={() =>
//                                     handleCategoryChange(category.category_id)
//                                   }
//                                 />
//                                 <label
//                                   htmlFor={`category-${category.category_id}`}
//                                   className="ml-2 text-sm"
//                                 >
//                                   {category.category_name}
//                                 </label>
//                               </div>
//                             ))}
//                           </div>
//                         </div>

//                         <div>
//                           <h3 className="font-medium mb-3">Price Range</h3>
//                           <div className="px-2">
//                             <Slider
//                               defaultValue={[0, 1000]}
//                               max={1000}
//                               step={10}
//                               value={priceRange}
//                               onValueChange={setPriceRange}
//                               className="mb-6"
//                             />
//                             <div className="flex justify-between text-sm text-gray-500">
//                               <span>INR {priceRange[0]}</span>
//                               <span>INR {priceRange[1]}</span>
//                             </div>
//                           </div>
//                         </div>

//                         {/* <div>
//                           <h3 className="font-medium mb-3">Location</h3>
//                           <Select
//                             value={selectedLocation}
//                             onValueChange={setSelectedLocation}
//                           >
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select location" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectItem value="all">All locations</SelectItem>
//                               <SelectItem value="manhattan">
//                                 Manhattan
//                               </SelectItem>
//                               <SelectItem value="brooklyn">Brooklyn</SelectItem>
//                               <SelectItem value="queens">Queens</SelectItem>
//                               <SelectItem value="bronx">Bronx</SelectItem>
//                               <SelectItem value="staten-island">
//                                 Staten Island
//                               </SelectItem>
//                               <SelectItem value="remote">Remote</SelectItem>
//                             </SelectContent>
//                           </Select>
//                         </div> */}

//                         <div>
//                           <h3 className="font-medium mb-3">Date</h3>
//                           <Select
//                             value={selectedDateRange}
//                             onValueChange={setSelectedDateRange}
//                           >
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select date range" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectItem value="any">Any time</SelectItem>
//                               <SelectItem value="today">Today</SelectItem>
//                               <SelectItem value="tomorrow">Tomorrow</SelectItem>
//                               <SelectItem value="this-week">
//                                 This week
//                               </SelectItem>
//                               <SelectItem value="this-weekend">
//                                 This weekend
//                               </SelectItem>
//                               <SelectItem value="next-week">
//                                 Next week
//                               </SelectItem>
//                             </SelectContent>
//                           </Select>
//                         </div>

//                         <Button
//                           className="w-full bg-blue-600 hover:bg-blue-700"
//                           onClick={() => {
//                             setSearchQuery("");
//                             setPriceRange([0, 1000]);
//                             setSelectedCategories([]);
//                             setSelectedLocation("all");
//                             setSelectedDateRange("any");
//                           }}
//                         >
//                           Clear Filters
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Tasks list */}
//                 <div className="w-full md:w-3/4">
//                   <div className="flex justify-between items-center mb-6">
//                     <div className="text-gray-500">
//                       Showing {sortedTasks.length} tasks
//                     </div>
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild>
//                         <Button
//                           variant="outline"
//                           className="flex items-center gap-2"
//                         >
//                           <ArrowUpDown className="h-4 w-4" />
//                           Sort by
//                         </Button>
//                       </DropdownMenuTrigger>
//                       <DropdownMenuContent align="end">
//                         <DropdownMenuItem onClick={() => setSortBy("newest")}>
//                           Newest first
//                         </DropdownMenuItem>
//                         <DropdownMenuItem onClick={() => setSortBy("oldest")}>
//                           Oldest first
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           onClick={() => setSortBy("price-high")}
//                         >
//                           Price: High to low
//                         </DropdownMenuItem>
//                         <DropdownMenuItem
//                           onClick={() => setSortBy("price-low")}
//                         >
//                           Price: Low to high
//                         </DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </div>

//                   <motion.div
//                     className="grid gap-6"
//                     variants={containerVariants}
//                     initial="hidden"
//                     animate="visible"
//                   >
//                     {sortedTasks.map((job) => (
//                       <motion.div
//                         key={job.id}
//                         variants={itemVariants}
//                         whileHover={{
//                           y: -5,
//                           boxShadow:
//                             "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                         }}
//                       >
//                         <Card className="overflow-hidden">
//                           <CardContent className="p-0">
//                             <div className="grid md:grid-cols-3 gap-6">
//                               <div className="md:col-span-2 p-6">
//                                 <div className="flex justify-between items-start mb-3">
//                                   <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
//                                     {job.category_name}
//                                   </Badge>
//                                   <Badge
//                                     variant="outline"
//                                     className="text-gray-500"
//                                   >
//                                     {job.status === false
//                                       ? "Available"
//                                       : "Unavailable"}
//                                   </Badge>
//                                 </div>
//                                 <Link href={`/tasks/${job.id}`}>
//                                   <h3 className="text-xl font-bold mb-2 hover:text-blue-600 transition-colors">
//                                     {job.title}
//                                   </h3>
//                                 </Link>
//                                 <p className="text-gray-500 mb-4">
//                                   {job.description}
//                                 </p>
//                                 <div className="grid grid-cols-2 gap-4 text-sm">
//                                   <div className="flex items-center text-gray-500">
//                                     <MapPin className="h-4 w-4 mr-2 text-gray-400" />
//                                     {job.location}
//                                   </div>
//                                   <div className="flex items-center text-gray-500">
//                                     <Clock className="h-4 w-4 mr-2 text-gray-400" />
//                                     {formatDate(job.dueDate)}
//                                   </div>
//                                   <div className="flex items-center text-gray-500">
//                                     <Calendar className="h-4 w-4 mr-2 text-gray-400" />
//                                     Posted {formatDate(job.postedAt)}
//                                   </div>
//                                   <div className="flex items-center font-medium">
//                                     <IndianRupee className="h-4 w-4 mr-2 text-gray-400" />
//                                     {job.budget}
//                                   </div>
//                                 </div>
//                               </div>
//                               <div className="bg-slate-50 p-6 flex flex-col justify-between">
//                                 {/* Poster Info */}
//                                 <div>
//                                   <div className="font-medium">
//                                     {job.posted_by}
//                                   </div>
//                                   <div className="flex items-center text-sm text-gray-500">
//                                     <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
//                                     {job.rating || "No rating"} •{" "}
//                                     {job.description} tasks
//                                   </div>
//                                 </div>

//                                 {/* Images */}
//                                 <div className="mt-4">
//                                   {job.job_images &&
//                                   job.job_images.urls &&
//                                   job.job_images.urls.length > 0 ? (
//                                     <div className="flex flex-wrap gap-2">
//                                       {job.job_images.urls.map((url, index) => (
//                                         <img
//                                           key={index}
//                                           src={url || "/images/placeholder.svg"}
//                                           alt={`${job.title} image ${
//                                             index + 1
//                                           }`}
//                                           className="w-20 h-20 object-cover rounded-md"
//                                         />
//                                       ))}
//                                     </div>
//                                   ) : (
//                                     <img
//                                       src="/images/placeholder.svg"
//                                       alt="Placeholder"
//                                       className="w-20 h-20 object-cover rounded-md"
//                                     />
//                                   )}
//                                 </div>

//                                 {/* Button */}
//                                 <div className="mt-auto">
//                                   <Link href={`/tasks/${job.id}`}>
//                                     <Button className="w-full bg-blue-600 hover:bg-blue-700">
//                                       View Details
//                                     </Button>
//                                   </Link>
//                                 </div>
//                               </div>
//                             </div>
//                           </CardContent>
//                         </Card>
//                       </motion.div>
//                     ))}
//                   </motion.div>

//                   {sortedTasks.length === 0 && (
//                     <div className="text-center py-12">
//                       <h3 className="text-xl font-bold mb-2">No tasks found</h3>
//                       <p className="text-gray-500 mb-6">
//                         Try adjusting your filters or search query
//                       </p>
//                       <Button
//                         onClick={() => {
//                           setSearchQuery("");
//                           setPriceRange([0, 1000]);
//                           setSelectedCategories([]);
//                           setSelectedLocation("all");
//                           setSelectedDateRange("any");
//                         }}
//                       >
//                         Clear filters
//                       </Button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </section>

//           <section className="py-16 bg-slate-50">
//             <div className="container px-4 md:px-6">
//               <div className="grid md:grid-cols-2 gap-12 items-center">
//                 <motion.div
//                   initial={{ opacity: 0, x: -50 }}
//                   whileInView={{ opacity: 1, x: 0 }}
//                   transition={{ duration: 0.5 }}
//                   viewport={{ once: true }}
//                 >
//                   <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
//                     Can't find what you're looking for?
//                   </h2>
//                   <p className="text-xl text-gray-500 mb-8">
//                     Post your own task and let Taskers come to you with their
//                     offers.
//                   </p>
//                   <Link href="/post-task">
//                     <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
//                       Post a Task
//                     </Button>
//                   </Link>
//                 </motion.div>
//                 <motion.div
//                   initial={{ opacity: 0, x: 50 }}
//                   whileInView={{ opacity: 1, x: 0 }}
//                   transition={{ duration: 0.5 }}
//                   viewport={{ once: true }}
//                   className="relative h-[400px]"
//                 >
//                   <Image
//                     src="images/placeholder.svg?height=400&width=600"
//                     fill
//                     alt="Post a task"
//                     className="object-cover rounded-xl"
//                   />
//                 </motion.div>
//               </div>
//             </div>
//           </section>
//         </>
//       )}
//     </>
//   );
// }

"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  MapPin,
  Clock,
  IndianRupee,
  Search,
  ChevronDown,
  Calendar,
  ArrowUpDown,
  Loader2,
  Star,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../../../components/ui/sheet";
import { cn } from "../../../lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Slider } from "../../../components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Checkbox } from "../../../components/ui/checkbox";
import axiosInstance from "../../../lib/axiosInstance";
import { toast } from "sonner";

interface Task {
  id: string;
  user_ref_id?: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  status: boolean;
  deletion_status?: boolean;
  job_completion_status?: number | string;
  bid_accepted?: boolean | string;
  assigned_tasker_id?: string | number | null;
  postedAt: string;
  offers?: number;
  assignedTo?: string;
  posted_by: string;
  dueDate?: string;
  completedDate?: string;
  rating?: number;
  category: string;
  category_name: string;
  job_images?: { urls: string[] };
}

interface Category {
  category_id: string;
  category_name: string;
  status: boolean;
  created_at: string;
}

export function BrowseTasksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [sortBy, setSortBy] = useState("newest");
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("any");
  const [locations, setLocations] = useState<string[]>([]);

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);

  const [draftPriceRange, setDraftPriceRange] = useState<[number, number]>([0, 50000]);
  const [draftSelectedCategories, setDraftSelectedCategories] = useState<string[]>([]);
  const [draftSelectedLocation, setDraftSelectedLocation] = useState("all");
  const [draftSelectedDateRange, setDraftSelectedDateRange] = useState("any");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 260);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "No due date";
    try {
      // Use a consistent format to avoid hydration issues
      const date = new Date(dateString);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    } catch {
      return "Invalid date";
    }
  };

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/get-all-jobs/");

      if (response?.data?.status_code === 200) {
        const jobsData = response?.data?.data?.jobs;

        if (Array.isArray(jobsData)) {
          const mappedJobs = jobsData.map((job: any) => ({
            id: job.job_id,
            user_ref_id: job.user_ref_id,
            title: job.job_title ?? "",
            description: job.job_description ?? "",
            budget: typeof job.job_budget === "number" ? job.job_budget : 0,
            location: job.job_location ?? "",
            status: Boolean(job.status),
            deletion_status: job.deletion_status,
            job_completion_status: job.job_completion_status,
            bid_accepted: job.bid_accepted,
            assigned_tasker_id: job.assigned_tasker_id ?? null,
            posted_by: job.posted_by ?? "",
            dueDate: job.job_due_date,
            category: job.job_category ?? "",
            category_name: job.job_category_name ?? "",
            job_images: job.job_images,
            postedAt: job.created_at ?? "",
          }));

          // Show only available (open) tasks: not deleted, not completed, not assigned
          const availableOnly = mappedJobs.filter((job: Task) => {
            const deleted = job.deletion_status === true || job.deletion_status === 1;
            const completed = job.job_completion_status === 1 || job.job_completion_status === "1";
            const assigned = job.bid_accepted === true || job.bid_accepted === "true" || !!job.assigned_tasker_id;
            return !deleted && !completed && !assigned;
          });

          setJobs(availableOnly);

          // Extract unique locations from available jobs (ignore falsy values)
          const uniqueLocations = [
            ...new Set(
              availableOnly
                .map((job: Task) => job.location)
                .filter((loc) => !!loc)
            ),
          ];
          setLocations(["all", ...uniqueLocations]);
        } else {
          console.warn("Unexpected jobs payload shape:", response.data.data);
          setJobs([]);
          setLocations(["all"]);
        }
      } else {
        toast.error(
          response?.data?.message || "Failed to fetch jobs"
        );
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      toast.error("An error occurred while fetching jobs");
      setJobs([]);
      setLocations(["all"]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("get-all-categories/");

      if (response?.data?.status_code === 200) {
        const categoriesData = response?.data?.data;

        if (Array.isArray(categoriesData)) {
          setCategories(categoriesData);
        } else {
          console.warn(
            "Unexpected categories payload shape:",
            response.data.data
          );
          setCategories([]);
        }
      } else {
        toast.error(
          response?.data?.message || "Failed to fetch categories"
        );
        setCategories([]);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("An error occurred while fetching categories");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCategories();
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const isDateInRange = (
    dueDate: string | undefined,
    range: string
  ): boolean => {
    if (!dueDate || range === "any") return true;

    const jobDate = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const isSameDay = (d1: Date, d2: Date) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    switch (range) {
      case "today":
        return isSameDay(jobDate, today);
      case "tomorrow":
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        return isSameDay(jobDate, tomorrow);
      case "this-week": {
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 6);
        return jobDate >= today && jobDate <= weekEnd;
      }
      case "this-weekend": {
        const nextSaturday = new Date(today);
        nextSaturday.setDate(today.getDate() + (6 - today.getDay()));
        const nextSunday = new Date(nextSaturday);
        nextSunday.setDate(nextSaturday.getDate() + 1);
        return jobDate >= nextSaturday && jobDate <= nextSunday;
      }
      case "next-week": {
        const nextWeekStart = new Date(today);
        nextWeekStart.setDate(today.getDate() + 7);
        const nextWeekEnd = new Date(nextWeekStart);
        nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
        return jobDate >= nextWeekStart && jobDate <= nextWeekEnd;
      }
      default:
        return true;
    }
  };

  const filteredTasks = jobs
    .filter((job) => {
      const title = (job.title ?? "").toLowerCase();
      const description = (job.description ?? "").toLowerCase();
      const categoryName = (job.category_name ?? "").toLowerCase();
      const location = (job.location ?? "").toLowerCase();
      const query = debouncedSearchQuery.trim().toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        description.includes(query) ||
        categoryName.includes(query) ||
        location.includes(query);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(job.category ?? "");

      const matchesLocation =
        selectedLocation === "all" ||
        location === selectedLocation.toLowerCase();

      const matchesDate = isDateInRange(job.dueDate, selectedDateRange);

      return matchesSearch && matchesCategory && matchesLocation && matchesDate;
    })
    .filter((task) => {
      const budget = typeof task.budget === "number" ? task.budget : 0;
      return budget >= priceRange[0] && budget <= priceRange[1];
    });

  const toSortTime = (t: Task) => {
    const raw = t.postedAt || "";
    if (!raw) return 0;
    const d = new Date(raw);
    return isNaN(d.getTime()) ? 0 : d.getTime();
  };
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "newest") {
      return toSortTime(b) - toSortTime(a);
    } else if (sortBy === "oldest") {
      return toSortTime(a) - toSortTime(b);
    } else if (sortBy === "price-high") {
      return (b.budget ?? 0) - (a.budget ?? 0);
    } else if (sortBy === "price-low") {
      return (a.budget ?? 0) - (b.budget ?? 0);
    }
    return 0;
  });

  const filtersActive = useMemo(() => {
    return (
      selectedCategories.length > 0 ||
      selectedLocation !== "all" ||
      selectedDateRange !== "any" ||
      priceRange[0] !== 0 ||
      priceRange[1] !== 50000
    );
  }, [selectedCategories, selectedLocation, selectedDateRange, priceRange]);

  const sortLabel = useMemo(() => {
    if (sortBy === "oldest") return "Oldest first";
    if (sortBy === "price-high") return "Price: High to low";
    if (sortBy === "price-low") return "Price: Low to high";
    return "Newest first";
  }, [sortBy]);

  const openFilterSheet = () => {
    setDraftPriceRange([priceRange[0], priceRange[1]]);
    setDraftSelectedCategories([...selectedCategories]);
    setDraftSelectedLocation(selectedLocation);
    setDraftSelectedDateRange(selectedDateRange);
    setFilterSheetOpen(true);
  };

  /** Clears filters to defaults and applies immediately (no second tap on Apply). */
  const resetAndApplyFilters = () => {
    const defaults: [number, number] = [0, 50000];
    setDraftPriceRange(defaults);
    setDraftSelectedCategories([]);
    setDraftSelectedLocation("all");
    setDraftSelectedDateRange("any");
    setPriceRange([defaults[0], defaults[1]]);
    setSelectedCategories([]);
    setSelectedLocation("all");
    setSelectedDateRange("any");
    setFilterSheetOpen(false);
  };

  const applyDraftFilters = () => {
    setPriceRange([draftPriceRange[0], draftPriceRange[1]]);
    setSelectedCategories([...draftSelectedCategories]);
    setSelectedLocation(draftSelectedLocation);
    setSelectedDateRange(draftSelectedDateRange);
    setFilterSheetOpen(false);
  };

  const handleDraftCategoryChange = (categoryId: string) => {
    setDraftSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 10 },
    },
  };

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-500">Loading tasks...</span>
        </div>
      ) : (
        <>
          <section className="hidden bg-slate-50 py-12 md:block md:py-20">
            <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
              <motion.div
                className="max-w-3xl mx-auto text-center"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                  Browse Tasks
                </h1>
                <p className="mt-4 text-xl text-gray-500">
                  Find tasks near you and start earning
                </p>
                <div className="mt-8 flex max-w-md mx-auto items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
                    <Input
                      type="text"
                      placeholder="Search tasks..."
                      className="h-11 rounded-xl border-slate-200 bg-white pl-10 pr-3 shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="button" size="icon" className="h-11 w-11 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700" aria-label="Search">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Mobile: compact browse chrome */}
          <section className="border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50/90 px-4 pb-3 pt-3 md:hidden">
              <h1 className="text-lg font-semibold tracking-tight text-slate-900">Browse tasks</h1>
              <p className="mt-0.5 text-xs text-slate-500">Find open tasks and send your offer</p>
              <div className="relative mt-3">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-[1.125rem] w-[1.125rem] -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  type="search"
                  enterKeyHint="search"
                  autoComplete="off"
                  placeholder="Search by title, area, category…"
                  className="h-12 rounded-2xl border-slate-200/90 bg-slate-50/90 pl-11 pr-4 text-[0.9375rem] shadow-inner shadow-slate-200/40 ring-1 ring-slate-200/60 transition-[box-shadow,background-color] placeholder:text-slate-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/25"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={openFilterSheet}
                  className="relative flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white py-2.5 pr-6 text-sm font-semibold text-slate-800 shadow-sm active:scale-[0.99]"
                >
                  <SlidersHorizontal className="h-4 w-4 text-slate-500" aria-hidden />
                  Filter
                  {filtersActive ? (
                    <span className="absolute right-2.5 top-2 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white" aria-hidden />
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => setSortSheetOpen(true)}
                  className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0 rounded-xl border border-slate-200/90 bg-white px-2 py-2 text-sm font-semibold text-slate-800 shadow-sm active:scale-[0.99]"
                >
                  <span className="flex items-center gap-1">
                    Sort
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                  </span>
                  <span className="max-w-full truncate text-[11px] font-medium leading-tight text-slate-500">{sortLabel}</span>
                </button>
              </div>
            </section>

          <section className="py-6 md:py-16">
            <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
              <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                {/* Filters sidebar (desktop) */}
                <div className="hidden w-full md:block md:w-1/4">
                  <div className="sticky top-20">
                    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Filters</h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowFilters(!showFilters)}
                          className="md:hidden"
                        >
                          {showFilters ? "Hide" : "Show"}
                          <ChevronDown
                            className={`ml-1 h-4 w-4 transition-transform ${
                              showFilters ? "rotate-180" : ""
                            }`}
                          />
                        </Button>
                      </div>

                      <div
                        className={`space-y-6 ${
                          showFilters ? "block" : "hidden md:block"
                        }`}
                      >
                        <div>
                          <h3 className="font-medium mb-3">Categories</h3>
                          <div className="space-y-2">
                            {categories.map((category) => (
                              <div
                                key={category.category_id}
                                className="flex items-center"
                              >
                                <Checkbox
                                  id={`category-${category.category_id}`}
                                  checked={selectedCategories.includes(
                                    category.category_id
                                  )}
                                  onCheckedChange={() =>
                                    handleCategoryChange(category.category_id)
                                  }
                                />
                                <label
                                  htmlFor={`category-${category.category_id}`}
                                  className="ml-2 text-sm"
                                >
                                  {category.category_name}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-3">Price Range</h3>
                          <div className="px-2">
                            <Slider
                              defaultValue={[0, 50000]}
                              max={50000}
                              step={100}
                              value={priceRange}
                              onValueChange={setPriceRange}
                              className="mb-6"
                            />
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>INR {priceRange[0]}</span>
                              <span>INR {priceRange[1]}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="font-medium mb-3">Location</h3>
                          <Select
                            value={selectedLocation}
                            onValueChange={setSelectedLocation}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              {locations.map((location) => (
                                <SelectItem key={location} value={location}>
                                  {location === "all"
                                    ? "All locations"
                                    : location}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <h3 className="font-medium mb-3">Date</h3>
                          <Select
                            value={selectedDateRange}
                            onValueChange={setSelectedDateRange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select date range" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="any">Any time</SelectItem>
                              <SelectItem value="today">Today</SelectItem>
                              <SelectItem value="tomorrow">Tomorrow</SelectItem>
                              <SelectItem value="this-week">
                                This week
                              </SelectItem>
                              <SelectItem value="this-weekend">
                                This weekend
                              </SelectItem>
                              <SelectItem value="next-week">
                                Next week
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            setSearchQuery("");
                            setPriceRange([0, 50000]);
                            setSelectedCategories([]);
                            setSelectedLocation("all");
                            setSelectedDateRange("any");
                          }}
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks list */}
                <div className="w-full md:w-3/4">
                  <div className="mb-4 hidden items-center justify-between md:mb-6 md:flex">
                    <div className="text-gray-500">
                      Showing {sortedTasks.length} tasks
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <ArrowUpDown className="h-4 w-4" />
                          Sort by
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortBy("newest")}>
                          Newest first
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                          Oldest first
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("price-high")}
                        >
                          Price: High to low
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setSortBy("price-low")}
                        >
                          Price: Low to high
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="mb-3 text-sm text-slate-500 md:hidden">
                    Showing <span className="font-semibold text-slate-700">{sortedTasks.length}</span> tasks
                  </p>

                  <motion.div
                    className="grid gap-4 md:gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {sortedTasks.map((job) => (
                      <motion.div
                        key={job.id}
                        variants={itemVariants}
                        whileHover={{
                          y: -5,
                          boxShadow:
                            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                        }}
                      >
                        <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-md shadow-slate-200/40 ring-1 ring-slate-100">
                          <CardContent className="p-0">
                            <div className="flex flex-col md:grid md:grid-cols-3 md:gap-6">
                              <div className="p-4 md:col-span-2 md:p-6">
                                <div className="mb-3 flex items-start justify-between gap-2">
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                    {job.category_name}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="shrink-0 text-gray-500"
                                  >
                                    {job.status === false
                                      ? "Available"
                                      : "Unavailable"}
                                  </Badge>
                                </div>
                                <Link href={`/tasks/${job.id}`}>
                                  <h3 className="mb-2 text-lg font-bold text-slate-900 transition-colors hover:text-blue-600 md:text-xl">
                                    {job.title}
                                  </h3>
                                </Link>
                                <p className="mb-4 line-clamp-2 text-sm text-gray-500 md:line-clamp-none md:text-base">
                                  {job.description}
                                </p>
                                <div className="grid grid-cols-2 gap-3 text-sm md:gap-4">
                                  <div className="flex min-w-0 items-center text-gray-500">
                                    <MapPin className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                                    <span className="truncate">{job.location}</span>
                                  </div>
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                                    {formatDate(job.dueDate)}
                                  </div>
                                  <div className="flex items-center text-gray-500">
                                    <Calendar className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                                    Posted {formatDate(job.postedAt)}
                                  </div>
                                  <div className="flex items-center font-semibold text-slate-800">
                                    <IndianRupee className="mr-2 h-4 w-4 shrink-0 text-gray-400" />
                                    {job.budget}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-col justify-between gap-4 border-t border-slate-100 bg-slate-50/90 p-4 md:border-t-0 md:bg-slate-50 md:p-6">
                                {/* Poster Info */}
                                <div>
                                  <div className="font-medium">
                                    {job.posted_by}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                    {job.rating || "No rating"}
                                  </div>
                                </div>

                                {/* Images */}
                                <div className="mt-4">
                                  {job.job_images &&
                                  job.job_images.urls &&
                                  job.job_images.urls.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {job.job_images.urls.map((url, index) => (
                                        <img
                                          key={index}
                                          src={url || "/images/placeholder.svg"}
                                          alt={`${job.title} image ${
                                            index + 1
                                          }`}
                                          className="w-20 h-20 object-cover rounded-md"
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <img
                                      src="/images/placeholder.svg"
                                      alt="Placeholder"
                                      className="w-20 h-20 object-cover rounded-md"
                                    />
                                  )}
                                </div>

                                {/* Button */}
                                <div className="mt-auto">
                                  <Link href={`/tasks/${job.id}`}>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                                      View Details
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </motion.div>

                  {sortedTasks.length === 0 && (
                    <div className="text-center py-12">
                      <h3 className="text-xl font-bold mb-2">No tasks found</h3>
                      <p className="text-gray-500 mb-6">
                        Try adjusting your filters or search query
                      </p>
                      <Button
                        onClick={() => {
                          setSearchQuery("");
                          setPriceRange([0, 50000]);
                          setSelectedCategories([]);
                          setSelectedLocation("all");
                          setSelectedDateRange("any");
                        }}
                      >
                        Clear filters
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Mobile: filter sheet */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetContent
              side="bottom"
              className={cn(
                "max-h-[90vh] overflow-y-auto rounded-t-2xl border-slate-200 p-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 dark:border-slate-700",
                "[&>button.absolute]:right-3 [&>button.absolute]:top-3"
              )}
            >
              <SheetHeader className="space-y-1 border-b border-slate-100 px-4 pb-3 text-left dark:border-slate-800">
                <SheetTitle className="text-lg text-slate-900">Filter</SheetTitle>
                <SheetDescription className="text-slate-500">
                  Narrow tasks by category, budget, location, and date.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 py-4">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">Categories</h3>
                  <div className="max-h-48 space-y-2.5 overflow-y-auto pr-1">
                    {categories.map((category) => (
                      <div key={category.category_id} className="flex items-center gap-2">
                        <Checkbox
                          id={`sheet-cat-${category.category_id}`}
                          checked={draftSelectedCategories.includes(category.category_id)}
                          onCheckedChange={() => handleDraftCategoryChange(category.category_id)}
                        />
                        <label htmlFor={`sheet-cat-${category.category_id}`} className="text-sm text-slate-700">
                          {category.category_name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">Budget (INR)</h3>
                  <div className="px-1">
                    <Slider
                      max={50000}
                      step={100}
                      value={draftPriceRange}
                      onValueChange={(v) => setDraftPriceRange(v as [number, number])}
                      className="mb-4"
                    />
                    <div className="flex justify-between text-xs font-medium text-slate-500">
                      <span>₹{draftPriceRange[0].toLocaleString("en-IN")}</span>
                      <span>₹{draftPriceRange[1].toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">Location</h3>
                  <Select value={draftSelectedLocation} onValueChange={setDraftSelectedLocation}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/80">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location} value={location}>
                          {location === "all" ? "All locations" : location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-slate-800">Due date</h3>
                  <Select value={draftSelectedDateRange} onValueChange={setDraftSelectedDateRange}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/80">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="this-week">This week</SelectItem>
                      <SelectItem value="this-weekend">This weekend</SelectItem>
                      <SelectItem value="next-week">Next week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter className="flex-row gap-2 border-t border-slate-100 px-4 pb-2 pt-3 dark:border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-xl border-slate-200 font-semibold"
                  onClick={resetAndApplyFilters}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  className="h-11 flex-1 rounded-xl bg-blue-600 font-semibold hover:bg-blue-700"
                  onClick={applyDraftFilters}
                >
                  Apply
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Sheet open={sortSheetOpen} onOpenChange={setSortSheetOpen}>
            <SheetContent
              side="bottom"
              className={cn(
                "rounded-t-2xl border-slate-200 p-0 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 dark:border-slate-700",
                "[&>button.absolute]:right-3 [&>button.absolute]:top-3"
              )}
            >
              <SheetHeader className="px-4 pb-2 text-left">
                <SheetTitle className="text-lg">Sort by</SheetTitle>
                <SheetDescription>Choose how tasks are ordered.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col px-2 pb-4">
                {(
                  [
                    { id: "newest" as const, label: "Newest first" },
                    { id: "oldest" as const, label: "Oldest first" },
                    { id: "price-high" as const, label: "Price: High to low" },
                    { id: "price-low" as const, label: "Price: Low to high" },
                  ] as const
                ).map((opt) => {
                  const active = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      className={cn(
                        "flex min-h-[48px] w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors",
                        active ? "bg-blue-50 text-blue-900 ring-1 ring-blue-200/80" : "text-slate-800 hover:bg-slate-50"
                      )}
                      onClick={() => {
                        setSortBy(opt.id);
                        setSortSheetOpen(false);
                      }}
                    >
                      {opt.label}
                      {active ? <Check className="h-5 w-5 shrink-0 text-blue-600" aria-hidden /> : null}
                    </button>
                  );
                })}
              </div>
              <SheetFooter className="px-3 pb-1">
                <Button type="button" variant="outline" className="w-full rounded-xl" onClick={() => setSortSheetOpen(false)}>
                  Close
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <section className="py-16 bg-slate-50">
            <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                    Can't find what you're looking for?
                  </h2>
                  <p className="text-xl text-gray-500 mb-8">
                    Post your own task and let Taskers come to you with their
                    offers.
                  </p>
                  <Link href="/post-task">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
                      Post a Task
                    </Button>
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="relative h-[400px]"
                >
                  <Image
                    src="images/placeholder.svg?height=400&width=600"
                    fill
                    alt="Post a task"
                    className="object-cover rounded-xl"
                  />
                </motion.div>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}