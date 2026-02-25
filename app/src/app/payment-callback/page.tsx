"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { CheckCircle, XCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openInAppOrWeb } from "@/lib/openInApp";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const error = searchParams.get("error");

  useEffect(() => {
    if (typeof window !== "undefined" && window.opener) {
      window.opener.focus?.();
    }
  }, []);

  const handleGoToDashboard = () => {
    if (window.opener) {
      window.opener.location.href = "/dashboard";
      window.close();
    } else {
      openInAppOrWeb("/dashboard");
    }
  };

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      openInAppOrWeb("/dashboard");
    }
  };

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-green-600 text-xl">Payment Successful!</CardTitle>
            <CardDescription>
              Your payment has been processed successfully. The task has been assigned.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              You can now close this window and return to the app to continue.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button onClick={handleGoToDashboard} className="w-full bg-green-600 hover:bg-green-700">
              <Home className="h-4 w-4 mr-2" />
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Close Window
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const errorMessage =
    error === "invalid_signature"
      ? "Payment verification failed."
      : error === "missing_params" || error === "missing_post_id"
        ? "Invalid callback. Please try the payment again from the app."
        : error === "server_error"
          ? "Something went wrong. Please check your dashboard or contact support."
          : "Payment could not be completed. Please try again from the app.";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-red-600 text-xl">Payment Failed</CardTitle>
          <CardDescription>We couldn&apos;t complete your payment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-red-50">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
          <p className="text-sm text-muted-foreground text-center mt-4">
            Please go back to the app and try again.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleGoToDashboard} variant="outline" className="w-full">
            <Home className="h-4 w-4 mr-2" />
            Go to Dashboard
          </Button>
          <Button variant="outline" onClick={handleClose} className="w-full">
            Close Window
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
