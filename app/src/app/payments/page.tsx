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
  const [showWebviewHelp, setShowWebviewHelp] = useState(false);
  const [paymentOpenedInBrowser, setPaymentOpenedInBrowser] = useState(false);
  const [paymentLinkForSafari, setPaymentLinkForSafari] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
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

  console.log("PaymentPage mounted with params:", { taskId, bidAmount, taskerId, taskPosterId });

  const buildPaymentUrl = (): string => {
    if (typeof window === "undefined") return "/payments";
    const params = new URLSearchParams();
    params.set("taskId", taskId);
    params.set("amount", String(bidAmount));
    if (taskerId) params.set("taskerId", taskerId);
    if (taskPosterId) params.set("taskPosterId", taskPosterId);
    return `${window.location.origin}/payments?${params.toString()}`;
  };

  const handlePayment = async () => {
    console.log("handlePayment called at", new Date().toISOString());
    if (isSubmitting) {
      console.log("Prevented double submit");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage("");
    setPaymentStatus(null);

    const commissionAmount = bidAmount * 0.05; // 5% commission
    const gstAmount = (bidAmount + commissionAmount) * 0.18; // 18% GST
    const payableAmount = bidAmount + commissionAmount + gstAmount;

    const orderPayload = {
      postId: taskId,
      bid_amount: Number(bidAmount.toFixed(2)),
      gst_amount: Number(gstAmount.toFixed(2)),
      commission_amount: Number(commissionAmount.toFixed(2)),
      payable_amount: Number(payableAmount.toFixed(2)),
      tasker_id: taskerId,
      taskmanager_id: taskPosterId,
    };

    let openedEmbedded = false;
    try {
      // Try in-app embedded checkout first (create-order)
      try {
        const orderResponse = await axiosInstance.post("/create-order/", orderPayload);
        const orderResult = orderResponse.data;
        const orderDetails = orderResult?.data;

        if (
          orderResult?.status_code === 200 &&
          orderDetails?.order_id &&
          orderDetails?.key &&
          orderDetails?.payable_amount != null &&
          orderDetails?.currency &&
          (razorpayLoaded || (typeof window !== "undefined" && !!(window as any).Razorpay))
        ) {
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
                  payable_amount: orderDetails.payable_amount ?? payableAmount,
                });
                if (verifyResp.data?.status_code === 200 && verifyResp.data?.data?.payment_status === "captured") {
                  // Add chat and clear payment storage (same as razorpay-callback)
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
              ondismiss: () => {
                setIsSubmitting(false);
              },
            },
          });
          rzp.open();
          openedEmbedded = true;
          return; // Stay on page, Razorpay overlay opened
        }
      } catch (orderErr: any) {
        console.warn("create-order failed, falling back to payment link:", orderErr?.response?.status ?? orderErr?.message);
      }

      // Fallback: payment link (opens Safari/external browser)
      const response = await axiosInstance.post("/create-payment-link/", orderPayload);
      const result = response.data;
      if (!result?.data?.short_url) {
        throw new Error(result?.message || "Failed to create payment link");
      }
      const paymentUrl = result.data.short_url;
      const d = result.data;

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
            payable_amount: payableAmount,
          })
        );
      } catch (_) {}

      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
      await new Promise((r) => setTimeout(r, 300));

      if (isIOS) {
        window.location.href = paymentUrl;
        return;
      }
      const win = window.open(paymentUrl, "_blank", "noopener,noreferrer");
      if (win) {
        setShowPaymentModal(false);
        setPaymentOpenedInBrowser(true);
        return;
      }
      window.location.href = paymentUrl;
    } catch (err: any) {
      console.error("Payment initiation error:", {
        message: err?.message,
        response: err?.response?.data,
      });
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


  // Function to fetch task order details after successful payment
  const fetchTaskOrderDetails = async (orderId: string) => {
    try {
      const response = await axiosInstance.get("/get-all-task-orders/");
      console.log("get-all-task-orders response:", response.data);
      const result = response.data;
      if (result.status_code !== 200 || !result.data.task_orders) {
        throw new Error(result.message || "Failed to fetch task orders");
      }
      const taskOrder = result.data.task_orders.find((order: any) => order.order_id === orderId);
      if (taskOrder) {
        console.log("Task order found:", taskOrder);
        // Optionally update UI with task order details
      } else {
        console.warn("Task order not found for order_id:", orderId);
      }
    } catch (err: any) {
      console.error("Error fetching task order:", err);
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

  const handleOpenInBrowser = () => {
    const url = buildPaymentUrl();
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      window.location.href = url;
    }
  };

  const handleCopyLink = () => {
    const url = buildPaymentUrl();
    navigator.clipboard.writeText(url).catch(() => {});
  };

  console.log("Current state:", { showPaymentModal, showPaymentFailed, paymentStatus, errorMessage });

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
      {showWebviewHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Open in Browser to Pay</CardTitle>
              <CardDescription>
                Razorpay checkout is blocked in in-app browsers. Please open this page in Safari/Chrome to complete
                payment.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCopyLink}>Copy Link</Button>
              <Button onClick={handleOpenInBrowser} className="bg-green-600 hover:bg-green-700">Open in Browser</Button>
            </CardFooter>
          </Card>
        </div>
      )}
      {paymentLinkForSafari && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Complete Payment in Safari</CardTitle>
              <CardDescription>
                Razorpay does not work reliably in the app. Copy the link below and paste it in Safari to pay. If you see a blank screen, copy the link and open in Safari.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2">
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(paymentLinkForSafari);
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
                  window.open(paymentLinkForSafari, "_blank", "noopener,noreferrer") ||
                    (window.location.href = paymentLinkForSafari);
                }}
              >
                Try Opening
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setPaymentLinkForSafari(null);
                  setShowPaymentModal(true);
                }}
              >
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      {paymentOpenedInBrowser && !paymentLinkForSafari && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Complete Payment in Browser</CardTitle>
              <CardDescription>
                The payment page has opened in your browser. Complete the payment there, then return to the app.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => router.push("/dashboard")} className="w-full">
                Go to Dashboard
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