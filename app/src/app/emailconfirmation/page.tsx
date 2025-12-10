"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import axiosInstance from "@/lib/axiosInstance";
import { toast, Toaster } from "sonner";

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

        // Make API call to verify email
        const response = await axiosInstance.get(`/verify-email/?token=${token}`);

        // Check if the response is successful
        if (response.data.status_code === 200) {
          setStatus("success");
          toast.success(response.data.message || "Email verified successfully!");
        } else {
          throw new Error(response.data.message || "Failed to verify email");
        }
      } catch (error: any) {
        setStatus("error");
        const message = error?.response?.data?.message || error?.message || "An unknown error occurred";
        setErrorMessage(message);
        toast.error(message);
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4">
      <Toaster />
      <Card className="w-full max-w-md backdrop-blur-sm bg-white/90 border-0 shadow-2xl">
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

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              Need help?{" "}
              <Link href="/support" className="text-blue-600 hover:text-blue-700 transition-colors">
                Contact Support
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function EmailConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <EmailConfirmationContent />
    </Suspense>
  );
}

