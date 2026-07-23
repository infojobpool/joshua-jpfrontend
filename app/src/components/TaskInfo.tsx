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
import { Calendar, FileText, IndianRupee, MapPin, MessageSquare, SquarePen, Star, Trash2, X } from "lucide-react";
import Image from "next/image";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import axiosInstance from "@/lib/axiosInstance";
import {
  PLACEHOLDER_DUE_DISPLAY,
  daysLeftLabel,
  dueDisplayForListCard,
} from "@/lib/taskDueDisplay";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveApiMediaUrl } from "@/lib/profileImage";
import { hasRealProfilePhotoUrl } from "@/lib/payoutProfileCompletion";
import { paymentsRouteFromSession } from "@/lib/paymentNavigation";
import type { PosterReviewSnippet } from "@/app/types";
import { toViewTransitionKey } from "@/lib/viewTransition";

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
  dueDateFlexible?: boolean;
  jobDueDateIso?: string | null;
  jobCategoryId?: string | null;
  customCategoryName?: string | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

const CUSTOM_CATEGORY_VALUE = "__custom__";
const MAX_TASK_IMAGES = 5;

function getFallbackCategoryId(categories: CategoryOption[], customName?: string): string | null {
  if (!categories.length) return null;
  const lower = (s: string) => (s || "").toLowerCase().trim();
  const custom = lower(customName || "");
  if (custom) {
    const matched = categories.find((c) => {
      const n = lower(c.name);
      return n.includes(custom) || custom.includes(n);
    });
    if (matched) return matched.id;
  }
  const other = categories.find((c) => lower(c.name).includes("other"));
  if (other) return other.id;
  const general = categories.find((c) => lower(c.name).includes("general"));
  if (general) return general.id;
  return categories[0].id;
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
  recentPosterReviews?: PosterReviewSnippet[];
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
  /** After successful save — refetch task on task page */
  onTaskUpdated?: () => void;
  /** Rendered directly under the description (e.g. offers section). */
  afterDescription?: ReactNode;
  /** Poster avatar/ratings still loading from /profile (show skeleton, not “no reviews”). */
  posterProfileLoading?: boolean;
}

function isRealTaskImage(img: Image | undefined): boolean {
  return Boolean(
    img?.url &&
      !String(img.url).includes("placeholder.svg") &&
      !String(img.url).includes("placeholder.com")
  );
}

function dueDisplayToIsoInput(display: string, isoFallback?: string | null): string {
  if (isoFallback && /^\d{4}-\d{2}-\d{2}$/.test(isoFallback)) return isoFallback;
  const t = display?.trim();
  if (!t || t === "Flexible" || t === "N/A") return "";
  const m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    const year = parseInt(m[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return "";
}

export function TaskInfo({
  task,
  openImageGallery,
  handleMessageUser,
  isTaskPoster,
  isEditing = false,
  setIsEditing,
  isPaymentPending: parentPaymentPending,
  paymentCheckDone,
  onTaskUpdated,
  afterDescription,
  posterProfileLoading = false,
}: TaskInfoProps) {
  const router = useRouter();
  const canPosterEdit = isTaskPoster && task.status === "open";

  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description,
    budget: String(task.budget ?? ""),
    location: task.location,
    dueDate: task.dueDate,
    category: task.category,
  });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [customCatName, setCustomCatName] = useState("");
  const [dueFlex, setDueFlex] = useState(false);
  const [dueDateInput, setDueDateInput] = useState("");
  const [removedImageUrls, setRemovedImageUrls] = useState<Set<string>>(() => new Set());
  const [newImageFiles, setNewImageFiles] = useState<{ id: string; file: File; url: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [minDate, setMinDate] = useState("");
  const [posterImgFailed, setPosterImgFailed] = useState(false);

  useEffect(() => {
    setPosterImgFailed(false);
  }, [task.poster?.id, task.poster?.avatar]);

  const posterAvatarRaw = task.poster?.avatar;
  const posterPhotoUrl = posterAvatarRaw ? resolveApiMediaUrl(posterAvatarRaw) : "";
  const showPosterPhoto =
    hasRealProfilePhotoUrl(posterAvatarRaw) &&
    hasRealProfilePhotoUrl(posterPhotoUrl) &&
    !posterImgFailed;
  const posterStatsPending =
    posterProfileLoading &&
    task.poster?.taskmasterReviewCount == null &&
    !(task.poster?.rating != null && Number(task.poster.rating) > 0);

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

  const syncFormFromTask = useCallback(() => {
    setFormData({
      title: task.title,
      description: task.description,
      budget: String(task.budget ?? ""),
      location: task.location,
      dueDate: task.dueDate,
      category: task.category,
    });
    setDueFlex(task.dueDateFlexible === true || task.dueDate === "Flexible");
    setDueDateInput(dueDisplayToIsoInput(task.dueDate, task.jobDueDateIso ?? null));
    setRemovedImageUrls(new Set());
    setNewImageFiles((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.url));
      return [];
    });
  }, [
    task.id,
    task.title,
    task.description,
    task.budget,
    task.location,
    task.dueDate,
    task.category,
    task.dueDateFlexible,
    task.jobDueDateIso,
  ]);

  useEffect(() => {
    if (!isEditing) syncFormFromTask();
  }, [isEditing, syncFormFromTask]);

  useEffect(() => {
    if (!isEditing || !canPosterEdit) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get("get-all-categories/");
        const data = res?.data;
        const ok =
          data?.status_code === 200 ||
          Number(data?.status_code) === 200 ||
          res?.status === 200;
        if (!ok) return;
        const raw = data?.data?.categories ?? data?.data?.category ?? data?.data ?? [];
        const list = Array.isArray(raw) ? raw : [];
        const mapped: CategoryOption[] = list
          .map((c: { category_id?: string; id?: string; category_name?: string; name?: string }) => ({
            id: String(c.category_id ?? c.id ?? ""),
            name: String(c.category_name ?? c.name ?? ""),
          }))
          .filter((c) => c.id && c.name);
        if (!cancelled) setCategories(mapped);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEditing, canPosterEdit]);

  useEffect(() => {
    if (!isEditing || !categories.length) return;
    if (task.customCategoryName) {
      setCategoryId(CUSTOM_CATEGORY_VALUE);
      setCustomCatName(task.customCategoryName);
      return;
    }
    if (task.jobCategoryId && categories.some((c) => c.id === task.jobCategoryId)) {
      setCategoryId(task.jobCategoryId);
      setCustomCatName("");
      return;
    }
    const byName = categories.find((c) => c.name === task.category);
    if (byName) {
      setCategoryId(byName.id);
      setCustomCatName("");
      return;
    }
    setCategoryId(categories[0]?.id ?? "");
    setCustomCatName("");
  }, [isEditing, categories, task.customCategoryName, task.jobCategoryId, task.category, task.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const keptExisting = task.images.filter(
      (img) => isRealTaskImage(img) && !removedImageUrls.has(img.url)
    ).length;
    const room = MAX_TASK_IMAGES - keptExisting - newImageFiles.length;
    if (room <= 0) {
      toast.error(`You can have at most ${MAX_TASK_IMAGES} photos`);
      e.target.value = "";
      return;
    }
    const slice = Array.from(e.target.files).slice(0, room);
    if (e.target.files.length > slice.length) {
      toast.message(`Only ${slice.length} more image${slice.length === 1 ? "" : "s"} allowed`);
    }
    setNewImageFiles((prev) => [
      ...prev,
      ...slice.map((file) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        url: URL.createObjectURL(file),
      })),
    ]);
    e.target.value = "";
  };

  const removeNewImage = (id: string) => {
    setNewImageFiles((prev) => {
      const row = prev.find((x) => x.id === id);
      if (row) URL.revokeObjectURL(row.url);
      return prev.filter((x) => x.id !== id);
    });
  };

  const toggleRemoveExistingUrl = (url: string) => {
    setRemovedImageUrls((prev) => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueFlex && !dueDateInput.trim()) {
      toast.error("Choose a due date or mark it as flexible");
      return;
    }
    const keptPhotos =
      task.images.filter((img) => isRealTaskImage(img) && !removedImageUrls.has(img.url)).length +
      newImageFiles.length;
    if (keptPhotos > MAX_TASK_IMAGES) {
      toast.error(`At most ${MAX_TASK_IMAGES} images allowed`);
      return;
    }
    if (categoryId === CUSTOM_CATEGORY_VALUE && !customCatName.trim()) {
      toast.error("Enter a custom category name");
      return;
    }
    setIsSubmitting(true);

    try {
      const isCustom = categoryId === CUSTOM_CATEGORY_VALUE;
      const categoryNameForApi = isCustom
        ? customCatName.trim() || task.category
        : categories.find((c) => c.id === categoryId)?.name || task.category;
      const categoryIdForApi = isCustom
        ? getFallbackCategoryId(categories, customCatName) ||
          task.jobCategoryId ||
          categories[0]?.id ||
          ""
        : categoryId || task.jobCategoryId || categories[0]?.id || "";

      const formDataToSend = new FormData();
      formDataToSend.append("job_id", task.id);
      formDataToSend.append("job_title", formData.title);
      formDataToSend.append("job_description", formData.description);
      formDataToSend.append("job_budget", formData.budget);
      formDataToSend.append("job_location", formData.location);
      formDataToSend.append("job_category", categoryIdForApi);
      formDataToSend.append("job_category_name", categoryNameForApi);
      if (isCustom && customCatName.trim()) {
        formDataToSend.append("custom_category_name", customCatName.trim());
      }

      const dueSend = dueFlex ? "" : dueDateInput.trim();
      formDataToSend.append("job_due_date", dueSend);
      formDataToSend.append("due_date", dueSend);
      formDataToSend.append("due_date_flexible", dueFlex ? "true" : "false");

      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("budget", formData.budget);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("category", categoryIdForApi);
      formDataToSend.append("category_name", categoryNameForApi);

      removedImageUrls.forEach((url) => {
        formDataToSend.append("remove_image_urls", url);
      });
      newImageFiles.forEach(({ file }) => formDataToSend.append("images", file));

      const response = await axiosInstance.put(`/update-job/${task.id}/`, formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const ok =
        response.data.status_code === 200 || Number(response.data.status_code) === 200;
      if (ok) {
        toast.success("Task updated successfully");
        setIsEditing?.(false);
        onTaskUpdated?.();
        router.refresh();
      } else {
        throw new Error(response.data.message || "Failed to update task");
      }
    } catch (error: unknown) {
      console.error("Error updating task:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = () => {
    syncFormFromTask();
    setIsEditing?.(true);
  };

  const handleCancelEdit = () => {
    setIsEditing?.(false);
    syncFormFromTask();
  };

  const realImageEntries = task.images
    .map((image, index) => ({ image, index }))
    .filter(({ image }) => isRealTaskImage(image));

  const photoThumbRing =
    "ring-2 ring-slate-200/90 hover:ring-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-shadow shadow-sm";

  return (
    <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            {isEditing && canPosterEdit ? (
              <Input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Task Title"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xl font-bold focus:border-blue-500"
              />
            ) : (
              <CardTitle
                className="task-title text-xl sm:text-2xl md:text-3xl text-slate-900 leading-snug font-semibold tracking-tight pr-1"
                style={{
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore viewTransitionName is supported in modern Chromium.
                  viewTransitionName: `task-title-${toViewTransitionKey(String(task.id ?? ""))}`,
                }}
              >
                {task.title}
              </CardTitle>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canPosterEdit && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                aria-label="Edit task"
                title="Edit task (open tasks only)"
              >
                <SquarePen className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 rounded-xl border border-slate-200/70 bg-white p-3.5 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Poster</p>
              {!isEditing ? (
                <Badge
                  variant={displayStatus === "in_progress" ? "default" : "outline"}
                  className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full border-0 ${
                    displayStatus === "pending_payment"
                      ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-sm"
                      : displayStatus === "in_progress"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                        : displayStatus === "completed"
                          ? "bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-sm"
                          : displayStatus === "deleted"
                            ? "bg-red-600 text-white shadow-sm"
                            : displayStatus === "canceled"
                              ? "bg-orange-500 text-white shadow-sm"
                              : displayStatus === "requested"
                                ? "bg-violet-600 text-white shadow-sm"
                                : "bg-blue-600 text-white shadow-sm ring-2 ring-blue-200/90"
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
              ) : null}
            </div>
            <div className="flex gap-3">
              {task.poster?.id ? (
                <Link
                  href={`/profilepage/${task.poster.id}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 shadow-sm ring-2 ring-white transition-shadow hover:ring-blue-200"
                >
                  {showPosterPhoto ? (
                    <img
                      src={posterPhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() => setPosterImgFailed(true)}
                    />
                  ) : posterProfileLoading ? (
                    <span className="block h-full w-full animate-pulse bg-slate-200 dark:bg-slate-600" aria-hidden />
                  ) : (
                    <span className="text-sm font-semibold text-slate-600">{task.poster?.name?.charAt(0) || "?"}</span>
                  )}
                </Link>
              ) : (
                <div className="h-11 w-11 shrink-0 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden ring-2 ring-white shadow-sm">
                  {showPosterPhoto ? (
                    <img
                      src={posterPhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={() => setPosterImgFailed(true)}
                    />
                  ) : posterProfileLoading ? (
                    <span className="block h-full w-full animate-pulse bg-slate-200 dark:bg-slate-600" aria-hidden />
                  ) : (
                    <span className="text-sm font-semibold text-slate-600">{task.poster?.name?.charAt(0) || "?"}</span>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1 space-y-2">
                {task.poster?.id ? (
                  <Link
                    href={`/profilepage/${task.poster.id}`}
                    className="block truncate text-sm font-semibold text-slate-900 hover:text-blue-700"
                  >
                    {task.poster?.name || "Unknown"}
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-slate-900 truncate">{task.poster?.name || "Unknown"}</p>
                )}
                {/* Poster review summary (filled after /profile + cache hydrate) */}
                <div className="rounded-lg border border-slate-100 bg-slate-50/90 px-2.5 py-2 ring-1 ring-slate-900/[0.03] dark:border-slate-700 dark:bg-slate-900/40 dark:ring-slate-600/20">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    As a poster
                  </p>
                  {(() => {
                    const tc = task.poster?.taskmasterReviewCount;
                    const ta = task.poster?.taskmasterAverageRating;
                    const hasVerified =
                      tc != null && tc > 0 && ta != null && !Number.isNaN(Number(ta));
                    const legacy = task.poster?.rating != null && Number(task.poster.rating) > 0;
                    if (posterStatsPending) {
                      return (
                        <div className="mt-2 space-y-1.5" aria-hidden>
                          <div className="h-3.5 w-28 animate-pulse rounded bg-slate-200 dark:bg-slate-600" />
                          <div className="h-3 w-40 animate-pulse rounded bg-slate-100 dark:bg-slate-700" />
                        </div>
                      );
                    }
                    if (hasVerified) {
                      const n = Number(ta);
                      return (
                        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                            <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100">
                              {n.toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-600 dark:text-slate-400">
                              · {tc} review{tc === 1 ? "" : "s"}
                            </span>
                          </div>
                          {task.poster?.id ? (
                            <Link
                              href={`/profilepage/${task.poster.id}`}
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                            >
                              View on profile
                            </Link>
                          ) : null}
                        </div>
                      );
                    }
                    if (legacy) {
                      return (
                        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                              {Number(task.poster.rating).toFixed(1)}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">profile rating</span>
                          </div>
                          {task.poster?.id ? (
                            <Link
                              href={`/profilepage/${task.poster.id}`}
                              className="text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                            >
                              View profile
                            </Link>
                          ) : null}
                        </div>
                      );
                    }
                    return (
                      <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                        Reviews from taskers show here after completed jobs.{" "}
                        {task.poster?.id ? (
                          <Link href={`/profilepage/${task.poster.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                            Open profile
                          </Link>
                        ) : null}
                      </p>
                    );
                  })()}
                </div>
                <div className="jp-bg-blue-pattern rounded-lg border border-blue-100/90 px-2.5 py-2 ring-1 ring-blue-900/[0.05]">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-100 ring-1 ring-blue-200/50">
                      <IndianRupee className="h-4 w-4 text-blue-700" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-800/90">Task budget</p>
                      <p className="text-base font-bold tabular-nums text-blue-950 dark:text-blue-100">
                        ₹{Number(task.budget).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
                {!isTaskPoster && !isEditing && (
                  <Button
                    type="button"
                    size="sm"
                    className="jp-btn-blue-gradient h-9 w-full text-sm font-semibold shadow-sm"
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 ring-1 ring-blue-100/60">
                <Calendar className="h-4 w-4 text-blue-700" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">To be done</p>
                  {(() => {
                    const { display, showDaysBadge } = dueDisplayForListCard(
                      task.dueDate,
                      task.dueDateFlexible,
                    );
                    const soft =
                      display === "Flexible" || display === PLACEHOLDER_DUE_DISPLAY;
                    return (
                      <p
                        className={cn(
                          "text-sm leading-tight",
                          soft
                            ? "font-medium text-slate-500"
                            : "font-semibold text-slate-900",
                        )}
                      >
                        {display}
                      </p>
                    );
                  })()}
                </div>
                {(() => {
                  const { showDaysBadge } = dueDisplayForListCard(
                    task.dueDate,
                    task.dueDateFlexible,
                  );
                  if (!showDaysBadge || !task.dueDate?.trim()) return null;
                  const left = daysLeftLabel(task.dueDate.trim());
                  if (!left) return null;
                  const past = left === "Past due";
                  return (
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        past
                          ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                          : left === "Due today"
                            ? "bg-amber-50 text-amber-800 ring-1 ring-amber-100"
                            : "bg-blue-50 text-blue-800 ring-1 ring-blue-100"
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
            <div className="flex flex-col gap-4 w-full sm:w-auto sm:max-w-[220px] sm:shrink-0 sm:items-end">
              {isPaymentPending ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(paymentsRouteFromSession())}
                  className="h-7 w-full px-2.5 text-[11px] bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900 font-medium sm:w-auto sm:self-end"
                >
                  Complete payment
                </Button>
              ) : null}

              {realImageEntries.length > 0 ? (
                <div className="flex flex-col gap-1.5 w-full sm:items-end sm:w-auto">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:text-right">
                    Photos
                  </p>
                  {realImageEntries.length === 1 ? (
                    <button
                      key={realImageEntries[0].image.id}
                      type="button"
                      onClick={() => openImageGallery(realImageEntries[0].index)}
                      className={`relative w-full max-w-[min(100%,260px)] aspect-[4/3] overflow-hidden rounded-xl ${photoThumbRing} sm:max-w-[200px] sm:self-end`}
                      aria-label="Open photo 1"
                    >
                      <Image
                        src={realImageEntries[0].image.url}
                        alt={realImageEntries[0].image.alt}
                        fill
                        sizes="(max-width:640px) 260px, 200px"
                        className="object-cover"
                      />
                    </button>
                  ) : realImageEntries.length === 2 ? (
                    <div className="flex gap-1.5 w-full max-w-[min(100%,260px)] sm:w-[112px] sm:max-w-none sm:self-end">
                      {realImageEntries.slice(0, 2).map(({ image, index }) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => openImageGallery(index)}
                          className={`relative flex-1 aspect-square min-w-0 overflow-hidden rounded-lg ${photoThumbRing}`}
                          aria-label={`Open photo ${index + 1}`}
                        >
                          <Image
                            src={image.url}
                            alt={image.alt}
                            fill
                            sizes="(max-width:640px) 130px, 56px"
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 w-full max-w-[min(100%,260px)] sm:w-[112px] sm:max-w-none sm:self-end">
                      {realImageEntries.slice(0, 4).map(({ image, index }) => (
                        <button
                          key={image.id}
                          type="button"
                          onClick={() => openImageGallery(index)}
                          className={`relative aspect-square overflow-hidden rounded-lg ${photoThumbRing}`}
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
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-3 md:p-5">
        {/* Photos: replace / remove / add (open tasks only) */}
        {isEditing && canPosterEdit && (
          <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-900/80">Photos</p>
            <p className="text-xs text-blue-800/80">
              Remove photos you no longer want, then add new ones (max {MAX_TASK_IMAGES} total).
            </p>
            {task.images.some((img) => isRealTaskImage(img)) ? (
              <div className="flex flex-wrap gap-2">
                {task.images
                  .filter((img) => isRealTaskImage(img))
                  .map((img) => {
                    const marked = removedImageUrls.has(img.url);
                    return (
                      <div
                        key={img.id + img.url}
                        className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 ${
                          marked ? "border-red-300 opacity-50" : "border-white shadow-sm"
                        }`}
                      >
                        <img src={img.url} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => toggleRemoveExistingUrl(img.url)}
                          className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-red-600 shadow border border-red-100"
                          aria-label={marked ? "Undo remove" : "Remove photo"}
                          title={marked ? "Undo remove" : "Remove photo"}
                        >
                          {marked ? <X className="h-4 w-4" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    );
                  })}
              </div>
            ) : null}
            {newImageFiles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {newImageFiles.map((row) => (
                  <div key={row.id} className="relative h-20 w-20 overflow-hidden rounded-lg border border-blue-200 shadow-sm">
                    <img src={row.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(row.id)}
                      className="absolute bottom-1 right-1 flex h-7 w-7 items-center justify-center rounded-md bg-white/95 text-slate-700 shadow border"
                      aria-label="Remove new photo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <div>
              <Label htmlFor="task-edit-images" className="text-xs font-medium text-blue-900">
                Add images
              </Label>
              <Input
                id="task-edit-images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleNewImageChange}
                className="mt-1 border-blue-200 focus:border-blue-400 text-xs bg-white"
              />
            </div>
          </div>
        )}

        {/* Description Section */}
        <div className="space-y-3.5 pt-0.5">
          <h3 className="flex items-center gap-3 text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            <span className="jp-bg-blue-pattern flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-blue-700 shadow-sm ring-1 ring-blue-100/90 dark:text-blue-300 dark:ring-blue-900/40">
              <FileText className="h-4 w-4" strokeWidth={2} aria-hidden />
            </span>
            Description
          </h3>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-900/[0.03] dark:border-slate-700/90 dark:bg-slate-950/35 dark:ring-slate-600/15 md:p-6">
            {isEditing && canPosterEdit ? (
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe what you need, timing, and any important details…"
                className="min-h-[120px] rounded-xl border-slate-200 bg-slate-50/40 text-[15px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 md:min-h-[140px] dark:border-slate-600 dark:bg-slate-900/50 dark:text-slate-100"
              />
            ) : (
              <p className="max-w-[65ch] text-pretty text-[15px] font-normal leading-[1.75] tracking-normal text-slate-600 antialiased dark:text-slate-300 md:text-base md:leading-[1.72] whitespace-pre-wrap">
                {task.description}
              </p>
            )}
          </div>
        </div>

        {afterDescription ? <div className="space-y-2">{afterDescription}</div> : null}

        {isEditing && canPosterEdit && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-lg p-3 border border-slate-200/70">
              <h4 className="text-xs font-semibold text-gray-800 mb-2">Category</h4>
              <select
                value={categoryId}
                onChange={(e) => {
                  const v = e.target.value;
                  setCategoryId(v);
                  if (v !== CUSTOM_CATEGORY_VALUE) setCustomCatName("");
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                disabled={!categories.length}
              >
                {!categories.length ? (
                  <option value="">Loading categories…</option>
                ) : (
                  <>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    <option value={CUSTOM_CATEGORY_VALUE}>Type your own…</option>
                  </>
                )}
              </select>
              {categoryId === CUSTOM_CATEGORY_VALUE ? (
                <Input
                  value={customCatName}
                  onChange={(e) => setCustomCatName(e.target.value)}
                  placeholder="Custom category name"
                  className="mt-2 border-slate-200 text-sm"
                />
              ) : null}
            </div>
            <div className="jp-bg-blue-pattern rounded-lg border border-blue-200/60 p-3">
              <div className="mb-1 flex items-center gap-2">
                <div className="rounded bg-blue-100 p-1">
                  <IndianRupee className="h-3 w-3 text-blue-600" />
                </div>
                <h4 className="text-xs font-semibold text-gray-800">Budget</h4>
              </div>
              <Input
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                placeholder="Budget"
                className="border-blue-200 bg-white/80 text-sm focus:border-blue-500"
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
            <div className="sm:col-span-2 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200/50 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded bg-purple-100">
                  <Calendar className="h-3 w-3 text-purple-600" />
                </div>
                <h4 className="text-xs font-semibold text-gray-800">Due date</h4>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="due-flex"
                  checked={dueFlex}
                  onCheckedChange={(c) => setDueFlex(c === true)}
                />
                <Label htmlFor="due-flex" className="text-sm font-normal cursor-pointer">
                  No specific date (flexible)
                </Label>
              </div>
              {!dueFlex ? (
                <Input
                  id="dueDateInput"
                  type="date"
                  min={minDate}
                  value={dueDateInput}
                  onChange={(e) => setDueDateInput(e.target.value)}
                  className="w-full border-purple-200 focus:border-purple-400 bg-white/80 text-sm"
                />
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
      {isEditing && canPosterEdit && (
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
