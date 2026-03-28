"use client";

import type React from "react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
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
  Wallet,
} from "lucide-react";
import useStore from "../../lib/Zustand";
import { resolveProfileImageUrl } from "@/lib/profileImage";
import Header from "@/components/Header";
import { TrustBadges } from "@/components/TrustBadges";
import { WelcomeBonusProcessHint } from "@/components/promo/WelcomeBonusProcessHint";
import {
  getMissingPayoutEligibilityItems,
  getPayoutCompletionStats,
  hasRealProfilePhotoUrl,
} from "@/lib/payoutProfileCompletion";
import { toast } from "sonner";

/** Android WebView: force visible text in fields (avoids white-on-white). */
const PROFILE_FIELD_TEXT = {
  color: "#0f172a",
  WebkitTextFillColor: "#0f172a",
  caretColor: "#0f172a",
} as const;

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
  cover_image?: string;
  joinDate: string;
  bank_info?: BankInfo;
  isEditing?: boolean;
  job_title?: string;
  /** Synced with wallet (GET /wallet, POST /wallet/add-upi). */
  upi_vpa?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  accountType: string;
  isLoggedIn: boolean;
  verification_status: number;
  profile_image?: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  date: string;
  isEditing: boolean;
  jobTitle?: string;
  reviewer_name?: string;
  reviewer_avatar?: string;
  role?: "tasker" | "taskmaster";
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const { isMobile } = useIsMobile();
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [tempCoverImage, setTempCoverImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { userId, logout, user: storeUser, updateUserProfileImage } = useStore();
  const [user, setUser] = useState<User | null>(null);

  const resolveAvatarUrl = (url: string | undefined) =>
    (url && resolveProfileImageUrl(url)) || url;

  const [profileuser, setProfileUser] = useState<UserProfile>({
    profile_id: "",
    name: "",
    email: "",
    phone: "",
    addresses: [],
    avatar: "/images/placeholder.svg?height=128&width=128",
    cover_image: "",
    joinDate: "",
    isEditing: false,
    job_title: "",
    upi_vpa: "",
  });

  const [verificationStatus, setVerificationStatus] = useState({
    pan: { completed: false },
    aadhar: { completed: false },
    bank: { completed: false },
  });

  const [reviews, setReviews] = useState<Review[]>([]);
  const payoutBonusPreview = useMemo(() => {
    const v = Math.max(
      Number(storeUser?.verification_status ?? 0),
      Number(user?.verification_status ?? 0),
    );
    const verificationLevel = Number.isNaN(v) ? 0 : v;
    const hasAddress = profileuser.addresses.some((a) => (a.address || "").trim().length > 0);
    const missing = getMissingPayoutEligibilityItems({
      verificationLevel,
      hasProfilePhoto: hasRealProfilePhotoUrl(profileuser.avatar),
      hasAddressOnProfile: hasAddress,
      upiVpa: profileuser.upi_vpa?.trim() || undefined,
    });
    return getPayoutCompletionStats(missing.length);
  }, [
    storeUser?.verification_status,
    user?.verification_status,
    profileuser.avatar,
    profileuser.upi_vpa,
    profileuser.addresses,
  ]);
  const fetchProfileRef = useRef(false);
  const fetchSuccessRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const FETCH_COOLDOWN_MS = 15000; // Don't refetch within 15 seconds (reduces request spam)

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

  // Sync verification status from user (localStorage) until profile API returns
  useEffect(() => {
    if (user?.verification_status != null) {
      const num = Number(user.verification_status);
      if (!isNaN(num)) {
        setVerificationStatus({
          pan: { completed: num >= 1 },
          aadhar: { completed: num >= 2 },
          bank: { completed: num >= 3 },
        });
      }
    }
  }, [user]);

  useEffect(() => {
    fetchSuccessRef.current = false;
    const fetchProfile = async () => {
      const now = Date.now();
      if (fetchProfileRef.current) return;
      if (now - lastFetchTimeRef.current < FETCH_COOLDOWN_MS && lastFetchTimeRef.current > 0) return;
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
        setError("Failed to load profile: missing user id");
        setIsLoading(false);
        return;
      }

      fetchProfileRef.current = true;
      try {
        setIsLoading(true);
        const response = await axiosInstance.get(`/profile?user_id=${effectiveUserId}`);
        const data = response.data;
        const payload = data?.data ?? data;
        if (data?.status_code && data.status_code !== 200) {
          throw new Error(data?.message || "Failed to load profile");
        }

        let upiVpa = "";
        const fromProfile = payload.upi_vpa ?? payload.upi;
        if (typeof fromProfile === "string" && fromProfile.trim()) {
          upiVpa = fromProfile.trim();
        } else {
          try {
            const wres = await axiosInstance.get(`/wallet?user_id=${effectiveUserId}&limit=1`);
            const wd = wres.data?.data ?? wres.data;
            const u = wd?.upi_vpa ?? wd?.upi;
            if (typeof u === "string" && u.trim()) upiVpa = u.trim();
          } catch {
            /* wallet fetch optional */
          }
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
            : [{ id: 1, address: "", isDefault: true }],
          avatar:
            payload.profile_img || (storeUser && storeUser.profile_image) || "",
          cover_image: payload.cover_img ?? payload.cover_image ?? payload.cover_image_url ?? "",
          joinDate: payload.tstamp ? formatDate(payload.tstamp) : "",
          bank_info: (() => {
            const raw = payload.bank_info ?? data?.bank_info ?? data?.data?.bank_info;
            if (!raw || typeof raw !== "object") return undefined;
            const num = raw.bank_account_number ?? raw.bankAccountNumber ?? "";
            const ifsc = raw.ifsc_code ?? raw.ifscCode ?? "";
            if (!num && !ifsc) return undefined;
            return {
              bank_account_number: String(num),
              ifsc_code: String(ifsc),
            };
          })(),
          job_title: payload.job_title || "",
          upi_vpa: upiVpa,
        });

        // Backend returns only verification_status (0–3) and bank_info. No separate pan/aadhar/bank flags.
        // 0=not verified, 1=PAN, 2=PAN+Aadhar, 3=PAN+Aadhar+Bank
        const rawStatus =
          payload.verification_status ??
          payload.verificationStatus ??
          data?.verification_status ??
          data?.verificationStatus ??
          response?.data?.verification_status ??
          response?.data?.verificationStatus ??
          null;
        const statusNum: number | null =
          rawStatus !== null && rawStatus !== undefined
            ? (typeof rawStatus === "string" ? parseInt(rawStatus, 10) : Number(rawStatus))
            : null;
        if (statusNum !== null) {
          setVerificationStatus({
            pan: { completed: statusNum >= 1 },
            aadhar: { completed: statusNum >= 2 },
            bank: { completed: statusNum >= 3 },
          });
          // Sync to localStorage and store so rest of app sees correct status
          try {
            const local = localStorage.getItem("user");
            if (local) {
              const parsed = JSON.parse(local);
              parsed.verification_status = statusNum;
              localStorage.setItem("user", JSON.stringify(parsed));
              useStore.setState({ user: { ...parsed, verification_status: statusNum } });
            }
          } catch {}
        }

        fetchSuccessRef.current = true;
        lastFetchTimeRef.current = Date.now();
        if (Array.isArray(payload.reviews)) {
          setReviews(
            payload.reviews.map((review: any, index: number) => ({
              id: index + 1,
              rating: review.rating || 0,
              comment: review.comment || "",
              date: review.timestamp ? formatDate(review.timestamp) : "",
              isEditing: false,
              jobTitle: review.job_title || review.task_title || review.title || review?.job?.job_title || "",
              reviewer_name: review.reviewer_name || "Anonymous",
              reviewer_avatar: review.reviewer_avatar || review.reviewer_profile_img || review.profile_img || "",
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
        fetchProfileRef.current = false;
        if (err.response?.status === 401) {
          logout();
          router.push("/signin");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileRef.current = false;
    fetchProfile();

    // Single retry after 8s only if first fetch didn't succeed (avoid rate limit)
    const retry = setTimeout(() => {
      if (!fetchSuccessRef.current) {
        fetchProfileRef.current = false;
        fetchProfile();
      }
    }, 8000);
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
    setTempCoverImage(null);
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

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setTempCoverImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerCoverImageInput = () => coverImageInputRef.current?.click();

  const removeCoverImage = () => {
    setTempCoverImage(null);
    if (coverImageInputRef.current) {
      coverImageInputRef.current.value = "";
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
      if (coverImageInputRef.current?.files?.[0]) {
        updateFormData.append("cover_file", coverImageInputRef.current.files[0]);
      }

      const response = await axiosInstance.put("/profile", updateFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;
      const newUpi = String(formData.get("upi_vpa") ?? "").trim();
      let nextUpi = profileuser.upi_vpa || "";

      if (newUpi && userId) {
        try {
          const res = await axiosInstance.post(
            `/wallet/add-upi?user_id=${userId}&upi_vpa=${encodeURIComponent(newUpi)}`
          );
          nextUpi = String((res.data?.data ?? res.data)?.upi_vpa ?? newUpi).trim();
          toast.success("Profile saved. UPI updated for wallet withdrawals.");
        } catch (upiErr: unknown) {
          const msg =
            (upiErr as { response?: { data?: { message?: string } } })?.response?.data?.message ??
            "Could not sync UPI to wallet";
          toast.error(`Profile saved. ${msg} You can add UPI from Wallet.`);
        }
      } else {
        toast.success("Profile saved.");
        nextUpi = profileuser.upi_vpa || "";
      }

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
        cover_image: data.data.cover_image ?? data.data.cover_img ?? profileuser.cover_image,
        upi_vpa: nextUpi,
        isEditing: false,
      });
      if (data.data.file_path) {
        updateUserProfileImage(data.data.file_path);
      }
      setTempAvatar(null);
      setTempCoverImage(null);
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
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border border-slate-200 border-t-blue-500 animate-spin" style={{ animationDuration: "0.85s" }} />
        <span className="text-sm text-slate-500 font-medium">Loading profile...</span>
      </div>
    </div>
  );
  if (error) return <div>Error: {error}</div>;

  // Use unified profile page for both mobile and desktop so data is consistent

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-slate-100/30 to-white">
      <Header user={{ ...profileuser, avatar: resolveAvatarUrl(profileuser.avatar) || profileuser.avatar }} onSignOut={handleSignOut} />
      <main className="flex-1 container mx-auto max-w-6xl py-6 md:py-10 px-4 md:px-6 pb-28 md:pb-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors mb-6 font-medium"
        >
          ← Back to Dashboard
        </Link>

        <div className="grid gap-8 md:grid-cols-3 mt-2">
          {/* Profile card - left column with overlapping avatar */}
          <Card className="md:col-span-1 border-0 shadow-xl rounded-2xl overflow-visible bg-white ring-1 ring-slate-200/50 relative z-10 md:-mr-4">
            <div
              className="h-32 rounded-t-2xl bg-cover bg-center bg-no-repeat relative"
              style={{
                backgroundImage: (tempCoverImage || (profileuser.cover_image && resolveProfileImageUrl(profileuser.cover_image)) || profileuser.cover_image)
                  ? `url(${tempCoverImage || resolveProfileImageUrl(profileuser.cover_image) || profileuser.cover_image})`
                  : undefined,
                backgroundColor: !tempCoverImage && !profileuser.cover_image ? undefined : undefined,
              }}
            >
              {(!tempCoverImage && !profileuser.cover_image) && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 rounded-t-2xl" />
              )}
              {profileuser.isEditing && (
                <>
                  <button
                    type="button"
                    onClick={triggerCoverImageInput}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 rounded-t-2xl transition-colors"
                  >
                    <div className="rounded-full bg-white/90 p-3">
                      <Camera className="h-6 w-6 text-emerald-700" />
                    </div>
                  </button>
                  <input
                    type="file"
                    ref={coverImageInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                  />
                  {tempCoverImage && (
                    <button
                      type="button"
                      onClick={removeCoverImage}
                      className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 shadow-md hover:bg-red-600"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  )}
                </>
              )}
            </div>
            <CardHeader className="flex flex-col items-center -mt-20 relative pb-2">
              {profileuser.isEditing ? (
                <div className="relative -mt-1">
                  <Avatar className="h-36 w-36 ring-4 ring-white shadow-2xl border-2 border-white/30 overflow-hidden">
                    <AvatarImage
                      src={tempAvatar || resolveAvatarUrl(profileuser.avatar) || profileuser.avatar}
                      alt={profileuser.name}
                      className="object-cover aspect-square"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl">
                      {profileuser.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full">
                    <div
                      className="rounded-full bg-black/60 p-2.5 cursor-pointer hover:bg-black/80 transition-colors"
                      onClick={triggerFileInput}
                    >
                      <Camera className="h-5 w-5 text-white" />
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
                      className="absolute -top-1 -right-1 rounded-full bg-red-500 p-1.5 shadow-md hover:bg-red-600"
                      onClick={removeSelectedImage}
                      type="button"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  )}
                </div>
              ) : (
                <Avatar className="h-36 w-36 ring-4 ring-white shadow-2xl border-2 border-white/30 overflow-hidden">
                  <AvatarImage
                    src={resolveAvatarUrl(profileuser.avatar) || profileuser.avatar}
                    alt={profileuser.name}
                    className="object-cover aspect-square"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-2xl">
                    {profileuser.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="text-center mt-3">
                <CardTitle className="text-xl font-bold text-slate-800">{profileuser.name}</CardTitle>
                <CardDescription className="text-sm text-slate-500 mt-0.5">{profileuser.email}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 rounded-xl border-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
                onClick={toggleEditProfile}
              >
                <Edit className="mr-2 h-4 w-4" />
                {profileuser.isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              {!profileuser.isEditing && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white p-4 text-center border border-slate-100 shadow-sm">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Member since</p>
                      <p className="text-sm font-bold text-slate-800 mt-1 break-words">{profileuser.joinDate || "—"}</p>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/80 p-4 text-center border border-emerald-100 shadow-sm">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-200/60">
                        <CheckCircle className="h-5 w-5 text-emerald-700" />
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Verification</p>
                      <p className={`text-sm font-bold mt-1 break-words ${verificationStatus.bank.completed ? "text-emerald-700" : "text-slate-600"}`}>
                        {verificationStatus.bank.completed ? "Verified" : verificationStatus.aadhar.completed ? "Aadhar" : verificationStatus.pan.completed ? "PAN" : "Pending"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white p-4 text-center border border-slate-100 shadow-sm">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                        <Phone className="h-5 w-5 text-emerald-600" />
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Contact</p>
                      <p className="text-sm font-bold text-slate-800 mt-1 break-all">{profileuser.phone || "—"}</p>
                    </div>
                  </div>
                  <TrustBadges
                    variant="strip"
                    heading="Your data is safe with JobPool"
                    subtext="Encrypted, DPDP-ready — industry-standard protection"
                  />
                  {payoutBonusPreview.remaining > 0 && (
                    <WelcomeBonusProcessHint
                      variant="compact"
                      className="mt-1"
                      percent={payoutBonusPreview.percent}
                      label={`${payoutBonusPreview.completed} of ${payoutBonusPreview.total} steps toward ₹100 bonus · ${payoutBonusPreview.remaining} left`}
                    />
                  )}
                </>
              )}
              {profileuser.isEditing ? (
                <form onSubmit={saveProfileChanges} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="name">Name</label>
                    <input
                      id="name"
                      name="name"
                      style={PROFILE_FIELD_TEXT}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      defaultValue={profileuser.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      style={PROFILE_FIELD_TEXT}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                      defaultValue={profileuser.email}
                      disabled
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="phone">Phone</label>
                    <input
                      id="phone"
                      name="phone"
                      style={PROFILE_FIELD_TEXT}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      defaultValue={profileuser.phone}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700" htmlFor="upi_vpa">
                      UPI ID
                    </label>
                    <input
                      id="upi_vpa"
                      name="upi_vpa"
                      type="text"
                      inputMode="email"
                      autoComplete="off"
                      placeholder="yourname@paytm"
                      style={PROFILE_FIELD_TEXT}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      defaultValue={profileuser.upi_vpa || ""}
                    />
                    <p className="text-xs text-slate-500">
                      Same UPI as in{" "}
                      <Link href="/wallet" className="text-emerald-600 font-medium underline-offset-2 hover:underline">
                        Wallet
                      </Link>
                      — used for withdrawals. Leave blank to keep your current wallet UPI unchanged.
                    </p>
                  </div>
                  {payoutBonusPreview.remaining > 0 && (
                    <WelcomeBonusProcessHint
                      variant="compact"
                      percent={payoutBonusPreview.percent}
                      label={`${payoutBonusPreview.completed} of ${payoutBonusPreview.total} steps toward ₹100 bonus · ${payoutBonusPreview.remaining} left`}
                    />
                  )}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Addresses</label>
                    {profileuser.addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="flex items-center gap-2 mb-2"
                      >
                        <textarea
                          name={`address-${addr.id}`}
                          style={PROFILE_FIELD_TEXT}
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                  <div className="flex justify-end pt-2">
                    <Button type="submit" size="sm" disabled={isLoading} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="space-y-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Profile Details</h3>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        <User className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Name</p>
                        <p className="font-medium text-slate-800">{profileuser.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        <Mail className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-slate-500">Email</p>
                        <p className="font-medium text-slate-800 truncate">{profileuser.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        <Phone className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Phone</p>
                        <p className="font-medium text-slate-800">{profileuser.phone || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <Wallet className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500">UPI ID</p>
                        <p className="font-medium text-slate-800 break-all">
                          {profileuser.upi_vpa?.trim() || "Not set"}
                        </p>
                        <Link
                          href="/wallet"
                          className="text-xs text-emerald-600 font-medium mt-1 inline-block underline-offset-2 hover:underline"
                        >
                          Open Wallet
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                        <MapPin className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500">Addresses</p>
                        {profileuser.addresses.filter((a) => a.address).length > 0 ? (
                          profileuser.addresses.map((addr) => (
                            <div key={addr.id} className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="font-medium text-slate-800">{addr.address}</span>
                              {addr.isDefault && (
                                <Badge className="bg-emerald-100 text-emerald-700 text-xs">Default</Badge>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="font-medium text-slate-500">No address added</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Joined</p>
                        <p className="font-medium text-slate-800">{profileuser.joinDate || "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Verification Status</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-slate-50">
                        <span className="text-sm font-medium text-slate-700">PAN Card</span>
                        {verificationStatus.pan.completed ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-white text-slate-500 border-slate-200">Pending</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-slate-50">
                        <span className="text-sm font-medium text-slate-700">Aadhar</span>
                        {verificationStatus.aadhar.completed ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-white text-slate-500 border-slate-200">Pending</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between rounded-xl px-4 py-3 bg-slate-50">
                        <span className="text-sm font-medium text-slate-700">Bank Account</span>
                        {verificationStatus.bank.completed ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-white text-slate-500 border-slate-200">Pending</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-2 border-0 shadow-xl rounded-2xl overflow-hidden bg-white ring-1 ring-slate-200/50 relative z-0 md:ml-[-1rem] md:shadow-2xl">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 py-6">
              <CardTitle className="text-xl font-bold text-slate-800 tracking-tight">Profile Details</CardTitle>
              <CardDescription className="text-slate-500">Manage your verification and reviews</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="bank">
                <TabsList className="w-full grid grid-cols-2 rounded-xl bg-slate-100/80 p-1.5 h-12">
                  <TabsTrigger value="bank" className="rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-700 data-[state=active]:font-semibold">Bank Account</TabsTrigger>
                  <TabsTrigger value="reviews" className="rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-700 data-[state=active]:font-semibold">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="bank" className="space-y-6 pt-6">
                  <div className="flex flex-col gap-6 md:flex-row">
                    <div className="w-full md:w-1/3">
                      <div className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 p-6 flex items-center justify-center min-h-[180px]">
                        <div className="text-center">
                          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                            <Briefcase className="h-8 w-8 text-emerald-600" />
                          </div>
                          <p className="text-sm font-medium text-slate-600">Bank Details</p>
                        </div>
                      </div>
                    </div>
                    <div className="w-full space-y-4 md:w-2/3">
                      {profileuser.bank_info &&
                      (profileuser.bank_info.bank_account_number || profileuser.bank_info.ifsc_code) ? (
                        <>
                          {verificationStatus.bank.completed && (
                            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-800">
                              <div className="flex items-center gap-3">
                                <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                                <p className="font-semibold">Verification Complete</p>
                              </div>
                            </div>
                          )}
                          {!verificationStatus.bank.completed && (
                            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-amber-800">
                              <p className="font-medium">Verification Pending</p>
                              <p className="text-sm text-amber-700 mt-1">Your bank details are saved. Complete verification to receive payments.</p>
                            </div>
                          )}
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                              <p className="text-xs font-semibold uppercase text-slate-500">Account Number</p>
                              <p className="font-medium text-slate-800 mt-1">{maskString(profileuser.bank_info.bank_account_number, 0, 4)}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                              <p className="text-xs font-semibold uppercase text-slate-500">IFSC Code</p>
                              <p className="font-medium text-slate-800 mt-1">{maskString(profileuser.bank_info.ifsc_code, 0, 4)}</p>
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
                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                          <p className="font-medium text-slate-700">Verification Pending</p>
                        </div>
                      )}
                      {profileuser.bank_info &&
                      (profileuser.bank_info.bank_account_number || profileuser.bank_info.ifsc_code) ? (
                        <Button asChild variant="outline" className="rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                          <Link href="/bankverification">Edit Bank Details</Link>
                        </Button>
                      ) : (
                        !verificationStatus.bank.completed && (
                          <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700">
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
                        )
                      )}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="reviews" className="space-y-4 pt-6">
                  <Tabs defaultValue="tasker" className="space-y-4">
                    <TabsList className="w-full grid grid-cols-2 rounded-xl bg-slate-100/80 p-1.5 h-12">
                      <TabsTrigger value="tasker" className="rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-700 data-[state=active]:font-semibold">
                        Reviews as Tasker
                      </TabsTrigger>
                      <TabsTrigger value="taskmaster" className="rounded-lg font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-700 data-[state=active]:font-semibold">
                        Reviews as Taskmaster
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="tasker" className="space-y-5 mt-0">
                      {reviews.filter((r) => (r.role || "tasker") === "tasker").length > 0 ? (
                        reviews
                          .filter((r) => (r.role || "tasker") === "tasker")
                          .map((review) => (
                            <div
                              key={review.id}
                              className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/50 p-5 space-y-3 shadow-sm hover:shadow-lg hover:border-emerald-100 transition-all duration-300"
                            >
                              <div className="flex items-start gap-4">
                                <Avatar className="h-14 w-14 shrink-0 ring-2 ring-white shadow-md">
                                  <AvatarImage src={review.reviewer_avatar} alt={review.reviewer_name} />
                                  <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 text-lg font-semibold">
                                    {(review.reviewer_name || "A").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <span className="font-semibold text-slate-800">{review.reviewer_name || "Anonymous"}</span>
                                    <span className="text-xs text-slate-500 font-medium">{review.date}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400 drop-shadow-sm" : "text-slate-200"}`}
                                      />
                                    ))}
                                    <span className="text-sm font-medium text-slate-600 ml-1">{review.rating}/5</span>
                                  </div>
                                  {review.jobTitle && (
                                    <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                      <Briefcase className="h-4 w-4 shrink-0 text-emerald-600" />
                                      <span className="text-sm font-semibold text-emerald-800">{review.jobTitle}</span>
                                    </div>
                                  )}
                                  <blockquote className="text-sm text-slate-600 leading-relaxed pl-2 border-l-2 border-emerald-200 italic">
                                    {review.comment}
                                  </blockquote>
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                          <Star className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">No reviews as tasker yet.</p>
                          <p className="text-sm text-slate-400 mt-1">Complete tasks to receive reviews.</p>
                        </div>
                      )}
                    </TabsContent>
                    <TabsContent value="taskmaster" className="space-y-5 mt-0">
                      {reviews.filter((r) => r.role === "taskmaster").length > 0 ? (
                        reviews
                          .filter((r) => r.role === "taskmaster")
                          .map((review) => (
                            <div
                              key={review.id}
                              className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/50 p-5 space-y-3 shadow-sm hover:shadow-lg hover:border-cyan-100 transition-all duration-300"
                            >
                              <div className="flex items-start gap-4">
                                <Avatar className="h-14 w-14 shrink-0 ring-2 ring-white shadow-md">
                                  <AvatarImage src={review.reviewer_avatar} alt={review.reviewer_name} />
                                  <AvatarFallback className="bg-gradient-to-br from-cyan-100 to-teal-100 text-cyan-700 text-lg font-semibold">
                                    {(review.reviewer_name || "A").charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <span className="font-semibold text-slate-800">{review.reviewer_name || "Anonymous"}</span>
                                    <span className="text-xs text-slate-500 font-medium">{review.date}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mb-2">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`h-4 w-4 ${i < review.rating ? "fill-amber-400 text-amber-400 drop-shadow-sm" : "text-slate-200"}`}
                                      />
                                    ))}
                                    <span className="text-sm font-medium text-slate-600 ml-1">{review.rating}/5</span>
                                  </div>
                                  {review.jobTitle && (
                                    <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-cyan-50 border border-cyan-100">
                                      <Briefcase className="h-4 w-4 shrink-0 text-cyan-600" />
                                      <span className="text-sm font-semibold text-cyan-800">{review.jobTitle}</span>
                                    </div>
                                  )}
                                  <blockquote className="text-sm text-slate-600 leading-relaxed pl-2 border-l-2 border-cyan-200 italic">
                                    {review.comment}
                                  </blockquote>
                                </div>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center">
                          <Star className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                          <p className="text-slate-500 font-medium">No reviews as taskmaster yet.</p>
                          <p className="text-sm text-slate-400 mt-1">Post tasks and complete them to receive reviews.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}