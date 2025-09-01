"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Star, MapPin } from "lucide-react";
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
//import Header from "@/components/Header"; // Import the new Header component

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

export default function ProfilePage() {
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
        setProfileUser({
          profile_id: data.profile_id || "",
          name: data.name || "",
          email: data.email || "",
          phone: data.phone_number || "",
          addresses: Array.isArray(data.addresses)
            ? data.addresses.map((addr: any, index: number) => ({
                id: index + 1,
                address: addr.address || "",
                isDefault: addr.isDefault || index === 0,
              }))
            : [],
          avatar: data.profile_img || "",
        });

        if (Array.isArray(data.reviews)) {
          setReviews(
            data.reviews.map((review: any, index: number) => ({
              id: index + 1,
              name: review.reviewer_name || "Anonymous",
              avatar: review.reviewer_avatar || "",
              date: review.timestamp ? formatDate(review.timestamp) : "",
              rating: review.rating || 0,
              comment: review.comment || "",
              project: review.project || "",
              role: review.role || "tasker",
            }))
          );
        }
      } catch (err: any) {
        setError("Failed to load profile");
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
    <div className="flex min-h-screen flex-col">
      {/* Use the Header component */}
      {/* <Header user={profileUser} onSignOut={handleSignOut} /> */}

      {/* Main content */}
      <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:underline mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <div className="grid gap-8 md:grid-cols-3">
          {/* Profile Information */}
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-col items-center text-center">
              <div className="relative w-32 h-32 mb-4">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profileUser.avatar} alt={profileUser.name} />
                  <AvatarFallback>
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
              {/* {loggedInUserId !== userId && (
                <Button className="mt-4 w-full">Accept User</Button>
              )} */}
            </CardHeader>
          </Card>

          {/* Reviews */}
          <div className="md:col-span-2 space-y-6">
            <Tabs
              defaultValue="tasker"
              onValueChange={(value) =>
                setActiveTab(value as "tasker" | "taskmaster")
              }
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Reviews</h2>
                <TabsList>
                  <TabsTrigger value="tasker">As Tasker</TabsTrigger>
                  <TabsTrigger value="taskmaster">As Taskmaster</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="tasker" className="space-y-4">
                {reviews
                  .filter((review) => review.role === "tasker")
                  .map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                {reviews.filter((review) => review.role === "tasker").length ===
                  0 && (
                  <p className="text-sm text-muted-foreground">
                    No tasker reviews available.
                  </p>
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
                  <p className="text-sm text-muted-foreground">
                    No taskmaster reviews available.
                  </p>
                )}
                <div className="text-center mt-6">
                  <Button variant="outline">Load More Reviews</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={review.avatar} alt={review.name} />
              <AvatarFallback>{review.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{review.name}</h4>
              <p className="text-sm text-muted-foreground">{review.date}</p>
            </div>
          </div>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
        <p className="text-sm">{review.comment}</p>
        {review.project && (
          <div className="mt-3 text-sm">
            <span className="font-medium">Project: </span>
            <span className="text-muted-foreground">{review.project}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}