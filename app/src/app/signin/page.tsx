"use client";

import { ChangeEvent, FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { getSafeRelativeNext } from "@/lib/safeNextRedirect";
import { useIsMobile } from "../../components/mobile/MobileWrapper";
import { Eye, EyeOff } from "lucide-react";
import { SignInVerificationOuterTip } from "@/components/auth/SignInEmailVerificationGuide";
import { messageSuggestsEmailVerification } from "@/lib/emailVerificationLogin";
import {
  clearPendingEmailVerifyFromSignupClient,
  readPendingEmailVerifyFromSignupClient,
} from "@/lib/pendingEmailVerifySignin";

export default function SignInPage() {
  const { login, isAuthenticated, checkAuth } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emphasizeFromSignup =
    searchParams.get("from") === "signup" || searchParams.get("pending") === "email";
  const { isMobile } = useIsMobile();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verifyBannerDismissed, setVerifyBannerDismissed] = useState(false);
  const [pendingFromSignupSession, setPendingFromSignupSession] = useState(false);

  useEffect(() => {
    setPendingFromSignupSession(readPendingEmailVerifyFromSignupClient());
  }, []);

  const showVerifyEmailBanner =
    !verifyBannerDismissed && (emphasizeFromSignup || pendingFromSignupSession);

  const dismissVerifyEmailBanner = () => {
    setVerifyBannerDismissed(true);
    clearPendingEmailVerifyFromSignupClient();
  };

  // Hydrate auth state and redirect away if already logged in
  useEffect(() => {
    checkAuth();
    setHydrated(true);
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      const next = getSafeRelativeNext(searchParams.get("next"));
      router.replace(next ?? "/dashboard");
    }
  }, [isAuthenticated, router, searchParams]);

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
        clearPendingEmailVerifyFromSignupClient();
        import("@/lib/firebase-push").then(({ registerPushToken }) => registerPushToken(token));

        toast.success("Login successful!");

        const next = getSafeRelativeNext(searchParams.get("next"));
        if (user.verification_status === 0) router.push("/verification");
        else router.push(next ?? "/dashboard");
      } else {
        const errorMessage = response.data.message || "Login failed";
        if (messageSuggestsEmailVerification(errorMessage)) {
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
          // 404 can mean user doesn't exist OR user exists but email not verified (backend may hide unverified users)
          setShowResendVerification(true);
          toast.error(
            errorMessage && !errorMessage.toLowerCase().includes("not found")
              ? errorMessage
              : "Account not found, or your email may not be verified yet. If you just signed up, please verify your email first—check your inbox (and spam folder) for the verification link."
          );
        } else if (status === 403 || status === 401) {
          if (messageSuggestsEmailVerification(errorMessage)) {
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
    return (
      <Suspense fallback={null}>
        <MobileSignIn />
      </Suspense>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/80 to-indigo-50/90 p-4 pb-10 pt-6 sm:pt-8">
      <Toaster />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <div className="mb-4 text-center sm:mb-5">
          <Link href="/" className="group inline-flex items-center justify-center">
            <img
              src="/images/jobpool-logo.png"
              alt="JobPool"
              className="h-20 w-auto transition-opacity group-hover:opacity-90 sm:h-24"
              style={{ mixBlendMode: "multiply" }}
            />
          </Link>
        </div>

        <SignInVerificationOuterTip
          open={showVerifyEmailBanner}
          onDismiss={dismissVerifyEmailBanner}
          variant="desktop"
          hasEmail={!!formData.email.trim()}
          onResend={handleResendVerification}
          isResending={isResending}
          emphasize={emphasizeFromSignup}
          onVerifiedRefresh={() => router.refresh()}
        />

        <Card className="border border-slate-200/70 bg-white/95 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/[0.04] backdrop-blur-sm">
          <form onSubmit={handleSubmit}>
            <CardHeader className="space-y-0.5 px-5 pb-2 pt-4 text-center sm:px-6">
              <CardTitle className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
                Welcome back
              </CardTitle>
              <CardDescription className="text-[13px] text-slate-500 sm:text-sm">
                Sign in to your JobPool account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-5 pb-1 sm:px-6">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-medium text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-10 border-slate-200 transition-colors focus:border-blue-500 focus:ring-blue-500/20 sm:h-11"
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <Label htmlFor="password" className="text-[13px] font-medium text-slate-700">
                    Password
                  </Label>
                  <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                    <Link href="/forgotpassword" className="text-[13px] font-medium text-blue-600 hover:text-blue-700">
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
                      className="text-[11px] text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
                    >
                      {isResending ? "Sending..." : "Resend verification"}
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-10 border-slate-200 pr-12 transition-colors focus:border-blue-500 focus:ring-blue-500/20 sm:h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              {showResendVerification && (
                <div
                  className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4 shadow-sm"
                  role="alert"
                >
                  <p className="text-sm font-semibold text-amber-950">Email not verified yet</p>
                  <p className="mt-1.5 text-sm text-amber-900 leading-snug">
                    Tap the link in the JobPool verification email (check spam), or resend below, then try signing in again.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      className="flex-1 bg-amber-600 text-white hover:bg-amber-700"
                      onClick={handleResendVerification}
                      disabled={isResending}
                    >
                      {isResending ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        "Resend verification email"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-amber-400 bg-white text-amber-950 hover:bg-amber-100"
                      onClick={() => router.refresh()}
                    >
                      I verified — try again
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-2 px-5 pb-4 pt-2 sm:px-6">
              <Button
                type="submit"
                className="h-10 w-full bg-blue-600 text-sm font-semibold text-white shadow-md shadow-blue-600/15 transition-all hover:bg-blue-700 sm:h-11"
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
              
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-[12px]">
                  <span className="bg-white px-3 text-slate-500">New here?</span>
                </div>
              </div>

              <Link href="/signup" className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full border border-blue-200 text-sm font-semibold text-blue-700 hover:bg-blue-50/80 sm:h-11"
                >
                  Create account
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-4 text-center">
          <p className="text-[11px] leading-relaxed text-slate-500 sm:text-xs">
            By signing in you agree to our{" "}
            <Link href="/termsandconditions" className="text-blue-600 hover:text-blue-700">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-700">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
