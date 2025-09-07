// import { Calendar, Clock, DollarSign, MapPin, MessageSquare } from "lucide-react";
// import Image from "next/image"; // Import Image from next/image
// import { Button } from "./ui/button";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
// import { Badge } from "./ui/badge";

// // Interfaces
// interface Task {
//   id: string;
//   title: string;
//   description: string;
//   budget: number;
//   location: string;
//   status: boolean;
//   postedAt: string;
//   dueDate: string;
//   category: string;
//   images: Image[];
//   poster: User;
//   offers: Offer[];
//   assignedTasker?: User;
// }

// interface Image {
//   id: string;
//   url: string;
//   alt: string;
// }

// interface Offer {
//   id: string;
//   tasker: User;
//   amount: number;
//   message: string;
//   createdAt: string;
// }

// interface User {
//   id: string;
//   name: string;
//   rating: number;
//   taskCount: number;
//   joinedDate: string;
// }

// interface TaskInfoProps {
//   task: Task;
//   openImageGallery: (index: number) => void;
//   handleMessageUser: (receiverId?: string) => void;
//   isTaskPoster: boolean;
// }

// export function TaskInfo({ task, openImageGallery, handleMessageUser, isTaskPoster }: TaskInfoProps) {
//   return (
//     <Card>
//       <CardHeader>
//         <div className="flex justify-between items-start">
//           <div>
//             <CardTitle className="text-2xl">{task.title}</CardTitle>
//             <CardDescription className="flex items-center gap-2 mt-1">
//               <Clock className="h-4 w-4" />
//               <span>Posted {task.postedAt}</span>
//               <Badge variant={task.status ? "secondary" : "outline"}>
//                 {task.status ? "Assigned" : "Open"}
//               </Badge>
//             </CardDescription>
//           </div>
//         </div>  
//         </CardHeader>
//       <CardContent className="space-y-4">
//         {task.images.length > 0 && (
//           <div className="space-y-2">
//             <h3 className="font-medium">Images</h3>
//             <div className="grid grid-cols-3 gap-2">
//               {task.images.map((image, index) => (
//                 <div
//                   key={image.id}
//                   className="aspect-square rounded-md overflow-hidden border cursor-pointer relative"
//                   onClick={() => openImageGallery(index)}
//                 >
//                   <Image
//                     src={image.url}
//                     alt={image.alt}
//                     fill
//                     sizes="(max-width: 768px) 100vw, 33vw"
//                     className="object-cover"
//                   />
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}
//         <div className="space-y-2">
//           <h3 className="font-medium">Description</h3>
//           <p className="text-muted-foreground">{task.description}</p>
//         </div>
//         <div className="grid grid-cols-2 gap-4">
//           <div className="space-y-1">
//             <h4 className="text-sm font-medium text-muted-foreground">Budget</h4>
//             <p className="flex items-center gap-1">
//               <DollarSign className="h-4 w-4" />
//               {task.budget}
//             </p>
//           </div>
//           <div className="space-y-1">
//             <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
//             <p className="flex items-center gap-1">
//               <MapPin className="h-4 w-4" />
//               {task.location}
//             </p>
//           </div>
//           <div className="space-y-1">
//             <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
//             <p className="flex items-center gap-1">
//               <Calendar className="h-4 w-4" />
//               {task.dueDate}
//             </p>
//           </div>
//           <div className="space-y-1">
//             <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
//             <p>{task.category}</p>
//           </div>
//         </div>
//       </CardContent>
//       {/* {task.status && (
//         <CardFooter>
//           <Button className="w-full" onClick={() => handleMessageUser(task.poster.id)}>
//             <MessageSquare className="mr-2 h-4 w-4" />
//             Message {isTaskPoster ? task.assignedTasker?.name : task.poster.name}
//           </Button>
//         </CardFooter>
//       )} */}
//     </Card>
//   );
// }



"use client";
import { Calendar, Clock, IndianRupee, MapPin, MessageSquare, SquarePen } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import axiosInstance from "@/lib/axiosInstance";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Interfaces
interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  status: string;
  postedAt: string;
  dueDate: string;
  category: string;
  images: Image[];
  poster: User;
  offers: Offer[];
  assignedTasker?: User;
}

interface Image {
  id: string;
  url: string;
  alt: string;
}

interface Offer {
  id: string;
  tasker: User;
  amount: number;
  message: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  rating: number;
  taskCount: number;
  joinedDate: string;
}

interface TaskInfoProps {
  task: Task;
  openImageGallery: (index: number) => void;
  handleMessageUser: (receiverId?: string) => void;
  isTaskPoster: boolean;
  isEditing?: boolean;
  setIsEditing?: (value: boolean) => void;
}

export function TaskInfo({ task, openImageGallery, handleMessageUser, isTaskPoster, isEditing = false, setIsEditing }: TaskInfoProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    budget: task.budget.toString(),
    location: task.location,
    dueDate: task.dueDate,
    category: task.category,
  });
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minDate, setMinDate] = useState("");
  
    useEffect(() => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      setMinDate(`${yyyy}-${mm}-${dd}`);
    }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("job_id", task.id);
      if (formData.title !== task.title) formDataToSend.append("title", formData.title);
      if (formData.description !== task.description) formDataToSend.append("description", formData.description);
      if (formData.category !== task.category) formDataToSend.append("category", formData.category);
      if (formData.budget !== task.budget.toString()) formDataToSend.append("budget", formData.budget);
      if (formData.location !== task.location) formDataToSend.append("location", formData.location);
      if (formData.dueDate !== task.dueDate) formDataToSend.append("due_date", formData.dueDate);
      images.forEach((image) => formDataToSend.append("images", image));

      const response = await axiosInstance.put(`/update-job/${task.id}/`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.status_code === 200) {
        toast.success("Task updated successfully");
        setIsEditing?.(false);
        // Update the task state to reflect changes
        const updatedTask = {
          ...task,
          title: formData.title,
          description: formData.description,
          budget: parseFloat(formData.budget),
          location: formData.location,
          dueDate: formData.dueDate,
          category: formData.category,
          images: images.length > 0 ? images.map((_, index) => ({
            id: `img${index + 1}`,
            url: URL.createObjectURL(_), // Temporary URL for new images
            alt: `Job image ${index + 1}`,
          })) : task.images,
        };
        // Note: You may need to reload task data from the API to get the actual image URLs
        router.refresh(); // Refresh the page to reflect changes
      } else {
        throw new Error(response.data.message || "Failed to update task");
      }
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast.error(error.response?.data?.message || "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing?.(true);
  };

  const handleCancelEdit = () => {
    setIsEditing?.(false);
    setFormData({
      title: task.title,
      description: task.description,
      budget: task.budget.toString(),
      location: task.location,
      dueDate: task.dueDate,
      category: task.category,
    });
    setImages([]);
  };

  return (
    <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 rounded-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-100/50 p-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            {isEditing && isTaskPoster ? (
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Task Title"
                className="text-xl font-bold bg-white/80 border-2 border-blue-200 focus:border-blue-400 rounded-lg px-3 py-2"
              />
            ) : (
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent leading-tight">
                {task.title}
              </CardTitle>
            )}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-gray-600">
                <div className="p-1 rounded-full bg-blue-100">
                  <Clock className="h-3 w-3 text-blue-600" />
                </div>
                <span className="text-sm font-medium">Posted {task.postedAt}</span>
              </div>
              <Badge 
                variant={task.status === "in_progress" ? "default" : "outline"}
                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  task.status === "in_progress"
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md"
                    : task.status === "completed"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                    : task.status === "deleted"
                    ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md"
                    : task.status === "canceled"
                    ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md"
                    : "bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200"
                }`}
              >
                {task.status === "in_progress" 
                  ? "🚀 In Progress" 
                  : task.status === "completed"
                  ? "✅ Completed"
                  : task.status === "deleted"
                  ? "🗑️ Deleted"
                  : task.status === "canceled"
                  ? "❌ Canceled"
                  : "📋 Open"}
              </Badge>
            </div>
          </div>
          {isTaskPoster && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg p-2 transition-all duration-200"
            >
              <SquarePen className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Images Section */}
        {task.images.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
              <div className="p-1 rounded bg-purple-100">
                <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              Images
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {task.images.map((image, index) => (
                <div
                  key={image.id}
                  className="aspect-square rounded-lg overflow-hidden border border-gray-200/50 cursor-pointer relative group hover:border-blue-300 transition-all duration-200 hover:shadow-md"
                  onClick={() => openImageGallery(index)}
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
              ))}
            </div>
            {isEditing && isTaskPoster && (
              <div className="bg-blue-50/80 rounded-lg p-2 border border-blue-200/50">
                <Label htmlFor="images" className="text-xs font-medium text-blue-800">Upload New Images (Optional)</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 border-blue-200 focus:border-blue-400 text-xs"
                />
              </div>
            )}
          </div>
        )}

        {/* Description Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
            <div className="p-1 rounded bg-blue-100">
              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            Description
          </h3>
          <div className="bg-gray-50/80 rounded-lg p-3 border border-gray-200/50">
            {isEditing && isTaskPoster ? (
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Task Description"
                className="min-h-[80px] border-blue-200 focus:border-blue-400 bg-white/80 text-sm"
              />
            ) : (
              <p className="text-gray-700 leading-relaxed text-sm">{task.description}</p>
            )}
          </div>
        </div>

        {/* Task Details Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Budget */}
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-200/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded bg-emerald-100">
                <IndianRupee className="h-3 w-3 text-emerald-600" />
              </div>
              <h4 className="text-xs font-semibold text-gray-800">Budget</h4>
            </div>
            {isEditing && isTaskPoster ? (
              <Input
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                placeholder="Budget"
                className="border-emerald-200 focus:border-emerald-400 bg-white/80 text-sm"
              />
            ) : (
              <p className="text-lg font-bold text-emerald-700">₹{task.budget}</p>
            )}
          </div>

          {/* Location */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded bg-blue-100">
                <MapPin className="h-3 w-3 text-blue-600" />
              </div>
              <h4 className="text-xs font-semibold text-gray-800">Location</h4>
            </div>
            {isEditing && isTaskPoster ? (
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Location"
                className="border-blue-200 focus:border-blue-400 bg-white/80 text-sm"
              />
            ) : (
              <p className="text-gray-700 text-xs leading-relaxed line-clamp-2">{task.location}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded bg-purple-100">
                <Calendar className="h-3 w-3 text-purple-600" />
              </div>
              <h4 className="text-xs font-semibold text-gray-800">Due Date</h4>
            </div>
            {isEditing && isTaskPoster ? (
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                min={minDate}
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full border-purple-200 focus:border-purple-400 bg-white/80 text-sm"
              />
            ) : (
              <p className="text-sm font-medium text-purple-700">{task.dueDate}</p>
            )}
          </div>

          {/* Category */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-200/50">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1 rounded bg-orange-100">
                <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <h4 className="text-xs font-semibold text-gray-800">Category</h4>
            </div>
            {isEditing && isTaskPoster ? (
              <Input
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Category"
                disabled
                className="border-orange-200 bg-orange-50/50 text-sm"
              />
            ) : (
              <p className="text-sm font-medium text-orange-700">{task.category}</p>
            )}
          </div>
        </div>
      </CardContent>
      {isEditing && isTaskPoster && (
        <CardFooter className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-t border-gray-200/50 p-3">
          <div className="flex gap-2 w-full">
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-sm"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 font-semibold rounded-lg transition-all duration-200 text-sm"
            >
              Cancel
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}