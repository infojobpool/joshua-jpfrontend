"use client";

import type React from "react";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
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
import { adminLoginPostPath } from "../lib/adminLoginPath";
import { formatAxiosApiError, getApiErrorMessage } from "../lib/apiError";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

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
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLoginError(null);
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
      setLoginError(null);
      const response = await axiosInstance.post(adminLoginPostPath(), {
        user_email: formData.user_email,
        email: formData.user_email,
        password: formData.password,
      });

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
        const axiosError = err as AxiosError<Record<string, unknown>>;
        const status = axiosError.response?.status;
        const msg = getApiErrorMessage(err);
        /** No HTTP response (CORS, DNS, offline, wrong API URL) — show URL + env hint, not generic "Request failed". */
        const noResponseDetail = formatAxiosApiError(err);

        if (status === 403) {
          setLoginError(msg);
          toast.error(msg, { duration: 8000 });
        } else if (status === 404) {
          setLoginError(
            `${noResponseDetail} If your API uses another path, set Vercel env NEXT_PUBLIC_ADMIN_LOGIN_PATH (e.g. admin/login/) and redeploy.`,
          );
          toast.error("Admin login URL not found (404). Check API route and env NEXT_PUBLIC_ADMIN_LOGIN_PATH.");
        } else if (status === 401) {
          setLoginError(msg || "Invalid email or password.");
          toast.error(
            msg || "Invalid email or password. Try again or use Forgot password."
          );
        } else if (status == null) {
          setLoginError(noResponseDetail);
          toast.error("Cannot reach API — check Network tab and Vercel env NEXT_PUBLIC_API_BASE_URL.");
        } else {
          setLoginError(msg || "Login failed. Please try again.");
          toast.error(msg || "An error occurred while logging in");
        }
      } else {
        setLoginError("Something went wrong");
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
              {loginError && (
                <Alert variant="destructive" className="text-left">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Could not sign in</AlertTitle>
                  <AlertDescription className="space-y-2 text-destructive/95">
                    <p>{loginError}</p>
                    {loginError.toLowerCase().includes("verified") ||
                    loginError.toLowerCase().includes("inactive") ? (
                      <p className="text-xs leading-relaxed opacity-90">
                        If you already clicked the email link: a superadmin should open{" "}
                        <strong>Employees</strong>, switch to <strong>All</strong> or{" "}
                        <strong>Inactive</strong>, and set your user to <strong>Active</strong>. If it still
                        fails, the API may be waiting on a separate verification flag—check the backend
                        admin user record or logs.
                      </p>
                    ) : null}
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="user_email" className="text-sm font-semibold text-gray-800">Email</Label>
                <Input
                  id="user_email"
                  type="email"
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
