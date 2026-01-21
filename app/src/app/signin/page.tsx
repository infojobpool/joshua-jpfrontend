"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Toaster } from "../../components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "../../lib/axiosInstance";
import useStore from "../../lib/Zustand";
import axios, { AxiosError } from "axios";
import { MobileSignIn } from "../../components/mobile/MobileAuth";
import { useIsMobile } from "../../components/mobile/MobileWrapper";

export default function SignInPage() {
  const { login, isAuthenticated, checkAuth } = useStore();
  const router = useRouter();
  const { isMobile } = useIsMobile();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Hydrate auth state and redirect away if already logged in
  useEffect(() => {
    checkAuth();
    setHydrated(true);
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Reset resend verification message when email changes
    if (name === "email") {
      setShowResendVerification(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      
      // Use axiosInstance which has timeout configured (60s)
      const response = await axiosInstance.post('/login/', {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (response.data.status_code === 200 && response.data.data) {
        const { token, user } = response.data.data;
        console.log("✅ Login successful, user data:", user);

        if (!token || !user) {
          throw new Error("Invalid response: Missing token or user data");
        }

        login(token, user);

        toast.success("Login successful!");

        if (user.verification_status === 0) router.push("/verification");
        else router.push("/dashboard");
      } else {
        const errorMessage = response.data.message || "Login failed";
        // Check if error is related to email verification
        if (errorMessage.toLowerCase().includes("verify") || 
            errorMessage.toLowerCase().includes("verification") ||
            errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("not")) {
          setShowResendVerification(true);
        }
        toast.error(errorMessage);
      }
    } catch (err: unknown) {
      console.error("❌ Login error:", err);
      
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const status = axiosError.response?.status;
        const errorMessage = axiosError.response?.data?.message || "";
        
        // Handle timeout errors
        if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
          toast.error("Request timed out. The server may be slow. Please try again.");
          setIsLoading(false);
          return;
        }
        
        // Handle network errors
        if (!err.response) {
          toast.error("Network error. Please check your internet connection and try again.");
          setIsLoading(false);
          return;
        }

        if (status === 404) {
          toast.error(errorMessage || "User not found.");
        } else if (status === 403 || status === 401) {
          // Check if error is related to email verification
          if (errorMessage.toLowerCase().includes("verify") || 
              errorMessage.toLowerCase().includes("verification") ||
              errorMessage.toLowerCase().includes("email") && errorMessage.toLowerCase().includes("not")) {
            setShowResendVerification(true);
          }
          toast.error(errorMessage || "Invalid email or password");
        } else if (status >= 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error(errorMessage || "An error occurred while logging in");
        }
      } else {
        const error = err as Error;
        if (error.message?.includes('timeout') || error.message?.includes('aborted')) {
          toast.error("Request timed out. Please try again.");
        } else {
          toast.error(error.message || "Something went wrong. Please try again.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsResending(true);
      const email = formData.email.trim().toLowerCase();
      console.log("📧 Attempting to resend verification email to:", email);
      
      // Try POST method first (standard approach)
      let response;
      try {
        response = await axiosInstance.post("/resend-verification-email/", {
          email: email,
        });
        console.log("📧 Resend verification response (POST):", response.data);
      } catch (postError: any) {
        // If POST fails with 404 or 405, try PUT with query parameter (like forgot password)
        if (postError.response?.status === 404 || postError.response?.status === 405) {
          console.log("📧 POST failed, trying PUT with query parameter...");
          response = await axiosInstance.put(`/resend-verification-email/?email=${encodeURIComponent(email)}`);
          console.log("📧 Resend verification response (PUT):", response.data);
        } else {
          throw postError; // Re-throw if it's a different error
        }
      }

      if (response.data.status_code === 200) {
        toast.success("Verification email sent! Please check your inbox (including spam folder).");
        setShowResendVerification(false);
      } else {
        const errorMsg = response.data.message || "Failed to send verification email";
        console.error("❌ Resend verification error:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("❌ Resend verification API error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      
      // Try to extract detailed error message
      let errorMsg = "Failed to send verification email. Please try again.";
      
      if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.detail) {
        errorMsg = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      // Check if endpoint doesn't exist (404)
      if (error.response?.status === 404) {
        errorMsg = "Verification email service is currently unavailable. Please contact support.";
      }
      
      toast.error(errorMsg);
    } finally {
      setIsResending(false);
    }
  };

  if (hydrated && isAuthenticated) return null;

  // Show mobile version on mobile devices
  if (isMobile) {
    return <MobileSignIn />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <Toaster />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center group">
            <img 
              src="/images/jobpool-logo.png" 
              alt="JobPool Logo" 
              className="h-32 md:h-36 w-auto group-hover:opacity-90 transition-opacity"
              style={{ mixBlendMode: 'multiply' }}
            />
          </Link>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl">
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to your JobPool account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
                  <div className="flex flex-col items-end gap-1">
                  <Link
                    href="/forgotpassword"
                    className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.email) {
                          handleResendVerification();
                        } else {
                          toast.error("Please enter your email address first");
                        }
                      }}
                      disabled={isResending || !formData.email}
                      className="text-xs text-blue-600 hover:text-blue-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      {isResending ? "Sending..." : "Resend verification email"}
                    </button>
                  </div>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>
              {showResendVerification && (
                <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
                  <p className="text-sm text-yellow-800 mb-3">
                    Your email address hasn't been verified yet. Please check your inbox for the verification link, or click below to resend it.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  >
                    {isResending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-yellow-300 border-t-yellow-700 rounded-full animate-spin"></div>
                        Sending...
                      </div>
                    ) : (
                      "Resend Verification Email"
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-6">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">New to JobPool?</span>
                </div>
              </div>
              
              <Link href="/signup" className="w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium transition-all duration-200"
                >
                  Create Account
                </Button>
              </Link>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (formData.email) {
                      handleResendVerification();
                    } else {
                      toast.error("Please enter your email address first");
                    }
                  }}
                  disabled={isResending || !formData.email}
                  className="text-sm text-blue-600 hover:text-blue-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed underline underline-offset-2"
                >
                  {isResending ? "Sending verification email..." : "Didn't receive verification email? Resend it"}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our{" "}
            <Link href="/termsandconditions" className="text-blue-600 hover:text-blue-700 transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-700 transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
