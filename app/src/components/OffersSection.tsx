

// import { FormEvent, useState } from "react";
// import { IndianRupee, Star } from "lucide-react";
// import { Button } from "./ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "./ui/card";
// import { Input } from "./ui/input";
// import { Textarea } from "./ui/textarea";
// import { Avatar, AvatarFallback } from "./ui/avatar";
// import axiosInstance from "../lib/axiosInstance";
// import { toast } from "sonner";
// import Link from "next/link";
// import { useRouter } from "next/navigation";

// interface Image {
//   id: string;
//   url: string;
//   alt: string;
// }

// interface User {
//   id: string;
//   name: string;
//   rating: number;
//   taskCount: number;
//   joinedDate: string;
// }

// interface Offer {
//   id: string;
//   tasker: User;
//   amount: number;
//   message: string;
//   createdAt: string;
// }

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

// interface OffersSectionProps {
//   task: Task;
//   offers: Offer[];
//   isTaskPoster: boolean;
//   hasSubmittedOffer: boolean;
//   handleSubmitOffer: (e: FormEvent) => void;
//   handleMessageUser: (receiverId?: string) => void;
//   offerAmount: string;
//   setOfferAmount: (value: string) => void;
//   offerMessage: string;
//   setOfferMessage: (value: string) => void;
//   isSubmitting: boolean;
//   currentUserId?: string;
// }

// export function OffersSection({
//   task,
//   offers,
//   isTaskPoster,
//   hasSubmittedOffer,
//   handleSubmitOffer,
//   handleMessageUser,
//   offerAmount,
//   setOfferAmount,
//   offerMessage,
//   setOfferMessage,
//   isSubmitting,
//   currentUserId,
// }: OffersSectionProps) {
//   const [isAccepting, setIsAccepting] = useState<string | null>(null);
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
//   ) => {
//     const input = e.target.value;

//     if (/\d/.test(input)) {
//       setError("Numbers are not allowed in the message.");
//     } else {
//       setError("");
//       setOfferMessage(input);
//     }
//   };

//   // Filter offers: task posters see all, taskers see only their own if they have submitted
//   const visibleOffers = isTaskPoster
//     ? offers
//     : hasSubmittedOffer
//     ? currentUserId
//       ? offers.filter((offer) => offer.tasker.id === currentUserId)
//       : offers // Fallback: assume offers contains only the tasker's offer if hasSubmittedOffer is true
//     : [];

//   const handleAcceptOffer = async (offer: Offer) => {
//   setIsAccepting(offer.id);
//   try {
//     const response = await axiosInstance.put(
//       `/accept-bid/${task.id}/${offer.tasker.id}/`
//     );

//     if (response.data.status_code === 200) {
//       toast.success(response.data.message || "Bid accepted successfully");
//       // Store tasker_id and taskposter_id in sessionStorage
//       sessionStorage.setItem("paymentData", JSON.stringify({
//         taskId: task.id,
//         taskerId: offer.tasker.id,
//         taskPosterId: task.poster.id,
//         amount: offer.amount,
//       }));
//       router.push("/payments");
//     } else {
//       toast.error(response.data.message || "Failed to accept bid");
//     }
//   } catch (error: any) {
//     console.error("Error accepting bid:", error);
//     toast.error(
//       error.response?.data?.message ||
//         "An error occurred while accepting the bid"
//     );
//   } finally {
//     setIsAccepting(null);
//   }
// };

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Offers ({visibleOffers.length})</CardTitle>
//         <CardDescription>
//           {isTaskPoster
//             ? "Choose the best offer for your task"
//             : hasSubmittedOffer
//             ? "Your submitted offer"
//             : "Submit an offer for this task"}
//         </CardDescription>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {visibleOffers.length === 0 ? (
//           <p className="text-center text-muted-foreground py-4">
//             {isTaskPoster
//               ? "No offers yet"
//               : hasSubmittedOffer
//               ? "Your offer is being processed"
//               : "No offers submitted yet"}
//           </p>
//         ) : (
//           visibleOffers.map((offer) => (
//             <div key={offer.id} className="border rounded-lg p-4 space-y-3">
//               <div className="flex justify-between items-start">
//                 <div className="flex items-center gap-2">
//                   <Link
//                     href={`/profilepage/${offer.tasker.id}`}
//                     className="flex items-center gap-2 hover:underline"
//                   >
//                     <Avatar className="h-8 w-8">
//                       <AvatarFallback>
//                         {offer.tasker.name.charAt(0)}
//                       </AvatarFallback>
//                     </Avatar>
//                     <div>
//                       <p className="font-medium">{offer.tasker.name}</p>
//                       <div className="flex items-center gap-1 text-sm text-muted-foreground">
//                         <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
//                         <span>
//                           {offer.tasker.rating} • {offer.tasker.taskCount} tasks
//                         </span>
//                       </div>
//                     </div>
//                   </Link>
//                 </div>
//                 <div className="text-right">
//                   <p className="font-bold">
//                     <IndianRupee className="w-4 h-4 inline" />{" "}
//                     {offer.amount.toFixed(2)}
//                   </p>
//                   <p className="text-xs text-muted-foreground">
//                     {offer.createdAt}
//                   </p>
//                 </div>
//               </div>
//               <p className="text-sm">{offer.message}</p>
//               {isTaskPoster && (
//                 <div className="flex gap-2">
//                   {!task.status && (
                    
//                       <Button
//                         className="w-full"
//                         size="sm"
//                         onClick={() => handleAcceptOffer(offer)}
//                         disabled={isAccepting === offer.id}
//                       >
//                         {isAccepting === offer.id
//                           ? "Accepting..."
//                           : "Accept Offer"}
//                       </Button>
                
//                   )}
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => handleMessageUser(offer.tasker.id)}
//                   >
//                     Message
//                   </Button>
//                 </div>
//               )}
//             </div>
//           ))
//         )}
//       </CardContent>
//       {!isTaskPoster && task.status && (
//         <CardFooter>
//           <p className="text-muted-foreground">
//             This task is no longer accepting offers.
//           </p>
//         </CardFooter>
//       )}
//       {!isTaskPoster && !task.status && !hasSubmittedOffer && (
//         <CardFooter>
//           <form onSubmit={handleSubmitOffer} className="w-full space-y-4">
//             <div className="space-y-2">
//               <label
//                 htmlFor="offerAmount"
//                 className="flex items-center space-x-1"
//               >
//                 <span>Your Offer</span>
//                 <IndianRupee className="w-3 h-3" />
//               </label>
//               <Input
//                 id="offerAmount"
//                 type="number"
//                 placeholder="e.g., 50"
//                 value={offerAmount}
//                 onChange={(e) => setOfferAmount(e.target.value)}
//                 required
//                 min="1"
//               />
//             </div>
//             <div className="space-y-2">
//               <label htmlFor="offerMessage">Message</label>
//               <Textarea
//                 id="offerMessage"
//                 placeholder="Introduce yourself and explain why you're a good fit for this task..."
//                 value={offerMessage}
//                 onChange={handleChange}
//                 rows={4}
//                 required
//               />
//               {error && <p className="text-red-500 text-sm">{error}</p>}
//             </div>
//             <Button type="submit" className="w-full" disabled={isSubmitting}>
//               {isSubmitting ? "Submitting..." : "Submit Offer"}
//             </Button>
//           </form>
//         </CardFooter>
//       )}
//       {!isTaskPoster && !task.status && hasSubmittedOffer && (
//         <CardFooter>
//           <p className="text-muted-foreground">
//             You have already submitted an offer for this task.
//           </p>
//         </CardFooter>
//       )}
//     </Card>
//   );
// }


import { FormEvent, useState, useEffect } from "react";
import { IndianRupee, Star } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import axiosInstance from "../lib/axiosInstance";
import {
  buildPaymentDescriptionFromPosterPreview,
  fetchFeePreview,
  formatInr,
  posterPayableAmount,
  type PosterFeeData,
} from "@/lib/feePreview";
import { PosterFeeBreakdown } from "@/components/fee/PosterFeeBreakdown";
import { getRazorpayCheckoutBranding } from "@/lib/razorpayBranding";
import { jobIdVariants } from "../lib/jobIdVariants";
import { toast } from "sonner";
import useStore from "@/lib/Zustand";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { NoOffersEmptyState } from "./NoOffersEmptyState";
import { offersCountLabel } from "@/lib/jobBids";
import {
  buildPaymentsPath,
  buildPaymentsPathWithAutopay,
  buildPublicPaymentsUrl,
  isCapacitorNative,
  openExternalCheckout,
  paymentLinkRedirectFields,
  persistPaymentSession,
  paymentsRouteFromSession,
  shouldUsePaymentLinkFlow,
} from "@/lib/paymentNavigation";

interface Image {
  id: string;
  url: string;
  alt: string;
}

interface User {
  id: string;
  name: string;
  rating: number;
  taskCount: number;
  joinedDate: string;
}

interface Offer {
  id: string;
  tasker: User;
  amount: number;
  message: string;
  createdAt: string;
  status?: string;
}

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

export interface OffersSectionProps {
  task: Task;
  offers: Offer[];
  isTaskPoster: boolean;
  hasSubmittedOffer: boolean;
  handleSubmitOffer: (e: FormEvent) => void;
  handleMessageUser: (receiverId?: string) => void;
  offerAmount: string;
  setOfferAmount: (value: string) => void;
  offerMessage: string;
  setOfferMessage: (value: string) => void;
  isSubmitting: boolean;
  currentUserId?: string;
  blockSubmitInitial?: boolean; // hint from parent to suppress form immediately
  isVerified?: boolean; // verification status for bid submission
  verificationChecked?: boolean; // whether verification status has been checked
  /** From parent - avoids flicker; only show payment pending after async API check */
  isPaymentPending?: boolean;
  paymentCheckDone?: boolean;
  /** When true and offers empty, show loading skeleton instead of "No offers yet" */
  bidsLoading?: boolean;
  /** Total bids from GET /get-job-with-bids/ when paginated */
  bidsTotal?: number | null;
  bidsHasMore?: boolean;
  /** Inside task Offers/Questions tabs — skip nested card chrome */
  embedded?: boolean;
}

function sameOfferUserId(a: unknown, b: unknown): boolean {
  if (a == null || b == null) return false;
  return String(a).trim() === String(b).trim();
}

export function OffersSection({
  task,
  offers,
  isTaskPoster,
  hasSubmittedOffer,
  handleSubmitOffer,
  handleMessageUser,
  offerAmount,
  setOfferAmount,
  offerMessage,
  setOfferMessage,
  isSubmitting,
  currentUserId,
  blockSubmitInitial = false,
  isVerified = false,
  verificationChecked = false,
  isPaymentPending: parentPaymentPending,
  paymentCheckDone,
  bidsLoading = false,
  bidsTotal = null,
  bidsHasMore = false,
  embedded = false,
}: OffersSectionProps) {
  const [error, setError] = useState("");
  const router = useRouter();
  const [completeOpen, setCompleteOpen] = useState<boolean>(false);
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [completing, setCompleting] = useState<boolean>(false);
  const [selectedFromSession, setSelectedFromSession] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState<string | null>(null);
  const [paymentUrlForApp, setPaymentUrlForApp] = useState<string | null>(null);
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false);
  /** Poster reviews fees before accept-bid + payment (web & PWA). */
  const [acceptFeeOffer, setAcceptFeeOffer] = useState<Offer | null>(null);
  const [acceptFeePreview, setAcceptFeePreview] = useState<PosterFeeData | null>(null);
  const [acceptFeePreviewLoading, setAcceptFeePreviewLoading] = useState(false);
  const [acceptFeePreviewError, setAcceptFeePreviewError] = useState<string | null>(null);
  const addNotifications = useStore((s) => s.addNotifications);
  const [taskerReviewStats, setTaskerReviewStats] = useState<Record<string, { average: number; count: number }>>({});

  // Tasker review lines: fetch profiles in parallel but merge each as it arrives (faster perceived load).
  useEffect(() => {
    const taskerIds = [...new Set(offers.map((o) => o.tasker?.id).filter(Boolean))] as string[];
    if (taskerIds.length === 0) {
      setTaskerReviewStats({});
      return;
    }
    let cancelled = false;
    setTaskerReviewStats((prev) => {
      const next = { ...prev };
      for (const k of Object.keys(next)) {
        if (!taskerIds.includes(k)) delete next[k];
      }
      return next;
    });
    void Promise.all(
      taskerIds.map(async (tid) => {
        try {
          const res = await axiosInstance.get(`/profile?user_id=${tid}`);
          const payload = res.data?.data ?? res.data;
          const reviews = payload?.reviews ?? [];
          if (!Array.isArray(reviews)) return;
          const taskerReviews = reviews.filter((r: any) => (r?.role ?? "").toLowerCase() === "tasker");
          const count = taskerReviews.length;
          if (count === 0) return;
          const sum = taskerReviews.reduce((s: number, r: any) => s + (Number(r?.rating) || 0), 0);
          const row = { average: sum / count, count };
          if (!cancelled) {
            setTaskerReviewStats((prev) => ({ ...prev, [tid]: row }));
          }
        } catch (_) {}
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [offers]);

  // Try to read accepted tasker from sessionStorage (when accept was done earlier in this browser)
  // This is a graceful fallback when API doesn't return accepted status on bids
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("paymentData");
      if (raw) {
        const data = JSON.parse(raw);
        if (data && String(data.taskId) === String(task.id)) {
          setSelectedFromSession(String(data.taskerId));
        }
      }
    } catch (_) {
      // ignore
    }
  }, [task.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const input = e.target.value;

    if (/\d/.test(input)) {
      setError("Numbers are not allowed in the message.");
    } else {
      setError("");
      setOfferMessage(input);
    }
  };

  // Check if payment is pending for this task
  const checkPaymentPending = () => {
    try {
      // If task is already in_progress, payment was completed - don't show pending
      if (task.status === "in_progress" || task.assignedTasker) {
        // Clear old payment flags since payment is complete
        try {
          const paymentData = sessionStorage.getItem("paymentData");
          if (paymentData) {
            const data = JSON.parse(paymentData);
            if (data.taskId === task.id) {
              sessionStorage.removeItem("paymentData");
              sessionStorage.removeItem("payment_page_visited");
              localStorage.removeItem("pending_payment_verification");
            }
          }
        } catch {}
        return false; // Payment is complete
      }
      
      const paymentData = sessionStorage.getItem("paymentData");
      const paymentPageVisited = sessionStorage.getItem("payment_page_visited");
      const pendingVerification = localStorage.getItem("pending_payment_verification");
      
      // Payment is pending if:
      // 1. paymentData exists for this task
      // 2. payment_page_visited flag exists
      // 3. Task status is still "open" (not "in_progress") OR pendingVerification exists
      // AND task is not yet in_progress
      if (paymentData && paymentPageVisited) {
        const data = JSON.parse(paymentData);
        if (data.taskId === task.id) {
          // Check if task is still open (payment not completed)
          const isTaskOpen = task.status === "open" || task.status === "Open" || !task.status || task.status === true;
          // Payment is pending if task is open OR pendingVerification exists
          return (isTaskOpen || !!pendingVerification) && task.status !== "in_progress";
        }
      }
    } catch (e) {
      console.error("Error checking payment pending:", e);
    }
    return false;
  };

  // Use parent's payment state when available - don't show pending until API check completes (avoids flicker)
  const isPaymentPending =
    paymentCheckDone !== undefined && parentPaymentPending !== undefined
      ? paymentCheckDone && parentPaymentPending
      : checkPaymentPending();

  // Deduplicate offers: If same user has multiple offers, keep only the most recent one
  // This prevents showing duplicate offers from the same tasker
  const deduplicatedOffers = offers.reduce((acc: Offer[], current: Offer) => {
    const currentTaskerId = current.tasker?.id;
    if (!currentTaskerId) return acc;
    const existingIndex = acc.findIndex(
      (offer) => offer.tasker?.id === currentTaskerId,
    );
    
    if (existingIndex === -1) {
      // First offer from this user - add it
      acc.push(current);
    } else {
      // User already has an offer - keep the most recent one (or accepted one)
      const existing = acc[existingIndex];
      
      // Priority: accepted > most recent
      if (current.status === "accepted" && existing.status !== "accepted") {
        acc[existingIndex] = current; // Replace with accepted one
      } else if (existing.status !== "accepted") {
        // If neither is accepted, keep the most recent one
        const currentDate = new Date(current.createdAt).getTime();
        const existingDate = new Date(existing.createdAt).getTime();
        if (currentDate > existingDate) {
          acc[existingIndex] = current; // Replace with more recent one
        }
      }
    }
    
    return acc;
  }, []);

  // Show all offers to all users (after deduplication)
  const visibleOffers = deduplicatedOffers;

  // Parent `isTaskPoster` can be briefly wrong if poster id vs user id types differ — re-check here.
  const effectiveIsTaskPoster =
    isTaskPoster ||
    (!!currentUserId && task.poster?.id != null && sameOfferUserId(task.poster.id, currentUserId));

  // Prevent brief flicker of the submit form on assigned/in-progress tasks
  const isAssignedToMe = !!(
    currentUserId &&
    task.assignedTasker &&
    sameOfferUserId(task.assignedTasker.id, currentUserId)
  );
  const hasLocalAccepted = selectedFromSession && currentUserId && selectedFromSession === String(currentUserId);
  const shouldBlockSubmit =
    task.status === "completed" ||
    (task.status === "in_progress" && !isPaymentPending) || // Don't block if payment is pending
    (isAssignedToMe && !isPaymentPending) || // Don't block if payment is pending
    (!!hasLocalAccepted && !isPaymentPending) || // Don't block if payment is pending
    blockSubmitInitial;


  const resetAcceptFeeDialog = () => {
    setAcceptFeeOffer(null);
    setAcceptFeePreview(null);
    setAcceptFeePreviewError(null);
    setAcceptFeePreviewLoading(false);
  };

  const openAcceptFeeDialog = (offer: Offer) => {
    setAcceptFeeOffer(offer);
    setAcceptFeePreview(null);
    setAcceptFeePreviewError(null);
    setAcceptFeePreviewLoading(true);
    void fetchFeePreview(offer.amount, "poster")
      .then((d) => {
        setAcceptFeePreview(d as PosterFeeData);
        setAcceptFeePreviewError(null);
      })
      .catch((e: unknown) => {
        setAcceptFeePreview(null);
        setAcceptFeePreviewError(e instanceof Error ? e.message : "Unable to load fees");
      })
      .finally(() => setAcceptFeePreviewLoading(false));
  };

  /** After poster confirms fee breakdown: accept bid + session + payment navigation. */
  const runAcceptBidAndPaymentFlow = async (offer: Offer, posterFeesForPayment?: PosterFeeData | null) => {
    const response = await axiosInstance.put(`/accept-bid/${task.id}/${offer.tasker.id}/`);

    if (response.data.status_code === 200) {
        toast.success(response.data.message || "Bid accepted successfully");
        addNotifications([{
          id: `accept-${task.id}-${offer.tasker.id}-${Date.now()}`,
          type: "bid",
          title: "Offer accepted",
          description: `You accepted ${offer.tasker.name}'s offer for ₹${offer.amount}. Complete payment to confirm.`,
          createdAt: new Date().toISOString(),
          read: false,
          link: buildPaymentsPath({
            taskId: task.id,
            taskerId: offer.tasker.id,
            taskPosterId: task.poster.id,
            amount: offer.amount,
          }),
          direction: "received",
          taskId: task.id,
        }]);
        
        // Update task status immediately to show in My Tasks
        const updatedTask = {
          ...task,
          status: "in_progress",
          assignedTasker: offer.tasker,
          accepted_bidder_id: offer.tasker.id,
          assigned_tasker_id: offer.tasker.id
        };
        
        // Update sessionStorage to reflect the change
        try {
          const existingTasks = JSON.parse(sessionStorage.getItem("user_tasks") || "[]");
          const updatedTasks = existingTasks.map((t: any) => 
            t.id === task.id ? updatedTask : t
          );
          sessionStorage.setItem("user_tasks", JSON.stringify(updatedTasks));
        } catch (e) {
          console.warn("Failed to update sessionStorage:", e);
        }
        
        // Store tasker_id and taskposter_id in sessionStorage
        persistPaymentSession({
          taskId: task.id,
          taskerId: offer.tasker.id,
          taskPosterId: task.poster.id,
          amount: offer.amount,
          taskTitle: task.title,
        });
        
        // Store accepted bidder info for immediate UI update
        sessionStorage.setItem("acceptedBidder", JSON.stringify({
          taskId: task.id,
          taskerId: offer.tasker.id,
          taskerName: offer.tasker.name,
          amount: offer.amount,
          timestamp: Date.now()
        }));
        
        // Store info to remove bid from My Bids section
        sessionStorage.setItem("acceptedBidRemoval", JSON.stringify({
          taskId: task.id,
          taskerId: offer.tasker.id,
          timestamp: Date.now()
        }));

        // Android PWA / native: payment link in external browser. iOS uses embedded Razorpay below.
        if (shouldUsePaymentLinkFlow()) {
          setPaymentLinkLoading(true);
          try {
            let posterFees: PosterFeeData;
            try {
              posterFees =
                posterFeesForPayment ??
                ((await fetchFeePreview(offer.amount, "poster")) as PosterFeeData);
            } catch (feeErr: unknown) {
              const msg = feeErr instanceof Error ? feeErr.message : "Unable to load fees";
              toast.error(msg);
              setPaymentLinkLoading(false);
              return;
            }
            const gstAmount = Number(posterFees.gst_amount ?? 0);
            const commissionAmount = Number(posterFees.commission_amount ?? posterFees.platform_fee ?? 0);
            const payableAmount = posterPayableAmount(posterFees, offer.amount) ?? 0;
            if (!payableAmount || payableAmount <= 0) {
              toast.error("Invalid fee preview from server.");
              setPaymentLinkLoading(false);
              return;
            }
            const paymentDescription = buildPaymentDescriptionFromPosterPreview(task.title, posterFees);
            const checkoutBranding = getRazorpayCheckoutBranding();
            const paymentUrlRes = await axiosInstance.post("/create-payment-link/", {
              postId: task.id,
              bid_amount: Number((posterFees.bid_amount ?? offer.amount).toFixed(2)),
              gst_amount: Number(gstAmount.toFixed(2)),
              commission_amount: Number(commissionAmount.toFixed(2)),
              payable_amount: Number(payableAmount.toFixed(2)),
              tasker_id: offer.tasker.id,
              taskmanager_id: task.poster.id,
              task_title: task.title,
              payment_description: paymentDescription,
              checkout_name: checkoutBranding.name,
              checkout_image: checkoutBranding.image,
              ...paymentLinkRedirectFields(),
            });
            const res = paymentUrlRes.data;
            const d = res?.data;
            const razorpayUrl = d?.short_url ?? res?.short_url;
            if (razorpayUrl) {
              try {
                localStorage.setItem(
                  "pending_payment_order",
                  JSON.stringify({
                    postId: task.id,
                    order_id: d?.order_id || "",
                    tasker_id: offer.tasker.id,
                    taskmanager_id: task.poster.id,
                    bid_amount: Number((posterFees.bid_amount ?? offer.amount).toFixed(2)),
                    gst_amount: Number(gstAmount.toFixed(2)),
                    commission_amount: Number(commissionAmount.toFixed(2)),
                    payable_amount: Number(payableAmount.toFixed(2)),
                  })
                );
              } catch (_) {}
              if (isCapacitorNative()) {
                toast.info("Complete payment in the window that opens, then return to JobPool.");
                void openExternalCheckout(razorpayUrl, {
                  onBrowserClosed: () => {
                    toast.message("Back in JobPool", {
                      description: "If payment succeeded, open Dashboard to see the updated task.",
                    });
                  },
                  onNeedSafariCopy: () => {
                    toast.info("Link copied. Open Safari, paste in the address bar, and pay.");
                  },
                });
                return;
              }
              setPaymentUrlForApp(razorpayUrl);
            } else {
              const fallbackUrl = buildPublicPaymentsUrl({
                taskId: task.id,
                taskerId: offer.tasker.id,
                taskPosterId: task.poster.id,
                amount: offer.amount,
                taskTitle: task.title,
              });
              toast.error("Payment link unavailable. Copy link below and open in Safari.");
              setPaymentUrlForApp(fallbackUrl);
            }
          } catch (e: any) {
            console.error("create-payment-link failed:", e?.response?.data ?? e);
            const fallbackUrl = buildPublicPaymentsUrl({
              taskId: task.id,
              taskerId: offer.tasker.id,
              taskPosterId: task.poster.id,
              amount: offer.amount,
              taskTitle: task.title,
            });
            toast.error("Copy the link below and paste in Safari to pay.");
            setPaymentUrlForApp(fallbackUrl);
          } finally {
            setPaymentLinkLoading(false);
          }
          return;
        }
        router.push(
          buildPaymentsPathWithAutopay({
            taskId: task.id,
            taskerId: offer.tasker.id,
            taskPosterId: task.poster.id,
            amount: offer.amount,
            taskTitle: task.title,
          }),
        );
    } else {
      toast.error(response.data.message || "Failed to accept bid");
      throw new Error(response.data.message || "Failed to accept bid");
    }
  };

  const handleConfirmAcceptAfterFeeReview = async () => {
    const offer = acceptFeeOffer;
    if (!offer) return;
    if (acceptFeePreviewLoading || !acceptFeePreview || acceptFeePreviewError) {
      toast.error("Wait for the payment breakdown to load, or fix the error above.");
      return;
    }
    setIsAccepting(offer.id);
    try {
      await runAcceptBidAndPaymentFlow(offer, acceptFeePreview);
      resetAcceptFeeDialog();
    } catch (error: any) {
      console.error("Error accepting bid:", error);
      if (!error?.message || error.message === "Failed to accept bid") {
        toast.error(
          error.response?.data?.message || "An error occurred while accepting the bid",
        );
      }
    } finally {
      setIsAccepting(null);
    }
  };

  const openCompleteModal = (offerId: string) => {
    setActiveOfferId(offerId);
    setCompleteOpen(true);
  };

  const handleCompleteWithReview = async () => {
    if (!activeOfferId) return;
    const offer = offers.find(o => o.id === activeOfferId);
    if (!offer) return;
    try {
      setCompleting(true);
      const token = typeof window !== "undefined" && (localStorage.getItem("token") || sessionStorage.getItem("token"));
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["X-Access-Token"] = token;
      }
      const reviewBody = { rating: reviewRating, comment: reviewComment };
      const tryIds = jobIdVariants(task.id);
      let lastErr: unknown = null;
      for (let i = 0; i < tryIds.length; i++) {
        const jid = tryIds[i];
        try {
          await axiosInstance.put(
            `/mark-complete-by-taskmaster/${jid}/`,
            reviewBody,
            { headers }
          );
          lastErr = null;
          break;
        } catch (e: unknown) {
          lastErr = e;
          const st = (e as { response?: { status?: number } })?.response?.status;
          const more = i < tryIds.length - 1;
          if (more && (st === 404 || st === 500)) continue;
          throw e;
        }
      }
      if (lastErr) throw lastErr;
      toast.success("Task marked complete and review submitted");
      setCompleteOpen(false);
      setReviewComment("");
    } catch (e: any) {
      const errMsg =
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        (typeof e?.response?.data === "string" ? e.response.data : null) ||
        "Failed to complete task";
      toast.error(errMsg);
    } finally {
      setCompleting(false);
    }
  };

  const offersBody =
    visibleOffers.length === 0 ? (
      bidsLoading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border-0 p-4 bg-gray-50 dark:bg-slate-800/50 animate-pulse">
              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-3 w-32 rounded bg-gray-200 dark:bg-slate-700" />
                </div>
              </div>
              <div className="h-3 w-full rounded bg-gray-200 dark:bg-slate-700 mt-3" />
            </div>
          ))}
          <p className="text-center text-xs text-muted-foreground">Loading offers…</p>
        </div>
      ) : (
        <NoOffersEmptyState
          variant={
            effectiveIsTaskPoster
              ? "poster"
              : hasSubmittedOffer
                ? "processing"
                : "tasker"
          }
        />
      )
    ) : (
      visibleOffers.map((offer) => (
        <div
          key={offer.id}
          className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden hover:border-slate-300/80 transition-colors"
        >
          <div className="space-y-3.5 p-3.5 md:p-5">
            <div className="flex items-start gap-3">
              <Link href={`/profilepage/${offer.tasker.id}`} className="shrink-0 hover:opacity-90">
                <Avatar className="h-10 w-10 ring-2 ring-slate-100">
                  <AvatarFallback className="text-sm font-semibold">
                    {offer.tasker.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/profilepage/${offer.tasker.id}`}
                    className="min-w-0 hover:opacity-90"
                  >
                    <p className="font-semibold text-slate-900 leading-snug break-words">
                      {offer.tasker.name}
                    </p>
                  </Link>
                  <p className="shrink-0 text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                    {(() => {
                      try {
                        return new Date(offer.createdAt).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      } catch {
                        return "Just now";
                      }
                    })()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                  <div className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                    <span className="truncate">
                      {taskerReviewStats[offer.tasker.id]?.count != null &&
                      taskerReviewStats[offer.tasker.id].count > 0
                        ? `${taskerReviewStats[offer.tasker.id].average.toFixed(1)} ★ (${taskerReviewStats[offer.tasker.id].count} reviews)`
                        : offer.tasker.rating != null && offer.tasker.rating > 0
                          ? `${offer.tasker.rating} ★`
                          : "New user"}
                      {offer.tasker.taskCount != null && offer.tasker.taskCount > 0 && (
                        <> · {offer.tasker.taskCount} tasks</>
                      )}
                    </span>
                  </div>
                  {(effectiveIsTaskPoster ||
                    (currentUserId && sameOfferUserId(offer.tasker.id, currentUserId))) && (
                    <p className="font-bold text-slate-900 text-sm tabular-nums shrink-0">
                      <IndianRupee className="w-3.5 h-3.5 inline opacity-70" />{" "}
                      {offer.amount.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-gradient-to-b from-slate-50/95 to-white px-3.5 py-3 md:px-4 md:py-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                What they said
              </p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {offer.message}
              </p>
            </div>
            {(offer.status === "accepted" ||
              (task.assignedTasker && sameOfferUserId(task.assignedTasker.id, offer.tasker.id)) ||
              (selectedFromSession && sameOfferUserId(selectedFromSession, offer.tasker.id))) && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {isPaymentPending && selectedFromSession === offer.tasker.id ? (
                  <div className="flex flex-col items-end gap-1 w-full sm:w-auto">
                    <span className="rounded-full bg-amber-50 text-amber-800 px-3 py-1.5 text-xs font-semibold ring-1 ring-amber-200">
                      Pending payment
                    </span>
                    <button
                      type="button"
                      onClick={() => router.push(paymentsRouteFromSession())}
                      className="text-xs font-medium text-blue-700 hover:underline"
                    >
                      Complete payment
                    </button>
                  </div>
                ) : (
                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 ring-1 ring-blue-100">
                    Selected
                  </span>
                )}
              </div>
            )}
            {effectiveIsTaskPoster && (
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                {task.status !== "completed" &&
                  task.status !== "in_progress" &&
                  !(
                    (task.status === "in_progress" && effectiveIsTaskPoster) ||
                    offer.status === "accepted" ||
                    (task.assignedTasker && sameOfferUserId(task.assignedTasker.id, offer.tasker.id)) ||
                    (selectedFromSession && sameOfferUserId(selectedFromSession, offer.tasker.id))
                  ) && (
                    <Button
                      className="jp-btn-blue-gradient w-full border-0 sm:flex-1"
                      size="sm"
                      onClick={() => openAcceptFeeDialog(offer)}
                      disabled={isAccepting === offer.id || acceptFeeOffer?.id === offer.id}
                    >
                      {isAccepting === offer.id ? "Accepting..." : "Accept Offer"}
                    </Button>
                  )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto"
                  onClick={() => handleMessageUser(offer.tasker.id)}
                  disabled={isPaymentPending && selectedFromSession === offer.tasker.id}
                  title={
                    isPaymentPending && selectedFromSession === offer.tasker.id
                      ? "Complete payment to enable messaging"
                      : ""
                  }
                >
                  {isPaymentPending && selectedFromSession === offer.tasker.id
                    ? "🔒 Message (Payment Required)"
                    : "Message"}
                </Button>
              </div>
            )}
          </div>
        </div>
      ))
    );

  return (
    <>
    {embedded ? (
      <div className="w-full min-w-0 space-y-3">
        {bidsHasMore ? (
          <p className="text-xs text-slate-500">
            Showing the latest offers. More bids exist on this task.
          </p>
        ) : null}
        {offersBody}
        {!effectiveIsTaskPoster && shouldBlockSubmit && (
          <p className="text-sm text-muted-foreground">This task is no longer accepting offers.</p>
        )}
        {!effectiveIsTaskPoster && !shouldBlockSubmit && !hasSubmittedOffer && (
          <div className="space-y-4 border-t border-slate-100 pt-4">
            {verificationChecked && !isVerified ? (
              <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 font-medium mb-2">⚠️ Verification Required</p>
                <p className="text-sm text-yellow-700 mb-3">
                  Please complete your verification (PAN and Aadhar) to place bids on tasks.
                </p>
                <Button
                  type="button"
                  onClick={() => router.push("/verification")}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  Complete Verification
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmitOffer} className="w-full space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="offerAmount-embedded"
                    className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1"
                  >
                    <span>Your offer</span>
                    <IndianRupee className="w-3 h-3" />
                  </label>
                  <Input
                    id="offerAmount-embedded"
                    type="number"
                    placeholder="e.g., 500"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    required
                    min="1"
                    disabled={!verificationChecked || !isVerified || isSubmitting}
                    className="h-11 rounded-xl border-slate-200 text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="offerMessage-embedded" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Your message
                  </label>
                  <Textarea
                    id="offerMessage-embedded"
                    placeholder="Introduce yourself and why you’re a good fit — keep it friendly and clear."
                    value={offerMessage}
                    onChange={handleChange}
                    rows={5}
                    required
                    disabled={!verificationChecked || !isVerified || isSubmitting}
                    className="min-h-[140px] rounded-xl border-slate-200 bg-slate-50/50 text-sm leading-relaxed resize-y focus:bg-white transition-colors"
                  />
                  {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
                </div>
                <Button
                  type="submit"
                  className="jp-btn-blue-gradient h-11 w-full rounded-xl font-semibold shadow-sm"
                  disabled={!verificationChecked || !isVerified || isSubmitting}
                >
                  {isSubmitting
                    ? "Submitting..."
                    : !verificationChecked
                      ? "Verifying..."
                      : verificationChecked && !isVerified
                        ? "Verification Required"
                        : "Make an offer"}
                </Button>
              </form>
            )}
          </div>
        )}
        {!effectiveIsTaskPoster &&
          task.status !== "completed" &&
          task.status !== "in_progress" &&
          hasSubmittedOffer && (
            <p className="text-sm text-muted-foreground">
              You have already submitted an offer for this task.
            </p>
          )}
      </div>
    ) : (
    <Card className="gap-0 border border-slate-200/80 py-0 shadow-sm rounded-2xl bg-white/95 overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-blue-50/40 px-4 pb-4 pt-4 md:px-6 md:pt-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              Offers ({offersCountLabel(offers.length, bidsTotal)})
            </CardTitle>
            <CardDescription className="text-slate-600 text-sm mt-1">
          {effectiveIsTaskPoster
            ? "Choose the best offer for your task"
            : hasSubmittedOffer
            ? "Your submitted offer"
            : "Submit an offer for this task"}
            </CardDescription>
            {bidsHasMore ? (
              <p className="text-xs text-slate-500 mt-2">
                Showing the latest offers. More bids exist on this task.
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pt-5 pb-4 md:px-6 md:pb-6">
        {offersBody}
      </CardContent>
      {!effectiveIsTaskPoster && shouldBlockSubmit && (
        <CardFooter className="px-4 md:px-6">
          <p className="text-muted-foreground">
            This task is no longer accepting offers.
          </p>
        </CardFooter>
      )}
      {!effectiveIsTaskPoster && !shouldBlockSubmit && !hasSubmittedOffer && (
        <CardFooter className="flex flex-col gap-4 items-center border-t border-slate-100 bg-slate-50/40 px-4 pt-5 pb-4 md:px-6 md:pb-6 dark:border-slate-700 dark:bg-slate-900/20">
          {verificationChecked && !isVerified ? (
            <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                ⚠️ Verification Required
              </p>
              <p className="text-sm text-yellow-700 mb-3">
                Please complete your verification (PAN and Aadhar) to place bids on tasks.
              </p>
              <Button 
                type="button" 
                onClick={() => router.push('/verification')}
                className="w-full bg-yellow-600 hover:bg-yellow-700"
              >
                Complete Verification
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitOffer} className="w-full space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="offerAmount"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1"
                >
                  <span>Your offer</span>
                  <IndianRupee className="w-3 h-3" />
                </label>
                <Input
                  id="offerAmount"
                  type="number"
                  placeholder="e.g., 500"
                  value={offerAmount}
                  onChange={(e) => setOfferAmount(e.target.value)}
                  required
                  min="1"
                  disabled={!verificationChecked || !isVerified || isSubmitting}
                  className="h-11 rounded-xl border-slate-200 text-base"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="offerMessage" className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Your message
                </label>
                <Textarea
                  id="offerMessage"
                  placeholder="Introduce yourself and why you’re a good fit — keep it friendly and clear."
                  value={offerMessage}
                  onChange={handleChange}
                  rows={5}
                  required
                  disabled={!verificationChecked || !isVerified || isSubmitting}
                  className="min-h-[140px] rounded-xl border-slate-200 bg-slate-50/50 text-sm leading-relaxed resize-y focus:bg-white transition-colors"
                />
                {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
              </div>
              <Button 
                type="submit" 
                className="jp-btn-blue-gradient h-11 w-full rounded-xl font-semibold shadow-sm" 
                disabled={!verificationChecked || !isVerified || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : !verificationChecked ? "Verifying..." : verificationChecked && !isVerified ? "Verification Required" : "Make an offer"}
              </Button>
            </form>
          )}
        </CardFooter>
      )}
      {!effectiveIsTaskPoster && task.status !== "completed" && task.status !== "in_progress" && hasSubmittedOffer && (
        <CardFooter className="px-4 md:px-6">
          <p className="text-muted-foreground">
            You have already submitted an offer for this task.
          </p>
        </CardFooter>
      )}
    </Card>
    )}
      <Dialog
        open={!!acceptFeeOffer}
        onOpenChange={(open) => {
          if (!open) resetAcceptFeeDialog();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Accept offer & pay</DialogTitle>
            <DialogDescription>
              Platform fee and GST on that fee are added at checkout. Total to pay is shown below. You can still cancel here without accepting the bid.
            </DialogDescription>
          </DialogHeader>
          {acceptFeeOffer ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2">
                <p className="font-medium text-slate-900">{task.title}</p>
                <p className="text-slate-600">
                  Bid from <span className="font-semibold text-slate-800">{acceptFeeOffer.tasker.name}</span> ·{" "}
                  <span className="tabular-nums font-semibold">{formatInr(acceptFeeOffer.amount)}</span>
                </p>
              </div>
              {acceptFeePreviewError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-800">{acceptFeePreviewError}</p>
              ) : acceptFeePreviewLoading || !acceptFeePreview ? (
                <p className="text-muted-foreground">Loading payment breakdown…</p>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Your payment</p>
                  <PosterFeeBreakdown data={acceptFeePreview} bidFallback={acceptFeeOffer.amount} compact />
                </div>
              )}
            </div>
          ) : null}
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={resetAcceptFeeDialog} disabled={isAccepting === acceptFeeOffer?.id}>
              Cancel
            </Button>
            <Button
              type="button"
              className="jp-btn-blue-gradient border-0"
              onClick={() => void handleConfirmAcceptAfterFeeReview()}
              disabled={
                !acceptFeeOffer ||
                acceptFeePreviewLoading ||
                !!acceptFeePreviewError ||
                !acceptFeePreview ||
                isAccepting === acceptFeeOffer.id
              }
            >
              {isAccepting === acceptFeeOffer?.id ? "Accepting…" : "Accept & continue to payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Complete</DialogTitle>
            <DialogDescription>Rate your tasker and add a short review.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} type="button" className={n <= reviewRating ? "text-yellow-400" : "text-gray-300"} onClick={() => setReviewRating(n)}>★</button>
              ))}
              <span className="text-sm text-muted-foreground">{reviewRating}/5</span>
            </div>
            <Textarea rows={4} placeholder="Write a short review..." value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)} disabled={completing}>Cancel</Button>
            <Button onClick={handleCompleteWithReview} disabled={completing}>{completing ? "Submitting..." : "Submit"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={!!paymentUrlForApp || paymentLinkLoading} onOpenChange={(open) => !open && !paymentLinkLoading && setPaymentUrlForApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{paymentLinkLoading ? "Creating payment link…" : "Open payment in browser"}</DialogTitle>
            <DialogDescription>
              {paymentLinkLoading
                ? "Please wait..."
                : "Copy the link below and open it in your browser to complete payment, then return to JobPool."}
            </DialogDescription>
          </DialogHeader>
          {paymentUrlForApp && !paymentLinkLoading && (
            <DialogFooter className="flex-col gap-2 sm:flex-col">
              <Button
                className="jp-btn-blue-gradient w-full rounded-lg font-semibold"
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(paymentUrlForApp);
                    toast.success("Link copied! Paste in your browser to pay.");
                  } catch {
                    toast.error("Could not copy link.");
                  }
                }}
              >
                Copy Link (recommended)
              </Button>
              {typeof navigator !== "undefined" && navigator.share && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      await navigator.share({ url: paymentUrlForApp, title: "JobPool Payment Link", text: "Complete your payment" });
                    } catch (e) {
                      if ((e as Error)?.name !== "AbortError") {
                        toast.error("Share not available. Use Copy Link instead.");
                      }
                    }
                  }}
                >
                  Share Link
                </Button>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  const result = await openExternalCheckout(paymentUrlForApp, {
                    router,
                    onBrowserClosed: () => {
                      toast.message("Back in JobPool", {
                        description: "If payment succeeded, open Dashboard to see the updated task.",
                      });
                    },
                  });
                  if (result === "blocked") {
                    toast.info("Use Copy Link and open in your browser.");
                  } else if (result === "opened") {
                    setPaymentUrlForApp(null);
                  }
                }}
              >
                Open Payment Page
              </Button>
              <Button variant="ghost" onClick={() => setPaymentUrlForApp(null)}>Cancel</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}