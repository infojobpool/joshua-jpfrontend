"use client";

import type React from "react";
import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Eye, EyeOff, Loader2, Shield } from "lucide-react";
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
import { adminLoginPostPath, adminLoginVerify2faPath } from "../lib/adminLoginPath";
import { formatAxiosApiError, getApiErrorMessage } from "../lib/apiError";
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";

type LoginStep = "credentials" | "2fa";

type LoginUser = {
  status: boolean;
  user_fullname: string;
  user_email: string;
};

function unwrapLoginData(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const root = payload as Record<string, unknown>;
  const data = root.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return root;
}

function parseLoginUser(raw: unknown): LoginUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;
  const email = String(u.user_email ?? u.email ?? "").trim();
  const name = String(u.user_fullname ?? u.full_name ?? u.name ?? "").trim();
  if (!email && !name) return null;
  return {
    status: Boolean(u.status ?? true),
    user_fullname: name || email,
    user_email: email,
  };
}

export default function AdminLoginPage() {
  const { login } = useStore();
  const router = useRouter();
  const [loginStep, setLoginStep] = useState<LoginStep>("credentials");
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [totpCode, setTotpCode] = useState("");
  const [formData, setFormData] = useState({
    user_email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const completeLogin = (token: string, user: LoginUser) => {
    login(token, user);
    toast.success("Login successful!");
    router.push("/dashboard");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setLoginError(null);
  };

  const handleCredentialsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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

      const { status_code, message } = response.data;
      const data = unwrapLoginData(response.data);

      if (status_code === 201) {
        toast.warning("Login successful, please reset your default password");
        router.push(`/resetpassword?email=${encodeURIComponent(formData.user_email)}`);
        return;
      }

      if (status_code !== 200 && status_code !== undefined) {
        toast.error(message || "Login failed");
        return;
      }

      if (data.requires_2fa === true && data.temp_token) {
        setTempToken(String(data.temp_token));
        setLoginStep("2fa");
        setTotpCode("");
        setLoginError(null);
        return;
      }

      const token = String(data.token ?? "");
      const user = parseLoginUser(data.user ?? data);
      if (!token || !user) {
        throw new Error("Invalid response: Missing token or user data");
      }

      completeLogin(token, user);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<Record<string, unknown>>;
        const status = axiosError.response?.status;
        const msg = getApiErrorMessage(err);
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
          toast.error(msg || "Invalid email or password. Try again or use Forgot password.");
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

  const handle2faSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = totpCode.trim();
    if (!tempToken) {
      setLoginError("Session expired. Sign in with your password again.");
      setLoginStep("credentials");
      return;
    }
    if (!code || (code.length !== 6 && code.length !== 8)) {
      toast.error("Enter a 6-digit authenticator code or 8-character backup code");
      return;
    }

    try {
      setIsLoading(true);
      setLoginError(null);
      const response = await axiosInstance.post(adminLoginVerify2faPath(), {
        temp_token: tempToken,
        code,
      });

      const { status_code, message } = response.data;
      const data = unwrapLoginData(response.data);

      if (status_code !== 200 && status_code !== undefined) {
        toast.error(message || "Verification failed");
        setLoginError(message || "Invalid code. Try again.");
        return;
      }

      const token = String(data.token ?? "");
      const user = parseLoginUser(data.user ?? data);
      if (!token || !user) {
        throw new Error("Invalid response: Missing token or user data");
      }

      setTempToken(null);
      completeLogin(token, user);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err);
      setLoginError(msg || "Invalid code. Try again.");
      toast.error(msg || "Invalid authenticator or backup code");
    } finally {
      setIsLoading(false);
    }
  };

  const backToCredentials = () => {
    setLoginStep("credentials");
    setTempToken(null);
    setTotpCode("");
    setLoginError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
            JobPool Admin
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {loginStep === "2fa"
              ? "Two-factor authentication required"
              : "Login to access the admin portal"}
          </p>
        </div>

        <Card className="border-0 shadow-xl rounded-2xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-t-2xl">
            <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
              {loginStep === "2fa" ? (
                <>
                  <Shield className="h-5 w-5 text-indigo-600" />
                  Authenticator code
                </>
              ) : (
                "Admin Login"
              )}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {loginStep === "2fa"
                ? "Enter the 6-digit code from your authenticator app, or an 8-character backup code."
                : "Enter your credentials to access the admin dashboard"}
            </CardDescription>
          </CardHeader>

          {loginStep === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit}>
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
                          <strong>Inactive</strong>, and set your user to <strong>Active</strong>.
                        </p>
                      ) : null}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="user_email" className="text-sm font-semibold text-gray-800">
                    Email
                  </Label>
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
                    <Label htmlFor="password" className="text-sm font-semibold text-gray-800">
                      Password
                    </Label>
                    <Link href="/forgotpassword" className="text-xs text-primary hover:underline">
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
                      <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
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
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl"
                  disabled={isLoading}
                >
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
          ) : (
            <form onSubmit={handle2faSubmit}>
              <CardContent className="space-y-4 p-6">
                {loginError ? (
                  <Alert variant="destructive" className="text-left">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Verification failed</AlertTitle>
                    <AlertDescription>{loginError}</AlertDescription>
                  </Alert>
                ) : null}
                <p className="text-sm text-muted-foreground">
                  Signed in as <strong>{formData.user_email}</strong>
                </p>
                <div className="space-y-2">
                  <Label htmlFor="totp-code" className="text-sm font-semibold text-gray-800">
                    Authenticator code
                  </Label>
                  <Input
                    id="totp-code"
                    inputMode="text"
                    autoComplete="one-time-code"
                    placeholder="123456 or backup code"
                    value={totpCode}
                    onChange={(e) =>
                      setTotpCode(e.target.value.replace(/\s/g, "").slice(0, 8).toUpperCase())
                    }
                    required
                    autoFocus
                    className="border-2 border-gray-200 focus:border-blue-400 rounded-xl bg-white/80 font-mono tracking-widest text-center text-lg"
                  />
                </div>
              </CardContent>
              <CardFooter className="p-6 pt-0 flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={backToCredentials}
                  disabled={isLoading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to password login
                </Button>
              </CardFooter>
            </form>
          )}
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
