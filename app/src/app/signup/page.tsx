"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { analytics } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
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
import { Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";
//import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Toaster } from "../../components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";
import axios from "axios";
import { TrustBadges } from "@/components/TrustBadges";
import { WelcomeBonusProcessHint } from "@/components/promo/WelcomeBonusProcessHint";
import { setPendingEmailVerifyFromSignupClient } from "@/lib/pendingEmailVerifySignin";
import { isValidProfilePhone, normalizeProfilePhone } from "@/lib/profilePhone";
import { AuthFlowShell, AuthPageViewport } from "@/components/auth/AuthFlowShell";

interface FormData {
  user_fullname: string;
  user_email: string;
  phone_number: string;
  password: string;
  confirm_password: string;
  // accountType: AccountType;
}

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    user_fullname: "",
    user_email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    // accountType: "both",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    analytics.viewSignup();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { user_fullname, user_email, phone_number, password, confirm_password } = formData;

    if (!user_fullname || !user_email || !password || !confirm_password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password !== confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    if (phone_number?.trim() && !isValidProfilePhone(phone_number)) {
      toast.error(
        "Invalid phone number. Use 10 digits, or 11 digits starting with 0 (for example 09876543210). +91 optional."
      );
      return;
    }

    const payload = {
      user_fullname,
      user_email,
      phone_number: phone_number?.trim() ? normalizeProfilePhone(phone_number) : undefined,
      password,
      confirm_password,

      // task_manager:
      //   formData.accountType === "poster" || formData.accountType === "both",
      // tasker:
      //   formData.accountType === "tasker" || formData.accountType === "both",
    };

    try {
      setIsLoading(true);
      await axiosInstance.post("/user-registration/", payload);
      setSignupSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data: any = err.response?.data;

        // 409: user already exists
        if (status === 409) {
          toast.error(data?.message || "User already exists.");
        }
        // 422: validation error – show backend field message (e.g. full name too long)
        else if (status === 422 && Array.isArray(data?.detail) && data.detail.length > 0) {
          const firstError = data.detail[0];
          const field = Array.isArray(firstError.loc) ? firstError.loc.slice(-1)[0] : undefined;
          const msg = firstError.msg || data?.message || "Please check the highlighted fields.";
          const friendly = field ? `${msg} (Field: ${field})` : msg;
          toast.error(friendly);
        } else {
          // Fallback for other API errors
          toast.error(data?.message || "An error occurred while creating your account");
        }
      } else {
        // Non-Axios error
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageViewport>
      <AuthFlowShell
        dense
        footer={
          <>
            By creating an account you agree to our{" "}
            <Link href="/termsandconditions" className="font-medium text-blue-600 hover:text-blue-700">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy-policy" className="font-medium text-blue-600 hover:text-blue-700">
              Privacy Policy
            </Link>
            .
          </>
        }
      >
      <Toaster />

        {/* Logo Section */}
        <div className="mb-6 text-center md:mt-1">
          <Link href="/" className="inline-flex items-center justify-center group">
            <img 
              src="/images/jobpool-logo.png" 
              alt="JobPool Logo" 
              className="h-28 md:h-32 w-auto group-hover:opacity-90 transition-opacity"
              style={{ mixBlendMode: 'multiply' }}
            />
          </Link>
        </div>

        {/* Main Card - show success view or form */}
        <Card className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/[0.04] backdrop-blur-sm">
          {signupSuccess ? (
            <div className="p-6 space-y-5">
              <div className="flex justify-center">
                <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <CardTitle className="text-xl">Account created!</CardTitle>
                <CardDescription className="text-slate-600">
                  You must verify your email before you can sign in.
                </CardDescription>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-slate-800/50 border border-blue-200 dark:border-slate-700 p-4 space-y-3">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Next steps:</p>
                <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-2 list-decimal list-inside">
                  <li>Check your inbox at <strong className="text-slate-800 dark:text-slate-100">{formData.user_email}</strong></li>
                  <li>Click the verification link (check spam folder too)</li>
                  <li>Return here to sign in</li>
                  <li>
                    After sign in, complete verification (PAN &amp; Aadhaar) and your profile in the app — you need
                    the full journey to earn the <strong className="text-slate-800 dark:text-slate-100">₹100 welcome bonus</strong> in your wallet. T&amp;Cs apply.
                  </li>
                </ol>
                <WelcomeBonusProcessHint variant="compact" className="text-left" />
              </div>
              <Link
                href="/signin?from=signup&pending=email"
                className="block"
                onClick={() => setPendingEmailVerifyFromSignupClient()}
              >
                <Button className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium">
                  Go to Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <p className="text-xs text-center text-slate-500">
                Didn&apos;t receive the email? Use &quot;Resend verification email&quot; on the sign in page.
              </p>
            </div>
          ) : (
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center pb-4 pt-5">
              <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Join JobPool</CardTitle>
              <CardDescription className="text-slate-600 text-sm mt-0.5">
                Create your account to start connecting and earning
              </CardDescription>
              <WelcomeBonusProcessHint variant="signup" className="mt-4 text-left" />
            </CardHeader>
            <CardContent className="space-y-4 px-6">
              <div className="space-y-1.5">
                <Label htmlFor="user_fullname" className="text-sm font-medium text-slate-700">Full Name</Label>
                <Input
                  id="user_fullname"
                  name="user_fullname"
                  placeholder="Enter your full name"
                  value={formData.user_fullname}
                  onChange={handleChange}
                  required
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user_email" className="text-sm font-medium text-slate-700">Email Address</Label>
                <Input
                  id="user_email"
                  name="user_email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.user_email}
                  onChange={handleChange}
                  required
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone_number" className="text-sm font-medium text-slate-700">Phone Number</Label>
                <Input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 pr-12"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters with uppercase, lowercase, numbers, and special characters
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm_password" className="text-sm font-medium text-slate-700">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                    className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 pr-12"
                  />
                  <button
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-4 px-6">
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating account...
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>
              
              <Link href="/signin" className="w-full">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-12 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-medium transition-all duration-200"
                >
                  Sign In Instead
                </Button>
              </Link>

              <TrustBadges
                variant="strip"
                heading="Your details are safe"
                subtext="Encrypted, compliant & protected"
                className="mt-1 w-full"
              />
            </CardFooter>
          </form>
          )}
        </Card>
      </AuthFlowShell>
    </AuthPageViewport>
  );
}
