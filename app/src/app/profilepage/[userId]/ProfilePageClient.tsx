"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Star, MapPin, Briefcase } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import useStore from "@/lib/Zustand";
import Link from "next/link";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface Address {
  id: number;
  address: string;
  isDefault: boolean;
}

interface UserProfile {
  profile_id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  avatar: string;
}

interface Review {
  id: number;
  name: string;
  avatar: string;
  date: string;
  rating: number;
  comment: string;
  project?: string;
  role: "tasker" | "taskmaster";
}

export default function ProfilePageClient() {
  const router = useRouter();
  const { userId } = useParams();
  const { userId: loggedInUserId, logout } = useStore();
  const [activeTab, setActiveTab] = useState<"tasker" | "taskmaster">("tasker");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<UserProfile>({
    profile_id: "",
    name: "",
    email: "",
    phone: "",
    addresses: [],
    avatar: "",
  });
  const [reviews, setReviews] = useState<Review[]>([]);

  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
  const reviewCount = reviews.length;

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  useEffect(() => {
    if (!userId) {
      setError("User ID is required");
      setIsLoading(false);
      router.push("/signin");
      return;
    }

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get(`/profile?user_id=${userId}`);
        const data = response.data;
        const payload = data?.data ?? data;
        if (data?.status_code && data.status_code !== 200) {
          throw new Error(data?.message || "Failed to load profile");
        }
        setProfileUser({
          profile_id: payload.profile_id || "",
          name: payload.name || "",
          email: payload.email || "",
          phone: payload.phone_number || "",
          addresses: Array.isArray(payload.addresses)
            ? payload.addresses.map((addr: any, index: number) => ({
                id: index + 1,
                address: addr.address || "",
                isDefault: addr.isDefault || index === 0,
              }))
            : [],
          avatar: payload.profile_img || "",
        });

        if (Array.isArray(payload.reviews)) {
          setReviews(
            payload.reviews.map((review: any, index: number) => ({
              id: index + 1,
              name: review.reviewer_name || "Anonymous",
              avatar: review.reviewer_avatar || "",
              date: review.timestamp ? formatDate(review.timestamp) : "",
              rating: review.rating || 0,
              comment: review.comment || "",
              project: review.job_title || review.task_title || review.title || review?.job?.job_title || review.project || "",
              role: review.role || "tasker",
            }))
          );
        }
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load profile";
        setError(message);
        if (err.response?.status === 401) {
          router.push("/signin");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, router]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-slate-100/30 to-white">
      {/* Main content */}
      <main className="flex-1 container py-6 md:py-10 px-4 md:px-6 max-w-6xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-slate-600 hover:text-emerald-600 font-medium mb-4 inline-block transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <div className="grid gap-8 md:grid-cols-3">
          {/* Profile Information */}
          <Card className="md:col-span-1 border-0 shadow-xl rounded-2xl overflow-hidden ring-1 ring-slate-200/50">
            <div className="h-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
            <CardHeader className="flex flex-col items-center text-center -mt-12 relative">
              <div className="relative w-28 h-28 mb-4">
                <Avatar className="w-28 h-28 ring-4 ring-white shadow-xl">
                  <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xl font-semibold">
                    {profileUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl font-bold">
                {profileUser.name || "Unknown User"}
              </CardTitle>
              <CardDescription className="flex items-center justify-center mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {profileUser.addresses.find((addr) => addr.isDefault)?.address ||
                  "Location not specified"}
              </CardDescription>
              {averageRating > 0 && (
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(averageRating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium">
                    {averageRating.toFixed(1)} ({reviewCount} reviews)
                  </span>
                </div>
              )}
            </CardHeader>
          </Card>

          {/* Reviews */}
          <div className="md:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden ring-1 ring-slate-200/50">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white py-5">
                <CardTitle className="text-xl font-bold text-slate-800">Reviews</CardTitle>
                <CardDescription>What others say about {profileUser.name}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
            <Tabs
              defaultValue="tasker"
              onValueChange={(value) =>
                setActiveTab(value as "tasker" | "taskmaster")
              }
            >
              <TabsList className="w-full grid grid-cols-2 rounded-xl bg-slate-100 p-1.5 mb-6">
                <TabsTrigger value="tasker" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 data-[state=active]:font-semibold">As Tasker</TabsTrigger>
                <TabsTrigger value="taskmaster" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700 data-[state=active]:font-semibold">As Taskmaster</TabsTrigger>
              </TabsList>

              <TabsContent value="tasker" className="space-y-4">
                {reviews
                  .filter((review) => review.role === "tasker")
                  .map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                {reviews.filter((review) => review.role === "tasker").length ===
                  0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                    <Star className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No tasker reviews available.</p>
                    <p className="text-sm text-slate-400 mt-1">Reviews will appear when tasks are completed.</p>
                  </div>
                )}
                <div className="text-center mt-6">
                  <Button variant="outline">Load More Reviews</Button>
                </div>
              </TabsContent>

              <TabsContent value="taskmaster" className="space-y-4">
                {reviews
                  .filter((review) => review.role === "taskmaster")
                  .map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                {reviews.filter((review) => review.role === "taskmaster").length ===
                  0 && (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                    <Star className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No taskmaster reviews available.</p>
                    <p className="text-sm text-slate-400 mt-1">Reviews will appear when posted tasks are completed.</p>
                  </div>
                )}
                <div className="text-center mt-6">
                  <Button variant="outline">Load More Reviews</Button>
                </div>
              </TabsContent>
            </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/50 p-5 shadow-sm hover:shadow-lg hover:border-emerald-100 transition-all duration-300">
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 shrink-0 ring-2 ring-white shadow-md">
          <AvatarImage src={review.avatar} alt={review.name} />
          <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 text-lg font-semibold">
            {review.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <h4 className="font-semibold text-slate-800">{review.name}</h4>
            <p className="text-xs text-slate-500 font-medium">{review.date}</p>
          </div>
          <div className="flex items-center gap-1.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating
                    ? "fill-amber-400 text-amber-400 drop-shadow-sm"
                    : "text-slate-200"
                }`}
              />
            ))}
            <span className="text-sm font-medium text-slate-600 ml-1">{review.rating}/5</span>
          </div>
          {review.project && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
              <Briefcase className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">{review.project}</span>
            </div>
          )}
          <blockquote className="text-sm text-slate-600 leading-relaxed pl-2 border-l-2 border-emerald-200 italic">
            {review.comment}
          </blockquote>
        </div>
      </div>
    </div>
  );
}