"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Eye, EyeOff } from "lucide-react";
//import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Toaster } from "../../components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";
import axios from "axios";

type AccountType = "tasker" | "poster" | "both";

interface FormData {
  user_fullname: string;
  user_email: string;
  password: string;
  confirm_password: string;
  // accountType: AccountType;
}

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    user_fullname: "",
    user_email: "",
    password: "",
    confirm_password: "",
    // accountType: "both",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: AccountType) => {
    setFormData((prev) => ({ ...prev, accountType: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const { user_fullname, user_email, password, confirm_password } = formData;

    if (!user_fullname || !user_email || !password || !confirm_password) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (password !== confirm_password) {
      toast.error("Passwords do not match");
      return;
    }

    const payload = {
      user_fullname,
      user_email,
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
      toast.success("Account created successfully! Please check your email to verify your account before signing in.");
      setTimeout(() => {
        router.push("/signin");
      }, 3000);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/80 to-indigo-50 flex items-center justify-center p-4 py-6">
      <Toaster />
      
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-200/40 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-6 mt-4 md:mt-6">
          <Link href="/" className="inline-flex items-center justify-center group">
            <img 
              src="/images/jobpool-logo.png" 
              alt="JobPool Logo" 
              className="h-28 md:h-32 w-auto group-hover:opacity-90 transition-opacity"
              style={{ mixBlendMode: 'multiply' }}
            />
          </Link>
        </div>

        {/* Main Card */}
        <Card className="backdrop-blur-sm bg-white/95 border-0 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center pb-4 pt-5">
              <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">Join JobPool</CardTitle>
              <CardDescription className="text-slate-600 text-sm mt-0.5">
                Create your account to start connecting and earning
              </CardDescription>
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
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className="h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                />
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
            </CardFooter>
          </form>
        </Card>

        {/* Footer */}
        <div className="text-center mt-5">
          <p className="text-sm text-gray-500">
            By creating an account, you agree to our{" "}
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
