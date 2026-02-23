

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentModal } from "@/components/PaymentModal"; // Adjust path
import { toast } from "sonner";
import { PaymentFailed } from "@/components/payment-failed"; // Adjust path
import { Task } from "../types"; // Adjust path to your types
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axiosInstance from "../../lib/axiosInstance"; // Adjust path to your axiosInstance

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
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [hasTriedOnce, setHasTriedOnce] = useState(false);
  const [showWebviewHelp, setShowWebviewHelp] = useState(false);
  const [paymentOpenedInBrowser, setPaymentOpenedInBrowser] = useState(false);
  const [paymentLinkForSafari, setPaymentLinkForSafari] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Retrieve data from sessionStorage on mount
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
      console.warn("No payment data found in sessionStorage");
      setErrorMessage("Payment data not found");
      setShowPaymentFailed(true);
    }
    
    // Mark that user has entered the payment page
    sessionStorage.setItem("payment_page_visited", "true");
  }, []);

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

  const loadRazorpay = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;
    if (window.Razorpay) return true;

    return new Promise((resolve) => {
      const existing = document.getElementById("razorpay-checkout-js") as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve(!!window.Razorpay));
        existing.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.id = "razorpay-checkout-js";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(!!window.Razorpay);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Ensure Razorpay script is loaded as early as possible
  useEffect(() => {
    (async () => {
      const ok = await loadRazorpay();
      setRazorpayLoaded(ok);
      console.log("Razorpay loaded on mount:", ok);
    })();
  }, []);

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

  // Use Payment Link (open in browser) when Razorpay modal would render blank:
  // - In-app WebView (PWA Builder, standalone PWA, TWA)
  // - Mobile devices (iPhone, Android, iPad, etc.)
  const usePaymentLink = (): boolean => {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent || "";
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (navigator as any).standalone === true ||
      (navigator as any).displayMode === "standalone";
    const isWebViewOrPWA =
      /wv\)|WebView|PWA Builder|pwashell|pwa-builder/i.test(ua) ||
      document.referrer?.startsWith("android-app://") ||
      typeof (window as any).Windows !== "undefined"; // PWA Builder on Windows
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    return !!(isStandalone || isWebViewOrPWA || isMobile);
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

    try {
      // Mobile / WebView: use Payment Link, open in system browser (Razorpay modal is blank in app)
      if (usePaymentLink()) {
        const response = await axiosInstance.post("/create-payment-link/", {
          postId: taskId,
          bid_amount: Number(bidAmount.toFixed(2)),
          gst_amount: Number(gstAmount.toFixed(2)),
          commission_amount: Number(commissionAmount.toFixed(2)),
          payable_amount: Number(payableAmount.toFixed(2)),
          tasker_id: taskerId,
          taskmanager_id: taskPosterId,
        });
        const result = response.data;
        if (!result?.data?.short_url) {
          throw new Error(result?.message || "Failed to create payment link");
        }
        const paymentUrl = result.data.short_url;
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
        const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches ||
          (navigator as any).standalone === true;

        // iOS PWA: programmatic window.open/location.href opens in same WebView (Razorpay blank).
        // Show "tap to open" modal with real <a> link - user's tap opens Safari reliably.
        if (isIOS && isStandalone) {
          setPaymentLinkForSafari(paymentUrl);
          setShowPaymentModal(false);
          return;
        }

        // Android/desktop: try window.open (opens external browser on Android). Fallback to tap modal if blocked.
        if (!isIOS) {
          const win = window.open(paymentUrl, "_blank", "noopener,noreferrer");
          if (win) {
            setShowPaymentModal(false);
            setPaymentOpenedInBrowser(true);
            return;
          }
        }

        // Popup blocked or fallback: show tap-to-open modal (works on all platforms)
        setPaymentLinkForSafari(paymentUrl);
        setShowPaymentModal(false);
        return;
      }

      const response = await axiosInstance.post("/create-order/", {
        postId: taskId,
        bid_amount: Number(bidAmount.toFixed(2)),
        gst_amount: Number(gstAmount.toFixed(2)),
        commission_amount: Number(commissionAmount.toFixed(2)),
        payable_amount: Number(payableAmount.toFixed(2)),
        tasker_id: taskerId,
        taskmanager_id: taskPosterId,
      });

      console.log("create-order response:", JSON.stringify(response.data, null, 2));
      const result = response.data;

      // Validate response
      if (!result || typeof result !== "object" || !result.data || result.status_code !== 200) {
        throw new Error(result.message || "Failed to create order");
      }

      const orderDetails = result.data;
      console.log("Order details:", orderDetails);
      if (
        !orderDetails.order_id ||
        !orderDetails.key ||
        typeof orderDetails.payable_amount !== "number" ||
        !orderDetails.currency ||
        !orderDetails.postId
      ) {
        console.error("Invalid order details:", orderDetails);
        throw new Error("Missing required order details");
      }

      // Verify Razorpay script (load on-demand for mobile reliability)
      const scriptOk = await loadRazorpay();
      setRazorpayLoaded(scriptOk);
      if (!scriptOk || !window.Razorpay) {
        console.error("Razorpay not loaded:", { razorpayLoaded: scriptOk, hasWindowRazorpay: !!window.Razorpay });
        throw new Error("Payment gateway not loaded. Please try again.");
      }

      // Persist details for redirect flow (webviews can skip handler)
      try {
        localStorage.setItem(
          "pending_payment_order",
          JSON.stringify({
            postId: orderDetails.postId,
            order_id: orderDetails.order_id,
            tasker_id: taskerId,
            taskmanager_id: taskPosterId,
            bid_amount: orderDetails.bid_amount,
            gst_amount: orderDetails.gst_amount,
            commission_amount: orderDetails.commission_amount,
            payable_amount: orderDetails.payable_amount,
          })
        );
      } catch (e) {
        console.warn("Failed to store pending payment order:", e);
      }

      // Razorpay checkout options
      const options = {
        key: orderDetails.key,
        amount: Math.round(orderDetails.payable_amount * 100), // Amount in paise
        currency: orderDetails.currency,
        order_id: orderDetails.order_id,
        name: "Your Company Name",
        description: `Payment for Task ID: ${orderDetails.postId}`,
        image: "https://jobpool.in/public/assets/img/logo/jp-logo.png",
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          console.log("✅ Razorpay payment successful! Response:", response);
          
          // Store payment details in case verification fails but payment succeeded
          const paymentDetails = {
            postId: orderDetails.postId,
            payment_id: response.razorpay_payment_id,
            order_id: response.razorpay_order_id,
            signature: response.razorpay_signature,
            tasker_id: taskerId,
            taskmanager_id: taskPosterId,
            bid_amount: orderDetails.bid_amount,
            gst_amount: orderDetails.gst_amount,
            commission_amount: orderDetails.commission_amount,
            payable_amount: orderDetails.payable_amount,
            timestamp: Date.now(),
          };
          
          // Store in localStorage for potential retry
          try {
            localStorage.setItem("pending_payment_verification", JSON.stringify(paymentDetails));
          } catch (e) {
            console.warn("Failed to store payment details:", e);
          }

          // Try to verify payment with retry logic
          let verificationSuccess = false;
          let lastError: any = null;
          const maxRetries = 3;
          
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(`🔄 Verifying payment (attempt ${attempt}/${maxRetries})...`);
              
              const verifyResponse = await axiosInstance.post("/verify-payment/", {
                postId: orderDetails.postId,
                payment_id: response.razorpay_payment_id,
                order_id: response.razorpay_order_id,
                signature: response.razorpay_signature,
                tasker_id: taskerId,
                taskmanager_id: taskPosterId,
                bid_amount: orderDetails.bid_amount,
                gst_amount: orderDetails.gst_amount,
                commission_amount: orderDetails.commission_amount,
                payable_amount: orderDetails.payable_amount,
              });
              
              console.log("✅ verify-payment response:", verifyResponse.data);
              const data = verifyResponse.data;
              
              if (data.status_code !== 200) {
                throw new Error(data.message || "Payment verification failed");
              }
              
              setPaymentStatus(data.data.payment_status);
              
              if (data.data.payment_status === "captured") {
                console.log("✅ Payment captured successfully");
                verificationSuccess = true;
                
                // Clear stored payment details on success so task/dashboard don't show "payment pending"
                try {
                  localStorage.removeItem("pending_payment_verification");
                  sessionStorage.removeItem("paymentData");
                  sessionStorage.removeItem("payment_page_visited");
                } catch (e) {
                  console.warn("Failed to clear payment details:", e);
                }
                
                // Show success message
                alert("Payment successful!");
                setShowPaymentModal(false);
                
                // Fetch and display task order details
                await fetchTaskOrderDetails(response.razorpay_order_id);
                break; // Exit retry loop on success
              } else {
                throw new Error(`Payment not captured: ${data.data.payment_status}`);
              }
            } catch (err: any) {
              lastError = err;
              console.error(`❌ Verification attempt ${attempt} failed:`, {
                message: err.message,
                code: err.code,
                status: err.response?.status,
                isNetworkError: err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error'),
              });
              
              // If it's a network error and we have retries left, wait and retry
              const isNetworkError = err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error');
              
              if (isNetworkError && attempt < maxRetries) {
                const waitTime = attempt * 2000; // Exponential backoff: 2s, 4s, 6s
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue; // Retry
              } else {
                // If it's not a network error or we're out of retries, break
                break;
              }
            }
          }
          
          // If verification failed after all retries, show appropriate message
          if (!verificationSuccess) {
            const isNetworkError = lastError?.code === 'ECONNREFUSED' || lastError?.code === 'ERR_NETWORK' || lastError?.message?.includes('Network Error');
            
            if (isNetworkError) {
              // Payment succeeded on Razorpay but verification API failed
              console.warn("⚠️ Payment succeeded on Razorpay but verification failed. Payment may still be processed.");
              setErrorMessage(
                "Payment was successful, but we couldn't verify it due to a network error. " +
                "Your payment may still be processed. Please check your payment status or contact support with Payment ID: " +
                response.razorpay_payment_id
              );
            } else {
              // Other verification error
              setErrorMessage(lastError?.response?.data?.message || lastError?.message || "Payment verification failed");
            }
            
            setShowPaymentFailed(true);
          }
        },
        prefill: {
          name: mockTask.poster.name || "Customer",
          email: mockTask.poster.email || "customer@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: () => {
            console.log("Razorpay modal dismissed");
            setErrorMessage("Payment cancelled by user");
            setShowPaymentFailed(true);
          },
        },
      };

      // WebView fallback: force redirect flow to avoid blank screen in in-app browsers
      if (usePaymentLink()) {
        (options as Record<string, unknown>).redirect = true;
        (options as Record<string, unknown>).callback_url =
          `${window.location.origin}/payments/razorpay-callback`;
      }

      console.log("Opening Razorpay checkout with options:", JSON.stringify(options, null, 2));
      const rzp = new window.Razorpay(options);
      rzp.open();
      console.log("Razorpay checkout opened");
    } catch (err: any) {
      console.error("Payment initiation error:", {
        message: err.message,
        stack: err.stack,
        response: err.response?.data,
      });
      // One-time auto-retry for transient server errors
      const status = err?.response?.status;
      if (!hasTriedOnce && (status === 500 || status === 502 || status === 503 || status === 504)) {
        console.warn("Auto-retrying create-order once due to server error", status);
        setHasTriedOnce(true);
        setTimeout(() => handlePayment(), 500);
        return;
      }
      setErrorMessage(err.message || "Failed to initiate payment");
      setShowPaymentFailed(true);
    } finally {
      setIsSubmitting(false);
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

  console.log("Current state:", { showPaymentModal, showPaymentFailed, paymentStatus, errorMessage, razorpayLoaded });

  return (
    <div>
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
              <CardTitle>Open in Safari to Pay</CardTitle>
              <CardDescription>
                Payment cannot complete in the app. Tap the button below to open the payment page in Safari. After
                payment, you&apos;ll be redirected back here.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2">
              <a
                href={paymentLinkForSafari}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    e.preventDefault();
                    window.location.href = `x-safari-${paymentLinkForSafari}`;
                  }
                }}
                className="w-full rounded-md bg-green-600 px-4 py-3 text-center font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 no-underline"
              >
                Open Payment Page in Safari
              </a>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    await navigator.clipboard?.writeText(paymentLinkForSafari);
                    toast.success("Link copied. Paste in Safari to pay.");
                  } catch {
                    toast.error("Could not copy. Tap the green button above to open.");
                  }
                }}
              >
                Copy Link (paste in Safari)
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