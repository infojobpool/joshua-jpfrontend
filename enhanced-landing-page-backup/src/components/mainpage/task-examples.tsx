// "use client";

// import { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import { Card, CardContent, CardFooter } from "../../components/ui/card";
// import { Badge } from "../../components/ui/badge";
// import { MapPin, Clock, IndianRupee } from "lucide-react";
// import axiosInstance from "../../lib/axiosInstance";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";

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
//   category_name?: string;
//   job_images?: { urls: string[] };
// }

// export function TaskExamples() {
//   const [jobs, setJobs] = useState<Task[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const router = useRouter();

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

//   useEffect(() => {
//     fetchJobs();
//   }, []);

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
//     <section id="browse" className="py-16 bg-white">
//       <div className="container px-4 md:px-6">
//         <motion.div
//           className="text-center mb-12"
//           initial={{ opacity: 0, y: -20 }}
//           whileInView={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           viewport={{ once: true }}
//         >
//           <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
//             Popular tasks near you
//           </h2>
//           <p className="mt-4 text-gray-500 md:text-xl">
//             Browse tasks or post your own
//           </p>
//         </motion.div>

//         {isLoading ? (
//           <div className="flex justify-center items-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//             <span className="ml-3 text-gray-500">Loading tasks...</span>
//           </div>
//         ) : (
//           <motion.div
//             className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
//             variants={containerVariants}
//             initial="hidden"
//             whileInView="visible"
//             viewport={{ once: true }}
//           >
//             {jobs.map((job, index) => (
//               <motion.div
//                 key={index}
//                 variants={itemVariants}
//                 whileHover={{
//                   y: -10,
//                   boxShadow:
//                     "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                 }}
//                 onClick={() => router.push("/signin")}
//               >
//                 <Card className="overflow-hidden h-full flex flex-col">
//                   <CardContent className="p-6 flex-1">
//                     <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
//                       {job.category_name}
//                     </Badge>
//                     <h3 className="text-lg font-bold mb-3">{job.title}</h3>
//                     <div className="space-y-2 text-sm text-gray-500">
//                       <div className="flex items-center">
//                         <MapPin className="h-4 w-4 mr-2 text-gray-400" />
//                         {job.location}
//                       </div>
//                       <div className="flex items-center">
//                         <Clock className="h-4 w-4 mr-2 text-gray-400" />
//                         {formatDate(job.dueDate)}
//                       </div>
//                       <div className="flex items-center">
//                         <IndianRupee className="h-4 w-4 mr-2 text-gray-400" />
//                         {job.budget}
//                       </div>
//                     </div>
//                   </CardContent>
//                   <CardFooter className="p-6 pt-0 border-t flex items-center space-x-4">
//                     {job.job_images?.urls[0] && (
//                       <img
//                         src={job.job_images.urls[0] || "/images/placeholder.svg"}
//                         alt={job.title}
//                         className="w-20 h-20 object-cover rounded-md"
//                       />
//                     )}
//                     <span className="text-sm font-medium">{job.posted_by || "Unknown"}</span>
//                   </CardFooter>
//                 </Card>
//               </motion.div>
//             ))}
//           </motion.div>
//         )}
//       </div>
//     </section>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { MapPin, Clock, IndianRupee } from "lucide-react";
import axiosInstance from "../../lib/axiosInstance";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Task {
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
  category_name?: string;
  job_images?: { urls: string[] };
}

export function TaskExamples() {
  const [jobs, setJobs] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "No due date";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
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
        }));
        setJobs(mappedJobs);
      } else {
        toast.error(response.data.message || "Failed to fetch jobs");
      }
    } catch {
      toast.error("An error occurred while fetching jobs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

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
    <section id="browse" className="py-16 bg-white">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
            Popular tasks near you
          </h2>
          <p className="mt-4 text-gray-500 md:text-xl">
            Browse tasks or post your own
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500">Loading tasks...</span>
          </div>
        ) : (
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {jobs.map((job, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{
                  y: -10,
                  boxShadow:
                    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                onClick={() => router.push("/signin")}
              >
                <Card className="overflow-hidden h-full flex flex-col">
                  <CardContent className="p-6 flex-1">
                    <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
                      {job.category_name}
                    </Badge>
                    <h3 className="text-lg font-bold mb-3">{job.title}</h3>
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {job.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        {formatDate(job.dueDate)}
                      </div>
                      <div className="flex items-center">
                        <IndianRupee className="h-4 w-4 mr-2 text-gray-400" />
                        {job.budget}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-6 pt-0 border-t flex items-center space-x-4">
                    {job.job_images?.urls[0] && (
                      <img
                        src={job.job_images.urls[0] || "/images/placeholder.svg"}
                        alt={job.title}
                        className="w-20 h-20 object-cover rounded-md"
                      />
                    )}
                    <span className="text-sm font-medium">{job.posted_by || "Unknown"}</span>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}