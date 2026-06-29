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
import {
  buildPaymentDescriptionFromPosterPreview,
  fetchFeePreview,
  posterPayableAmount,
  type PosterFeeData,
} from "@/lib/feePreview";
import { getRazorpayCheckoutBranding } from "@/lib/razorpayBranding";
import { openExternalCheckout, paymentLinkRedirectFields, shouldUsePaymentLinkFlow, isCapacitorNative } from "@/lib/paymentNavigation";

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
  taskTitle?: string;
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

  // Check if Razorpay is loaded (script loads on this page only - not in root layout to avoid PWA opening to Razorpay)
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      setRazorpayLoaded(true);
      return;
    }
    const interval = setInterval(() => {
      if ((window as any).Razorpay) {
        setRazorpayLoaded(true);
        clearInterval(interval);
      }
    }, 100);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!(window as any).Razorpay) {
        console.error("Failed to load Razorpay script");
        setErrorMessage("Failed to load payment gateway");
        setShowPaymentFailed(true);
      }
    }, 15000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);
  const [paymentUrlForSafari, setPaymentUrlForSafari] = useState<string | null>(null);
  const [posterFees, setPosterFees] = useState<PosterFeeData | null>(null);
  const [posterFeesLoading, setPosterFeesLoading] = useState(false);
  const [posterFeesError, setPosterFeesError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Retrieve data from sessionStorage or URL params (when opened in Safari from copy link)
  useEffect(() => {
    let resolved: PaymentData | null = null;

    const data = sessionStorage.getItem("paymentData");
    if (data) {
      try {
        resolved = JSON.parse(data) as PaymentData;
        setPaymentData(resolved);
        console.log("Retrieved payment data from sessionStorage:", resolved);
      } catch (err) {
        console.error("Error parsing payment data:", err);
        setErrorMessage("Invalid payment data");
        setShowPaymentFailed(true);
      }
    } else {
      const taskId = searchParams.get("taskId");
      const amount = searchParams.get("amount");
      const taskerId = searchParams.get("taskerId") || "";
      const taskPosterId = searchParams.get("taskPosterId") || "";
      if (taskId && amount && !isNaN(parseFloat(amount))) {
        const taskTitle = searchParams.get("taskTitle");
        resolved = {
          taskId,
          taskerId,
          taskPosterId,
          amount: parseFloat(amount),
          ...(taskTitle ? { taskTitle: decodeURIComponent(taskTitle) } : {}),
        };
        setPaymentData(resolved);
        setShowPaymentModal(true);
        try {
          sessionStorage.setItem("paymentData", JSON.stringify(resolved));
        } catch {
          /* ignore */
        }
        console.log("Retrieved payment data from URL params:", resolved);
      } else {
        console.warn("No payment data in sessionStorage or URL params");
        setErrorMessage("Payment data not found");
        setShowPaymentFailed(true);
      }
    }

    if (resolved?.taskId) {
      sessionStorage.setItem("payment_page_visited", "true");
    }
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

  useEffect(() => {
    if (!bidAmount || bidAmount <= 0) {
      setPosterFees(null);
      setPosterFeesError(null);
      setPosterFeesLoading(false);
      return;
    }
    let cancelled = false;
    setPosterFeesLoading(true);
    setPosterFeesError(null);
    void (async () => {
      try {
        const data = (await fetchFeePreview(bidAmount, "poster")) as PosterFeeData;
        if (!cancelled) {
          setPosterFees(data);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setPosterFees(null);
          setPosterFeesError(e instanceof Error ? e.message : "Unable to load fees");
        }
      } finally {
        if (!cancelled) setPosterFeesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bidAmount]);

  const handlePayment = async () => {
    if (isSubmitting) return;
    if (!posterFees || posterFeesLoading) {
      toast.error("Payment fees are still loading. Please wait.");
      return;
    }
    if (posterFeesError) {
      toast.error(posterFeesError);
      return;
    }
    setIsSubmitting(true);
    setErrorMessage("");
    setPaymentStatus(null);

    const gstAmount = Number(posterFees.gst_amount ?? 0);
    const commissionAmount = Number(posterFees.commission_amount ?? posterFees.platform_fee ?? 0);
    const payableAmount = posterPayableAmount(posterFees, bidAmount) ?? 0;
    if (!payableAmount || payableAmount <= 0) {
      toast.error("Invalid payment total from server. Refresh and try again.");
      setIsSubmitting(false);
      return;
    }
    const taskTitle = paymentData?.taskTitle || mockTask.title;

    const checkoutBranding = getRazorpayCheckoutBranding();
    const orderPayload = {
      postId: taskId,
      bid_amount: Number((posterFees.bid_amount ?? bidAmount).toFixed(2)),
      gst_amount: Number(gstAmount.toFixed(2)),
      commission_amount: Number(commissionAmount.toFixed(2)),
      payable_amount: Number(payableAmount.toFixed(2)),
      tasker_id: taskerId,
      taskmanager_id: taskPosterId,
      task_title: taskTitle,
      payment_description: buildPaymentDescriptionFromPosterPreview(taskTitle || `Task ${taskId}`, posterFees),
      checkout_name: checkoutBranding.name,
      checkout_image: checkoutBranding.image,
      ...paymentLinkRedirectFields(),
    };

    // PWA / native app: payment link in system browser (embedded Razorpay modal is blank in WebView).
    const isStandalonePWA = shouldUsePaymentLinkFlow();

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
              bid_amount: orderPayload.bid_amount,
              gst_amount: orderPayload.gst_amount,
              commission_amount: orderPayload.commission_amount,
              payable_amount: orderPayload.payable_amount,
            })
          );
        } catch (_) {}
        if (isCapacitorNative()) {
          toast.info("Complete payment in the window that opens, then return to JobPool.");
          void openExternalCheckout(paymentUrl, {
            onBrowserClosed: () => {
              toast.message("Back in JobPool", {
                description: "If payment succeeded, open Dashboard to see the updated task.",
              });
            },
          });
          return;
        }
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
        name: checkoutBranding.name,
        image: checkoutBranding.image,
        theme: checkoutBranding.theme,
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
              bid_amount: orderDetails.bid_amount ?? orderPayload.bid_amount,
              gst_amount: orderDetails.gst_amount ?? orderPayload.gst_amount,
              commission_amount: orderDetails.commission_amount ?? orderPayload.commission_amount,
              payable_amount: orderDetails.payable_amount ?? orderPayload.payable_amount,
            });
            if (verifyResp.data?.status_code === 200 && verifyResp.data?.data?.payment_status === "captured") {
              try {
                const raw = sessionStorage.getItem("paymentData");
                const data = raw ? JSON.parse(raw) : null;
                const tId = taskerId || data?.taskerId;
                const tmId = taskPosterId || data?.taskPosterId;
                const taskIdForChat = orderDetails.postId || taskId || data?.taskId;
                if (tId && tmId) {
                  axiosInstance.get("/create-or-get-chat/", { params: { sender: tmId, receiver: tId, job_id: taskIdForChat } }).then((chatResp) => {
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
      // Brief delay before open() - helps avoid blank page on first load in mobile WebView
      await new Promise((r) => setTimeout(r, 150));
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
        onLoad={() => {
          setRazorpayLoaded(true);
        }}
        onError={() => {
          console.error("Failed to load Razorpay script");
          setErrorMessage("Failed to load payment gateway");
          setShowPaymentFailed(true);
        }}
      />
      <PaymentModal
        show={showPaymentModal}
        task={mockTask}
        bidAmount={bidAmount}
        handlePayment={handlePayment}
        closeModal={closeModal}
        isSubmitting={isSubmitting}
        razorpayReady={razorpayLoaded}
        externalFeePreview={{
          data: posterFees,
          loading: posterFeesLoading,
          error: posterFeesError,
        }}
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
              {typeof navigator !== "undefined" && navigator.share && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      await navigator.share({ url: paymentUrlForSafari, title: "JobPool Payment Link", text: "Complete your payment" });
                      toast.success("Use Copy or Open in Safari from the share menu.");
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
                  if (!paymentUrlForSafari) return;
                  const result = await openExternalCheckout(paymentUrlForSafari, {
                    router,
                    onBrowserClosed: () => {
                      toast.message("Back in JobPool", {
                        description: "If payment succeeded, open Dashboard to see the updated task.",
                      });
                    },
                  });
                  if (result === "blocked") {
                    toast.info("Popup blocked. Use 'Copy Link' above, then paste in Safari to pay.");
                  } else if (result === "navigated") {
                    setPaymentUrlForSafari(null);
                  } else {
                    toast.info("Complete payment in the browser, then return to JobPool.");
                  }
                }}
              >
                Open Payment Page
              </Button>
              <p className="text-xs text-muted-foreground text-center w-full">
                Opens Razorpay in your browser. Use Copy Link if this page goes blank.
              </p>
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