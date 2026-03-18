"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Toaster } from "../../components/ui/sonner";
import { toast } from "sonner";
import { IndianRupee, Loader, Pencil, Upload, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import axiosInstance from "../../lib/axiosInstance";
import useStore from "../../lib/Zustand";
import { handleAxiosError } from "../../lib/handleAxiosError";
import LocationDetector from "../../components/LocationDetector";
import Header from "@/components/Header";

interface User {
  id: string;
  name: string;
  email: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  budget: number | string; // Allow string to handle input value
  location: string;
  dueDate: string;
}

interface Category {
  id: string;
  name: string;
}

interface ImageData {
  id: string;
  name: string;
  url: string;
  file: File;
}

const CUSTOM_CATEGORY_VALUE = "__custom__";

/** Get a fallback category ID when user types their own (Other/General preferred for admin clarity) */
function getFallbackCategoryId(categories: Category[]): string | null {
  if (!categories.length) return null;
  const lower = (s: string) => s.toLowerCase();
  const other = categories.find((c) => lower(c.name).includes("other"));
  if (other) return other.id;
  const general = categories.find((c) => lower(c.name).includes("general"));
  if (general) return general.id;
  return categories[0].id;
}

export default function PostTaskPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "",
    budget: "",
    location: "",
    dueDate: "",
  });
  const [images, setImages] = useState<ImageData[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmPost, setShowConfirmPost] = useState<boolean>(false);
  const [minDate, setMinDate] = useState("");
  const [dueDateFlexible, setDueDateFlexible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const { userId } = useStore();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1";

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setMinDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    const checkVerification = async () => {
      // Check if user is logged in
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        router.push("/signin");
        return;
      }

      const parsedUser = JSON.parse(storedUser);
      const effectiveUserId = userId || parsedUser?.id || parsedUser?.userId || parsedUser?.user_id;
      if (!effectiveUserId) {
        console.warn("No user ID found, redirecting to signin");
        router.push("/signin");
        return;
      }

      // Show form immediately – don't block on slow profile API
      setUser(parsedUser);
      setLoading(false);

      try {
        // Fetch verification in background (Submit stays disabled until this completes)
        const cacheBuster = `?user_id=${effectiveUserId}&_t=${Date.now()}`;
        const response = await axiosInstance.get(`/profile${cacheBuster}`);
        const data = response.data;
        
        // Check verification status from API
        const apiVerificationStatus = 
          data.verification_status ?? 
          data.verificationStatus ?? 
          data.data?.verification_status ??
          null;
        
        console.log("🔍 Post Task - Verification Check:", {
          verification_status: apiVerificationStatus,
          pan_verified: data.pan_verified,
          aadhar_verified: data.aadhar_verified,
        });

        // Check if user has PAN + Aadhar verified (status >= 2)
        // verification_status: 1 = PAN, 2 = Aadhar, 3 = Bank
        // For posting tasks, PAN + Aadhar (status >= 2) should be sufficient
        if (apiVerificationStatus === null || apiVerificationStatus === undefined) {
          // Check explicit verification flags if verification_status is not available
          const panVerified = data.pan_verified === true || data.pan_status === 'verified' || data.pan_status === 'approved';
          const aadharVerified = data.aadhar_verified === true || data.aadhaar_verified === true || data.aadhar_status === 'verified' || data.aadhar_status === 'approved';
          
          if (!panVerified || !aadharVerified) {
            toast.error("Please complete your verification (PAN and Aadhar) to post tasks");
            router.push("/verification");
            return;
          }
        } else if (typeof apiVerificationStatus === 'number' && apiVerificationStatus < 2) {
          // Require at least PAN + Aadhar (status >= 2) to post tasks
          toast.error("Please complete your verification (PAN and Aadhar) to post tasks");
          router.push("/verification");
          return;
        }
        
        // Update localStorage with fresh verification status
        try {
          parsedUser.verification_status = apiVerificationStatus;
          localStorage.setItem("user", JSON.stringify(parsedUser));
        } catch (e) {
          console.warn("Failed to update localStorage:", e);
        }
      } catch (error: any) {
        console.error("Failed to check verification status:", error);
        // If API call fails, fall back to localStorage check
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Fallback: require at least status 2 (PAN + Aadhar)
          if (parsedUser.verification_status === undefined || parsedUser.verification_status < 2) {
            toast.error("Please complete your verification (PAN and Aadhar) to post tasks");
            router.push("/verification");
            return;
          }
        } else {
          router.push("/signin");
          return;
        }
      } finally {
        setVerificationLoading(false);
        setLoading(false); // Allow form to render once verification check completes
      }
    };

    checkVerification();
  }, [router, userId]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/get-all-categories/");
      if (response.data?.data) {
        setCategories(
          response.data.data.map(
            (category: { category_id: string; category_name: string }) => ({
              id: category.category_id,
              name: category.category_name,
            })
          )
        );
        setError("");
        return;
      }
    } catch (err: any) {
      console.warn("Axios categories failed, falling back to fetch. Status:", err?.response?.status);
    }

    try {
      const res = await fetch(`${apiBase}/get-all-categories/`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        credentials: "omit",
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Fetch ${res.status} ${res.statusText}: ${text}`);
      }
      const data = await res.json();
      const list = (data?.data || []).map((c: any) => ({ id: c.category_id, name: c.category_name }));
      setCategories(list);
      setError("");
    } catch (fallbackErr: any) {
      console.error("Fetch categories error:", fallbackErr);
      setError(`Failed to load categories. API: ${apiBase}`);
      toast.error(fallbackErr?.message || "Failed to load categories");
    }
  }, [apiBase]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "category" && value !== CUSTOM_CATEGORY_VALUE) {
      setCustomCategoryName("");
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newImages = files.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file),
        file: file,
      }));

      setImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((image) => image.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const isCustomCategory = formData.category === CUSTOM_CATEGORY_VALUE;
    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.budget ||
      !formData.location?.trim()
    ) {
      toast.error("Please fill in all required fields (including Location)");
      return;
    }
    if (isCustomCategory && !customCategoryName.trim()) {
      toast.error("Please type your category name, or select one from the list");
      return;
    }

    await confirmPostSubmission();
  };

  const confirmPostSubmission = async () => {
    // Double-check verification status before submission (fetch fresh from API)
    try {
      let effectiveUserId = userId;
      if (!effectiveUserId) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          effectiveUserId = parsedUser?.id || parsedUser?.userId || parsedUser?.user_id;
        }
      }

      if (effectiveUserId) {
        // Fetch fresh verification status from API
        const cacheBuster = `?user_id=${effectiveUserId}&_t=${Date.now()}`;
        const response = await axiosInstance.get(`/profile${cacheBuster}`);
        const data = response.data;
        
        const apiVerificationStatus = 
          data.verification_status ?? 
          data.verificationStatus ?? 
          data.data?.verification_status ??
          null;

        // Require at least PAN + Aadhar (status >= 2) to post tasks
        if (apiVerificationStatus === null || apiVerificationStatus === undefined) {
          // Check explicit verification flags
          const panVerified = data.pan_verified === true || data.pan_status === 'verified' || data.pan_status === 'approved';
          const aadharVerified = data.aadhar_verified === true || data.aadhaar_verified === true || data.aadhar_status === 'verified' || data.aadhar_status === 'approved';
          
          if (!panVerified || !aadharVerified) {
            toast.error("Please complete your verification (PAN and Aadhar) to post tasks");
            router.push("/verification");
            return;
          }
        } else if (typeof apiVerificationStatus === 'number' && apiVerificationStatus < 2) {
          toast.error("Please complete your verification (PAN and Aadhar) to post tasks");
          router.push("/verification");
          return;
        }
      }
    } catch (error: any) {
      console.error("Failed to verify status before submission:", error);
      // Fallback to localStorage check
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.verification_status === undefined || parsedUser.verification_status < 2) {
          toast.error("Please complete your verification (PAN and Aadhar) to post tasks");
          router.push("/verification");
          return;
        }
      }
    }

    if (!formData.location?.trim()) {
      toast.error("Please enter or detect your location");
      return;
    }

    setIsSubmitting(true);
    setShowConfirmPost(false);

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("user_id", userId || "");
    formDataToSubmit.append("title", formData.title);
    formDataToSubmit.append("description", formData.description);

    const isCustomCategory = formData.category === CUSTOM_CATEGORY_VALUE;
    if (isCustomCategory) {
      const fallbackId = getFallbackCategoryId(categories);
      formDataToSubmit.append("category", fallbackId || categories[0]?.id || "general");
      formDataToSubmit.append("custom_category_name", customCategoryName.trim());
    } else {
      formDataToSubmit.append("category", formData.category);
    }
    formDataToSubmit.append("budget", formData.budget.toString());
    formDataToSubmit.append("location", formData.location);
    formDataToSubmit.append("due_date", dueDateFlexible ? "" : formData.dueDate);
    formDataToSubmit.append("due_date_flexible", dueDateFlexible ? "true" : "false");

    images.forEach((image) => {
      formDataToSubmit.append("images", image.file);
    });

    try {
      const response = await axiosInstance.post(
        "/post-a-job/",
        formDataToSubmit,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.status_code === 201) {
        toast.success("Your task has been posted!");
        router.push("/dashboard");
      } else if (response.data.status_code === 403) {
        toast.error(response.data.message || "Please complete verification to post a job");
        if (response.data.data?.verification_status !== undefined) {
          console.log("Verification status:", response.data.data.verification_status);
        }
      } else {
        toast.error(
          response.data.message || "Failed to post task. Please try again."
        );
      }
    } catch (error: any) {
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.status_code === 403) {
          toast.error(errorData.message || "Please complete verification to post a job");
        } else {
          toast.error(errorData.message || "Something went wrong. Please try again.");
        }
      } else {
        handleAxiosError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 m-auto h-5 w-5 rounded-full bg-blue-600/10 animate-ping" />
          </div>
          <span className="text-sm text-muted-foreground animate-pulse">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const handleSignOut = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("bids");
    router.push("/");
  };

  const budgetAmount = parseFloat(formData.budget.toString()) || 0;
  const fee = budgetAmount * 0.28;
  const totalAmount = budgetAmount + fee;

  return (
    <div className="flex min-h-screen flex-col">
      <Toaster />
      <Header
        user={{ name: user.name, avatar: "/images/placeholder.svg" }}
        onSignOut={handleSignOut}
      />
      <main className="flex-1 container mx-auto max-w-3xl py-8 md:py-12 px-4 md:px-6">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:underline mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <div>
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Post a Task</h1>
            <p className="text-muted-foreground mt-1">
              Describe what you need done and find the right person for the job
            </p>
            {error && (
              <div className="flex items-center justify-between gap-3 text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-md mb-4">
                <span>{error}</span>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    // Re-run categories effect by temporary forcing state change
                    setCategories([]);
                    // Manually refetch by calling the effect function via a state flip
                    // Simply trigger a rerender; the effect depends on apiBase and will run
                  }}
                  className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          <Card className="border-0 shadow-sm rounded-xl">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <CardTitle className="text-xl font-semibold tracking-tight">Task Details</CardTitle>
                <CardDescription>
                  Provide clear details to attract the right taskers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Task Title</Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="e.g., Help Moving Furniture"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe what you need done in detail..."
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="category">Category</Label>
                      <button
                        type="button"
                        onClick={() => { fetchCategories(); toast.success("Categories refreshed"); }}
                        className="text-xs text-muted-foreground hover:text-foreground underline"
                      >
                        Just added one? Refresh
                      </button>
                    </div>
                    <div className="space-y-2">
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) =>
                          handleSelectChange("category", e.target.value)
                        }
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select a category or subcategory</option>
                        {categories.length > 0 ? (
                          <>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            <option value={CUSTOM_CATEGORY_VALUE}>
                              ✏️ Can&apos;t find yours? Type your own
                            </option>
                          </>
                        ) : (
                          <option value="loading" disabled>
                            Loading categories...
                          </option>
                        )}
                      </select>
                      {formData.category === CUSTOM_CATEGORY_VALUE && (
                        <div className="pt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                          <Label htmlFor="customCategory" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                            <Pencil className="h-3.5 w-3.5" />
                            Your category name
                          </Label>
                          <Input
                            id="customCategory"
                            placeholder="e.g., Event Photography, Car Wash"
                            value={customCategoryName}
                            onChange={(e) =>
                              setCustomCategoryName(e.target.value)}
                            className="border-blue-200 focus:ring-blue-500"
                            maxLength={60}
                          />
                          <p className="text-xs text-muted-foreground">
                            We&apos;ll use the closest match for now. Admins can add your suggestion to the main list.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">
                      Budget <IndianRupee className="w-4 h-4 inline" />
                    </Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      placeholder="e.g., 5000"
                      value={formData.budget}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                    <p className="text-xs text-muted-foreground">
                      Enter a full address (street, area, city) so taskers can find the location. Use Detect or search and pick from suggestions for best results.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 items-start">
                      <div className="w-full sm:w-auto">
                        <LocationDetector
                          onLocationChange={(location: string) =>
                            setFormData((prev) => ({ ...prev, location }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="dueDate">Due Date (Optional)</Label>
                      <label className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        <Checkbox
                          id="dueDateFlexible"
                          checked={dueDateFlexible}
                          onCheckedChange={(checked) => {
                            setDueDateFlexible(!!checked);
                            if (checked) setFormData((prev) => ({ ...prev, dueDate: "" }));
                          }}
                        />
                        <span>Flexible</span>
                      </label>
                    </div>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      min={minDate}
                      value={formData.dueDate}
                      onChange={handleChange}
                      disabled={dueDateFlexible}
                      className="w-full"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Images (Optional)</Label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center bg-gray-50">
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Label
                      htmlFor="images"
                      className="cursor-pointer flex flex-col items-center gap-2 text-muted-foreground"
                    >
                      <Upload className="h-8 w-8" />
                      <span className="font-medium">
                        Click to upload images
                      </span>
                      <span className="text-xs">
                        Upload up to 5 images to show your task details
                      </span>
                    </Label>
                  </div>
                  {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                      {images.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                            <img
                              src={image.url || "/images/placeholder.svg"}
                              alt={image.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || verificationLoading}>
                  {isSubmitting ? (
                    <Loader className="animate-spin" />
                  ) : verificationLoading ? (
                    "Verifying..."
                  ) : (
                    "Post Task"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      {/* Confirmation dialog removed per request; posting happens immediately */}
    </div>
  );
}