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

import { useEffect, useState } from "react";
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
} from "lucide-react";
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
      if (response.data.status_code === 200) {
        const mappedJobs = response.data.data.jobs.map((job: any) => ({
          id: job.job_id,
          user_ref_id: job.user_ref_id,
          title: job.job_title,
          description: job.job_description,
          budget: job.job_budget,
          location: job.job_location,
          status: job.status,
          deletion_status: job.deletion_status,
          posted_by: job.posted_by,
          dueDate: job.job_due_date,
          category: job.job_category,
          category_name: job.job_category_name,
          job_images: job.job_images,
          postedAt: job.created_at,
        }));
        setJobs(mappedJobs);
        // Extract unique locations from jobs
        const uniqueLocations = [
          ...new Set(mappedJobs.map((job: Task) => job.location)),
        ];
        setLocations(["all", ...uniqueLocations]);
      } else {
        toast.error(response.data.message || "Failed to fetch jobs");
      }
    } catch {
      toast.error("An error occurred while fetching jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("get-all-categories/");
      if (response.data.status_code === 200) {
        setCategories(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to fetch categories");
      }
    } catch {
      toast.error("An error occurred while fetching categories");
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
    .filter(
      (job) =>
        (job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          job.category_name.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (selectedCategories.length === 0 ||
          selectedCategories.includes(job.category)) &&
        (selectedLocation === "all" ||
          job.location.toLowerCase() === selectedLocation.toLowerCase()) &&
        isDateInRange(job.dueDate, selectedDateRange)
    )
    .filter(
      (task) => task.budget >= priceRange[0] && task.budget <= priceRange[1]
    );

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "newest") {
      return a.id < b.id ? 1 : -1;
    } else if (sortBy === "oldest") {
      return a.id > b.id ? 1 : -1;
    } else if (sortBy === "price-high") {
      return a.budget < b.budget ? 1 : -1;
    } else if (sortBy === "price-low") {
      return a.budget > b.budget ? 1 : -1;
    }
    return 0;
  });

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
          <section className="bg-slate-50 py-12 md:py-20">
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
                <div className="mt-8 flex items-center max-w-md mx-auto">
                  <Input
                    type="text"
                    placeholder="Search tasks..."
                    className="flex-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button className="ml-2 bg-blue-600 hover:bg-blue-700">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="py-16">
            <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Filters sidebar */}
                <div className="w-full md:w-1/4">
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
                  <div className="flex justify-between items-center mb-6">
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

                  <motion.div
                    className="grid gap-6"
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
                        <Card className="overflow-hidden">
                          <CardContent className="p-0">
                            <div className="grid md:grid-cols-3 gap-6">
                              <div className="md:col-span-2 p-6">
                                <div className="flex justify-between items-start mb-3">
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                    {job.category_name}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-gray-500"
                                  >
                                    {job.status === false
                                      ? "Available"
                                      : "Unavailable"}
                                  </Badge>
                                </div>
                                <Link href={`/tasks/${job.id}`}>
                                  <h3 className="text-xl font-bold mb-2 hover:text-blue-600 transition-colors">
                                    {job.title}
                                  </h3>
                                </Link>
                                <p className="text-gray-500 mb-4">
                                  {job.description}
                                </p>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center text-gray-500">
                                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                    {job.location}
                                  </div>
                                  <div className="flex items-center text-gray-500">
                                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                    {formatDate(job.dueDate)}
                                  </div>
                                  <div className="flex items-center text-gray-500">
                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                    Posted {formatDate(job.postedAt)}
                                  </div>
                                  <div className="flex items-center font-medium">
                                    <IndianRupee className="h-4 w-4 mr-2 text-gray-400" />
                                    {job.budget}
                                  </div>
                                </div>
                              </div>
                              <div className="bg-slate-50 p-6 flex flex-col justify-between">
                                {/* Poster Info */}
                                <div>
                                  <div className="font-medium">
                                    {job.posted_by}
                                  </div>
                                  <div className="flex items-center text-sm text-gray-500">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                    {job.rating || "No rating"} •{" "}
                                    {job.description} tasks
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