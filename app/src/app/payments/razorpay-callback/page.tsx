"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { openInAppOrWeb } from "@/lib/openInApp";

type PendingOrder = {
  postId: string;
  order_id?: string;
  tasker_id: string;
  taskmanager_id: string;
  bid_amount: number;
  gst_amount: number;
  commission_amount: number;
  payable_amount: number;
};

function addChatAndRedirect(postId: string, taskerId: string, taskmanagerId: string) {
  try {
    const raw = sessionStorage.getItem("paymentData");
    const data = raw ? JSON.parse(raw) : null;
    const taskId = data?.taskId || postId;
    const tId = data?.taskerId || taskerId;
    const tmId = data?.taskPosterId || taskmanagerId;
    if (tId && tmId) {
      axiosInstance.get("/create-or-get-chat/", {
        params: { sender: tmId, receiver: tId, job_id: taskId },
      }).then((chatResp) => {
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
  localStorage.removeItem("pending_payment_verification");
  sessionStorage.removeItem("paymentData");
  sessionStorage.removeItem("payment_page_visited");
}

export default function RazorpayCallbackPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying payment...");

  useEffect(() => {
    const urlStatus = params.get("status");
    const already = params.get("already");
    const errorParam = params.get("error");
    const paymentId = params.get("razorpay_payment_id");
    const orderId = params.get("razorpay_order_id");
    const signature = params.get("razorpay_signature");

    // New flow: backend redirects with ?status=success | ?status=success&already=1 | ?status=failed&error=...
    if (urlStatus === "success") {
      setStatus("success");
      setMessage(already === "1" ? "Payment already verified." : "Payment successful!");
      addChatAndRedirect("", "", "");
      return;
    }
    if (urlStatus === "failed") {
      setStatus("error");
      setMessage(errorParam || "Payment could not be completed.");
      addChatAndRedirect("", "", "");
      return;
    }

    // Legacy flow: Razorpay redirects with payment_id, order_id, signature
    if (!paymentId || !orderId || !signature) {
      setStatus("error");
      setMessage("Missing payment details.");
      addChatAndRedirect("", "", "");
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
      setStatus("success");
      setMessage("Payment completed.");
      addChatAndRedirect("", "", "");
      return;
    }

    (async () => {
      try {
        const verifyResponse = await axiosInstance.post("/verify-payment/", {
          postId: pending!.postId,
          payment_id: paymentId,
          order_id: orderId,
          signature,
          tasker_id: pending!.tasker_id,
          taskmanager_id: pending!.taskmanager_id,
          bid_amount: pending!.bid_amount,
          gst_amount: pending!.gst_amount,
          commission_amount: pending!.commission_amount,
          payable_amount: pending!.payable_amount,
        });

        if (verifyResponse.data?.status_code !== 200) {
          throw new Error(verifyResponse.data?.message || "Payment verification failed");
        }

        setStatus("success");
        setMessage("Payment successful!");
        addChatAndRedirect(pending!.postId, pending!.tasker_id, pending!.taskmanager_id);
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Payment verification failed");
      }
    })();
  }, [params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === "loading" ? "Verifying Payment" : status === "success" ? "Payment Successful" : "Payment Failed"}
          </CardTitle>
          <CardDescription>
            {status === "success" ? (
              <>
                A payment confirmation has been sent to your email and mobile.
                <br /><br />
                Close this page and reopen the JobPool app from your home screen. Your payment will appear there.
              </>
            ) : (
              message
            )}
          </CardDescription>
        </CardHeader>
        {status === "error" && (
          <CardFooter className="flex flex-col gap-2">
            <Button onClick={() => (window.location.href = "/payments/")}>Try Again</Button>
            <Button variant="outline" onClick={() => openInAppOrWeb("/dashboard")}>
              Back to Dashboard
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
