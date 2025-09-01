"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "../../lib/axiosInstance"; // Import axiosInstance for API calls
import { toast, Toaster } from "sonner"; // Import sonner for toast notifications

export default function EmailConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the token from the URL
        const token = searchParams.get("token");

        if (!token) {
          setStatus("error");
          setErrorMessage("No confirmation token found in the URL.");
          return;
        }

        // Make API call to verify email
        const response = await axiosInstance.get(`/verify-email/?token=${token}`);

        // Check if the response is successful
        if (response.data.status_code === 200) {
          setStatus("success");
          toast.success(response.data.message || "Email verified successfully!");
        } else {
          throw new Error(response.data.message || "Failed to verify email");
        }
      } catch (error) {
        setStatus("error");
        const message = error instanceof Error ? error.message : "An unknown error occurred";
        setErrorMessage(message);
        toast.error(message);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Toaster /> {/* Add Toaster for toast notifications */}
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Email Confirmation</CardTitle>
          <CardDescription>
            {status === "loading" && "Verifying your email address..."}
            {status === "success" && "Your email has been successfully verified!"}
            {status === "error" && "There was a problem verifying your email."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-4">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="text-center space-y-2">
                <p className="font-medium">Your email address has been verified.</p>
                <p className="text-muted-foreground">
                  Thank you for confirming your email. You can now access all features of our platform.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-16 w-16 text-red-500" />
              <div className="text-center space-y-2">
                <p className="font-medium">Verification failed</p>
                <p className="text-muted-foreground">
                  {errorMessage || "The confirmation link is invalid or has expired."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {status === "success" && (
            <Button className="w-full" onClick={() => router.push("/signin")}>
              Please login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {status === "error" && (
            <div className="space-y-2 w-full">
              <Button className="w-full" variant="outline" onClick={() => router.push("/auth/resend-confirmation")}>
                Resend Confirmation Email
              </Button>
              <Button className="w-full" variant="secondary" onClick={() => router.push("/auth/login")}>
                Return to Login
              </Button>
            </div>
          )}

          {status === "loading" && (
            <Button className="w-full" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </Button>
          )}

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Need help?{" "}
              <Link href="/support" className="underline underline-offset-4 hover:text-primary">
                Contact Support
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}