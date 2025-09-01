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
  status: boolean;
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
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            {isEditing && isTaskPoster ? (
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Task Title"
                className="text-2xl font-bold"
              />
            ) : (
              <CardTitle className="text-2xl">{task.title}</CardTitle>
            )}
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock className="h-4 w-4" />
              <span>Posted {task.postedAt}</span>
              <Badge variant={task.status ? "secondary" : "outline"}>
                {task.status ? "Assigned" : "Open"}
              </Badge>
            </CardDescription>
          </div>
          {isTaskPoster && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEditClick}
              className="text-muted-foreground hover:text-primary"
            >
              <SquarePen />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {task.images.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Images</h3>
            <div className="grid grid-cols-3 gap-2">
              {task.images.map((image, index) => (
                <div
                  key={image.id}
                  className="aspect-square rounded-md overflow-hidden border cursor-pointer relative"
                  onClick={() => openImageGallery(index)}
                >
                  <Image
                    src={image.url}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            {isEditing && isTaskPoster && (
              <div>
                <Label htmlFor="images">Upload New Images (Optional)</Label>
                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        )}
        <div className="space-y-2">
          <h3 className="font-medium">Description</h3>
          {isEditing && isTaskPoster ? (
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Task Description"
              className="min-h-[100px]"
            />
          ) : (
            <p className="text-muted-foreground">{task.description}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Budget</h4>
            {isEditing && isTaskPoster ? (
              <Input
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                placeholder="Budget"
              />
            ) : (
              <p className="flex items-center gap-1">
                <IndianRupee  className="h-4 w-4" />
                {task.budget}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
            {isEditing && isTaskPoster ? (
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Location"
              />
            ) : (
              <p className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {task.location}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Due Date</h4>
            {isEditing && isTaskPoster ? (
              <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      min={minDate}
                      value={formData.dueDate}
                      onChange={handleChange}
                      className="w-full"
                    />

              
            ) : (
              <p className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {task.dueDate}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-medium text-muted-foreground">Category</h4>
            {isEditing && isTaskPoster ? (
              <Input
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Category"
                disabled
              />
            ) : (
              <p>{task.category}</p>
            )}
          </div>
        </div>
      </CardContent>
      {isEditing && isTaskPoster && (
        <CardFooter className="space-x-2">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancelEdit}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}