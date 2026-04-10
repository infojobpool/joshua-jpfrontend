"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Star, MapPin, Briefcase, Package } from "lucide-react";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PublicOfferingsList } from "@/components/profile/PublicOfferingsList";
import { ProfilePortfolioSlider } from "@/components/profile/ProfilePortfolioSlider";
import { resolveProfileImageUrl } from "@/lib/profileImage";
import { BrandedPageLoader } from "@/components/BrandedPageLoader";

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
  const { userId: loggedInUserId } = useStore();
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

  const profileIdStr = String(userId ?? "");
  const viewerIsOwner =
    Boolean(loggedInUserId) && String(loggedInUserId) === profileIdStr;

  const avatarSrc = profileUser.avatar
    ? resolveProfileImageUrl(profileUser.avatar) || profileUser.avatar
    : "";

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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

  if (isLoading) return <BrandedPageLoader subtitle="Loading profile" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-slate-100/30 to-white overflow-x-hidden w-full min-w-0">
      {/* Main content — min-w-0 + overflow-x-hidden stop wide children (e.g. portfolio strip) from shifting layout on mobile */}
      <main className="flex-1 w-full min-w-0 max-w-6xl mx-auto box-border py-6 md:py-10 px-4 md:px-6 overflow-x-hidden">
        <Link
          href="/dashboard"
          className="text-sm text-slate-600 hover:text-emerald-600 font-medium mb-4 inline-block transition-colors"
        >
          ← Back to Dashboard
        </Link>
        <div className="grid grid-cols-1 gap-6 md:gap-8 md:grid-cols-3 min-w-0 w-full max-w-full">
          {/* Plain div (not Card): shared Card uses flex + gap-6 + py-6 which still caused huge empty bands / odd alignment on mobile WebViews */}
          <div className="md:col-span-1 w-full max-w-full min-w-0 rounded-2xl overflow-hidden relative bg-card text-card-foreground shadow-[0_24px_64px_-16px_rgba(15,118,110,0.38)] ring-1 ring-slate-900/[0.06] before:pointer-events-none before:absolute before:inset-x-5 before:top-0 before:z-10 before:h-1 before:rounded-full before:bg-gradient-to-r before:from-amber-300 before:via-emerald-400 before:to-cyan-500 before:content-['']">
            <div className="h-[4.5rem] sm:h-24 shrink-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-800" />
            <div className="flex flex-col items-center justify-start text-center -mt-11 sm:-mt-14 relative z-0 px-3 sm:px-4 pb-4 sm:pb-5 pt-0 w-full max-w-full min-w-0 mx-auto">
              <div className="relative w-[5.75rem] h-[5.75rem] sm:w-[7.25rem] sm:h-[7.25rem] mb-2 sm:mb-3 shrink-0 mx-auto">
                <Avatar className="w-full h-full ring-[3px] ring-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)]">
                  <AvatarImage src={avatarSrc} alt={profileUser.name} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-lg sm:text-xl font-semibold">
                    {profileUser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="inline-flex items-center rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-2">
                JobPool profile
              </div>
              <CardTitle className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 w-full max-w-full px-1 break-words text-center">
                {profileUser.name || "Unknown User"}
              </CardTitle>
              <CardDescription className="mt-2 text-slate-600 text-sm w-full max-w-full px-1 flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:items-start sm:gap-1.5 sm:text-left">
                <MapPin className="w-4 h-4 shrink-0 sm:mt-0.5" aria-hidden />
                <span className="break-words min-w-0 text-center sm:text-left max-w-[min(100%,20rem)]">
                  {profileUser.addresses.find((addr) => addr.isDefault)?.address ||
                    "Location not specified"}
                </span>
              </CardDescription>
              {averageRating > 0 && (
                <div className="flex items-center justify-center flex-wrap gap-1 mt-3 w-full max-w-full rounded-full bg-slate-50 px-2.5 sm:px-3 py-1.5 border border-slate-100">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(averageRating)
                          ? "text-amber-500 fill-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                  <span className="ml-1 text-sm font-semibold text-slate-800">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500">({reviewCount} reviews)</span>
                </div>
              )}
            </div>
          </div>

          {/* Listings and reviews — collapsible */}
          <div className="md:col-span-2 space-y-4 min-w-0">
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden ring-1 ring-slate-200/80">
              <CardHeader className="border-b border-slate-100/80 bg-gradient-to-b from-slate-50/95 via-white to-white py-6">
                <CardTitle className="text-xl font-bold text-slate-800">About this member</CardTitle>
                <CardDescription>Portfolio showcase, then listings and reviews below</CardDescription>
              </CardHeader>
              <CardContent className="pt-5 px-3 sm:px-6 pb-6 space-y-6">
                <ProfilePortfolioSlider userId={profileIdStr} viewerIsOwner={viewerIsOwner} />
                <Accordion type="multiple" defaultValue={["listings"]} className="w-full space-y-3">
                  <AccordionItem
                    value="listings"
                    className="rounded-2xl border border-emerald-200/60 bg-emerald-50/20 px-3 sm:px-4 border-b-0"
                  >
                    <AccordionTrigger className="hover:no-underline py-4 text-left [&[data-state=open]]:pb-2">
                      <span className="flex flex-wrap items-center gap-2 pr-2">
                        <Package className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span className="text-base font-semibold text-slate-900">Public listings</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <PublicOfferingsList
                        profileUserId={profileIdStr}
                        providerName={profileUser.name || "Member"}
                        viewerIsOwner={viewerIsOwner}
                      />
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem
                    value="reviews"
                    className="rounded-2xl border border-slate-200/80 bg-white px-3 sm:px-4 border-b-0"
                  >
                    <AccordionTrigger className="hover:no-underline py-4 text-left [&[data-state=open]]:pb-2">
                      <span className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-500 shrink-0 fill-amber-400/25" />
                        <span className="text-base font-semibold text-slate-900">Reviews</span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <p className="text-sm text-slate-600 mb-4">What others say about {profileUser.name}</p>
            <Tabs defaultValue="tasker">
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
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
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