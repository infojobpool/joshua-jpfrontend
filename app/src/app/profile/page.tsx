"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "@/lib/axiosInstance";
import { MobileProfile } from "@/components/mobile/MobileProfile";
import { useIsMobile } from "@/components/mobile/MobileWrapper";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Star,
  Camera,
  X,
  Briefcase,
} from "lucide-react";
import useStore from "../../lib/Zustand";
import Header from "@/components/Header"; // Import the Header component

interface Address {
  id: number;
  address: string;
  isDefault: boolean;
}

interface BankInfo {
  // account_holder_name: string;
  bank_account_number: string;
  ifsc_code: string;
  // bank_name: string;
  // bank_location: string;
  // swift_code: string;
}

interface UserProfile {
  profile_id: string;
  name: string;
  email: string;
  phone: string;
  addresses: Address[];
  avatar: string;
  joinDate: string;
  bank_info?: BankInfo;
  isEditing?: boolean;
  job_title?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  accountType: string;
  isLoggedIn: boolean;
  verification_status: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  date: string;
  isEditing: boolean;
  jobTitle?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isMobile } = useIsMobile();
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, logout } = useStore();
  const [user, setUser] = useState<User | null>(null);

  const [profileuser, setProfileUser] = useState<UserProfile>({
    profile_id: "",
    name: "",
    email: "",
    phone: "",
    addresses: [],
    avatar: "/images/placeholder.svg?height=128&width=128",
    joinDate: "",
    isEditing: false,
    job_title: "",
  });

  const [verificationStatus, setVerificationStatus] = useState({
    pan: { completed: false },
    aadhar: { completed: false },
    bank: { completed: false },
  });

  const [reviews, setReviews] = useState<Review[]>([]);

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
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage:", error);
        router.push("/signin");
      }
    } else {
      router.push("/signin");
    }
  }, [router]);

  useEffect(() => {
    if (user) {
      setVerificationStatus({
        pan: { completed: user.verification_status >= 1 },
        aadhar: { completed: user.verification_status >= 2 },
        bank: { completed: user.verification_status >= 3 },
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchProfile = async () => {
      // Derive userId from localStorage as a fallback for slow hydration
      let effectiveUserId = userId as any;
      if (!effectiveUserId) {
        try {
          const local = localStorage.getItem("user");
          if (local) {
            const parsed = JSON.parse(local);
            effectiveUserId = parsed?.id || parsed?.userId || parsed?.user_id;
          }
        } catch {}
      }
      if (!effectiveUserId) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await axiosInstance.get(`/profile?user_id=${effectiveUserId}`);
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
            : [{ id: 1, address: "", isDefault: true }],
          avatar:
            data.profile_img || "/images/placeholder.svg?height=128&width=128",
          joinDate: data.tstamp ? formatDate(data.tstamp) : "",
          bank_info: data.bank_info
            ? {
                // account_holder_name: data.bank_info.account_holder_name || "",
                bank_account_number: data.bank_info.bank_account_number || "",
                ifsc_code: data.bank_info.ifsc_code || "",
                // bank_name: data.bank_info.bank_name || "",
                // bank_location: data.bank_info.bank_location || "",
                // swift_code: data.bank_info.swift_code || "",
              }
            : undefined,
          job_title: data.job_title || "",
        });

        if (Array.isArray(data.reviews)) {
          setReviews(
            data.reviews.map((review: any, index: number) => ({
              id: index + 1,
              rating: review.rating || 0,
              comment: review.comment || "",
              date: review.timestamp ? formatDate(review.timestamp) : "",
              isEditing: false,
              jobTitle: review.job_title || review.task_title || review.title || review?.job?.job_title || "",
            }))
          );
        }
      } catch (err: any) {
        setError("Failed to load profile");
        if (err.response?.status === 401) {
          logout();
          router.push("/signin");
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Run immediately and again when store userId changes
    fetchProfile();

    // Safety fallback: reattempt after 2s if still loading and no data
    const retry = setTimeout(() => {
      if (!profileuser.profile_id) {
        fetchProfile();
      }
    }, 2000);
    return () => clearTimeout(retry);
  }, [userId, logout, router]);

  const handleSignOut = () => {
    logout();
    router.push("/");
  };

  const maskString = (str: string, visibleStart = 0, visibleEnd = 4) => {
    if (!str) return "";
    const start = str.slice(0, visibleStart);
    const middle = str
      .slice(visibleStart, str.length - visibleEnd)
      .replace(/./g, "*");
    const end = str.slice(str.length - visibleEnd);
    return start + middle + end;
  };

  const toggleEditProfile = () => {
    setProfileUser({ ...profileuser, isEditing: !profileuser.isEditing });
    setTempAvatar(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempAvatar(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedImage = () => {
    setTempAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addNewAddress = () => {
    const newAddress = {
      id: profileuser.addresses.length + 1,
      address: "",
      isDefault: false,
    };
    setProfileUser({
      ...profileuser,
      addresses: [...profileuser.addresses, newAddress],
    });
  };

  const removeAddress = (id: number) => {
    if (profileuser.addresses.find((addr) => addr.id === id)?.isDefault) {
      return;
    }
    setProfileUser({
      ...profileuser,
      addresses: profileuser.addresses.filter((addr) => addr.id !== id),
    });
  };

  const setDefaultAddress = (id: number) => {
    setProfileUser({
      ...profileuser,
      addresses: profileuser.addresses.map((addr) => ({
        ...addr,
        isDefault: addr.id === id,
      })),
    });
  };

  const updateAddress = (id: number, newAddress: string) => {
    setProfileUser({
      ...profileuser,
      addresses: profileuser.addresses.map((addr) =>
        addr.id === id ? { ...addr, address: newAddress } : addr
      ),
    });
  };

  const saveProfileChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    if (!profileuser.profile_id) {
      setError("Profile ID is required");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const addresses = profileuser.addresses.map((addr) => ({
        address: addr.address,
        isDefault: addr.isDefault,
      }));

      const updateFormData = new FormData();
      updateFormData.append("profile_id", profileuser.profile_id);
      updateFormData.append("name", formData.get("name") as string);
      updateFormData.append("phone_number", formData.get("phone") as string);
      updateFormData.append("addresses", JSON.stringify(addresses));
      if (fileInputRef.current?.files?.[0]) {
        updateFormData.append("file", fileInputRef.current.files[0]);
      }

      const response = await axiosInstance.put("/profile", updateFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;
      setProfileUser({
        ...profileuser,
        name: data.data.name,
        phone: data.data.phone_number,
        addresses: data.data.addresses.map((addr: any, index: number) => ({
          id: index + 1,
          address: addr.address || "",
          isDefault: addr.isDefault || false,
        })),
        avatar: data.data.file_path || profileuser.avatar,
        isEditing: false,
      });
      setTempAvatar(null);
    } catch (err: any) {
      setError("Failed to update profile");
      if (err.response?.status === 401) {
        logout();
        router.push("/signin");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
          <div className="absolute inset-0 m-auto h-5 w-5 rounded-full bg-blue-600/10 animate-ping" />
        </div>
        <span className="text-sm text-muted-foreground animate-pulse">Loading profile...</span>
      </div>
    </div>
  );
  if (error) return <div>Error: {error}</div>;

  // Use unified profile page for both mobile and desktop so data is consistent

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={profileuser} onSignOut={handleSignOut} />
      <main className="flex-1 container mx-auto max-w-6xl py-8 md:py-12 px-4 md:px-6">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <div className="grid gap-8 md:grid-cols-3 mt-4">
          <Card className="md:col-span-1 border-0 shadow-sm rounded-xl">
            <CardHeader className="flex flex-col items-center space-y-2 text-center">
              {profileuser.isEditing ? (
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={tempAvatar || profileuser.avatar}
                      alt={profileuser.name}
                    />
                    <AvatarFallback>
                      {profileuser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="rounded-full bg-black/50 p-2 cursor-pointer"
                      onClick={triggerFileInput}
                    >
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  {tempAvatar && (
                    <button
                      className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1"
                      onClick={removeSelectedImage}
                      type="button"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <Avatar className="h-24 w-24">
                  <AvatarImage
                    src={profileuser.avatar}
                    alt={profileuser.name}
                  />
                  <AvatarFallback>
                    {profileuser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              )}
              <div>
                <CardTitle className="text-xl font-semibold tracking-tight">{profileuser.name}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">{profileuser.email}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={toggleEditProfile}
              >
                <Edit className="mr-2 h-4 w-4" />
                {profileuser.isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {!profileuser.isEditing && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] uppercase text-muted-foreground">Member since</p>
                    <p className="text-sm font-medium">{profileuser.joinDate || "—"}</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] uppercase text-muted-foreground">Verification</p>
                    <p className="text-sm font-medium">
                      {verificationStatus.bank.completed ? "Verified" : verificationStatus.aadhar.completed ? "Aadhar" : verificationStatus.pan.completed ? "PAN" : "Pending"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] uppercase text-muted-foreground">Contact</p>
                    <p className="text-sm font-medium">{profileuser.phone || "—"}</p>
                  </div>
                </div>
              )}
              {profileuser.isEditing ? (
                <form onSubmit={saveProfileChanges} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="name">
                      Name
                    </label>
                    <input
                      id="name"
                      name="name"
                      className="w-full rounded-md border p-2 text-sm"
                      defaultValue={profileuser.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      className="w-full rounded-md border p-2 text-sm bg-gray-100"
                      defaultValue={profileuser.email}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="phone">
                      Phone
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      className="w-full rounded-md border p-2 text-sm"
                      defaultValue={profileuser.phone}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Addresses</label>
                    {profileuser.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="flex items-center gap-2 mb-2"
                      >
                        <textarea
                          name={`address-${addr.id}`}
                          className="w-full rounded-md border p-2 text-sm"
                          defaultValue={addr.address}
                          rows={2}
                          onChange={(e) =>
                            updateAddress(addr.id, e.target.value)
                          }
                        />
                        <div className="flex flex-col gap-1">
                          {!addr.isDefault && (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDefaultAddress(addr.id)}
                              >
                                Set Default
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeAddress(addr.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {addr.isDefault && (
                            <Badge variant="outline" className="ml-auto">
                              Default
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addNewAddress}
                    >
                      Add Address
                    </Button>
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isLoading}>
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{profileuser.name}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{profileuser.email}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{profileuser.phone}</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div className="flex flex-col">
                          <span className="font-medium">Addresses:</span>
                          {profileuser.addresses.map((addr) => (
                            <div
                              key={addr.id}
                              className="flex items-center mt-1"
                            >
                              <span>{addr.address}</span>
                              {addr.isDefault && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs px-2 py-1"
                                >
                                  Default
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Joined: {profileuser.joinDate}</span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <h3 className="mb-2 text-sm font-medium">
                      Verification Status
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">PAN Card</span>
                        {verificationStatus.pan.completed ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-700"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Aadhar</span>
                        {verificationStatus.aadhar.completed ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-700"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bank Account</span>
                        {verificationStatus.bank.completed ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" /> Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-700"
                          >
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-2 border-0 shadow-sm rounded-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold tracking-tight">Profile Details</CardTitle>
              <CardDescription>Manage your verification and reviews</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="bank">
                <TabsList className="w-full grid grid-cols-2 rounded-xl bg-gray-100 p-2">
                  <TabsTrigger value="bank" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">Bank Account</TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="bank" className="space-y-4 pt-4">
                  <div className="flex flex-col gap-6 md:flex-row">
                    <div className="w-full md:w-1/3">
                      <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                        <img
                          src="/images/placeholder.svg?height=160&width=240"
                          alt="Bank Details"
                          className="mx-auto h-40 w-60 rounded-md object-cover"
                        />
                      </div>
                    </div>
                    <div className="w-full space-y-4 md:w-2/3">
                      {verificationStatus.bank.completed &&
                      profileuser.bank_info ? (
                        <>
                          <div className="rounded-md bg-green-50 p-3 text-green-700">
                            <div className="flex items-center">
                              <CheckCircle className="mr-2 h-5 w-5" />
                              <div>
                                <p className="font-medium">
                                  Verification Complete
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2">
                            {/* <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Account Holder Name
                              </p>
                              <p>{profileuser.bank_info.account_holder_name}</p>
                            </div> */}
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Account Number
                              </p>
                              <p>
                                {profileuser.bank_info.bank_account_number}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                IFSC Code
                              </p>
                              <p>
                                {profileuser.bank_info.ifsc_code}
                                </p>
                            </div>
                            {/* <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Bank Name
                              </p>
                              <p>{profileuser.bank_info.bank_name}</p>
                            </div> */}
                            {/* <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                Bank Location
                              </p>
                              <p>{profileuser.bank_info.bank_location}</p>
                            </div> */}
                            {/* <div>
                              <p className="text-sm font-medium text-muted-foreground">
                                SWIFT Code
                              </p>
                              <p>{profileuser.bank_info.swift_code}</p>
                            </div> */}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-md bg-gray-100 p-3">
                          <div className="flex items-center">
                            <div>
                              <p className="font-medium">
                                Verification Pending
                              </p>
                              {/* <p className="text-sm">
                                Please complete your bank account verification
                              </p> */}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* {!verificationStatus.bank.completed && (
                        <Button asChild>
                          <Link href="/verification">Start Verification</Link>
                        </Button>
                      )} */}
                      {!verificationStatus.bank.completed && (
                        <Button asChild>
                          <Link
                            href={
                              user?.verification_status === 2
                                ? "/bankverification"
                                : "/verification"
                            }
                          >
                            Start Verification
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center"></div>
                    {reviews.length > 0 ? (
                      reviews.map((review) => (
                        <div
                          key={review.id}
                          className="rounded-lg border p-4 space-y-3 bg-white shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center space-x-4">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < review.rating
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                                <span className="text-sm text-muted-foreground">
                                  {review.date}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm font-bold">
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                                <span>Job Title: {review.jobTitle || profileuser.job_title || "—"}</span>
                              </div>
                            </div>
                          </div>
                          {review.isEditing ? (
                            <div className="space-y-2">
                              <textarea
                                className="w-full rounded-md border p-2 text-sm"
                                defaultValue={review.comment}
                                id={`review-${review.id}`}
                                rows={3}
                              />
                            </div>
                          ) : (
                            <p className="text-sm">{review.comment}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No reviews available.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}