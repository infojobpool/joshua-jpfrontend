"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import  axiosInstance  from "../../lib/axiosInstance"; // Adjust the import path to where your axiosInstance is defined


export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("loading");

    try {
      // Make API call to the backend using axiosInstance
      const response = await axiosInstance.put(`/send-forgot-link?email=${email}`);

      // Check if the response indicates success
      if (response.data.status_code === 200) {
        setStatus("success");
      } else {
        // Handle non-200 status codes from APIResponse
        setStatus("error");
        setErrorMessage(response.data.message || "Something went wrong.");
      }
    } catch (error: any) {
      setStatus("error");
      // Extract error message from API response or fallback to a generic message
      const errorMsg =
        error.response?.data?.message ||
        "Failed to send reset link. Please try again later.";
      setErrorMessage(errorMsg);
    }
  };

  const handleTryAgain = () => {
    setStatus("idle");
    setErrorMessage("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center">
            <Link
              href="/signin"
              className="mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to login</span>
            </Link>
            <CardTitle className="text-2xl">Reset Password</CardTitle>
          </div>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your
            password
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "error" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {status === "success" ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">
                  Check your email
                </AlertTitle>
                <AlertDescription className="text-green-700">
                  We've sent a password reset link to{" "}
                  <span className="font-medium">{email}</span>. Please check
                  your inbox and spam folder.
                </AlertDescription>
              </Alert>

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="mb-2 font-medium">What happens next?</h3>
                <ol className="ml-4 list-decimal space-y-2 text-sm text-gray-600">
                  <li>Check your email for a message from us</li>
                  <li>Click the reset link in the email</li>
                  <li>Create a new password</li>
                  <li>Log in with your new password</li>
                </ol>
              </div>

              <div className="text-center text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or{" "}
                <button
                  onClick={handleTryAgain}
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
                >
                  try again
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={status === "loading" || !email}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm">
            Remember your password?{" "}
            <Link
              href="/signin"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              Back to login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}