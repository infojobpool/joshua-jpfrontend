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
import axios, { AxiosError } from "axios";

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
        const axiosError = err as AxiosError<{ message: string }>;
        if (axiosError.response?.status === 409) {
          toast.error(
            axiosError.response.data?.message || "User already exists."
          );
        } else {
          toast.error("An error occurred while creating your account");
        }
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Toaster />
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your information below to create your account
          </p>
        </div>
        <Card className="p-6">
          <form onSubmit={handleSubmit}>
            <CardHeader className="mb-4">
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>
                Join JobPool to post or complete tasks.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="user_fullname">Full Name</Label>
                <Input
                  id="user_fullname"
                  name="user_fullname"
                  placeholder="John Doe"
                  value={formData.user_fullname}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="user_email">Email</Label>
                <Input
                  id="user_email"
                  name="user_email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.user_email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must contain at least 8 characters with a mix of uppercase, lowercase, numbers, and special characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm Password</Label>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Optional radio group removed for clarity */}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </Button>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link
                  href="/signin"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Sign in
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
