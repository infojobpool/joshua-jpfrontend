

"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import { useRouter, useSearchParams } from "next/navigation";
import { PaymentModal } from "@/components/PaymentModal"; // Adjust path
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

  // Check if Razorpay is loaded
  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      console.log("Razorpay loaded on mount");
    }
  }, []);

  // Fallback to query params or mock data if sessionStorage is empty
  const taskId = paymentData?.taskId || searchParams.get("taskId") || mockTask.id;
  const bidAmount = paymentData?.amount || (searchParams.get("amount") && !isNaN(parseFloat(searchParams.get("amount")!))
    ? parseFloat(searchParams.get("amount")!)
    : mockTask.budget);
  const taskerId = paymentData?.taskerId || searchParams.get("taskerId") || "";
  const taskPosterId = paymentData?.taskPosterId || searchParams.get("taskPosterId") || mockTask.poster.id;

  console.log("PaymentPage mounted with params:", { taskId, bidAmount, taskerId, taskPosterId });

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

      // Verify Razorpay script
      if (!razorpayLoaded || !window.Razorpay) {
        console.error("Razorpay not loaded:", { razorpayLoaded, hasWindowRazorpay: !!window.Razorpay });
        throw new Error("Payment gateway not loaded. Please try again.");
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

  console.log("Current state:", { showPaymentModal, showPaymentFailed, paymentStatus, errorMessage, razorpayLoaded });

  return (
    <div>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("Razorpay script loaded");
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
      {paymentData && (
        <div className="mt-4">
          <p>Tasker ID: {paymentData.taskerId}</p>
          <p>Task Poster ID: {paymentData.taskPosterId}</p>
        </div>
      )}
    </div>
  );
}