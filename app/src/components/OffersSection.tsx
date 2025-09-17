

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
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";

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

interface OffersSectionProps {
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

  // Show all offers to all users
  const visibleOffers = offers;

  // Prevent brief flicker of the submit form on assigned/in-progress tasks
  const isAssignedToMe = !!(currentUserId && task.assignedTasker && task.assignedTasker.id === currentUserId);
  const hasLocalAccepted = selectedFromSession && currentUserId && selectedFromSession === String(currentUserId);
  const shouldBlockSubmit =
    task.status === "completed" ||
    task.status === "in_progress" ||
    isAssignedToMe ||
    !!hasLocalAccepted ||
    blockSubmitInitial;


  const handleAcceptOffer = async (offer: Offer) => {
    setIsAccepting(offer.id);
    try {
      const response = await axiosInstance.put(
        `/accept-bid/${task.id}/${offer.tasker.id}/`
      );

      if (response.data.status_code === 200) {
        toast.success(response.data.message || "Bid accepted successfully");
        
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
        sessionStorage.setItem("paymentData", JSON.stringify({
          taskId: task.id,
          taskerId: offer.tasker.id,
          taskPosterId: task.poster.id,
          amount: offer.amount,
        }));
        
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
        
        router.push("/payments");
      } else {
        toast.error(response.data.message || "Failed to accept bid");
      }
    } catch (error: any) {
      console.error("Error accepting bid:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while accepting the bid"
      );
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
      // Mark complete
      await axiosInstance.put(`/mark-complete/${task.id}/`);
      // Submit review
      await axiosInstance.put("/submit-review/", {
        job_ref_id: task.id,
        reviewer_id: task.poster.id,
        user_id: offer.tasker.id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success("Task marked complete and review submitted");
      setCompleteOpen(false);
      setReviewComment("");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to complete task");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Offers ({offers.length})</CardTitle>
        <CardDescription>
          {isTaskPoster
            ? "Choose the best offer for your task"
            : hasSubmittedOffer
            ? "Your submitted offer"
            : "Submit an offer for this task"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {visibleOffers.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            {isTaskPoster
              ? "No offers yet"
              : hasSubmittedOffer
              ? "Your offer is being processed"
              : "No offers submitted yet"}
          </p>
        ) : (
          visibleOffers.map((offer) => (
            <div key={offer.id} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-200 p-4 md:p-5 bg-white">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/profilepage/${offer.tasker.id}`}
                    className="flex items-center gap-3 hover:underline"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {offer.tasker.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium leading-none">{offer.tasker.name}</p>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>
                          {offer.tasker.rating} • {offer.tasker.taskCount} tasks
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
                <div className="text-right">
                  {/* Show amount only for task poster or if it's the current user's offer */}
                  {(() => {
                    // Handle both string and number types for ID comparison
                    const isCurrentUserOffer = currentUserId && (
                      offer.tasker.id === currentUserId || 
                      offer.tasker.id === String(currentUserId) || 
                      String(offer.tasker.id) === currentUserId
                    );
                    const shouldShowAmount = isTaskPoster || isCurrentUserOffer;
                    return shouldShowAmount;
                  })() && (
                    <p className="font-bold text-gray-900">
                      <IndianRupee className="w-4 h-4 inline" />{" "}
                      {offer.amount.toFixed(2)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
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
              </div>
              <div className="flex items-center justify-between">
                {/* Show message to everyone - all bidders can see each other's messages */}
                <p className="text-sm text-gray-700">{offer.message}</p>
                {(offer.status === "accepted" || (task.assignedTasker && task.assignedTasker.id === offer.tasker.id) || (selectedFromSession && selectedFromSession === offer.tasker.id)) && (
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-medium">Selected</span>
                    <Button size="sm" onClick={() => openCompleteModal(offer.id)}>
                      Mark as Complete
                    </Button>
                  </div>
                )}
              </div>
              {isTaskPoster && (
                <div className="w-full flex flex-col sm:flex-row gap-2 mt-3">
                  {task.status !== "completed" && task.status !== "in_progress" && 
                   !((task.status === "in_progress" && isTaskPoster) || offer.status === "accepted" || 
                     (task.assignedTasker && task.assignedTasker.id === offer.tasker.id) || 
                     (selectedFromSession && selectedFromSession === offer.tasker.id)) && (
                    <Button
                      className="w-full sm:flex-1"
                      size="sm"
                      onClick={() => handleAcceptOffer(offer)}
                      disabled={isAccepting === offer.id}
                    >
                      {isAccepting === offer.id ? "Accepting..." : "Accept Offer"}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={() => handleMessageUser(offer.tasker.id)}
                  >
                    Message
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
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
      {!isTaskPoster && shouldBlockSubmit && (
        <CardFooter>
          <p className="text-muted-foreground">
            This task is no longer accepting offers.
          </p>
        </CardFooter>
      )}
      {!isTaskPoster && !shouldBlockSubmit && !hasSubmittedOffer && (
        <CardFooter>
          <form onSubmit={handleSubmitOffer} className="w-full space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="offerAmount"
                className="flex items-center space-x-1"
              >
                <span>Your Offer</span>
                <IndianRupee className="w-3 h-3" />
              </label>
              <Input
                id="offerAmount"
                type="number"
                placeholder="e.g., 50"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                required
                min="1"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="offerMessage">Message</label>
              <Textarea
                id="offerMessage"
                placeholder="Introduce yourself and explain why you're a good fit for this task..."
                value={offerMessage}
                onChange={handleChange}
                rows={4}
                required
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Offer"}
            </Button>
          </form>
        </CardFooter>
      )}
      {!isTaskPoster && task.status !== "completed" && task.status !== "in_progress" && hasSubmittedOffer && (
        <CardFooter>
          <p className="text-muted-foreground">
            You have already submitted an offer for this task.
          </p>
        </CardFooter>
      )}
    </Card>
  );
}