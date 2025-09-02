"use client";

import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { IndianRupee, Loader, Upload, X } from "lucide-react";
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

export default function PostTaskPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const { userId } = useStore();

  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setMinDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      // Redirect to sign in if not logged in
      router.push("/signin");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const fetchCategories = async () => {
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
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to load categories. Please try again.");
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
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

    if (
      !formData.title ||
      !formData.description ||
      !formData.category ||
      !formData.budget
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    await confirmPostSubmission();
  };

  const confirmPostSubmission = async () => {
    setIsSubmitting(true);
    setShowConfirmPost(false);

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("user_id", userId || "");
    formDataToSubmit.append("title", formData.title);
    formDataToSubmit.append("description", formData.description);
    formDataToSubmit.append("category", formData.category);
    formDataToSubmit.append("budget", formData.budget.toString());
    formDataToSubmit.append("location", formData.location);
    formDataToSubmit.append("due_date", formData.dueDate);

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
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
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
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleSelectChange("category", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category or subcategory" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="loading" disabled>
                            Loading categories...
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
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
                    <Label htmlFor="location">Location</Label>
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
                    <Label htmlFor="dueDate">Due Date (Optional)</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      min={minDate}
                      value={formData.dueDate}
                      onChange={handleChange}
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
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader className="animate-spin" />
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