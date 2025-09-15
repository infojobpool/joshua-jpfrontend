"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useIsMobile } from "./MobileWrapper";
import { MobileForm, MobileInput, MobileButton } from "./MobileForm";
import { MobileCard, MobileCardHeader, MobileCardContent } from "./MobileCard";
import useStore from "@/lib/Zustand";
import mobileAxiosInstance from "@/lib/mobileAxiosInstance";
import { toast, Toaster } from "sonner";

export function MobileSignIn() {
  const { isMobile } = useIsMobile();
  const router = useRouter();
  const { login, isAuthenticated } = useStore();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const normalizedEmail = (formData.email || "").trim().toLowerCase();
      const payload = { ...formData, email: normalizedEmail };
      const response = await mobileAxiosInstance.post("/login/", payload);
      
      if (response.data.status_code === 200 && response.data.data) {
        const { token, user } = response.data.data;
        
        if (!token || !user) {
          throw new Error("Invalid response: Missing token or user data");
        }

        login(token, user);
        toast.success("Login successful!");
        
        if (user.verification_status === 0) {
          router.push("/verification");
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error(response.data.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.jobpool.in/api/v1');
      if (error.response?.status === 404) {
        toast.error(`User not found for this email on ${base}. Try Sign Up if new.`);
      } else {
        const serverMsg = error.response?.data?.message || error.message;
        toast.error(serverMsg || "Login failed. Please try again.");
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
  };

  if (!isMobile) {
    return null; // Don't render on desktop
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <MobileCard className="w-full max-w-md">
        <MobileCardHeader>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to your JobPool account</p>
          </div>
        </MobileCardHeader>

        <MobileCardContent>
          <MobileForm onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email Address
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full h-12 px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full h-12 px-4 py-3 border-2 border-gray-200 rounded-xl text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ml-2 text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="/forgotpassword" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot password?
              </Link>
            </div>

            <MobileButton 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </MobileButton>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </MobileForm>
        </MobileCardContent>
      </MobileCard>
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
