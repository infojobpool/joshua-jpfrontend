// "use client";

// import { ImageGalleryModal } from "@/components/ImageGalleryModal";
// import { OffersSection } from "@/components/OffersSection";
// import { PaymentModal } from "@/components/PaymentModal";
// import { PosterInfo } from "@/components/PosterInfo";
// import { ReviewSection } from "@/components/ReviewSection";
// import { SafetyTips } from "@/components/SafetyTips";
// import { TaskInfo } from "@/components/TaskInfo";
// import { Toaster } from "@/components/ui/sonner";
// import axiosInstance from "@/lib/axiosInstance";
// import useStore from "@/lib/Zustand";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { FormEvent, use, useEffect, useState } from "react";
// import { toast } from "sonner";
// import {
//   Task,
//   User,
//   Bid,
//   Offer,
//   ApiBidResponse,
//   ApiJobResponse,
// } from "../../types";
// import { TaskProgress } from "@/components/TaskProgress";
// import { Button } from "@/components/ui/button";
// import Header from "@/components/Header";

// interface TaskDetailPageProps {
//   params: Promise<{ id: string }>;
// }

// export default function TaskDetailPage({ params }: TaskDetailPageProps) {
//   const router = useRouter();
//   const { id } = use(params);
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [task, setTask] = useState<Task | null>(null);
//   const [bids, setBids] = useState<Bid[]>([]);
//   const [offers, setOffers] = useState<Offer[]>([]);
//   const [offerAmount, setOfferAmount] = useState<string>("");
//   const [offerMessage, setOfferMessage] = useState<string>("");
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const [reviewRating, setReviewRating] = useState<number>(5);
//   const [reviewComment, setReviewComment] = useState<string>("");
//   const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
//   const [showImageGallery, setShowImageGallery] = useState<boolean>(false);
//   const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
//   const [isEditing, setIsEditing] = useState<boolean>(false);
//   const { userId } = useStore();
//   const taskerId = offers.length > 0 ? offers[0].tasker.id : null;

//   // Load user and sync bids
//   useEffect(() => {
//     const storedUser = localStorage.getItem("user");
//     if (storedUser && userId) {
//       const parsedUser: User = JSON.parse(storedUser);
//       parsedUser.id = parsedUser.id || userId;
//       setUser(parsedUser);
//       console.log("Loaded user from localStorage:", parsedUser);
//       console.log("User ID after setting:", parsedUser.id);
//     } else {
//       router.push("/signin");
//     }

//     // Sync bids to localStorage
//     if (userId) {
//       const syncBids = async () => {
//         try {
//           const response = await axiosInstance.get(`/get-user-bids/${userId}/`);
//           const data: ApiBidResponse = response.data;
//           if (data.status_code === 200) {
//             localStorage.setItem("bids", JSON.stringify(data.data));
//             console.log("Synced bids to localStorage:", data.data);
//           }
//         } catch (error) {
//           console.error("Error syncing bids:", error);
//         }
//       };
//       syncBids();
//     }
//   }, [router, userId]);

//   // Load task data
//   useEffect(() => {
//     const loadTaskData = async () => {
//       try {
//         const response = await axiosInstance.get(`/get-job/${id}/`);
//         const data: ApiJobResponse = response.data;

//         if (data.status_code !== 200) {
//           throw new Error(data.message);
//         }

//         const job = data.data;

       

// const mappedTask: Task = {
//   id: job.job_id,
//   title: job.job_title,
//   description: job.job_description,
//   budget: job.job_budget,
//   location: job.job_location,
//   status: job.status,
//   job_completion_status: job.job_completion_status,
//   postedAt: job.timestamp
//     ? (() => {
//         const date = new Date(job.timestamp);
//         return isNaN(date.getTime())
//           ? "Invalid Date"
//           : date.toLocaleDateString("en-GB", {
//               day: "2-digit",
//               month: "2-digit",
//               year: "numeric",
//               timeZone: "UTC",
//             });
//       })()
//     : "N/A",
//   dueDate: job.job_due_date
//     ? new Date(job.job_due_date).toLocaleDateString("en-GB", {
//         day: "2-digit",
//         month: "2-digit",
//         year: "numeric",
//         timeZone: "UTC",
//       })
//     : "N/A",
//   category: job.job_category_name,
//   images: job.job_images.urls.map((url: string, index: number) => ({
//     id: `img${index + 1}`,
//     url,
//     alt: `Job image ${index + 1}`,
//   })),
//   poster: {
//     id: job.user_ref_id,
//     name: job.posted_by,
//     avatar: "/images/placeholder.svg",
//     rating: job.rating ?? null,
//     taskCount: job.task_count ?? 0,
//     joinedDate: job.joined_date ?? null,
//   },
//   offers: [],
//   assignedTasker: undefined,
// };
//         setTask(mappedTask);
//       } catch (error: any) {
//         console.error("Error loading task data:", error);
//         toast.error(
//           error.response?.data?.detail || "Failed to load task details"
//         );
//         setTask(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadTaskData();
//   }, [id]);

//   // Load bids/offers
//   useEffect(() => {
//     if (!userId || !task) return;

//     const isTaskPoster = task.poster.id === userId;

//     async function loadBids() {
//       try {
//         let taskBids: Bid[] = [];
//         if (isTaskPoster) {
//           // Task poster: fetch all bids
//           const response = await axiosInstance.get(`/get-bids/${id}/`);
//           const data: ApiBidResponse = response.data;
//           if (data.status_code !== 200) {
//             throw new Error(data.message);
//           }
//           taskBids = data.data;
//         } else {
//           // Non-poster: read from localStorage
//           const storedBids = localStorage.getItem("bids");
//           const allBids: Bid[] = storedBids ? JSON.parse(storedBids) : [];
//           taskBids = allBids.filter((bid) => bid.job_id === id);
//         }

//         // Map bids to offers
//         const newOffers: Offer[] = taskBids.map((bid: Bid, index: number) => ({
//           id: `bid${index + 1}`,
//           tasker: {
//             id: bid.bidder_id,
//             name: `${bid.bidder_name}`,
//             avatar: "/images/placeholder.svg",
//             rating: 4.5,
//             taskCount: 5,
//             joinedDate: "Apr 2023",
//           },
//           amount: bid.bid_amount,
//           message: bid.bid_description,
//           createdAt: "Just now",
//         }));

//         setOffers(newOffers);
//         setBids(taskBids);
//         console.log("Loaded bids:", taskBids);
//         console.log("Mapped offers:", newOffers);
//       } catch (error: any) {
//         console.error("Error loading bids:", error);
//         // toast.error(`Failed to load bids: ${error.message || "Unknown error"}`);
//       }
//     }

//     loadBids();
//   }, [id, task, userId]);

//   const handleSubmitOffer = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!offerAmount || !offerMessage || !userId) {
//       toast.error("Please fill in all required fields");
//       return;
//     }
//     const offerAmountNumber = parseFloat(offerAmount);

//     if (task && offerAmountNumber > task.budget) {
//       toast.error("Offer amount cannot be greater than the task budget.");
//       return;
//     }

//     const payload = {
//       job_ref_id: id,
//       bidder_ref_id: userId,
//       bid_amount: offerAmountNumber,
//       bid_description: offerMessage,
//     };

//     setIsSubmitting(true);

//     try {
//       const response = await axiosInstance.post("/bid-a-job/", payload);

//       if (response.data.status_code === 201) {
//         toast.success("Your offer has been submitted!");

//         // Update localStorage bids
//         const storedBids = localStorage.getItem("bids");
//         const allBids: Bid[] = storedBids ? JSON.parse(storedBids) : [];
//         allBids.push({
//           job_id: id,
//           bidder_id: userId,
//           bid_amount: offerAmountNumber,
//           bid_description: offerMessage,
//           bidder_name: user?.name,
//         });
//         localStorage.setItem("bids", JSON.stringify(allBids));

//         // Update state
//         const taskBids = allBids.filter((bid) => bid.job_id === id);
//         const newOffers: Offer[] = taskBids.map((bid: Bid, index: number) => ({
//           id: `bid${index + 1}`,
//           tasker: {
//             id: bid.bidder_id,
//             name: `${bid.bidder_name}`,
//             avatar: "/images/placeholder.svg",
//             rating: 4.5,
//             taskCount: 5,
//             joinedDate: "Apr 2023",
//           },
//           amount: bid.bid_amount,
//           message: bid.bid_description,
//           createdAt: "Just now",
//         }));
//         setOffers(newOffers);
//         setBids(taskBids);
//         console.log("Updated bids after submission:", taskBids);
//         console.log("Updated offers after submission:", newOffers);

//         setOfferAmount("");
//         setOfferMessage("");
//       } else {
//         throw new Error(response.data.message || "Failed to submit offer");
//       }
//     } catch (error: any) {
//       console.error("Error submitting offer:", error);
//       const errorMessage =
//         error.response?.data?.message || "Failed to submit offer";
//       toast.error(errorMessage);
//       if (error.response?.status === 400 && userId) {
//         // Sync bids
//         const bidsResponse = await axiosInstance.get(
//           `/get-user-bids/${userId}/`
//         );
//         const bidsData: ApiBidResponse = bidsResponse.data;
//         if (bidsData.status_code === 200) {
//           localStorage.setItem("bids", JSON.stringify(bidsData.data));
//           const taskBids = bidsData.data.filter((bid) => bid.job_id === id);
//           const newOffers: Offer[] = taskBids.map(
//             (bid: Bid, index: number) => ({
//               id: `bid${index + 1}`,
//               tasker: {
//                 id: bid.bidder_id,
//                 name: `User ${bid.bidder_id}`,
//                 avatar: "/images/placeholder.svg",
//                 rating: 4.5,
//                 taskCount: 5,
//                 joinedDate: "Apr 2023",
//               },
//               amount: bid.bid_amount,
//               message: bid.bid_description,
//               createdAt: "Just now",
//             })
//           );
//           setOffers(newOffers);
//           setBids(taskBids);
//           console.log("Updated bids after 400 error:", taskBids);
//           console.log("Updated offers after 400 error:", newOffers);
//         }
//       }
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSubmitReview = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!reviewComment) {
//       toast.error("Please provide a review comment");
//       return;
//     }
//     if (!taskerId) {
//       toast.error("No tasker assigned to this task");
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const payload = {
//         job_ref_id: id,
//         reviewer_id: userId,
//         user_id: taskerId,
//         rating: reviewRating,
//         comment: reviewComment,
//       };

//       const response = await axiosInstance.put("/submit-review/", payload);

//       if (response.data.status_code === 200) {
//         toast.success("Your review has been submitted!");
//         router.push("/dashboard");
//       } else {
//         throw new Error(response.data.message || "Failed to submit review");
//       }
//     } catch (error: any) {
//       console.error("Error submitting review:", error);
//       toast.error(error.response?.data?.message || "Failed to submit review");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const markAsComplete = () => {
//     setTimeout(() => {
//       toast.success("Task marked as complete!");
//       setTask((prevTask: Task | null) =>
//         prevTask ? { ...prevTask, job_completion_status: 1 } : prevTask
//       );
//       if (task?.poster.id === userId) {
//         setShowPaymentModal(true);
//       }
//     }, 1000);
//   };

//   const handlePayment = () => {
//     setIsSubmitting(true);
//     setTimeout(() => {
//       toast.success("Payment processed successfully");
//       setShowPaymentModal(false);
//       setIsSubmitting(false);
//       router.push("/payments");
//     }, 1500);
//   };

//   const handleMessageUser = async (receiverId?: string) => {
//     if (!userId || !task) {
//       console.error("handleMessageUser - Missing userId or task", {
//         userId,
//         task,
//       });
//       toast.error("Please log in to send messages");
//       return;
//     }

//     const senderId = userId;
//     let targetReceiverId: string | undefined;

//     console.log("handleMessageUser - Inputs:", {
//       userId,
//       receiverId,
//       isTaskPoster,
//       taskPosterId: task.poster.id,
//       offersLength: offers.length,
//       firstOfferTaskerId: offers[0]?.tasker.id,
//     });

//     if (receiverId) {
//       targetReceiverId = receiverId;
//     } else if (isTaskPoster) {
//       targetReceiverId = offers.length > 0 ? offers[0].tasker.id : undefined;
//     } else {
//       targetReceiverId = task.poster.id;
//     }

//     if (!targetReceiverId) {
//       console.error("handleMessageUser - No recipient available", {
//         offers,
//         isTaskPoster,
//       });
//       toast.error("No recipient available to message");
//       return;
//     }

//     if (targetReceiverId === senderId) {
//       console.error(
//         "handleMessageUser - Invalid recipient: sender and receiver are the same",
//         { senderId, targetReceiverId }
//       );
//       toast.error("Cannot message yourself");
//       return;
//     }

//     console.log("handleMessageUser - Initiating chat with:", {
//       senderId,
//       targetReceiverId,
//     });
// // /api/v1/get-chat-id/?sender=bptemt&receiver=apbori&job_id=task_2
//     try {
//       const response = await axiosInstance.get(
//         `/get-chat-id/?sender=${senderId}&receiver=${targetReceiverId}&job_id=${id}`
//       );
//       console.log("handleMessageUser - API Response:", response.data);
//       if (response.data.status_code === 200 && response.data.data.chat_id) {
//         const chatId = response.data.data.chat_id;
//         const storedChats = localStorage.getItem("userChats");
//         const chatIds: string[] = storedChats ? JSON.parse(storedChats) : [];
//         if (!chatIds.includes(chatId)) {
//           chatIds.push(chatId);
//           localStorage.setItem("userChats", JSON.stringify(chatIds));
//         }
//         console.log("handleMessageUser - Navigating to chat:", { chatId });
//         router.push(`/messages/${chatId}`);
//       } else {
//         console.log(
//           "handleMessageUser - No existing chat, starting new chat:",
//           { senderId, targetReceiverId }
//         );
//         router.push(
//           `/messages/new?sender=${senderId}&receiver=${targetReceiverId}`
//         );
//       }
//     } catch (error: any) {
//       console.error(
//         "handleMessageUser - Error initiating chat:",
//         error.response?.data || error
//       );
//       toast.error(error.response?.data?.message || "Failed to initiate chat");
//     }
//   };

//   const openImageGallery = (index: number) => {
//     setCurrentImageIndex(index);
//     setShowImageGallery(true);
//   };

//   const closeImageGallery = () => {
//     setShowImageGallery(false);
//   };

//   const nextImage = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setCurrentImageIndex((prev) => (prev + 1) % (task?.images.length || 1));
//   };

//   const prevImage = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setCurrentImageIndex(
//       (prev) =>
//         (prev - 1 + (task?.images.length || 1)) % (task?.images.length || 1)
//     );
//   };

//   const handleSignOut = () => {
//     localStorage.removeItem("user");
//     localStorage.removeItem("token");
//     localStorage.removeItem("bids");
//     router.push("/");
//   };

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         Loading...
//       </div>
//     );
//   }

//   if (!user || !userId) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         Please log in to view task details
//       </div>
//     );
//   }

//   if (!task) {
//     return (
//       <div className="flex h-screen items-center justify-center flex-col gap-4">
//         <p>Task not found</p>
//         <Link
//           href="/dashboard"
//           className="text-sm text-blue-600 hover:underline"
//         >
//           Back to Dashboard
//         </Link>
//       </div>
//     );
//   }

//   const isTaskPoster: boolean = task.poster.id === userId;
//   const hasSubmittedOffer = offers.some((offer) => offer.tasker.id === userId);
//   console.log("User ID from user:", user.id);
//   console.log("User ID from store:", userId);
//   console.log("Offers:", offers);
//   console.log("Has submitted offer:", hasSubmittedOffer);

//   return (
//     <div className="flex min-h-screen flex-col">
//       <Toaster position="top-right" />
//       <Header user={{ name: user.name, avatar: user.avatar || "/images/placeholder.svg" }} onSignOut={handleSignOut} />
//       <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
//         <div className="max-w-4xl mx-auto">
//           <div className="mb-6 flex justify-between items-center">
//             <Link
//               href="/dashboard"
//               className="text-sm text-muted-foreground hover:underline"
//             >
//               ← Back to Dashboard
//             </Link>
//           </div>

//           <div className="grid gap-6 md:grid-cols-3">
//             <div className="md:col-span-2 space-y-6">
//               <TaskInfo
//                 task={task}
//                 openImageGallery={openImageGallery}
//                 handleMessageUser={handleMessageUser}
//                 isTaskPoster={isTaskPoster}
//                 isEditing={isEditing}
//                 setIsEditing={setIsEditing}
//               />
//               <ReviewSection
//                 isTaskPoster={isTaskPoster}
//                 taskStatus={task.status}
//                 handleSubmitReview={handleSubmitReview}
//                 reviewRating={reviewRating}
//                 setReviewRating={setReviewRating}
//                 reviewComment={reviewComment}
//                 setReviewComment={setReviewComment}
//                 isSubmitting={isSubmitting}
//                 taskerId={taskerId}
//                 completionStatus = {task.job_completion_status}
//               />
//               <OffersSection
//                 task={task}
//                 offers={offers}
//                 isTaskPoster={isTaskPoster}
//                 hasSubmittedOffer={hasSubmittedOffer}
//                 handleSubmitOffer={handleSubmitOffer}
//                 handleMessageUser={handleMessageUser}
//                 offerAmount={offerAmount}
//                 setOfferAmount={setOfferAmount}
//                 offerMessage={offerMessage}
//                 setOfferMessage={setOfferMessage}
//                 isSubmitting={isSubmitting}
//               />
//             </div>
//             <div className="space-y-6">
//               <PosterInfo
//                 poster={task.poster}
//                 isTaskPoster={isTaskPoster}
//                 handleMessageUser={handleMessageUser}
//               />
//               <SafetyTips />
//             </div>
//           </div>
//         </div>
//       </main>

//       <PaymentModal
//         show={showPaymentModal}
//         task={task}
//         handlePayment={handlePayment}
//         closeModal={() => setShowPaymentModal(false)}
//         isSubmitting={isSubmitting}
//       />
//       <ImageGalleryModal
//         show={showImageGallery}
//         images={task.images}
//         currentIndex={currentImageIndex}
//         closeGallery={closeImageGallery}
//         nextImage={nextImage}
//         prevImage={prevImage}
//       />
//     </div>
//   );
// }

// "use client";

// import { ImageGalleryModal } from "@/components/ImageGalleryModal";
// import { OffersSection } from "@/components/OffersSection";
// import { PaymentModal } from "@/components/PaymentModal";
// import { PosterInfo } from "@/components/PosterInfo";
// import { ReviewSection } from "@/components/ReviewSection";
// import { SafetyTips } from "@/components/SafetyTips";
// import { TaskInfo } from "@/components/TaskInfo";
// import { Toaster } from "@/components/ui/sonner";
// import axiosInstance from "@/lib/axiosInstance";
// import useStore from "@/lib/Zustand";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { FormEvent, use, useEffect, useState } from "react";
// import { toast } from "sonner";
// import {
//   Task,
//   User,
//   Bid,
//   Offer,
//   ApiBidResponse,
//   ApiJobResponse,
// } from "../../types";
// import { TaskProgress } from "@/components/TaskProgress";
// import { Button } from "@/components/ui/button";
// import Header from "@/components/Header";

// interface TaskDetailPageProps {
//   params: Promise<{ id: string }>;
// }

// export default function TaskDetailPage({ params }: TaskDetailPageProps) {
//   const router = useRouter();
//   const { id } = use(params);
//   const { userId, user: storeUser, checkAuth, isAuthenticated } = useStore();
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [authLoading, setAuthLoading] = useState<boolean>(true); // New state for auth loading
//   const [task, setTask] = useState<Task | null>(null);
//   const [bids, setBids] = useState<Bid[]>([]);
//   const [offers, setOffers] = useState<Offer[]>([]);
//   const [offerAmount, setOfferAmount] = useState<string>("");
//   const [offerMessage, setOfferMessage] = useState<string>("");
//   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
//   const [reviewRating, setReviewRating] = useState<number>(5);
//   const [reviewComment, setReviewComment] = useState<string>("");
//   const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
//   const [showImageGallery, setShowImageGallery] = useState<boolean>(false);
//   const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
//   const [isEditing, setIsEditing] = useState<boolean>(false);
//   const taskerId = offers.length > 0 ? offers[0].tasker.id : null;

//   // Load user and sync bids
//   useEffect(() => {
//     // Call checkAuth and wait briefly for store to update
//     checkAuth();
//     const authTimeout = setTimeout(() => {
//       setAuthLoading(false); // Mark auth loading as complete
//       if (isAuthenticated && storeUser) {
//         setUser({
//           id: storeUser.id,
//           name: storeUser.name,
//           avatar: "/images/placeholder.svg",
//           rating: null,
//           taskCount: null,
//           joinedDate: null,
//         });
//         console.log("Loaded user from store:", storeUser);
//       } else {
//         const storedUser = localStorage.getItem("user");
//         if (storedUser && userId) {
//           const parsedUser: User = JSON.parse(storedUser);
//           parsedUser.id = parsedUser.id || userId;
//           setUser(parsedUser);
//           console.log("Loaded user from localStorage:", parsedUser);
//           console.log("User ID after setting:", parsedUser.id);
//         } else {
//           console.log("No authenticated user, redirecting to signin");
//           router.push("/signin");
//         }
//       }

//       // Sync bids to localStorage
//       if (userId) {
//         const syncBids = async () => {
//           try {
//             const response = await axiosInstance.get(`/get-user-bids/${userId}/`);
//             const data: ApiBidResponse = response.data;
//             if (data.status_code === 200) {
//               localStorage.setItem("bids", JSON.stringify(data.data));
//               console.log("Synced bids to localStorage:", data.data);
//             }
//           } catch (error) {
//             console.error("Error syncing bids:", error);
//           }
//         };
//         syncBids();
//       }
//     }, 100); // Small delay to ensure checkAuth completes

//     return () => clearTimeout(authTimeout); // Cleanup timeout
//   }, [router, userId, isAuthenticated, storeUser, checkAuth]);

//   // Load task data
//   useEffect(() => {
//     const loadTaskData = async () => {
//       try {
//         const response = await axiosInstance.get(`/get-job/${id}/`);
//         const data: ApiJobResponse = response.data;

//         if (data.status_code !== 200) {
//           throw new Error(data.message);
//         }

//         const job = data.data;
//         console.log("API Response Data:", job);
//         console.log("Joined Date from API:", job.joined_date);

//         const mappedTask: Task = {
//           id: job.job_id,
//           title: job.job_title,
//           description: job.job_description,
//           budget: job.job_budget,
//           location: job.job_location,
//           status: job.status,
//           job_completion_status: job.job_completion_status,
//           postedAt: job.timestamp
//             ? (() => {
//                 const date = new Date(job.timestamp);
//                 return isNaN(date.getTime())
//                   ? "Invalid Date"
//                   : date.toLocaleDateString("en-GB", {
//                       day: "2-digit",
//                       month: "2-digit",
//                       year: "numeric",
//                       timeZone: "UTC",
//                     });
//               })()
//             : "N/A",
//           dueDate: job.job_due_date
//             ? new Date(job.job_due_date).toLocaleDateString("en-GB", {
//                 day: "2-digit",
//                 month: "2-digit",
//                 year: "numeric",
//                 timeZone: "UTC",
//               })
//             : "N/A",
//           category: job.job_category_name,
//           images: job.job_images.urls.map((url: string, index: number) => ({
//             id: `img${index + 1}`,
//             url,
//             alt: `Job image ${index + 1}`,
//           })),
//           poster: {
//             id: job.user_ref_id,
//             name: job.posted_by,
//             avatar: "/images/placeholder.svg",
//             rating: job.rating ?? null,
//             taskCount: job.task_count ?? 0,
//             joinedDate: job.joined_date ?? null,
//           },
//           offers: [],
//           assignedTasker: undefined,
//         };
//         setTask(mappedTask);
//         console.log("Mapped Task Poster:", mappedTask.poster);
//       } catch (error: any) {
//         console.error("Error loading task data:", error);
//         toast.error(
//           error.response?.data?.detail || "Failed to load task details"
//         );
//         setTask(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadTaskData();
//   }, [id]);

//   // Load bids/offers
//   useEffect(() => {
//     if (!userId || !task) return;

//     const isTaskPoster = task.poster.id === userId;

//     async function loadBids() {
//       try {
//         let taskBids: Bid[] = [];
//         if (isTaskPoster) {
//           const response = await axiosInstance.get(`/get-bids/${id}/`);
//           const data: ApiBidResponse = response.data;
//           if (data.status_code !== 200) {
//             throw new Error(data.message);
//           }
//           taskBids = data.data;
//         } else {
//           const storedBids = localStorage.getItem("bids");
//           const allBids: Bid[] = storedBids ? JSON.parse(storedBids) : [];
//           taskBids = allBids.filter((bid) => bid.job_id === id);
//         }

//         const newOffers: Offer[] = taskBids.map((bid: Bid, index: number) => ({
//           id: `bid${index + 1}`,
//           tasker: {
//             id: bid.bidder_id,
//             name: `${bid.bidder_name}`,
//             avatar: "/images/placeholder.svg",
//             rating: 4.5,
//             taskCount: 5,
//             joinedDate: "Apr 2023",
//           },
//           amount: bid.bid_amount,
//           message: bid.bid_description,
//           createdAt: "Just now",
//         }));

//         setOffers(newOffers);
//         setBids(taskBids);
//         console.log("Loaded bids:", taskBids);
//         console.log("Mapped offers:", newOffers);
//       } catch (error: any) {
//         console.error("Error loading bids:", error);
//       }
//     }

//     loadBids();
//   }, [id, task, userId]);

//   const handleSubmitOffer = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!offerAmount || !offerMessage || !userId) {
//       toast.error("Please fill in all required fields");
//       return;
//     }
//     const offerAmountNumber = parseFloat(offerAmount);

//     if (task && offerAmountNumber > task.budget) {
//       toast.error("Offer amount cannot be greater than the task budget.");
//       return;
//     }

//     const payload = {
//       job_ref_id: id,
//       bidder_ref_id: userId,
//       bid_amount: offerAmountNumber,
//       bid_description: offerMessage,
//     };

//     setIsSubmitting(true);

//     try {
//       const response = await axiosInstance.post("/bid-a-job/", payload);

//       if (response.data.status_code === 201) {
//         toast.success("Your offer has been submitted!");

//         const storedBids = localStorage.getItem("bids");
//         const allBids: Bid[] = storedBids ? JSON.parse(storedBids) : [];
//         allBids.push({
//           job_id: id,
//           bidder_id: userId!,
//           bid_amount: offerAmountNumber,
//           bid_description: offerMessage,
//           bidder_name: user?.name,
//         });
//         localStorage.setItem("bids", JSON.stringify(allBids));

//         const taskBids = allBids.filter((bid) => bid.job_id === id);
//         const newOffers: Offer[] = taskBids.map((bid: Bid, index: number) => ({
//           id: `bid${index + 1}`,
//           tasker: {
//             id: bid.bidder_id,
//             name: `${bid.bidder_name}`,
//             avatar: "/images/placeholder.svg",
//             rating: 4.5,
//             taskCount: 5,
//             joinedDate: "Apr 2023",
//           },
//           amount: bid.bid_amount,
//           message: bid.bid_description,
//           createdAt: "Just now",
//         }));
//         setOffers(newOffers);
//         setBids(taskBids);
//         console.log("Updated bids after submission:", taskBids);
//         console.log("Updated offers after submission:", newOffers);

//         setOfferAmount("");
//         setOfferMessage("");
//       } else {
//         throw new Error(response.data.message || "Failed to submit offer");
//       }
//     } catch (error: any) {
//       console.error("Error submitting offer:", error);
//       toast.error(error.response?.data?.message || "Failed to submit offer");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSubmitReview = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!reviewComment) {
//       toast.error("Please provide a review comment");
//       return;
//     }
//     if (!taskerId) {
//       toast.error("No tasker assigned to this task");
//       return;
//     }

//     setIsSubmitting(true);

//     try {
//       const payload = {
//         job_ref_id: id,
//         reviewer_id: userId,
//         user_id: taskerId,
//         rating: reviewRating,
//         comment: reviewComment,
//       };

//       const response = await axiosInstance.put("/submit-review/", payload);

//       if (response.data.status_code === 200) {
//         toast.success("Your review has been submitted!");
//         router.push("/dashboard");
//       } else {
//         throw new Error(response.data.message || "Failed to submit review");
//       }
//     } catch (error: any) {
//       console.error("Error submitting review:", error);
//       toast.error(error.response?.data?.message || "Failed to submit review");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const markAsComplete = () => {
//     setTimeout(() => {
//       toast.success("Task marked as complete!");
//       setTask((prevTask: Task | null) =>
//         prevTask ? { ...prevTask, job_completion_status: 1 } : prevTask
//       );
//       if (task?.poster.id === userId) {
//         setShowPaymentModal(true);
//       }
//     }, 1000);
//   };

//   const handlePayment = () => {
//     setIsSubmitting(true);
//     setTimeout(() => {
//       toast.success("Payment processed successfully");
//       setShowPaymentModal(false);
//       setIsSubmitting(false);
//       router.push("/payments");
//     }, 1500);
//   };

//   const handleMessageUser = async (receiverId?: string) => {
//     if (!userId || !task) {
//       console.error("handleMessageUser - Missing userId or task", {
//         userId,
//         task,
//       });
//       toast.error("Please log in to send messages");
//       return;
//     }

//     const senderId = userId;
//     let targetReceiverId: string | undefined;

//     if (receiverId) {
//       targetReceiverId = receiverId;
//     } else if (task.poster.id === userId) {
//       targetReceiverId = offers.length > 0 ? offers[0].tasker.id : undefined;
//     } else {
//       targetReceiverId = task.poster.id;
//     }

//     if (!targetReceiverId) {
//       console.error("handleMessageUser - No recipient available", {
//         offers,
//         isTaskPoster: task.poster.id === userId,
//       });
//       toast.error("No recipient available to message");
//       return;
//     }

//     if (targetReceiverId === senderId) {
//       console.error(
//         "handleMessageUser - Invalid recipient: sender and receiver are the same",
//         { senderId, targetReceiverId }
//       );
//       toast.error("Cannot message yourself");
//       return;
//     }

//     try {
//       const response = await axiosInstance.get(
//         `/get-chat-id/?sender=${senderId}&receiver=${targetReceiverId}&job_id=${id}`
//       );
//       console.log("handleMessageUser - API Response:", response.data);
//       if (response.data.status_code === 200 && response.data.data.chat_id) {
//         const chatId = response.data.data.chat_id;
//         const storedChats = localStorage.getItem("userChats");
//         const chatIds: string[] = storedChats ? JSON.parse(storedChats) : [];
//         if (!chatIds.includes(chatId)) {
//           chatIds.push(chatId);
//           localStorage.setItem("userChats", JSON.stringify(chatIds));
//         }
//         router.push(`/messages/${chatId}`);
//       } else {
//         router.push(
//           `/messages/new?sender=${senderId}&receiver=${targetReceiverId}`
//         );
//       }
//     } catch (error: any) {
//       console.error(
//         "handleMessageUser - Error initiating chat:",
//         error.response?.data || error
//       );
//       toast.error(error.response?.data?.message || "Failed to initiate chat");
//     }
//   };

//   const openImageGallery = (index: number) => {
//     setCurrentImageIndex(index);
//     setShowImageGallery(true);
//   };

//   const closeImageGallery = () => {
//     setShowImageGallery(false);
//   };

//   const nextImage = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setCurrentImageIndex((prev) => (prev + 1) % (task?.images.length || 1));
//   };

//   const prevImage = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setCurrentImageIndex(
//       (prev) =>
//         (prev - 1 + (task?.images.length || 1)) % (task?.images.length || 1)
//     );
//   };

//   const handleSignOut = () => {
//     localStorage.removeItem("user");
//     localStorage.removeItem("token");
//     localStorage.removeItem("bids");
//     router.push("/");
//   };

//   if (authLoading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         Checking authentication...
//       </div>
//     );
//   }

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         Loading...
//       </div>
//     );
//   }

//   if (!user || !userId) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         Please log in to view task details
//       </div>
//     );
//   }

//   if (!task) {
//     return (
//       <div className="flex h-screen items-center justify-center flex-col gap-4">
//         <p>Task not found</p>
//         <Link
//           href="/dashboard"
//           className="text-sm text-blue-600 hover:underline"
//         >
//           Back to Dashboard
//         </Link>
//       </div>
//     );
//   }

//   const isTaskPoster: boolean = task.poster.id === userId;
//   const hasSubmittedOffer = offers.some((offer) => offer.tasker.id === userId);

//   return (
//     <div className="flex min-h-screen flex-col">
//       <Toaster position="top-right" />
//       <Header user={{ name: user.name, avatar: user.avatar || "/images/placeholder.svg" }} onSignOut={handleSignOut} />
//       <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
//         <div className="max-w-4xl mx-auto">
//           <div className="mb-6 flex justify-between items-center">
//             <Link
//               href="/dashboard"
//               className="text-sm text-muted-foreground hover:underline"
//             >
//               ← Back to Dashboard
//             </Link>
//           </div>

//           <div className="grid gap-6 md:grid-cols-3">
//             <div className="md:col-span-2 space-y-6">
//               <TaskInfo
//                 task={task}
//                 openImageGallery={openImageGallery}
//                 handleMessageUser={handleMessageUser}
//                 isTaskPoster={isTaskPoster}
//                 isEditing={isEditing}
//                 setIsEditing={setIsEditing}
//               />
//               <ReviewSection
//                 isTaskPoster={isTaskPoster}
//                 taskStatus={task.status}
//                 handleSubmitReview={handleSubmitReview}
//                 reviewRating={reviewRating}
//                 setReviewRating={setReviewRating}
//                 reviewComment={reviewComment}
//                 setReviewComment={setReviewComment}
//                 isSubmitting={isSubmitting}
//                 taskerId={taskerId}
//                 completionStatus={task.job_completion_status}
//               />
//               <OffersSection
//                 task={task}
//                 offers={offers}
//                 isTaskPoster={isTaskPoster}
//                 hasSubmittedOffer={hasSubmittedOffer}
//                 handleSubmitOffer={handleSubmitOffer}
//                 handleMessageUser={handleMessageUser}
//                 offerAmount={offerAmount}
//                 setOfferAmount={setOfferAmount}
//                 offerMessage={offerMessage}
//                 setOfferMessage={setOfferMessage}
//                 isSubmitting={isSubmitting}
//               />
//             </div>
//             <div className="space-y-6">
//               <PosterInfo
//                 poster={task.poster}
//                 isTaskPoster={isTaskPoster}
//                 handleMessageUser={handleMessageUser}
//               />
//               <SafetyTips />
//             </div>
//           </div>
//         </div>
//       </main>

//       <PaymentModal
//         show={showPaymentModal}
//         task={task}
//         handlePayment={handlePayment}
//         closeModal={() => setShowPaymentModal(false)}
//         isSubmitting={isSubmitting}
//       />
//       <ImageGalleryModal
//         show={showImageGallery}
//         images={task.images}
//         currentIndex={currentImageIndex}
//         closeGallery={closeImageGallery}
//         nextImage={nextImage}
//         prevImage={prevImage}
//       />
//     </div>
//   );
// }
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
import { useRouter } from "next/navigation";
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
  const { id } = use(params);
  const { userId, user: storeUser, checkAuth, isAuthenticated, logout } = useStore();
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
  const [showConfirmBid, setShowConfirmBid] = useState<boolean>(false);
  const taskerId = offers.length > 0 ? offers[0].tasker.id : null;

  // Load user, profile, and sync bids
  useEffect(() => {
    console.log("Starting auth check, userId:", userId, "isAuthenticated:", isAuthenticated);
    checkAuth();
    const authTimeout = setTimeout(() => {
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
      } else {
        const storedUser = localStorage.getItem("user");
        if (storedUser && userId) {
          const parsedUser: User = JSON.parse(storedUser);
          parsedUser.id = parsedUser.id || userId;
          setUser(parsedUser);
          console.log("Loaded user from localStorage:", parsedUser);
        } else {
          console.log("No authenticated user, redirecting to signin");
          router.push("/signin");
          return;
        }
      }

      // Fetch user profile
      const fetchProfile = async () => {
        if (!userId) return;
        try {
          const response = await axiosInstance.get(`/profile?user_id=${userId}`);
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
        fetchProfile();
        syncBids();
      }
    }, 100);

    return () => clearTimeout(authTimeout);
  }, [router, userId, isAuthenticated, storeUser, checkAuth, logout]);

  // Load task data
  useEffect(() => {
    const loadTaskData = async () => {
      try {
        const response = await axiosInstance.get(`/get-job/${id}/`);
        const data: ApiJobResponse = response.data;

        if (data.status_code !== 200) {
          throw new Error(data.message);
        }

        const job = data.data;
        console.log("API Response Data (Job):", job);

        const assignedId =
          job.assigned_tasker_id ||
          job.assigned_user_id ||
          job.assigned_to ||
          job.accepted_bidder_id ||
          job.worker_id ||
          null;

        const mappedTask: Task = {
          id: job.job_id,
          title: job.job_title,
          description: job.job_description,
          budget: job.job_budget,
          location: job.job_location,
          status: job.status,
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
                url,
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
      } catch (error: any) {
        console.error("Error loading task data:", error);
        toast.error(
          error.response?.data?.detail || "Failed to load task details"
        );
        setTask(null);
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
        // Fetch all bids for the task from the API
        const response = await axiosInstance.get(`/get-bids/${id}/`);
        const data: ApiBidResponse = response.data;
        console.log("Raw API response for bids:", data); // Debug log

        if (data.status_code !== 200) {
          throw new Error(data.message || "Failed to fetch bids");
        }

        const taskBids: Bid[] = data.data;
        console.log("Fetched task bids:", taskBids); // Debug log

        // Update localStorage with only the current user's bids
        const storedBids = localStorage.getItem("bids");
        let allBids: Bid[] = storedBids ? JSON.parse(storedBids) : [];
        // Keep non-task bids and update with current user's bids from API
        allBids = [
          ...allBids.filter((bid) => bid.job_id !== id), // Remove old bids for this task
          ...taskBids.filter((bid) => bid.bidder_id === userId), // Add current user's bids
        ];
        localStorage.setItem("bids", JSON.stringify(allBids));
        console.log("Updated localStorage bids:", allBids); // Debug log

        // Map all task bids to offers
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
        console.log("Mapped offers:", newOffers); // Debug log
      } catch (error: any) {
        console.error("Error loading bids:", error);
        toast.error(error.response?.data?.message || "Failed to load bids");
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
        toast.success("Your offer has been submitted!");

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

        // Refresh bids from API to ensure all offers are up-to-date
        const response = await axiosInstance.get(`/get-bids/${id}/`);
        const data: ApiBidResponse = response.data;
        if (data.status_code === 200) {
          const taskBids = data.data;
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

  if (!user || !userId || !userProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        Please log in to view task details
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
  const handlingCharges = bidAmountNumber * 0.23; // 23% handling charges incl. GST
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
              task={task}
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
              <span className="text-gray-700">Handling Charges (incl. GST):</span>
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