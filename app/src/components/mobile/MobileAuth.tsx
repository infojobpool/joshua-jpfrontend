"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SignInVerificationOuterTip } from "@/components/auth/SignInEmailVerificationGuide";
import { messageSuggestsEmailVerification } from "@/lib/emailVerificationLogin";
import {
  clearPendingEmailVerifyFromSignupClient,
  readPendingEmailVerifyFromSignupClient,
} from "@/lib/pendingEmailVerifySignin";
import { useIsMobile } from "./MobileWrapper";
import { MobileForm, MobileInput, MobileButton } from "./MobileForm";
import { MobileCard, MobileCardHeader, MobileCardContent } from "./MobileCard";
import useStore from "@/lib/Zustand";
import axiosInstance from "@/lib/axiosInstance";
import { toast, Toaster } from "sonner";

const REMEMBER_EMAIL_KEY = "jobpool_signin_remember_email";
const REMEMBER_PASSWORD_KEY = "jobpool_signin_remember_password";

export function MobileSignIn() {
  const { isMobile } = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emphasizeFromSignup =
    searchParams.get("from") === "signup" || searchParams.get("pending") === "email";
  const { login, isAuthenticated } = useStore();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
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

  // Pre-fill email and password from localStorage if we previously saved them (remember me)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
      const savedPassword = localStorage.getItem(REMEMBER_PASSWORD_KEY);
      if (savedEmail) {
        setFormData(prev => ({
          ...prev,
          email: savedEmail,
          password: savedPassword || prev.password,
        }));
        setRememberMe(true);
      }
    } catch (_) {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const normalizedEmail = (formData.email || "").trim().toLowerCase();
      // Use axiosInstance which has timeout configured (60s)
      const response = await axiosInstance.post('/login/', {
        email: normalizedEmail,
        password: formData.password,
      });
      
      if (response.data && response.data.status_code === 200 && response.data.data) {
        const { token, user } = response.data.data;
        
        if (!token || !user) {
          throw new Error("Invalid response: Missing token or user data");
        }

        login(token, user);
        clearPendingEmailVerifyFromSignupClient();
        import("@/lib/firebase-push").then(({ registerPushToken }) => registerPushToken(token));
        if (rememberMe && normalizedEmail) {
          try {
            localStorage.setItem(REMEMBER_EMAIL_KEY, normalizedEmail);
            if (formData.password) {
              localStorage.setItem(REMEMBER_PASSWORD_KEY, formData.password);
            }
          } catch (_) {}
        } else {
          try {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
            localStorage.removeItem(REMEMBER_PASSWORD_KEY);
          } catch (_) {}
        }
        toast.success("Login successful!");
        
        if (user.verification_status === 0) {
          router.push("/verification");
        } else {
          router.push("/dashboard");
        }
      } else {
        const errorMessage = response.data.message || "Login failed";
        if (messageSuggestsEmailVerification(errorMessage)) {
          setShowResendVerification(true);
        }
        toast.error(errorMessage);
      }
    } catch (error: any) {
      console.error('[mobile][login] error:', error);
      
      // Handle timeout errors
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        toast.error("Request timed out. The server may be slow. Please try again.");
        setIsLoading(false);
        return;
      }
      
      // Handle network errors
      if (!error.response) {
        toast.error("Network error. Please check your internet connection and try again.");
        setIsLoading(false);
        return;
      }
      
      try {
        const status = error?.response?.status;
        const dataMsg = error?.response?.data?.message;
        const networkMsg = error?.message;
        const detail = status
          ? `Status ${status}${dataMsg ? `: ${dataMsg}` : ''}`
          : networkMsg || 'Unknown error';
        
        // 404 often means “no account” or hidden unverified user; other statuses only if copy mentions verification
        if (status === 404 || messageSuggestsEmailVerification(dataMsg)) {
          setShowResendVerification(true);
        }
        
        if (status === 404) {
          toast.error(
            dataMsg && !dataMsg.toLowerCase().includes("not found")
              ? dataMsg
              : "Account not found, or your email may not be verified yet. If you just signed up, please verify your email first—check your inbox (and spam folder) for the verification link."
          );
        } else if (status >= 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error(detail);
        }
      } catch (_) {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Reset resend verification message when email changes
    if (e.target.name === "email") {
      setShowResendVerification(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsResending(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';
      const email = formData.email.trim().toLowerCase();
      console.log("📧 [Mobile] Attempting to resend verification email to:", email);
      
      // Try POST method first
      let response = await fetch(`${apiBase}/resend-verification-email/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
        credentials: 'omit',
      });
      
      // If POST fails with 404 or 405, try PUT with query parameter
      if (response.status === 404 || response.status === 405) {
        console.log("📧 [Mobile] POST failed, trying PUT with query parameter...");
        response = await fetch(`${apiBase}/resend-verification-email/?email=${encodeURIComponent(email)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'omit',
        });
      }
      
      const data = await response.json();
      console.log("📧 [Mobile] Resend verification response:", { status: response.status, data });

      if (response.status === 200 && data.status_code === 200) {
        toast.success("Verification email sent! Please check your inbox (including spam folder).");
        setShowResendVerification(false);
      } else {
        const errorMsg = data.message || data.detail || "Failed to send verification email";
        console.error("❌ [Mobile] Resend verification error:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (error: any) {
      console.error("❌ [Mobile] Resend verification API error:", error);
      let errorMsg = "Failed to send verification email. Please try again.";
      
      if (error.message) {
        errorMsg = error.message;
      }
      
      toast.error(errorMsg);
    } finally {
      setIsResending(false);
    }
  };

  if (!isMobile) {
    return null; // Don't render on desktop
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-50 flex items-center justify-center p-4 py-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <SignInVerificationOuterTip
          open={showVerifyEmailBanner}
          onDismiss={dismissVerifyEmailBanner}
          variant="mobile"
          hasEmail={!!formData.email.trim()}
          onResend={handleResendVerification}
          isResending={isResending}
          emphasize={emphasizeFromSignup}
          onVerifiedRefresh={() => router.refresh()}
        />
        <MobileCard className="overflow-hidden border-0 shadow-xl shadow-slate-200/50 rounded-2xl bg-white/95 backdrop-blur-sm">
          <MobileCardHeader className="pb-2 pt-5">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
              <p className="text-slate-600 text-sm mt-0.5">Sign in to your JobPool account</p>
            </div>
          </MobileCardHeader>

          <MobileCardContent className="px-5 pb-5 pt-0 space-y-3">
            <MobileForm onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email Address <span className="text-red-500">*</span></label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={{ color: '#000000', WebkitTextFillColor: '#000000', caretColor: '#000000', fontWeight: 600 }}
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
                <input
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={{ color: '#000000', WebkitTextFillColor: '#000000', caretColor: '#000000', fontWeight: 600 }}
                  className="w-full h-11 px-4 border border-slate-200 rounded-xl text-base text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-slate-600">Remember me</span>
                </label>
                <div className="flex flex-col items-end gap-0.5">
                  <Link href="/forgotpassword" className="text-sm text-blue-600 hover:text-blue-700 font-medium">Forgot password?</Link>
                  <button
                    type="button"
                    onClick={() => formData.email ? handleResendVerification() : toast.error("Enter email first")}
                    disabled={isResending || !formData.email}
                    className="text-xs text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {isResending ? "Sending..." : "Resend verification"}
                  </button>
                </div>
              </div>

              {showResendVerification && (
                <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-3 shadow-sm" role="alert">
                  <p className="text-xs font-semibold text-amber-950">Email not verified yet</p>
                  <p className="mt-1 text-[11px] leading-snug text-amber-900">
                    Tap the link in the JobPool verification email (check spam), or resend, then try again.
                  </p>
                  <div className="mt-2 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="w-full px-3 py-2.5 text-sm font-semibold text-white bg-amber-600 rounded-xl hover:bg-amber-700 disabled:opacity-50"
                    >
                      {isResending ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        "Resend verification email"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.refresh()}
                      className="w-full px-3 py-2 text-sm font-medium text-amber-950 bg-white border border-amber-300 rounded-xl hover:bg-amber-100"
                    >
                      I verified — try again
                    </button>
                  </div>
                </div>
              )}

              <MobileButton
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/25 transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : (
                  "Sign In"
                )}
              </MobileButton>

              <p className="text-center text-sm text-slate-600">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-semibold">Sign up</Link>
              </p>
            </MobileForm>
          </MobileCardContent>
        </MobileCard>
      </div>
    </div>
  );
}

export function MobileSignUp() {
  const { isMobile } = useIsMobile();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Sign up:", formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isMobile) {
    return null; // Don't render on desktop
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <MobileCard className="w-full max-w-md">
        <MobileCardHeader>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Join JobPool</h1>
            <p className="text-gray-600">Create your account to get started</p>
          </div>
        </MobileCardHeader>

        <MobileCardContent>
          <MobileForm onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              <MobileInput
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <MobileInput
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <MobileInput
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <MobileInput
              label="Password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <MobileInput
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />

            <div className="flex items-start">
              <input type="checkbox" className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" required />
              <span className="ml-2 text-sm text-gray-600">
                I agree to the{" "}
                <Link href="/termsandconditions" className="text-blue-600 hover:text-blue-800">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800">
                  Privacy Policy
                </Link>
              </span>
            </div>

            <MobileButton type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Create Account
            </MobileButton>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/signin" className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </MobileForm>
        </MobileCardContent>
      </MobileCard>
    </div>
  );
}
