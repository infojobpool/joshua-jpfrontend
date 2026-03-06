"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentModal } from "@/components/PaymentModal";
import { toast } from "sonner";
import { PaymentFailed } from "@/components/payment-failed";
import { Task } from "../types";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axiosInstance from "../../lib/axiosInstance";

// Mock task data (replace with actual task data, e.g., via API or props)
const mockTask: Task = {
  id: "task123",
  title: "Sample Task",
  description: "Complete a sample task",
  budget: 1000,
  location: "Remote",
  status: true,
  job_completion_status: 0,
  postedAt: "2025-05-26",
  dueDate: "2025-06-01",
  category: "General",
  images: [],
  poster: {
    id: "user1",
    name: "John Doe",
    avatar: "",
    rating: 4.5,
    taskCount: 10,
    joinedDate: "2024-01-01",
    email: "john@example.com",
  },
  offers: [],
};

interface PaymentData {
  taskId: string;
  taskerId: string;
  taskPosterId: string;
  amount: number;
}

export default function PaymentPage() {
  const [showPaymentModal, setShowPaymentModal] = useState(true);
  const [showPaymentFailed, setShowPaymentFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [hasTriedOnce, setHasTriedOnce] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentUrlForSafari, setPaymentUrlForSafari] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Retrieve data from sessionStorage or URL params (when opened in Safari from copy link)
  useEffect(() => {
    const data = sessionStorage.getItem("paymentData");
    if (data) {
      try {
        const parsedData: PaymentData = JSON.parse(data);
        setPaymentData(parsedData);
        console.log("Retrieved payment data from sessionStorage:", parsedData);
      } catch (err) {
        console.error("Error parsing payment data:", err);
        setErrorMessage("Invalid payment data");
        setShowPaymentFailed(true);
      }
    } else {
      // Opened in Safari/browser - no sessionStorage. Use URL params.
      const taskId = searchParams.get("taskId");
      const amount = searchParams.get("amount");
      const taskerId = searchParams.get("taskerId") || "";
      const taskPosterId = searchParams.get("taskPosterId") || "";
      if (taskId && amount && !isNaN(parseFloat(amount))) {
        setPaymentData({
          taskId,
          taskerId,
          taskPosterId,
          amount: parseFloat(amount),
        });
        setShowPaymentModal(true);
        console.log("Retrieved payment data from URL params:", { taskId, amount, taskerId, taskPosterId });
      } else {
        console.warn("No payment data in sessionStorage or URL params");
        setErrorMessage("Payment data not found");
        setShowPaymentFailed(true);
      }
    }    
    // Mark that user has entered the payment page
    sessionStorage.setItem("payment_page_visited", "true");
  }, [searchParams]);

  // Warn user before leaving page without completing payment
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (showPaymentModal && !paymentStatus) {
        e.preventDefault();
        e.returnValue = "Payment is not complete. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [showPaymentModal, paymentStatus]);

  // Fallback to query params or mock data if sessionStorage is empty
  const taskId = paymentData?.taskId || searchParams.get("taskId") || mockTask.id;
  const bidAmount = paymentData?.amount || (searchParams.get("amount") && !isNaN(parseFloat(searchParams.get("amount")!))
    ? parseFloat(searchParams.get("amount")!)
    : mockTask.budget);
  const taskerId = paymentData?.taskerId || searchParams.get("taskerId") || "";
  const taskPosterId = paymentData?.taskPosterId || searchParams.get("taskPosterId") || mockTask.poster.id;

  const handlePayment = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");
    setPaymentStatus(null);

    const commissionAmount = bidAmount * 0.05; // 5% commission
    const gstAmount = (bidAmount + commissionAmount) * 0.18; // 18% GST

    const orderPayload = {
      postId: taskId,
      bid_amount: Number(bidAmount.toFixed(2)),
      gst_amount: Number(gstAmount.toFixed(2)),
      commission_amount: Number(commissionAmount.toFixed(2)),
      payable_amount: Number((bidAmount + commissionAmount + gstAmount).toFixed(2)),
      tasker_id: taskerId,
      taskmanager_id: taskPosterId,
    };

    // Only PWA (installed app): modal shows blank. Web (browser) always uses modal.
    const isStandalonePWA =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(display-mode: standalone)")?.matches ||
        window.matchMedia?.("(display-mode: fullscreen)")?.matches ||
        (navigator as any).standalone === true);

    let openedEmbedded = false;
    try {
      // PWA only: Show Copy/Open dialog. User copies link, opens Safari, pays, returns to app.
      if (isStandalonePWA) {
        const linkResponse = await axiosInstance.post("/create-payment-link/", orderPayload);
        const linkResult = linkResponse.data;
        const paymentUrl = linkResult?.data?.short_url;
        if (!paymentUrl) throw new Error(linkResult?.message || "Failed to create payment link");
        const d = linkResult.data;
        try {
          localStorage.setItem(
            "pending_payment_order",
            JSON.stringify({
              postId: taskId,
              order_id: d?.order_id || "",
              tasker_id: taskerId,
              taskmanager_id: taskPosterId,
              bid_amount: bidAmount,
              gst_amount: gstAmount,
              commission_amount: commissionAmount,
              payable_amount: Number(orderPayload.payable_amount),
            })
          );
        } catch (_) {}
        setPaymentUrlForSafari(paymentUrl);
        return;
      }

      if (!razorpayLoaded && !(typeof window !== "undefined" && (window as any).Razorpay)) {
        throw new Error("Payment gateway not loaded. Please refresh and try again.");
      }

      const orderResponse = await axiosInstance.post("/create-order/", orderPayload);
      const orderResult = orderResponse.data;
      const orderDetails = orderResult?.data;

      if (
        orderResult?.status_code !== 200 ||
        !orderDetails?.order_id ||
        !orderDetails?.key ||
        orderDetails?.payable_amount == null ||
        !orderDetails?.currency
      ) {
        throw new Error(orderResult?.message || "Failed to create order");
      }

      const rzp = new (window as any).Razorpay({
        key: orderDetails.key,
        amount: Math.round(Number(orderDetails.payable_amount) * 100), // paise
        currency: orderDetails.currency || "INR",
        order_id: orderDetails.order_id,
        name: "JobPool",
        description: `Payment for task`,
        handler: async (res: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            const verifyResp = await axiosInstance.post("/verify-payment/", {
              postId: orderDetails.postId || taskId,
              payment_id: res.razorpay_payment_id,
              order_id: res.razorpay_order_id,
              signature: res.razorpay_signature,
              tasker_id: taskerId,
              taskmanager_id: taskPosterId,
              bid_amount: orderDetails.bid_amount ?? bidAmount,
              gst_amount: orderDetails.gst_amount ?? gstAmount,
              commission_amount: orderDetails.commission_amount ?? commissionAmount,
              payable_amount: orderDetails.payable_amount ?? Number((bidAmount + commissionAmount + gstAmount).toFixed(2)),
            });
            if (verifyResp.data?.status_code === 200 && verifyResp.data?.data?.payment_status === "captured") {
              try {
                const raw = sessionStorage.getItem("paymentData");
                const data = raw ? JSON.parse(raw) : null;
                const tId = taskerId || data?.taskerId;
                const tmId = taskPosterId || data?.taskPosterId;
                const taskIdForChat = orderDetails.postId || taskId || data?.taskId;
                if (tId && tmId) {
                  axiosInstance.post("/get-chat-id/", { sender: tmId, receiver: tId, job_id: taskIdForChat }).then((chatResp) => {
                    if (chatResp.data?.status_code === 200 && chatResp.data?.data?.chat_id) {
                      const chatId = chatResp.data.data.chat_id;
                      const stored = localStorage.getItem("userChats");
                      const chatIds: string[] = stored ? JSON.parse(stored) : [];
                      if (!chatIds.includes(chatId)) {
                        chatIds.push(chatId);
                        localStorage.setItem("userChats", JSON.stringify(chatIds));
                      }
                    }
                  }).catch(() => {});
                }
              } catch (_) {}
              localStorage.removeItem("pending_payment_order");
              sessionStorage.removeItem("paymentData");
              sessionStorage.removeItem("payment_page_visited");
              setPaymentStatus("captured");
              setShowPaymentModal(false);
              toast.success("Payment successful!");
            } else {
              throw new Error(verifyResp.data?.message || "Verification failed");
            }
          } catch (e: any) {
            console.error("Verify error:", e);
            setErrorMessage(e?.message || "Payment verification failed");
            setShowPaymentFailed(true);
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: () => setIsSubmitting(false),
        },
      });
      rzp.open();
      openedEmbedded = true;
    } catch (err: any) {
      console.error("Payment initiation error:", err?.message, err?.response?.data);
      const status = err?.response?.status;
      if (!hasTriedOnce && (status === 500 || status === 502 || status === 503 || status === 504)) {
        setHasTriedOnce(true);
        setTimeout(() => handlePayment(), 800);
        return;
      }
      setErrorMessage(err?.message || "Failed to create payment");
      setShowPaymentFailed(true);
    } finally {
      if (!openedEmbedded) setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setShowPaymentFailed(false);
  };

  const handleRetry = () => {
    setShowPaymentFailed(false);
    setHasTriedOnce(false);
    handlePayment();
  };

  const handleGoHome = () => {
    router.push("/dashboard");
    closeModal();
  };

  return (
    <div>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
      />
      <PaymentModal
        show={showPaymentModal}
        task={mockTask}
        bidAmount={bidAmount}
        handlePayment={handlePayment}
        closeModal={closeModal}
        isSubmitting={isSubmitting}
      />
      <PaymentFailed
        show={showPaymentFailed}
        errorMessage={errorMessage}
        onClose={closeModal}
        onRetry={handleRetry}
        onGoHome={handleGoHome}
      />
      {paymentStatus === "captured" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-green-600">Payment Successful</CardTitle>
              <CardDescription>Your payment has been processed successfully.</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button onClick={handleGoHome} className="bg-green-600 hover:bg-green-700">
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      {paymentUrlForSafari && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Open in Safari to Pay</CardTitle>
              <CardDescription>
                Copy the link below, open Safari, paste the link, and complete payment there. Then return to the JobPool app.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(paymentUrlForSafari);
                    toast.success("Link copied! Open Safari, paste the link, and complete payment.");
                  } catch {
                    toast.error("Could not copy. Try the Open button below.");
                  }
                }}
              >
                Copy Link (recommended)
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.open(paymentUrlForSafari, "_blank", "noopener,noreferrer") ||
                    (window.location.href = paymentUrlForSafari);
                }}
              >
                Open Payment Page
              </Button>
              <Button variant="ghost" onClick={() => setPaymentUrlForSafari(null)}>
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      {paymentData && (
        <div className="mt-4">
          <p>Tasker ID: {paymentData.taskerId}</p>
          <p>Task Poster ID: {paymentData.taskPosterId}</p>
        </div>
      )}
    </div>
  );
}