"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type PendingOrder = {
  postId: string;
  order_id: string;
  tasker_id: string;
  taskmanager_id: string;
  bid_amount: number;
  gst_amount: number;
  commission_amount: number;
  payable_amount: number;
};

export default function RazorpayCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying payment...");

  useEffect(() => {
    const paymentId = params.get("razorpay_payment_id");
    const orderId = params.get("razorpay_order_id");
    const signature = params.get("razorpay_signature");

    if (!paymentId || !orderId || !signature) {
      setStatus("error");
      setMessage("Missing Razorpay payment details.");
      return;
    }

    let pending: PendingOrder | null = null;
    try {
      const raw = localStorage.getItem("pending_payment_order");
      if (raw) pending = JSON.parse(raw) as PendingOrder;
    } catch {
      // ignore
    }

    if (!pending) {
      setStatus("error");
      setMessage("Payment details not found. Please contact support.");
      return;
    }

    (async () => {
      try {
        const verifyResponse = await axiosInstance.post("/verify-payment/", {
          postId: pending.postId,
          payment_id: paymentId,
          order_id: orderId,
          signature,
          tasker_id: pending.tasker_id,
          taskmanager_id: pending.taskmanager_id,
          bid_amount: pending.bid_amount,
          gst_amount: pending.gst_amount,
          commission_amount: pending.commission_amount,
          payable_amount: pending.payable_amount,
        });

        if (verifyResponse.data?.status_code !== 200) {
          throw new Error(verifyResponse.data?.message || "Payment verification failed");
        }

        setStatus("success");
        setMessage("Payment successful!");
        localStorage.removeItem("pending_payment_order");
        localStorage.removeItem("pending_payment_verification");
        sessionStorage.removeItem("paymentData");
        sessionStorage.removeItem("payment_page_visited");

        setTimeout(() => router.push("/dashboard"), 1500);
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Payment verification failed");
      }
    })();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === "loading" ? "Verifying Payment" : status === "success" ? "Payment Success" : "Payment Failed"}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        {status === "error" && (
          <CardFooter className="flex justify-end">
            <Button onClick={() => router.push("/payments")}>Try Again</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
