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
import type { ReactNode } from "react";
import Link from "next/link";
import { Calendar, IndianRupee, MapPin, MessageSquare, SquarePen, Star } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
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
  latitude?: number;
  longitude?: number;
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
  avatar?: string;
  taskmasterAverageRating?: number | null;
  taskmasterReviewCount?: number | null;
}

interface TaskInfoProps {
  task: Task;
  openImageGallery: (index: number) => void;
  handleMessageUser: (receiverId?: string) => void;
  isTaskPoster: boolean;
  isEditing?: boolean;
  setIsEditing?: (value: boolean) => void;
  /** From parent - avoids flicker; only show payment pending after async API check */
  isPaymentPending?: boolean;
  paymentCheckDone?: boolean;
  /** Rendered directly under the description (e.g. offers section). */
  afterDescription?: ReactNode;
}

function formatPostedAgo(iso: string | undefined, fallback: string): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `about ${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `about ${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `about ${Math.floor(diff / 86400000)}d ago`;
  return fallback;
}

/** Calendar date from ISO for a clear "Posted" line (avoids a second mystery date on the row). */
function formatCalendarDateFromIso(iso: string | undefined, fallback: string): string {
  if (!iso) return fallback;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isRealTaskImage(img: Image | undefined): boolean {
  return Boolean(
    img?.url &&
      !String(img.url).includes("placeholder.svg") &&
      !String(img.url).includes("placeholder.com")
  );
}

/** Parse task due label (e.g. DD/MM/YYYY) to local calendar date, or null if flexible / invalid. */
function parseDueDateEndOfDay(due: string): Date | null {
  const t = due?.trim();
  if (!t || t === "Flexible" || t === "N/A") return null;
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const d = parseInt(m[1], 10);
    const mo = parseInt(m[2], 10) - 1;
    const y = parseInt(m[3], 10);
    const dt = new Date(y, mo, d);
    return isNaN(dt.getTime()) ? null : dt;
  }
  const parsed = Date.parse(t);
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
}

function daysLeftLabel(due: string): string | null {
  const end = parseDueDateEndOfDay(due);
  if (!end) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  if (diff < 0) return "Past due";
  if (diff === 0) return "Due today";
  if (diff === 1) return "1 day left";
  return `${diff} days left`;
}

export function TaskInfo({ task, openImageGallery, handleMessageUser, isTaskPoster, isEditing = false, setIsEditing, isPaymentPending: parentPaymentPending, paymentCheckDone, afterDescription }: TaskInfoProps) {
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
  
  // Use parent's payment state when available - don't show pending until API check completes (avoids flicker)
  const isPaymentPending =
    paymentCheckDone !== undefined && parentPaymentPending !== undefined
      ? paymentCheckDone && parentPaymentPending
      : (() => {
          if (typeof window === "undefined") return false;
          try {
            if (task.status === "in_progress" || task.assignedTasker) return false;
            const paymentData = sessionStorage.getItem("paymentData");
            const paymentPageVisited = sessionStorage.getItem("payment_page_visited");
            const pendingVerification = localStorage.getItem("pending_payment_verification");
            if (paymentData && paymentPageVisited) {
              const data = JSON.parse(paymentData);
              if (data.taskId === task.id) return !!pendingVerification && task.status !== "in_progress";
            }
          } catch {}
          return false;
        })();
  
  // Override status display if payment is pending
  const displayStatus = isPaymentPending && task.status === "in_progress" 
    ? "pending_payment" 
    : task.status;
  
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

  const realImageEntries = task.images
    .map((image, index) => ({ image, index }))
    .filter(({ image }) => isRealTaskImage(image));

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isEditing && isTaskPoster ? (
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Task Title"
                className="text-xl font-bold bg-white border border-slate-200 focus:border-emerald-400 rounded-xl px-3 py-2"
              />
            ) : (
              <CardTitle className="task-title text-xl sm:text-2xl md:text-3xl text-slate-900 leading-snug font-semibold tracking-tight pr-1">
                {task.title}
              </CardTitle>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isTaskPoster && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg p-2"
                aria-label="Edit task"
              >
                <SquarePen className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-sm space-y-3">
            <div className="flex gap-3">
              {task.poster?.id ? (
                <Link
                  href={`/profilepage/${task.poster.id}`}
                  className="h-11 w-11 shrink-0 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm hover:ring-emerald-200 transition-shadow"
                >
                  {task.poster?.avatar ? (
                    <img src={task.poster.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-slate-600">{task.poster?.name?.charAt(0) || "?"}</span>
                  )}
                </Link>
              ) : (
                <div className="h-11 w-11 shrink-0 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                  {task.poster?.avatar ? (
                    <img src={task.poster.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold text-slate-600">{task.poster?.name?.charAt(0) || "?"}</span>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Posted by</p>
                {task.poster?.id ? (
                  <Link
                    href={`/profilepage/${task.poster.id}`}
                    className="text-sm font-semibold text-slate-900 truncate block hover:text-emerald-700"
                  >
                    {task.poster?.name || "Unknown"}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-slate-900 truncate">{task.poster?.name || "Unknown"}</p>
                )}
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                  <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" aria-hidden />
                  <span>
                    {task.poster?.taskmasterReviewCount != null &&
                    task.poster.taskmasterReviewCount > 0 &&
                    task.poster.taskmasterAverageRating != null
                      ? `${Number(task.poster.taskmasterAverageRating).toFixed(1)} ★ (${task.poster.taskmasterReviewCount})`
                      : task.poster?.rating != null && task.poster.rating > 0
                        ? `${task.poster.rating} ★`
                        : "New user"}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  <span className="text-slate-500">Posted on</span>{" "}
                  {formatCalendarDateFromIso((task as { postedAtISO?: string }).postedAtISO, task.postedAt)}
                  {(() => {
                    const iso = (task as { postedAtISO?: string }).postedAtISO;
                    if (!iso) return null;
                    const diff = Date.now() - new Date(iso).getTime();
                    if (diff < 0 || diff >= 604800000) return null;
                    const rel = formatPostedAgo(iso, "");
                    return rel ? <span className="text-slate-400"> · {rel}</span> : null;
                  })()}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {task.poster?.taskCount != null && task.poster.taskCount !== undefined && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                      {task.poster.taskCount} tasks posted
                    </span>
                  )}
                  {task.poster?.joinedDate && String(task.poster.joinedDate).trim() !== "" && (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-emerald-100">
                      Joined {task.poster.joinedDate}
                    </span>
                  )}
                </div>
                {!isTaskPoster && !isEditing && (
                  <Button
                    type="button"
                    size="sm"
                    className="mt-3 w-full h-9 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    onClick={() => handleMessageUser(task.poster?.id)}
                    disabled={isPaymentPending}
                    title={isPaymentPending ? "Complete payment to enable messaging" : undefined}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-2 shrink-0" />
                    {isPaymentPending ? "Message (complete payment)" : "Message poster"}
                  </Button>
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-2 border-t border-slate-100 items-start">
              <div className="h-9 w-9 shrink-0 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-emerald-700" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">To be done</p>
                  <p className="text-sm font-semibold text-slate-900">{task.dueDate || "Flexible"}</p>
                </div>
                {(() => {
                  const left = daysLeftLabel(task.dueDate);
                  if (!left) return null;
                  const past = left === "Past due";
                  return (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        past
                          ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                          : left === "Due today"
                            ? "bg-amber-50 text-amber-800 ring-1 ring-amber-100"
                            : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                      }`}
                    >
                      {left}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {!isEditing && (
            <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex flex-col items-end gap-2">
                <Badge
                  variant={displayStatus === "in_progress" ? "default" : "outline"}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-full border-0 ${
                    displayStatus === "pending_payment"
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm"
                      : displayStatus === "in_progress"
                        ? "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm"
                        : displayStatus === "completed"
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm"
                          : displayStatus === "deleted"
                            ? "bg-red-600 text-white shadow-sm"
                            : displayStatus === "canceled"
                              ? "bg-orange-500 text-white shadow-sm"
                              : displayStatus === "requested"
                                ? "bg-violet-600 text-white shadow-sm"
                                : "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200/80"
                  }`}
                >
                  {displayStatus === "pending_payment"
                    ? "Pending payment"
                    : displayStatus === "in_progress"
                      ? "In progress"
                      : displayStatus === "completed"
                        ? "Completed"
                        : displayStatus === "deleted"
                          ? "Deleted"
                          : displayStatus === "canceled"
                            ? "Canceled"
                            : displayStatus === "requested"
                              ? "Requested"
                              : "Open"}
                </Badge>
                {isPaymentPending && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/payments")}
                    className="h-7 px-2.5 text-[11px] bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900 font-medium"
                  >
                    Complete payment
                  </Button>
                )}
              </div>

              {realImageEntries.length > 0 ? (
                <div className="flex flex-col items-end gap-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700/90">Photos</p>
                  <div className="grid grid-cols-2 gap-1.5 w-[104px] sm:w-[112px]">
                    {realImageEntries.slice(0, 4).map(({ image, index }) => (
                      <button
                        key={image.id}
                        type="button"
                        onClick={() => openImageGallery(index)}
                        className="relative aspect-square rounded-lg overflow-hidden ring-2 ring-emerald-200/90 hover:ring-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-shadow shadow-sm"
                        aria-label={`Open photo ${index + 1}`}
                      >
                        <Image
                          src={image.url}
                          alt={image.alt}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-5 space-y-4">
        {/* Image upload when editing */}
        {isEditing && isTaskPoster && (
          <div className="bg-blue-50/80 rounded-lg p-2 border border-blue-200/50">
            <Label htmlFor="images" className="text-xs font-medium text-blue-800">
              {task.images.length > 0 ? "Upload New Images (Optional)" : "Upload Images (Optional)"}
            </Label>
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

        {/* Description Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </span>
            Description
          </h3>
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 md:p-4">
            {isEditing && isTaskPoster ? (
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Task Description"
                className="min-h-[80px] border-slate-200 focus:border-emerald-400 bg-white text-sm rounded-lg"
              />
            ) : (
              <p className="text-slate-700 leading-relaxed text-sm">{task.description}</p>
            )}
          </div>
        </div>

        {afterDescription ? <div className="space-y-2">{afterDescription}</div> : null}

        {isEditing && isTaskPoster && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg p-3 border border-emerald-200/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded bg-emerald-100">
                  <IndianRupee className="h-3 w-3 text-emerald-600" />
                </div>
                <h4 className="text-xs font-semibold text-gray-800">Budget</h4>
              </div>
              <Input
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                placeholder="Budget"
                className="border-emerald-200 focus:border-emerald-400 bg-white/80 text-sm"
              />
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200/50">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-3 w-3 text-blue-600" />
                <h4 className="text-xs font-semibold text-gray-800">Location</h4>
              </div>
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Location"
                className="border-blue-200 focus:border-blue-400 bg-white/80 text-sm"
              />
            </div>
            <div className="col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded bg-purple-100">
                  <Calendar className="h-3 w-3 text-purple-600" />
                </div>
                <h4 className="text-xs font-semibold text-gray-800">Due date</h4>
              </div>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                min={minDate}
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full border-purple-200 focus:border-purple-400 bg-white/80 text-sm"
              />
            </div>
          </div>
        )}
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