"use client";

import { ImageGalleryModal } from "@/components/ImageGalleryModal";
import { OffersSection } from "@/components/OffersSection";
import { PaymentModal } from "@/components/PaymentModal";
import { PosterInfo } from "@/components/PosterInfo";
import { ReviewSection } from "@/components/ReviewSection";
import { CompletionReviewModal } from "@/components/CompletionReviewModal";
import { SafetyTips } from "@/components/SafetyTips";
import { TaskInfo } from "@/components/TaskInfo";
import { Toaster } from "@/components/ui/sonner";
import axiosInstance from "@/lib/axiosInstance";
import useStore from "@/lib/Zustand";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { Task, User, Bid, Offer, ApiBidResponse, ApiJobResponse } from "../../types";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface UserProfile {
  profile_id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  joinDate: string;
}

export default function TaskDetailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const id = params?.id as string;
  const { userId, user: storeUser, checkAuth, isAuthenticated, logout, addNotifications } = useStore();
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
  const [existingReview, setExistingReview] = useState<{ rating: number; comment: string; timestamp?: string } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showImageGallery, setShowImageGallery] = useState<boolean>(false);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [bidsLoading, setBidsLoading] = useState<boolean>(false);
  const [showConfirmBid, setShowConfirmBid] = useState<boolean>(false);
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationChecked, setVerificationChecked] = useState<boolean>(false);
  const [isPaymentPending, setIsPaymentPending] = useState<boolean>(false);
  const [taskRefreshKey, setTaskRefreshKey] = useState<number>(0);
  const [completeReviewOpen, setCompleteReviewOpen] = useState(false);
  const [completeReviewAsTaskmaster, setCompleteReviewAsTaskmaster] = useState(false);
  const taskerId = offers.length > 0 ? offers[0].tasker.id : (task?.assignedTasker?.id ? String(task.assignedTasker.id) : null);

  // Debug: Log verification state changes
  useEffect(() => {
    console.log("🔍 Verification state changed:", { isVerified, verificationChecked });
  }, [isVerified, verificationChecked]);

  // Check for existing review in localStorage when task loads
  useEffect(() => {
    if (!task?.id || !userId) return;
    try {
      const raw = localStorage.getItem("poster_reviews");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed[task.id]) {
          setExistingReview(parsed[task.id]);
          console.log("Found existing review for task:", task.id, parsed[task.id]);
        }
      }
    } catch (error) {
      console.warn("Failed to load existing review from localStorage:", error);
    }
  }, [task?.id, userId]);

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
          
          // Check verification status immediately from localStorage
          // verification_status >= 2 (PAN + Aadhar) is sufficient for bidding
          if (parsedUser.verification_status !== undefined && parsedUser.verification_status !== null) {
            const statusNum = typeof parsedUser.verification_status === 'string' ? parseInt(parsedUser.verification_status, 10) : Number(parsedUser.verification_status);
            const verified = !isNaN(statusNum) && statusNum >= 2; // >= 2 = PAN + Aadhar (sufficient for bidding)
            setIsVerified(verified);
            setVerificationChecked(true);
            console.log("✅ Initial verification check from localStorage:", parsedUser.verification_status, "->", statusNum, "Verified:", verified);
          } else {
            // No verification status in localStorage yet, wait for API
            setIsVerified(false);
            setVerificationChecked(false);
            console.log("⏳ No verification status in localStorage, waiting for API...");
          }
          
          // Continue to fetch profile for latest verification status (will update if different)
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

      // Fetch user profile and verification status
      const fetchProfile = async () => {
        if (!userId) return;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout
          
          // Try to get verification status from profile endpoint
          const response = await axiosInstance.get(`/profile?user_id=${userId}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          
          console.log("🔍 Raw profile API response:", response);
          console.log("🔍 Response data:", response.data);
          console.log("🔍 Response data type:", typeof response.data);
          console.log("🔍 Response data keys:", response.data ? Object.keys(response.data) : []);
          
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
          
          // Check verification status from API response - try multiple possible locations
          // Check all possible nested structures
          const apiVerificationStatus = 
            data?.verification_status !== undefined ? data.verification_status :
            data?.verificationStatus !== undefined ? data.verificationStatus :
            data?.data?.verification_status !== undefined ? data.data.verification_status :
            data?.data?.verificationStatus !== undefined ? data.data.verificationStatus :
            response.data?.verification_status !== undefined ? response.data.verification_status :
            response.data?.verificationStatus !== undefined ? response.data.verificationStatus :
            response.data?.data?.verification_status !== undefined ? response.data.data.verification_status :
            response.data?.data?.verificationStatus !== undefined ? response.data.data.verificationStatus :
            null;
          
          console.log("🔍 Full API response for verification:", {
            data,
            responseData: response.data,
            apiVerificationStatus,
            allKeys: Object.keys(data || {}),
            dataKeys: data ? Object.keys(data) : [],
            responseDataKeys: response.data ? Object.keys(response.data) : []
          });
          
          // Also check if verification status might be in pan_verified, aadhaar_verified fields
          const panVerified = data?.pan_verified || data?.panVerified || data?.data?.pan_verified || response.data?.pan_verified;
          const aadhaarVerified = data?.aadhaar_verified || data?.aadhaarVerified || data?.aadhaar_verified || data?.data?.aadhaar_verified || response.data?.aadhaar_verified;
          const bankVerified = data?.bank_verified || data?.bankVerified || data?.data?.bank_verified || response.data?.bank_verified;
          
          console.log("🔍 Individual verification flags:", { panVerified, aadhaarVerified, bankVerified });
          
          // If we have individual flags but no status number, calculate it
          let calculatedStatus = null;
          if (apiVerificationStatus === null && (panVerified !== undefined || aadhaarVerified !== undefined || bankVerified !== undefined)) {
            if (bankVerified === true || bankVerified === 1) calculatedStatus = 3;
            else if (aadhaarVerified === true || aadhaarVerified === 1) calculatedStatus = 2;
            else if (panVerified === true || panVerified === 1) calculatedStatus = 1;
            else calculatedStatus = 0;
            console.log("🔍 Calculated verification status from flags:", calculatedStatus);
          }
          
          const finalVerificationStatus = apiVerificationStatus !== null ? apiVerificationStatus : calculatedStatus;
          
          // If still no status found, check if bank_info exists (indicates at least some verification)
          if (finalVerificationStatus === null) {
            const bankInfo = data?.bank_info || data?.bankInfo || data?.data?.bank_info || response.data?.bank_info;
            if (bankInfo && Object.keys(bankInfo).length > 0) {
              // If bank info exists, assume at least PAN + Aadhar + Bank (3)
              calculatedStatus = 3;
              console.log("🔍 Found bank_info, assuming verification_status = 3");
            }
          }
          
          const finalStatus = finalVerificationStatus !== null ? finalVerificationStatus : calculatedStatus;
          
          if (finalStatus !== null && finalStatus !== undefined) {
            // Convert to number if it's a string
            const statusNum = typeof finalStatus === 'string' ? parseInt(finalStatus, 10) : Number(finalStatus);
            const verified = !isNaN(statusNum) && statusNum >= 2; // >= 2 = PAN + Aadhar (sufficient for bidding)
            setIsVerified(verified);
            setVerificationChecked(true);
            console.log("✅ Verification status from API:", finalStatus, "->", statusNum, "Verified:", verified);
            
            // Update localStorage user with latest verification status
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              parsedUser.verification_status = statusNum;
              localStorage.setItem("user", JSON.stringify(parsedUser));
              console.log("💾 Updated localStorage verification_status to:", statusNum);
            }
          } else {
            // Fallback to localStorage verification status
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              const statusNum = typeof parsedUser.verification_status === 'string' ? parseInt(parsedUser.verification_status, 10) : Number(parsedUser.verification_status);
              
              if (!isNaN(statusNum) && statusNum >= 0) {
                // Valid number found in localStorage
                const verified = statusNum >= 2; // >= 2 = PAN + Aadhar (sufficient for bidding)
                setIsVerified(verified);
                setVerificationChecked(true);
                console.log("⚠️ Using localStorage verification status:", parsedUser.verification_status, "->", statusNum, "Verified:", verified);
              } else {
                // Invalid or missing verification status - assume not verified
                console.warn("⚠️ Invalid verification_status in localStorage:", parsedUser.verification_status);
                setIsVerified(false);
                setVerificationChecked(true);
                console.log("❌ No valid verification status found, defaulting to not verified");
              }
            } else {
              // No user in localStorage
              setIsVerified(false);
              setVerificationChecked(true);
              console.log("❌ No user found in localStorage");
            }
          }
        } catch (err: any) {
          // Handle AbortError silently for background tasks
          if (err.name === 'AbortError' || err.name === 'CanceledError') {
            console.log("Profile fetch timed out (background task)");
            // Still check localStorage for verification status
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              const statusNum = typeof parsedUser.verification_status === 'string' ? parseInt(parsedUser.verification_status, 10) : Number(parsedUser.verification_status);
              const verified = !isNaN(statusNum) && statusNum >= 2; // >= 2 = PAN + Aadhar (sufficient for bidding)
              setIsVerified(verified);
              setVerificationChecked(true);
            }
            return;
          }
          console.error("Failed to fetch profile:", err);
          if (err.response?.status === 401) {
            logout();
            router.push("/signin");
          } else {
            // Fallback to localStorage verification status on error
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              const statusNum = typeof parsedUser.verification_status === 'string' ? parseInt(parsedUser.verification_status, 10) : Number(parsedUser.verification_status);
              const verified = !isNaN(statusNum) && statusNum >= 2; // >= 2 = PAN + Aadhar (sufficient for bidding)
              setIsVerified(verified);
              setVerificationChecked(true);
              console.log("Fallback verification check from localStorage on error:", parsedUser.verification_status, "->", statusNum, "Verified:", verified);
            } else {
              // If no user in localStorage, assume not verified
              setIsVerified(false);
              setVerificationChecked(true);
            }
          }
        }
      };

      // Always fetch profile to get latest verification status (even if we have localStorage data)
      if (userId) {
        fetchProfile();
      } else {
        // If no userId, check localStorage only
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          if (parsedUser.verification_status !== undefined && parsedUser.verification_status !== null) {
            const statusNum = typeof parsedUser.verification_status === 'string' ? parseInt(parsedUser.verification_status, 10) : Number(parsedUser.verification_status);
            const verified = !isNaN(statusNum) && statusNum >= 2; // >= 2 = PAN + Aadhar (sufficient for bidding)
            setIsVerified(verified);
            setVerificationChecked(true);
          } else {
            setIsVerified(false);
            setVerificationChecked(true);
          }
        }
      }

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
        
        // Use cache only if fresh (< 5 min) – stale cache can have wrong assignedTasker/offers state
        const cacheKey = `task_${id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            const cacheAge = Date.now() - (cachedData?.timestamp || 0);
            if (cachedData?.task && cacheAge < 300000) {
              // 5 min – avoid serving old task that lacks assignedTasker/bids info
              console.log("Using fresh cached task data");
              setTask(cachedData.task);
              setLoading(false);
            }
          } catch {}
        }

        // Primary request (fetch) with reasonable timeout and Axios fallback
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log("Task loading timeout reached, aborting request");
          controller.abort();
        }, 6000); // 6s timeout – faster feedback

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

        // Check cancellation status FIRST (for both pre-payment and post-payment)
        // Backend may return cancel_status as boolean, string, or in status field
        const isCancelled = 
          job.cancel_status === true || 
          job.cancel_status === "true" || 
          job.cancel_status === 1 ||
          job.status === "cancelled" || 
          job.status === "Cancelled" ||
          job.status === "canceled" ||
          job.status === "Canceled" ||
          job.cancelled === true ||
          job.cancelled === "true";
        
        if (isCancelled) {
          jobStatus = "canceled";
          console.log(`✅ Task ${job.job_id} marked as cancelled (pre or post payment):`, {
            cancel_status: job.cancel_status,
            status: job.status,
            cancelled: job.cancelled
          });
        } else if (job.job_completion_status === 1) {
          jobStatus = "completed";
        } else if (job.deletion_status) {
          jobStatus = "deleted";
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
        

        // Normalize "posted" date so it matches dashboard cards:
        // Prefer true creation timestamps over due date.
        const rawPosted =
          job.tstamp ||
          job.timestamp ||
          job.created_at ||
          job.job_tstamp ||
          job.job_due_date;

        const formattedPosted =
          rawPosted && !isNaN(new Date(rawPosted).getTime())
            ? new Date(rawPosted).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                timeZone: "UTC",
              })
            : "N/A";

        const mappedTask: Task = {
          id: job.job_id,
          title: job.job_title,
          description: job.job_description,
          budget: job.job_budget,
          location: job.job_location,
          status: jobStatus,
          job_completion_status: job.job_completion_status,
          tasker_completed: Boolean((job as any).tasker_completed),
          taskmaster_completed: Boolean((job as any).taskmaster_completed),
          postedAt: formattedPosted,
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
          assignedTasker: assignedId
            ? {
                id: String(assignedId),
                name:
                  (job as any).assigned_tasker_name ||
                  (job as any).tasker_name ||
                  (job as any).accepted_bidder_name ||
                  "Assigned tasker",
                avatar: "/images/placeholder.svg",
                rating: null,
                taskCount: null,
                joinedDate: null,
              }
            : undefined,
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
  }, [id, taskRefreshKey]);

  // Load bids/offers
  useEffect(() => {
    if (!userId || !task) return;

    async function loadBids() {
      try {
        setBidsLoading(true);
        // Use fetch API for better performance
        const token = localStorage.getItem('token');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

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
          } catch (error: any) {
            console.error("❌ Failed to fetch task bids endpoint /get-bids/:", {
              error: error.message,
              status: error.response?.status,
              url: `/get-bids/${id}/`
            });
            // DON'T fallback to user bids for poster - that would show their own bids
            // Instead, set empty bids and show error
            console.warn("⚠️ Cannot fetch task bids - endpoint not available. Showing empty bids.");
            setOffers([]);
            setBids([]);
            setBidsLoading(false);
            return; // Exit early - don't process user bids
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
          // For task poster, use all bids directly from the task bids endpoint
          // Try multiple possible response structures from backend
          const raw =
            data.data?.bids ??
            data.data?.data ??
            (Array.isArray(data.data) ? data.data : null) ??
            data.bids ??
            data.data ??
            [];
          taskBids = Array.isArray(raw) ? raw : [];
          // If data.data is object with job_id key, it might be { [job_id]: bids }
          if (taskBids.length === 0 && data.data && typeof data.data === "object" && !Array.isArray(data.data)) {
            const maybeBids = (data.data as any)[id] ?? (data.data as any).bids ?? Object.values(data.data);
            taskBids = Array.isArray(maybeBids) ? maybeBids : [];
          }
          console.log("Fetched all task bids for poster:", taskBids);
        } else {
          // For non-poster, filter user's bids for this task
          const allUserBids: Bid[] = Array.isArray(data.data) ? data.data : [];
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

        // When task has assigned tasker but get-bids returned empty, synthesize an offer so taskmaster sees who they're confirming
        let taskBidsToUse = taskBids || [];
        if (taskBidsToUse.length === 0 && task?.assignedTasker?.id) {
          taskBidsToUse = [
            {
              bidder_id: task.assignedTasker.id,
              bidder_name: (task.assignedTasker as any).name || "Assigned tasker",
              bid_amount: 0,
              bid_description: "Accepted offer",
              job_id: id,
              created_at: new Date().toISOString(),
              status: "accepted",
            } as Bid,
          ];
          console.log("Synthesized offer from assigned tasker:", taskBidsToUse);
        }

        // Map all task bids to offers
        // Filter out bids where the bidder is the same as the poster (users can't bid on their own tasks)
        const posterId = task?.poster?.id;
        const validBids = (taskBidsToUse || []).filter((bid: Bid) => {
          const bidderId = String(bid.bidder_id || "").trim();
          const posterIdStr = String(posterId || "").trim();
          
          // Log bid details for debugging
          console.log("🔍 Bid mapping:", {
            bid_id: bid.bid_id || bid.id,
            bidder_id: bid.bidder_id,
            bidder_name: bid.bidder_name,
            poster_id: posterId,
            is_same: bidderId === posterIdStr,
            task_id: id
          });
          
          // Exclude bids where bidder is the poster
          if (bidderId && posterIdStr && bidderId === posterIdStr) {
            console.warn("⚠️ Excluding bid: bidder is the same as poster", {
              bidder_id: bidderId,
              bidder_name: bid.bidder_name,
              poster_id: posterIdStr
            });
            return false;
          }
          return true;
        });
        
        const newOffers: Offer[] = validBids.map((bid: Bid, index: number) => ({
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
        
        console.log("✅ Mapped offers (after filtering):", {
          total_bids: taskBids?.length || 0,
          filtered_bids: validBids.length,
          offers: newOffers.map(o => ({
            id: o.id,
            tasker_id: o.tasker.id,
            tasker_name: o.tasker.name,
            amount: o.amount
          }))
        });

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
    
    // Wait for verification check to complete
    if (!verificationChecked) {
      toast.error("Please wait while we verify your account status...");
      return;
    }
    
    // Check if user is verified (PAN + Aadhar minimum required for bidding)
    if (!isVerified) {
      toast.error("Please complete your verification (PAN and Aadhar) to place bids");
      router.push("/verification");
      return;
    }
    
    // Double-check from localStorage as well
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const statusNum = typeof parsedUser.verification_status === 'string' ? parseInt(parsedUser.verification_status, 10) : Number(parsedUser.verification_status);
      if (parsedUser.verification_status === undefined || parsedUser.verification_status === null || isNaN(statusNum) || statusNum < 2) {
        toast.error("Please complete your verification (PAN and Aadhar) to place bids");
        router.push("/verification");
        return;
      }
    } else {
      toast.error("Please log in to place bids");
      router.push("/signin");
      return;
    }
    
    setShowConfirmBid(true);
  };

  const confirmBidSubmission = async () => {
    // Triple-check verification status before API call
    if (!verificationChecked || !isVerified) {
      toast.error("Please complete your verification (PAN and Aadhar) to place bids");
      setShowConfirmBid(false);
      router.push("/verification");
      return;
    }
    
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      toast.error("Please log in to place bids");
      setShowConfirmBid(false);
      router.push("/signin");
      return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    const statusNum = typeof parsedUser.verification_status === 'string' ? parseInt(parsedUser.verification_status, 10) : Number(parsedUser.verification_status);
    if (parsedUser.verification_status === undefined || parsedUser.verification_status === null || isNaN(statusNum) || statusNum < 2) {
      toast.error("Please complete your verification (PAN and Aadhar) to place bids");
      setShowConfirmBid(false);
      router.push("/verification");
      return;
    }

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
        addNotifications([{
          id: `bid-${id}-${userId}-${Date.now()}`,
          type: "system",
          title: "Offer submitted",
          description: `Your offer of ₹${offerAmountNumber} for "${task?.title || "task"}" was submitted.`,
          createdAt: new Date().toISOString(),
          read: false,
          link: `/tasks/${id}`,
        }]);

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
        // Save review to localStorage
        const reviewData = {
          rating: reviewRating,
          comment: reviewComment,
          timestamp: new Date().toISOString(),
        };
        
        try {
          const stored = localStorage.getItem("poster_reviews");
          const reviews = stored ? JSON.parse(stored) : {};
          reviews[task?.id || id] = reviewData;
          localStorage.setItem("poster_reviews", JSON.stringify(reviews));
          console.log("Review saved to localStorage:", reviewData);
        } catch (e) {
          console.error("Failed to store review locally:", e);
        }
        
        // Update state to show the review
        setExistingReview(reviewData);
        
        // Clear form
        setReviewRating(5);
        setReviewComment("");
        
        toast.success("Your review has been submitted!");
        // Don't redirect immediately - let user see their review
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

  const handleCompleteReviewSubmit = async (rating: number, comment: string) => {
    if (!task) return;
    try {
      setIsSubmitting(true);
      const reviewBody = { rating, comment };
      const token = typeof window !== "undefined" && (localStorage.getItem("token") || sessionStorage.getItem("token"));
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["X-Access-Token"] = token;
      }
      if (completeReviewAsTaskmaster) {
        await axiosInstance.put(`/mark-complete-by-taskmaster/${task.id}/`, reviewBody, { headers });
      } else {
        await axiosInstance.put(`/mark-complete/${task.id}/`, reviewBody, { headers });
      }
      toast.success("Task marked complete and review submitted!");
      setCompleteReviewOpen(false);
      const payload = {
        job_completion_status: 1,
        tasker_completed: true,
        taskmaster_completed: true,
      };
      setTask((prev) => (prev ? { ...prev, ...payload } : prev));
      localStorage.removeItem(`task_${task.id}`);
      setTaskRefreshKey((k) => k + 1);
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        (typeof error?.response?.data === "string" ? error.response.data : null) ||
        "Failed to complete. Please try again.";
      console.error("Mark complete error:", { status: error?.response?.status, data: error?.response?.data, msg: errMsg });
      toast.error(errMsg);
      throw error;
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

    // Check if payment is pending - disable messaging if so
    if (isPaymentPending) {
      toast.error("Please complete payment before messaging. Payment is required to confirm the task assignment.", {
        duration: 5000,
        action: {
          label: "Complete Payment",
          onClick: () => router.push("/payments"),
        },
      });
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

  // Check if user accepted an offer but didn't complete payment
  useEffect(() => {
    if (!id || !userId) return;
    
    const checkPendingPayment = async () => {
      try {
        const paymentData = sessionStorage.getItem("paymentData");
        const paymentPageVisited = sessionStorage.getItem("payment_page_visited");
        const pendingVerification = localStorage.getItem("pending_payment_verification");
        
        if (paymentData && paymentPageVisited) {
          const data = JSON.parse(paymentData);
          if (data.taskId !== id) {
            setIsPaymentPending(false);
            return;
          }
          // For this task: get fresh status from API so we don't show "payment pending" after user just paid
          let paymentCompleted = false;
          if (task?.status === "in_progress" || task?.assignedTasker) {
            paymentCompleted = true;
          } else {
            try {
              const token = localStorage.getItem("token");
              const res = await fetch(`https://api.jobpool.in/api/v1/get-job/${id}/`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                credentials: "omit",
              });
              if (res.ok) {
                const json = await res.json();
                const job = json?.data;
                const assignedId = job?.assigned_tasker_id || job?.assigned_user_id || job?.assigned_to || job?.accepted_bidder_id || job?.worker_id;
                const status = (job?.status || "").toLowerCase();
                if (status === "in_progress" || assignedId || job?.payment_status === "success" || job?.payment_status === true) {
                  paymentCompleted = true;
                }
              }
            } catch (_) {
              // Fall back to current task state
              if (task?.status === "in_progress" || task?.assignedTasker) paymentCompleted = true;
            }
          }
          if (paymentCompleted) {
            console.log("✅ Payment completed for task:", id, "- clearing flags");
            sessionStorage.removeItem("paymentData");
            sessionStorage.removeItem("payment_page_visited");
            localStorage.removeItem("pending_payment_verification");
            setIsPaymentPending(false);
            return;
          }
          const isTaskOpen = task?.status === "open" || task?.status === "Open" || !task?.status || task?.status === true;
          if (isTaskOpen) {
            console.warn("⚠️ Payment pending for task:", id, "- task is still open");
            setIsPaymentPending(true);
            toast.error("⚠️ Payment was not completed. Please complete payment to confirm the assignment.", {
              duration: 6000,
              action: {
                label: "Complete Payment",
                onClick: () => router.push("/payments"),
              },
            });
          } else if (pendingVerification) {
            console.warn("⚠️ Payment verification pending for task:", id);
            setIsPaymentPending(true);
            toast.error("⚠️ Payment verification pending. Please wait for confirmation.", {
              duration: 6000,
            });
          } else {
            setIsPaymentPending(false);
          }
        } else {
          setIsPaymentPending(false);
        }
      } catch (e) {
        console.error("Error checking pending payment:", e);
        setIsPaymentPending(false);
      }
    };
    
    const timeoutId = setTimeout(() => {
      checkPendingPayment();
    }, task ? 100 : 1000);
    
    return () => clearTimeout(timeoutId);
  }, [id, userId, router, task]);

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
      <div className="min-h-screen p-4 md:p-6 animate-in fade-in duration-200">
        <div className="mx-auto max-w-3xl">
          <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-6" />
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <div className="h-7 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-4" />
            <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded animate-pulse mb-2" />
            <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-700 rounded animate-pulse mb-6" />
            <div className="flex gap-3 mb-6">
              <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>
            <div className="h-24 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse mb-6" />
            <div className="h-12 w-full max-w-xs bg-blue-200/50 dark:bg-slate-600 rounded-xl animate-pulse" />
          </div>
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

  // Don't block on userProfile – use user from store/localStorage for header; profile loads in background
  const headerUser = userProfile
    ? { name: userProfile.name, avatar: userProfile.avatar }
    : user
      ? { name: user.name, avatar: user.avatar || "/images/placeholder.svg" }
      : { name: "User", avatar: "/images/placeholder.svg" };

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
      <Header user={headerUser} onSignOut={handleSignOut} />
      
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
            {/* Poster can leave review only after final completion */}
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
              existingReview={existingReview}
            />
            {/* Completion controls — backend must set job_completion_status = 1 only when BOTH tasker_completed and taskmaster_completed are true */}
            <div className="mt-4 space-y-2">
              {/* Tasker completion button (only for assigned tasker, before they confirm) */}
              {!isTaskPoster &&
                task.assignedTasker?.id === userId &&
                !task.tasker_completed &&
                task.job_completion_status !== 1 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCompleteReviewAsTaskmaster(false);
                      setCompleteReviewOpen(true);
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Mark task as completed (Tasker)"}
                  </Button>
                )}

              {/* Taskmaster completion button (only for poster, before they confirm) */}
              {isTaskPoster &&
                !task.taskmaster_completed &&
                task.job_completion_status !== 1 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCompleteReviewAsTaskmaster(true);
                      setCompleteReviewOpen(true);
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Updating..." : "Confirm completion (Taskmaster)"}
                  </Button>
                )}

              {/* Small status text so both parties know what's pending */}
              {(task.tasker_completed || task.taskmaster_completed) &&
                task.job_completion_status !== 1 && (
                  <p className="text-xs text-muted-foreground">
                    {task.tasker_completed && !task.taskmaster_completed
                      ? "Tasker has marked the task as completed. Waiting for taskmaster confirmation."
                      : !task.tasker_completed && task.taskmaster_completed
                      ? "Taskmaster has confirmed completion. Waiting for tasker to mark as completed."
                      : null}
                  </p>
                )}
            </div>
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
              isVerified={isVerified}
              verificationChecked={verificationChecked}
            />
          </div>
          
          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            <PosterInfo
              poster={task.poster}
              isTaskPoster={isTaskPoster}
              handleMessageUser={handleMessageUser}
              isPaymentPending={isPaymentPending}
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
                  
                  // Check if cancellation reason is provided
                  if (!cancelReason.trim()) {
                    toast.error("Please provide a reason for cancellation");
                    setIsCancelling(false);
                    return;
                  }
                  
                  // Determine user role: taskmaster (poster) or tasker (assigned)
                  const isTaskMaster = task?.poster?.id === userId;
                  const isTasker = task?.assignedTasker?.id === userId;
                  const role = isTaskMaster ? "taskmaster" : isTasker ? "tasker" : "unknown";
                  
                  if (role === "unknown") {
                    toast.error("Unable to determine your role for this task");
                    setIsCancelling(false);
                    return;
                  }
                  
                  // Use the new user-cancel endpoint
                  const reason = encodeURIComponent(cancelReason.trim());
                  const resp = await axiosInstance.put(
                    `/user-cancel-job/${id}/?user_id=${userId}&role=${role}&cancellation_reason=${reason}`
                  );
                  
                  if (resp.data?.status_code === 200 || resp.status === 200) {
                    const refundMessage = resp.data.refund_message || "";
                    const cancellationFee = resp.data.cancellation_fee || "";
                    
                    toast.success(`Task cancelled successfully! ${cancellationFee ? `Fee: ${cancellationFee}. ` : ''}${refundMessage}`);
                    setShowCancelDialog(false);
                    setCancelReason("");
                    
                    // Clear cache to force fresh data
                    const cacheKey = `task_${id}`;
                    localStorage.removeItem(cacheKey);
                    
                    // Update local state immediately (optimistic update)
                    setTask((prev) => (prev ? { ...prev, status: "canceled", cancel_status: true } : prev));
                    
                    // Refresh task data from backend after a short delay
                    setTimeout(async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`https://api.jobpool.in/api/v1/get-job/${id}/`, {
                          method: 'GET',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          credentials: 'omit',
                        });
                        
                        if (response.ok) {
                          const data = await response.json();
                          if (data.status_code === 200 && data.data) {
                            const job = data.data;
                            let jobStatus = "open";
                            if (job.job_completion_status === 1) {
                              jobStatus = "completed";
                            } else if (job.deletion_status) {
                              jobStatus = "deleted";
                            } else if (job.cancel_status) {
                              jobStatus = "canceled";
                            } else if (job.status === "in_progress" || job.status === "working" || job.status === "assigned") {
                              jobStatus = "in_progress";
                            }
                            
                            // Update task with fresh data from backend
                            setTask((prev) => prev ? {
                              ...prev,
                              status: jobStatus,
                              cancel_status: job.cancel_status ?? false,
                            } : prev);
                          }
                        }
                      } catch (refreshError) {
                        console.error("Error refreshing task after cancellation:", refreshError);
                      }
                    }, 1000); // Wait 1 second for backend to process
                  } else {
                    toast.error(resp.data?.message || "Failed to cancel task");
                  }
                } catch (e: any) {
                  console.error("Task cancel error:", e);
                  const errMsg = e?.response?.data?.detail || e?.response?.data?.message || "Failed to cancel task";
                  toast.error(errMsg);
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

      <CompletionReviewModal
        open={completeReviewOpen}
        onOpenChange={setCompleteReviewOpen}
        revieweeName={
          completeReviewAsTaskmaster
            ? (task?.assignedTasker?.name || "the tasker")
            : (task?.poster?.name || "the taskmaster")
        }
        onSubmit={handleCompleteReviewSubmit}
        isTaskmasterReviewingTasker={completeReviewAsTaskmaster}
      />
    </div>
  );
}