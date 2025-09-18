"use client";

import { ImageGalleryModal } from "@/components/ImageGalleryModal";
import { OffersSection } from "@/components/OffersSection";
import { PaymentModal } from "@/components/PaymentModal";
import { PosterInfo } from "@/components/PosterInfo";
import { ReviewSection } from "@/components/ReviewSection";
import { SafetyTips } from "@/components/SafetyTips";
import { TaskInfo } from "@/components/TaskInfo";
import { Toaster } from "@/components/ui/sonner";
import axiosInstance from "@/lib/axiosInstance";
import useStore from "@/lib/Zustand";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, use, useEffect, useState } from "react";
import { toast } from "sonner";
import { Task, User, Bid, Offer, ApiBidResponse, ApiJobResponse } from "../../types";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface TaskDetailPageProps {
  params: Promise<{ id: string }>;
}

interface UserProfile {
  profile_id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const { userId, user: storeUser, checkAuth, isAuthenticated, logout } = useStore();
  const fromBid = searchParams.get('fromBid') === 'true';
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [task, setTask] = useState<Task | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerAmount, setOfferAmount] = useState<string>("");
  const [offerMessage, setOfferMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showImageGallery, setShowImageGallery] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [bidsLoading, setBidsLoading] = useState<boolean>(false);
  const [showConfirmBid, setShowConfirmBid] = useState<boolean>(false);
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const taskerId = offers.length > 0 ? offers[0].tasker.id : null;

  // Load user, profile, and sync bids
  useEffect(() => {
    console.log("Starting auth check, userId:", userId, "isAuthenticated:", isAuthenticated);
    
    // Check if we have user data from localStorage first (hydration-safe)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        if (parsedUser.id) {
          setUser(parsedUser);
          setAuthLoading(false);
          console.log("Loaded user from localStorage (hydration-safe):", parsedUser);
          return; // Exit early to prevent flicker
        }
      } catch (e) {
        console.error("Failed to parse stored user:", e);
      }
    }
    
    // Fallback to Zustand store if localStorage fails
    checkAuth();
    setAuthLoading(false);
    if (isAuthenticated && storeUser) {
      const authUser: User = {
        id: storeUser.id,
        name: storeUser.name,
        avatar: storeUser.avatar || "/images/placeholder.svg",
        rating: null,
        taskCount: null,
        joinedDate: null,
      };
      setUser(authUser);
      localStorage.setItem("user", JSON.stringify(authUser));
      console.log("Loaded user from store:", authUser);
    } else if (!storedUser) {
      console.log("No authenticated user, redirecting to signin");
      router.push("/signin");
      return;
    }

      // Fetch user profile (non-blocking, runs in background)
      const fetchProfile = async () => {
        if (!userId) return;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout - more reasonable
          
          const response = await axiosInstance.get(`/profile?user_id=${userId}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          const data = response.data;
          const profile: UserProfile = {
            profile_id: data.profile_id || "",
            name: data.name || "",
            email: data.email || "",
            phone: data.phone_number || "",
            avatar: data.profile_img || "/images/placeholder.svg",
            joinDate: data.tstamp ? new Date(data.tstamp).toLocaleDateString() : "",
          };
          setUserProfile(profile);
          console.log("Loaded user profile:", profile);
        } catch (err: any) {
          // Handle AbortError silently for background tasks
          if (err.name === 'AbortError' || err.name === 'CanceledError') {
            console.log("Profile fetch timed out (background task)");
            return;
          }
          console.error("Failed to fetch profile:", err);
          if (err.response?.status === 401) {
            logout();
            router.push("/signin");
          }
        }
      };

      // Sync user's bids to localStorage
      if (userId) {
        const syncBids = async () => {
          try {
            const response = await axiosInstance.get(`/get-user-bids/${userId}/`);
            const data: ApiBidResponse = response.data;
            if (data.status_code === 200) {
              localStorage.setItem("bids", JSON.stringify(data.data));
              console.log("Synced user bids to localStorage:", data.data);
            }
          } catch (error) {
            console.error("Error syncing user bids:", error);
          }
        };
        
        // Call functions in parallel (non-blocking)
        Promise.allSettled([
          fetchProfile(),
          syncBids()
        ]).then(() => {
          console.log("Background tasks completed");
        }).catch(err => {
          console.warn("Some background tasks failed:", err);
        });
      }
    // No cleanup necessary
  }, [router, userId, isAuthenticated, storeUser]);

  // Load task data
  useEffect(() => {
    const loadTaskData = async () => {
      try {
        setLoading(true);
        
        // Check cache first and render immediately
        const cacheKey = `task_${id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          const cacheAge = Date.now() - cachedData.timestamp;
          if (cacheAge < 300000) { // 5 minutes cache
            console.log("Using cached task data");
            setTask(cachedData.task);
            setLoading(false);
            // Continue to refresh in background
          }
        }

        // Primary request (fetch) with reasonable timeout and Axios fallback
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("Task loading timeout reached, aborting request");
          controller.abort();
        }, 12000); // 12s timeout – faster feedback

        let data: ApiJobResponse;
        try {
          const response = await fetch(`https://api.jobpool.in/api/v1/get-job/${id}/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'omit',
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          data = await response.json();
        } catch (primaryErr) {
          // Fallback to axios instance (may have different infra/routing)
          console.warn("Primary task fetch failed, trying fallback via axiosInstance", primaryErr);
          try {
            const axiosResp = await axiosInstance.get(`/get-job/${id}/`);
            data = axiosResp.data as ApiJobResponse;
          } catch (fallbackErr) {
            throw fallbackErr;
          }
        }

        if (data.status_code !== 200) {
          throw new Error(data.message);
        }

        const job = data.data;
        console.log("API Response Data (Job):", job);
        console.log("🔍 Job status fields:", {
          status: job.status,
          job_completion_status: job.job_completion_status,
          bid_accepted: job.bid_accepted,
          offer_accepted: job.offer_accepted,
          assigned_tasker_id: job.assigned_tasker_id,
          accepted_bidder_id: job.accepted_bidder_id,
          worker_id: job.worker_id,
          payment_status: job.payment_status,
          assigned_user_id: job.assigned_user_id,
          assigned_to: job.assigned_to
        });

        const assignedId =
          job.assigned_tasker_id ||
          job.assigned_user_id ||
          job.assigned_to ||
          job.accepted_bidder_id ||
          job.worker_id ||
          null;

        // Status determination for individual task page – use same logic as dashboard
        let jobStatus = "open";

        if (job.job_completion_status === 1) {
          jobStatus = "completed";
        } else if (job.deletion_status) {
          jobStatus = "deleted";
        } else if (job.cancel_status) {
          jobStatus = "canceled";
        } else if (job.status === "in_progress" || job.status === "working" || job.status === "assigned" || 
                  job.status === "accepted" || job.status === "paid" || job.status === "active" ||
                  job.status === true) {
          jobStatus = "in_progress";
        } else if (job.bid_accepted === true || job.bid_accepted === "true" || 
                  job.offer_accepted === true || job.offer_accepted === "true" ||
                  job.payment_status === "paid" || job.payment_status === "completed" ||
                  job.payment_status === "success" || job.payment_status === true ||
                  job.payment_status === "PAID" || job.payment_status === "COMPLETED" ||
                  job.payment_status === "SUCCESS" || job.payment_status === 1 ||
                  job.payment_status === "1" || job.payment_status === "confirmed" ||
                  job.payment_status === "CONFIRMED" || job.payment_status === "processed" ||
                  job.payment_status === "PROCESSED" || job.payment_status === "settled" ||
                  job.payment_status === "SETTLED" || !!assignedId) {
          jobStatus = "in_progress";
          console.log(`Task ${job.job_id} marked as in_progress due to payment/acceptance/assignment`);
        }

        console.log("🔍 Status determination result:", {
          assignedId,
          jobStatus,
          statusChecks: {
            explicitStatus: job.status,
            hasAssignedId: !!assignedId,
            bidAccepted: job.bid_accepted,
            offerAccepted: job.offer_accepted,
            paymentStatus: job.payment_status
          }
        });

        // Fallback: if this browser previously accepted and paid, mark as in_progress from session
        try {
          const rawPayment = sessionStorage.getItem("paymentData");
          if (rawPayment) {
            const pd = JSON.parse(rawPayment);
            if (String(pd.taskId) === String(job.job_id)) {
              jobStatus = "in_progress";
            }
          }
        } catch {}
        // If you navigated from Assigned to Me, align to in_progress immediately to avoid showing "Open" first
        try {
          const navHint = sessionStorage.getItem("nav_from_assigned");
          if (navHint === "1") {
            jobStatus = "in_progress";
          }
        } catch {}
        // All other tasks remain "open" for bidding
        

        const mappedTask: Task = {
          id: job.job_id,
          title: job.job_title,
          description: job.job_description,
          budget: job.job_budget,
          location: job.job_location,
          status: jobStatus,
          job_completion_status: job.job_completion_status,
          postedAt: job.timestamp
            ? (() => {
                const date = new Date(job.timestamp);
                return isNaN(date.getTime())
                  ? "Invalid Date"
                  : date.toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      timeZone: "UTC",
                    });
              })()
            : "N/A",
          dueDate: job.job_due_date
            ? new Date(job.job_due_date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                timeZone: "UTC",
              })
            : "N/A",
          category: job.job_category_name,
          images: job.job_images?.urls?.length
            ? job.job_images.urls.map((url: string, index: number) => ({
                id: `img${index + 1}`,
                url: typeof url === "string" && url.includes("placeholder.com") ? "/images/placeholder.svg" : url,
                alt: `Job image ${index + 1}`,
              }))
            : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
          poster: {
            id: job.user_ref_id,
            name: job.posted_by,
            avatar: "/images/placeholder.svg",
            rating: job.rating ?? null,
            taskCount: job.task_count ?? 0,
            joinedDate: job.joined_date ?? null,
          },
          offers: [],
          assignedTasker: assignedId ? { id: String(assignedId) } as any : undefined,
        };
        setTask(mappedTask);
        console.log("Mapped Task:", mappedTask);
        
        // Cache the task data
        localStorage.setItem(cacheKey, JSON.stringify({
          task: mappedTask,
          timestamp: Date.now()
        }));
      } catch (error: any) {
        console.error("Error loading task data:", error);
        if ((error as any)?.name === 'AbortError') {
          console.log("Task loading was aborted due to timeout");
          // Try to load from cache as fallback
          try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
              const cachedData = JSON.parse(cached);
              setTask(cachedData.task);
              console.log("Loaded task from cache after timeout");
              return; // Don't set task to null if we loaded from cache
            }
          } catch (cacheError) {
            console.warn("Failed to load from cache:", cacheError);
          }
          setTask(null); // Only set to null if no cache available
        } else {
          toast.error(
            error.response?.data?.detail || "Failed to load task details"
          );
          setTask(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadTaskData();
  }, [id]);

  // Load bids/offers
  useEffect(() => {
    if (!userId || !task) return;

    async function loadBids() {
      try {
        setBidsLoading(true);
        // Use fetch API for better performance
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

        // Check if current user is the task poster
        const isTaskPoster = task && task.poster && task.poster.id === userId;
        
        let response;
        if (isTaskPoster) {
          // Task poster: try to fetch all bids for this task using axiosInstance
          console.log("Fetching all bids for task (user is poster)");
          try {
            const axiosResponse = await axiosInstance.get(`/get-bids/${id}/`, {
              signal: controller.signal
            });
            // Convert axios response to fetch-like response
            response = {
              ok: true,
              json: () => Promise.resolve(axiosResponse.data)
            } as any;
          } catch (error) {
            console.warn("Failed to fetch task bids, falling back to user bids:", error);
            // Fallback to user bids if task bids endpoint fails
            response = await fetch(`https://api.jobpool.in/api/v1/get-user-bids/${userId}/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'omit',
              signal: controller.signal
            });
          }
        } else {
          // Non-poster: try to fetch all bids for this task (amounts hidden in UI)
          console.log("Fetching all task bids for non-poster (privacy enforced in UI)");
          try {
            const axiosResponse = await axiosInstance.get(`/get-bids/${id}/`, {
              signal: controller.signal
            });
            // Convert axios response to fetch-like response
            response = {
              ok: true,
              json: () => Promise.resolve(axiosResponse.data)
            } as any;
          } catch (error) {
            console.warn("Failed to fetch all task bids, falling back to user's bids:", error);
            response = await fetch(`https://api.jobpool.in/api/v1/get-user-bids/${userId}/`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              credentials: 'omit',
              signal: controller.signal
            });
          }
        }

        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: ApiBidResponse = await response.json();
        console.log("Raw API response for bids:", data); // Debug log

        if (data.status_code !== 200) {
          throw new Error(data.message || "Failed to fetch bids");
        }

        let taskBids: Bid[] = [];
        if (isTaskPoster) {
          // For task poster, use all bids directly (or filter if fallback was used)
          taskBids = data.data;
          console.log("Fetched all task bids for poster:", taskBids);
        } else {
          // For non-poster, filter user's bids for this task
          const allUserBids: Bid[] = data.data;
          taskBids = allUserBids.filter((bid) => bid.job_id === id);
          console.log("Filtered user's task bids:", taskBids);
        }

        // Update localStorage appropriately based on user role
        if (isTaskPoster) {
          // For task poster, store all bids for this task
          localStorage.setItem(`task_${id}_bids`, JSON.stringify(taskBids));
          console.log("Stored all task bids for poster:", taskBids);
        } else {
          // For non-poster, update user's bids
          const storedBids = localStorage.getItem("bids");
          let allBids: Bid[] = storedBids ? JSON.parse(storedBids) : [];
          allBids = [
            ...allBids.filter((bid) => bid.job_id !== id), // Remove old bids for this task
            ...taskBids, // Add current user's bids for this task
          ];
          localStorage.setItem("bids", JSON.stringify(allBids));
          console.log("Updated user's bids:", allBids);
        }

        // Map all task bids to offers
        const newOffers: Offer[] = (taskBids || []).map((bid: Bid, index: number) => ({
          id: `bid${index + 1}`,
          tasker: {
            id: bid.bidder_id,
            name: bid.bidder_name || "Unknown",
            avatar: "/images/placeholder.svg",
            rating: null,
            taskCount: null,
            joinedDate: null,
          },
          amount: bid.bid_amount,
          message: bid.bid_description || "",
          // Keep raw timestamp; format in component to avoid stale "Just now" labels
          createdAt: bid.created_at || new Date().toISOString(),
          status: bid.status || "pending",
        }));

        setOffers(newOffers);
        setBids(taskBids);
        // If any bid is accepted/assigned, force task status to in_progress for UI consistency
        try {
          const hasAccepted = taskBids.some((b) => {
            const s = String(b.status || "").toLowerCase();
            return [
              "accepted",
              "assigned",
              "in_progress",
              "working",
              "active",
            ].includes(s);
          });
          if (hasAccepted) {
            setTask((prev) => (prev ? { ...prev, status: "in_progress" } : prev));
          }
        } catch {}
        console.log("Mapped offers:", newOffers); // Debug log
      } catch (error: any) {
        console.error("Error loading bids:", error);
        if ((error as any)?.name === 'AbortError') {
          console.log("Bids request timed out");
        }
        // Removed annoying toast notification for failed bid loading
      } finally {
        setBidsLoading(false);
      }
    }

    loadBids();
  }, [id, task, userId]);

  const handleSubmitOffer = async (e: FormEvent) => {
    e.preventDefault();
    if (!offerAmount || !offerMessage || !userId) {
      toast.error("Please fill in all required fields");
      return;
    }
    setShowConfirmBid(true);
  };

  const confirmBidSubmission = async () => {
    const offerAmountNumber = parseFloat(offerAmount);

    const payload = {
      job_ref_id: id,
      bidder_ref_id: userId,
      bid_amount: offerAmountNumber,
      bid_description: offerMessage,
    };

    setIsSubmitting(true);
    setShowConfirmBid(false);

    try {
      const response = await axiosInstance.post("/bid-a-job/", payload);

      if (response.data.status_code === 201) {
        toast.success("Your offer has been submitted and the task moved to My Bids.");

        const storedBids = localStorage.getItem("bids");
        let allBids: Bid[] = storedBids ? JSON.parse(storedBids) : [];
        allBids.push({
          job_id: id,
          bidder_id: userId!,
          bid_amount: offerAmountNumber,
          bid_description: offerMessage,
          bidder_name: user?.name || "Unknown",
          created_at: new Date().toISOString(),
        });
        localStorage.setItem("bids", JSON.stringify(allBids));

        // Also append to sessionStorage requestedTasks so Dashboard hydrates My Bids immediately
        try {
          const prev = JSON.parse(sessionStorage.getItem("requestedTasks") || "[]");
          const appended = [
            ...prev,
            {
              bid_id: `local-${Date.now()}`,
              task_id: String(id),
              task_title: task?.title || "Untitled",
              bid_amount: offerAmountNumber,
              bid_description: offerMessage,
              status: "pending",
              created_at: new Date().toLocaleDateString("en-GB"),
              task_location: task?.location || "",
              task_description: task?.description || "",
              posted_by: task?.poster?.name || "",
              job_due_date: task?.dueDate || "",
              job_budget: task?.budget || 0,
              job_category: task?.category || "",
              category_name: task?.category || "",
              images: task?.images || [],
              task_cancelled: false,
              task_deleted: false,
            },
          ];
          sessionStorage.setItem("requestedTasks", JSON.stringify(appended));
        } catch {}

        // Refresh bids from API to ensure all offers are up-to-date
        const response = await axiosInstance.get(`/get-user-bids/${userId}/`);
        const data: ApiBidResponse = response.data;
        if (data.status_code === 200) {
          const taskBids = data.data.filter((bid: Bid) => bid.job_id === id);
          const newOffers: Offer[] = taskBids.map((bid: Bid, index: number) => ({
            id: `bid${index + 1}`,
            tasker: {
              id: bid.bidder_id,
              name: bid.bidder_name || "Unknown",
              avatar: "/images/placeholder.svg",
              rating: null,
              taskCount: null,
              joinedDate: null,
            },
            amount: bid.bid_amount,
            message: bid.bid_description || "",
            createdAt: bid.created_at
              ? new Date(bid.created_at).toLocaleString("en-GB", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  timeZone: "UTC",
                })
              : "Just now",
            status: bid.status || "pending",
          }));
          setOffers(newOffers);
          setBids(taskBids);
          console.log("Updated bids after submission:", taskBids);
          console.log("Updated offers after submission:", newOffers);
        }

        setOfferAmount("");
        setOfferMessage("");

        // Signal dashboard to refresh bids immediately
        try { sessionStorage.setItem("refresh_bids", "1"); } catch {}

        // Redirect to Dashboard -> My Bids tab
        router.push("/dashboard?tab=my-bids");
      } else {
        throw new Error(response.data.message || "Failed to submit offer");
      }
    } catch (error: any) {
      console.error("Error submitting offer:", error);
      toast.error(error.response?.data?.message || "Failed to submit offer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!reviewComment) {
      toast.error("Please provide a review comment");
      return;
    }
    if (!taskerId) {
      toast.error("No tasker assigned to this task");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        job_ref_id: id,
        reviewer_id: userId,
        user_id: taskerId,
        rating: reviewRating,
        comment: reviewComment,
      };

      const response = await axiosInstance.put("/submit-review/", payload);

      if (response.data.status_code === 200) {
        toast.success("Your review has been submitted!");
        router.push("/dashboard");
      } else {
        throw new Error(response.data.message || "Failed to submit review");
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsComplete = () => {
    setTimeout(() => {
      toast.success("Task marked as complete!");
      setTask((prevTask: Task | null) =>
        prevTask ? { ...prevTask, job_completion_status: 1 } : prevTask
      );
      if (task?.poster.id === userId) {
        setShowPaymentModal(true);
      }
    }, 1000);
  };

  const handlePayment = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      toast.success("Payment processed successfully");
      setShowPaymentModal(false);
      setIsSubmitting(false);
      router.push("/payments");
    }, 1500);
  };

  const handleMessageUser = async (receiverId?: string) => {
    if (!userId || !task) {
      console.error("handleMessageUser - Missing userId or task", {
        userId,
        task,
      });
      toast.error("Please log in to send messages");
      return;
    }

    const senderId = userId;
    let targetReceiverId: string | undefined;

    if (receiverId) {
      targetReceiverId = receiverId;
    } else if (task.poster.id === userId) {
      targetReceiverId = offers.length > 0 ? offers[0].tasker.id : undefined;
    } else {
      targetReceiverId = task.poster.id;
    }

    if (!targetReceiverId) {
      console.error("handleMessageUser - No recipient available", {
        offers,
        isTaskPoster: task.poster.id === userId,
      });
      toast.error("No recipient available to message");
      return;
    }

    if (targetReceiverId === senderId) {
      console.error(
        "handleMessageUser - Invalid recipient: sender and receiver are the same",
        { senderId, targetReceiverId }
      );
      toast.error("Cannot message yourself");
      return;
    }

    try {
      let response = await axiosInstance.get(
        `/get-chat-id/?sender=${senderId}&receiver=${targetReceiverId}&job_id=${id}`
      );
      // If the GET route isn't supported, fall back to POST body
      if (response.status === 404) {
        response = await axiosInstance.post(`/get-chat-id/`, {
          sender: senderId,
          receiver: targetReceiverId,
          job_id: id,
        });
      }
      console.log("handleMessageUser - API Response:", response.data);
      if (response.data.status_code === 200 && response.data.data.chat_id) {
        const chatId = response.data.data.chat_id;
        const storedChats = localStorage.getItem("userChats");
        const chatIds: string[] = storedChats ? JSON.parse(storedChats) : [];
        if (!chatIds.includes(chatId)) {
          chatIds.push(chatId);
          localStorage.setItem("userChats", JSON.stringify(chatIds));
        }
        router.push(`/messages/${chatId}`);
      } else {
        router.push(
          `/messages/new?sender=${senderId}&receiver=${targetReceiverId}`
        );
      }
    } catch (error: any) {
      // Retry with POST if server responded 404 for GET
      if (error?.response?.status === 404) {
        try {
          const postResp = await axiosInstance.post(`/get-chat-id/`, {
            sender: senderId,
            receiver: targetReceiverId,
            job_id: id,
          });
          if (postResp.data.status_code === 200 && postResp.data.data.chat_id) {
            const chatId = postResp.data.data.chat_id;
            const storedChats = localStorage.getItem("userChats");
            const chatIds: string[] = storedChats ? JSON.parse(storedChats) : [];
            if (!chatIds.includes(chatId)) {
              chatIds.push(chatId);
              localStorage.setItem("userChats", JSON.stringify(chatIds));
            }
            router.push(`/messages/${chatId}`);
            return;
          }
        } catch (postErr: any) {
          console.error("handleMessageUser - POST fallback failed:", postErr?.response?.data || postErr);
        }
      }
      console.error(
        "handleMessageUser - Error initiating chat:",
        error?.response?.data || error
      );
      toast.error(error?.response?.data?.message || "Failed to initiate chat");
    }
  };

  const openImageGallery = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageGallery(true);
  };

  const closeImageGallery = () => {
    setShowImageGallery(false);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % (task?.images.length || 1));
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(
      (prev) =>
        (prev - 1 + (task?.images.length || 1)) % (task?.images.length || 1)
    );
  };

  const handleSignOut = () => {
    console.log("handleSignOut called");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("bids");
    logout();
    router.push("/");
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        <svg className="animate-spin h-6 w-6 text-gray-400 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path></svg>
        Checking authentication...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 m-auto h-5 w-5 rounded-full bg-blue-600/10 animate-ping" />
          </div>
          <span className="text-sm text-muted-foreground animate-pulse">Loading task details...</span>
        </div>
      </div>
    );
  }

  if (!user || !userId) {
    // While auth is still hydrating on mobile, avoid flashing login message
    if (authLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
              <div className="absolute inset-0 m-auto h-5 w-5 rounded-full bg-blue-600/10 animate-ping" />
            </div>
            <span className="text-sm text-muted-foreground animate-pulse">Preparing your session...</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex h-screen items-center justify-center">
        Please log in to view task details
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 m-auto h-5 w-5 rounded-full bg-blue-600/10 animate-ping" />
          </div>
          <span className="text-sm text-muted-foreground animate-pulse">Loading task details...</span>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <p>Task not found</p>
        <Link
          href="/dashboard"
          className="text-sm text-blue-600 hover:underline"
          onClick={() => console.log("Navigating to dashboard, userId:", userId, "isAuthenticated:", isAuthenticated)}
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const isTaskPoster: boolean = task.poster.id === userId;
  const hasSubmittedOffer = offers.some((offer) => offer.tasker.id === userId);
  const bidAmountNumber = parseFloat(offerAmount) || 0;
  const handlingCharges = bidAmountNumber * 0.20; // 20% handling charges (excluding GST)
  const totalAmount = Math.max(bidAmountNumber - handlingCharges, 0); // amount user receives after charges

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Toaster position="top-right" />
      <Header user={{ name: userProfile.name, avatar: userProfile.avatar }} onSignOut={handleSignOut} />
      
      {/* Premium Back Navigation */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 md:px-6 py-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
            onClick={() => console.log("Navigating to dashboard, userId:", userId, "isAuthenticated:", isAuthenticated)}
          >
            <div className="p-1 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors duration-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            Back to Dashboard
          </Link>
        </div>
      </div>

      <main className="container mx-auto max-w-6xl px-4 md:px-6 py-4 md:py-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-4">
            <TaskInfo
              task={fromBid ? { ...task, status: "requested" } : task}
              openImageGallery={openImageGallery}
              handleMessageUser={handleMessageUser}
              isTaskPoster={isTaskPoster}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
            />
            <ReviewSection
              isTaskPoster={isTaskPoster}
              taskStatus={task.status}
              handleSubmitReview={handleSubmitReview}
              reviewRating={reviewRating}
              setReviewRating={setReviewRating}
              reviewComment={reviewComment}
              setReviewComment={setReviewComment}
              isSubmitting={isSubmitting}
              taskerId={taskerId}
              completionStatus={task.job_completion_status}
            />
            {/* Allow tasker to request cancellation */}
            {(!isTaskPoster && (task.status === "in_progress" || !!task.assignedTasker)) && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
                  Cancel Task
                </Button>
              </div>
            )}
            <OffersSection
              task={task}
              offers={offers}
              isTaskPoster={isTaskPoster}
              hasSubmittedOffer={hasSubmittedOffer}
              handleSubmitOffer={handleSubmitOffer}
              handleMessageUser={handleMessageUser}
              offerAmount={offerAmount}
              setOfferAmount={setOfferAmount}
              offerMessage={offerMessage}
              setOfferMessage={setOfferMessage}
              isSubmitting={isSubmitting}
              currentUserId={userId}
              blockSubmitInitial={!isTaskPoster && (task.status === "in_progress" || !!task.assignedTasker)}
            />
          </div>
          
          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            <PosterInfo
              poster={task.poster}
              isTaskPoster={isTaskPoster}
              handleMessageUser={handleMessageUser}
            />
            <SafetyTips />
          </div>
        </div>
      </main>

      <PaymentModal
        show={showPaymentModal}
        task={task}
        handlePayment={handlePayment}
        closeModal={() => setShowPaymentModal(false)}
        isSubmitting={isSubmitting}
      />
      <ImageGalleryModal
        show={showImageGallery}
        images={task.images}
        currentIndex={currentImageIndex}
        closeGallery={closeImageGallery}
        nextImage={nextImage}
        prevImage={prevImage}
      />
      {/* Cancel Task Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this task?</DialogTitle>
            <DialogDescription>
              Tell the admin why you want to cancel. They will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-gray-700">Reason</label>
            <textarea
              rows={4}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm"
              placeholder="e.g., Unable to complete due to schedule conflict"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelling}>
              Keep Task
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                try {
                  setIsCancelling(true);
                  // Try preferred endpoint first; fallback to existing cancel-job
                  let resp;
                  try {
                    resp = await axiosInstance.post(`/request-cancel-job/${id}/`, {
                      reason: cancelReason || "",
                      requester_id: userId,
                    });
                  } catch (err) {
                    resp = await axiosInstance.put(`/cancel-job/${id}/`, {
                      reason: cancelReason || "",
                    });
                  }
                  if (resp.data?.status_code === 200) {
                    toast.success("Cancel request sent to admin");
                    setShowCancelDialog(false);
                    setCancelReason("");
                    setTask((prev) => (prev ? { ...prev, status: "canceled" } : prev));
                  } else {
                    toast.error(resp.data?.message || "Failed to send cancel request");
                  }
                } catch (e: any) {
                  toast.error(e?.response?.data?.message || "Failed to send cancel request");
                } finally {
                  setIsCancelling(false);
                }
              }}
              disabled={isCancelling}
            >
              {isCancelling ? "Sending..." : "Send Cancel Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showConfirmBid} onOpenChange={setShowConfirmBid}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Your Bid</DialogTitle>
            <DialogDescription>
              Please review your bid details before submitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-3">
              <span className="font-bold text-gray-800">Bid Amount:</span>
              <span className="font-bold text-blue-600 text-lg">₹{bidAmountNumber.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3">
              <span className="text-gray-700">Handling Charges (Excluding GST):</span>
              <span className="font-semibold text-red-600">₹{handlingCharges.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3 border border-green-200">
              <span className="font-bold text-gray-800">You Receive:</span>
              <span className="font-bold text-green-600 text-lg">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmBid(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={confirmBidSubmission} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Confirm Bid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}