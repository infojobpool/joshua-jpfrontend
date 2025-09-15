"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { MapPin, Clock, IndianRupee, Star, ArrowRight } from "lucide-react";
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
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

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
    setIsClient(true);
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

  if (!isClient) {
    return (
      <section id="browse" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="browse" className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-gray-900">
            Popular tasks near you
          </h2>
          <p className="mt-4 text-gray-600 md:text-xl max-w-2xl mx-auto">
            Discover local opportunities and connect with skilled taskers in your area
          </p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500 text-lg">Loading tasks...</span>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {jobs.slice(0, 8).map((job, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                onClick={() => router.push("/signin")}
                className="cursor-pointer group"
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden group-hover:ring-2 group-hover:ring-blue-200">
                  <div className="relative">
                    {job.job_images?.urls[0] ? (
                      <img
                        src={job.job_images.urls[0]}
                        alt={job.title}
                        className="w-full h-32 object-cover"
                      />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                        <div className="text-blue-400 text-4xl">🔧</div>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-blue-600 text-white hover:bg-blue-700 border-0">
                        {job.category_name || "General"}
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full shadow-sm">
                      <div className="flex items-center text-sm font-semibold text-green-600">
                        <IndianRupee className="h-3 w-3 mr-1" />
                        {job.budget}
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {job.description}
                    </p>
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{job.location}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span>{formatDate(job.dueDate)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <Star className="h-4 w-4 mr-1 text-yellow-400 fill-current" />
                        <span>4.8</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {job.posted_by || "Anonymous"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
        
        {jobs.length > 8 && (
          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
          >
            <button
              onClick={() => router.push("/browse-tasks")}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All Tasks
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
}