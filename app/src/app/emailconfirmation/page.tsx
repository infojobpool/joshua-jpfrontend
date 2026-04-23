"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "@/lib/axiosInstance";
import { toast, Toaster } from "sonner";
import { AuthFlowShell, AuthPageViewport } from "@/components/auth/AuthFlowShell";

function EmailConfirmationContent() {
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

        console.log("📧 [Email Verification] Attempting to verify email with token:", token.substring(0, 10) + "...");

        // Try GET with query parameter first (standard approach)
        let response;
        try {
          response = await axiosInstance.get(`/verify-email/?token=${encodeURIComponent(token)}`);
          console.log("📧 [Email Verification] GET response:", response.data);
        } catch (getError: any) {
          // If GET fails, try POST with token in body
          if (getError.response?.status === 404 || getError.response?.status === 405 || getError.code === 'ECONNREFUSED' || getError.code === 'ERR_NETWORK') {
            console.log("📧 [Email Verification] GET failed, trying POST with token in body...");
            try {
              response = await axiosInstance.post(`/verify-email/`, {
                token: token,
              });
              console.log("📧 [Email Verification] POST response:", response.data);
            } catch (postError: any) {
              // If POST also fails, try GET with different endpoint format
              console.log("📧 [Email Verification] POST failed, trying alternative endpoint format...");
              try {
                response = await axiosInstance.get(`/verify-email?token=${encodeURIComponent(token)}`);
                console.log("📧 [Email Verification] Alternative GET response:", response.data);
              } catch (altError: any) {
                // Log detailed error information
                console.error("❌ [Email Verification] All attempts failed:", {
                  getError: {
                    status: getError.response?.status,
                    message: getError.message,
                    code: getError.code,
                    data: getError.response?.data,
                  },
                  postError: {
                    status: postError.response?.status,
                    message: postError.message,
                    code: postError.code,
                    data: postError.response?.data,
                  },
                  altError: {
                    status: altError.response?.status,
                    message: altError.message,
                    code: altError.code,
                    data: altError.response?.data,
                  },
                });
                throw altError; // Throw the last error
              }
            }
          } else {
            throw getError; // Re-throw if it's a different error
          }
        }

        // Check if the response is successful
        if (response.data.status_code === 200 || response.status === 200) {
          setStatus("success");
          toast.success(response.data.message || "Email verified successfully!");
          
          // Update user verification status in localStorage if user is logged in
          try {
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
              const parsedUser = JSON.parse(storedUser);
              parsedUser.email_verified = true;
              localStorage.setItem("user", JSON.stringify(parsedUser));
            }
          } catch (e) {
            console.warn("Failed to update localStorage:", e);
          }
        } else {
          throw new Error(response.data.message || "Failed to verify email");
        }
      } catch (error: any) {
        console.error("❌ [Email Verification] Final error:", {
          message: error?.message,
          code: error?.code,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          url: error?.config?.url,
        });

        setStatus("error");
        
        // Provide more detailed error messages
        let message = "Failed to verify email";
        if (error?.code === 'ECONNREFUSED' || error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
          message = "Failed to connect to the server. Please check your internet connection and try again.";
        } else if (error?.response?.status === 404) {
          message = "Verification endpoint not found. Please contact support.";
        } else if (error?.response?.status === 400) {
          message = error?.response?.data?.message || "Invalid verification token. The link may have expired.";
        } else if (error?.response?.status === 401) {
          message = "Unauthorized. Please try requesting a new verification email.";
        } else if (error?.response?.status === 500) {
          message = "Server error. Please try again later or contact support.";
        } else if (error?.response?.data?.message) {
          message = error.response.data.message;
        } else if (error?.message) {
          message = error.message;
        }
        
        setErrorMessage(message);
        toast.error(message);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <AuthPageViewport>
      <AuthFlowShell
        footer={
          <>
            Need help?{" "}
            <Link href="/support" className="font-medium text-blue-600 hover:text-blue-700">
              Contact support
            </Link>
            .
          </>
        }
      >
      <Toaster />
      <Card className="w-full max-w-md border border-slate-200/70 bg-white/95 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/[0.04] backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Email Confirmation</CardTitle>
          <CardDescription className="text-gray-600">
            {status === "loading" && "Verifying your email address..."}
            {status === "success" && "Your email has been successfully verified!"}
            {status === "error" && "There was a problem verifying your email."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-4">
          {status === "loading" && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
              <p className="text-center text-muted-foreground">Please wait while we verify your email address.</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <div className="text-center space-y-2">
                <p className="font-medium text-lg">Your email address has been verified.</p>
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
                <p className="font-medium text-lg">Verification failed</p>
                <p className="text-muted-foreground">
                  {errorMessage || "The confirmation link is invalid or has expired."}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          {status === "success" && (
            <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" onClick={() => router.push("/signin")}>
              Go to Sign In
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}

          {status === "error" && (
            <div className="space-y-2 w-full">
              <Button className="w-full" variant="outline" onClick={() => router.push("/signin")}>
                Go to Sign In
              </Button>
              <Button className="w-full" variant="secondary" onClick={() => router.push("/")}>
                Return to Home
              </Button>
            </div>
          )}

          {status === "loading" && (
            <Button className="w-full" disabled>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </Button>
          )}

        </CardFooter>
      </Card>
      </AuthFlowShell>
    </AuthPageViewport>
  );
}

export default function EmailConfirmationPage() {
  return (
    <Suspense
      fallback={
        <AuthPageViewport>
          <AuthFlowShell>
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" aria-hidden />
              <p className="mt-3 text-sm text-slate-500">Loading…</p>
            </div>
          </AuthFlowShell>
        </AuthPageViewport>
      }
    >
      <EmailConfirmationContent />
    </Suspense>
  );
}

