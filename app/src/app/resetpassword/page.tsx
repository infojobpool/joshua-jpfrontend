"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Lock,
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
import axiosInstance from "../../lib/axiosInstance"; 


export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password === confirmPassword;

  const isPasswordValid =
    hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

  const isFormValid =
    isPasswordValid && passwordsMatch && confirmPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      setStatus("error");
      setErrorMessage("Please fix the password issues before submitting.");
      return;
    }

    setStatus("loading");

    try {
      // Make API call to reset password
      const response = await axiosInstance.put(`/forgot-password/`, {
        new_password: password,
        confirm_new_password: confirmPassword,
      }, {
        params: { email_token: token },
      });

      // Check if the response indicates success
      if (response.data.message === "Password reset successful") {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(response.data.message || "Something went wrong.");
      }
    } catch (error: any) {
      setStatus("error");
      const errorMsg =
        error.response?.data?.message ||
        "Failed to reset password. Please try again later.";
      setErrorMessage(errorMsg);
    }
  };

  // If no token is provided, show an error
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>
              The password reset link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Please request a new password reset link from the forgot
                password page.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/forgotpassword">Go to Forgot Password</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

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
            <CardTitle className="text-2xl">Create New Password</CardTitle>
          </div>
          <CardDescription>
            Enter a new password for your account
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
                  Password Reset Successful
                </AlertTitle>
                <AlertDescription className="text-green-700">
                  Your password has been reset successfully. You can now log in
                  with your new password.
                </AlertDescription>
              </Alert>

              <Button asChild className="w-full">
                <Link href="/signin">Go to Login</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status === "loading"}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    className="pl-10 pr-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={status === "loading"}
                    required
                  />
                </div>
                {confirmPassword && !passwordsMatch && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <h3 className="mb-2 text-sm font-medium">
                  Password Requirements:
                </h3>
                <ul className="space-y-1 text-xs">
                  <li
                    className={`flex items-center ${
                      hasMinLength ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <span className="mr-2">{hasMinLength ? "✓" : "○"}</span>
                    At least 8 characters
                  </li>
                  <li
                    className={`flex items-center ${
                      hasUpperCase ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <span className="mr-2">{hasUpperCase ? "✓" : "○"}</span>
                    At least one uppercase letter (A-Z)
                  </li>
                  <li
                    className={`flex items-center ${
                      hasLowerCase ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <span className="mr-2">{hasLowerCase ? "✓" : "○"}</span>
                    At least one lowercase letter (a-z)
                  </li>
                  <li
                    className={`flex items-center ${
                      hasNumber ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <span className="mr-2">{hasNumber ? "✓" : "○"}</span>
                    At least one number (0-9)
                  </li>
                  <li
                    className={`flex items-center ${
                      hasSpecialChar ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    <span className="mr-2">{hasSpecialChar ? "✓" : "○"}</span>
                    At least one special character (!@#$%^&*)
                  </li>
                </ul>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={status === "loading" || !isFormValid}
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
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