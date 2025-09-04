"use client";

import type React from "react";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import axiosInstance from "../lib/axiosInstance";
import useStore from "../lib/Zustand";
import axios, { AxiosError } from "axios";

export default function AdminLoginPage() {
  const { login } = useStore();
  const router = useRouter();
  const [formData, setFormData] = useState({
    user_email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (!formData.user_email || !formData.password) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.post("/admin-login/", formData);

      const { status_code, message, data } = response.data;

      if (status_code === 200 && data) {
        const { token, user } = data;

        if (!token || !user) {
          throw new Error("Invalid response: Missing token or user data");
        }

        login(token, user); // Presumably sets auth context or localStorage

        toast.success("Login successful!");
        router.push("/dashboard");
      } else if (status_code === 201) {
        toast.warning("Login successful, please reset your default password");
        router.push(`/resetpassword?email=${encodeURIComponent(formData.user_email)}`);
      } else {
        toast.error(message || "Login failed");
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ message?: string }>;
        const status = axiosError.response?.status;

        if (status === 404) {
          toast.error(axiosError.response?.data?.message || "User not found.");
        } else {
          toast.error(
            axiosError.response?.data?.message ||
              "An error occurred while logging in"
          );
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">JobPool Admin</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">Login to access the admin portal</p>
        </div>

        <Card className="border-0 shadow-xl rounded-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-t-2xl">
            <CardTitle className="text-lg md:text-xl font-bold">Admin Login</CardTitle>
            <CardDescription className="text-gray-600">Enter your credentials to access the admin dashboard</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 p-6">
              <div className="space-y-2">
                <Label htmlFor="user_email" className="text-sm font-semibold text-gray-800">Email</Label>
                <Input
                  id="user_email"
                  type="user_email"
                  name="user_email"
                  placeholder="admin@taskmaster.com"
                  value={formData.user_email}
                  onChange={handleChange}
                  required
                  className="border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/80"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-800">Password</Label>
                  <Link
                    href="/forgotpassword"
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
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
                    className="pr-10 border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/80"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(!!checked)}
                />
                <Label htmlFor="remember" className="text-sm font-normal text-gray-700">
                  Remember me for 30 days
                </Label>
              </div>
            </CardContent>
            <CardFooter className="p-6 pt-0">
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Login"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Need help?{" "}
            <Link href="/support" className="text-primary hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
