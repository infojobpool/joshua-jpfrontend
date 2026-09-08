"use client";

import type React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import axiosInstance from "@/lib/axiosInstance";
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Gift,
  Package,
  Inbox,
  Images,
  ChevronRight,
} from "lucide-react";
import useStore from "../../lib/Zustand";
import { resolveProfileImageUrl } from "@/lib/profileImage";
import Header from "@/components/Header";
import { TrustBadges } from "@/components/TrustBadges";
import { WelcomeBonusProcessHint } from "@/components/promo/WelcomeBonusProcessHint";
import {
  computeMissingFromProfile,
  getPayoutCompletionStats,
  mapMissingRequirementsToItems,
} from "@/lib/payoutProfileCompletion";
import { toast } from "sonner";
import { ProfileOfferingsPanel } from "@/components/profile/ProfileOfferingsPanel";
import { ProfilePortfolioSlider } from "@/components/profile/ProfilePortfolioSlider";
import { PortfolioEditorPanel } from "@/components/profile/PortfolioEditorPanel";
import { ListingRequestsPanel } from "@/components/profile/ListingRequestsPanel";
import { isValidProfilePhone, normalizeProfilePhone } from "@/lib/profilePhone";

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

type ProfileMainTab = "profile" | "listings" | "reviews";

function isProfileMainTab(v: string | null): v is ProfileMainTab {
  return v === "profile" || v === "listings" || v === "reviews";
}

/** Sub-areas inside Profile → Listings (URL: `?tab=listings&section=…`). */
type ListingsWorkspaceSection = "offerings" | "portfolio" | "bookings";

function isListingsWorkspaceSection(v: string): v is ListingsWorkspaceSection {
  return v === "offerings" || v === "portfolio" || v === "bookings";
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const [tempAvatar, setTempAvatar] = useState<string | null>(null);
  const [tempCoverImage, setTempCoverImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState<string | null>(null);
  const [profileRetryNonce, setProfileRetryNonce] = useState(0);
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
  const [mainTab, setMainTab] = useState<ProfileMainTab>("profile");

  useLayoutEffect(() => {
    const t = searchParams.get("tab");
    if (isProfileMainTab(t)) setMainTab(t);
  }, [searchParams]);

  /** Listings workspace should not block on slow /profile — URL is source of truth for this gate. */
  const isListingsTab =
    searchParams.get("tab") === "listings" || mainTab === "listings";

  const onMainTabChange = useCallback(
    (v: string) => {
      if (!isProfileMainTab(v)) return;
      setMainTab(v);
      if (v === "listings") {
        const s = searchParams.get("section");
        const section =
          s === "portfolio" || s === "bookings" || s === "requests"
            ? `&section=${s === "requests" ? "bookings" : s}`
            : "";
        router.replace(`/profile?tab=listings${section}`, { scroll: false });
      } else {
        router.replace(`/profile?tab=${v}`, { scroll: false });
      }
    },
    [router, searchParams],
  );

  const listingsWorkspaceSection: ListingsWorkspaceSection = useMemo(() => {
    const s = searchParams.get("section");
    if (s === "portfolio") return "portfolio";
    if (s === "bookings" || s === "requests") return "bookings";
    return "offerings";
  }, [searchParams]);

  const onListingsWorkspaceChange = useCallback(
    (v: string) => {
      if (!isListingsWorkspaceSection(v)) return;
      router.replace(`/profile?tab=listings&section=${v}`, { scroll: false });
    },
    [router],
  );

  const payoutBonusPreview = useMemo(() => {
    const v = Math.max(
      Number(storeUser?.verification_status ?? 0),
      Number(user?.verification_status ?? 0),
    );
    const verificationLevel = Number.isNaN(v) ? 0 : v;
    const missing = mapMissingRequirementsToItems(
      computeMissingFromProfile({
        verificationLevel,
        fullName: profileuser.name,
        phoneNumber: profileuser.phone,
        upiVpa: profileuser.upi_vpa?.trim() || undefined,
      })
    );
    return getPayoutCompletionStats(missing.length);
  }, [
    storeUser?.verification_status,
    user?.verification_status,
    profileuser.name,
    profileuser.phone,
    profileuser.upi_vpa,
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
      // Cooldown skip must clear loading — this path skips try/finally, which otherwise leaves a stuck spinner.
      if (now - lastFetchTimeRef.current < FETCH_COOLDOWN_MS && lastFetchTimeRef.current > 0) {
        setIsLoading(false);
        return;
      }
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
        setProfileLoadError("Failed to load profile: missing user id");
        setIsLoading(false);
        return;
      }

      fetchProfileRef.current = true;
      const profileAbort = new AbortController();
      const profileTimeoutMs = 22_000;
      const profileTimeoutId = setTimeout(() => profileAbort.abort(), profileTimeoutMs);
      try {
        setIsLoading(true);
        setProfileLoadError(null);
        const response = await axiosInstance.get(`/profile?user_id=${effectiveUserId}`, {
          signal: profileAbort.signal,
          timeout: profileTimeoutMs,
        });
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
            const wres = await axiosInstance.get(`/wallet?user_id=${effectiveUserId}&limit=1`, {
              signal: profileAbort.signal,
              timeout: 12_000,
            });
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
        const msgLower = String(err?.message ?? "").toLowerCase();
        const timedOut =
          err?.code === "ERR_CANCELED" ||
          err?.code === "ECONNABORTED" ||
          err?.name === "CanceledError" ||
          msgLower.includes("timeout") ||
          msgLower.includes("aborted");
        const message = timedOut
          ? "Profile request timed out. Check your connection and try again."
          : err?.response?.data?.message ||
            err?.message ||
            "Failed to load profile";
        setProfileLoadError(message);
        try {
          const raw = localStorage.getItem("user");
          if (raw) {
            const p = JSON.parse(raw) as Record<string, unknown>;
            const name = String(p.name ?? p.user_fullname ?? p.full_name ?? "").trim();
            const email = String(p.email ?? p.user_email ?? "").trim();
            const pid = String(p.profile_id ?? p.profileId ?? "").trim();
            const img = String(p.profile_image ?? p.profile_img ?? p.avatar ?? "").trim();
            setProfileUser((prev) => ({
              ...prev,
              name: name || prev.name,
              email: email || prev.email,
              profile_id: pid || prev.profile_id,
              avatar: img ? resolveProfileImageUrl(img) || img : prev.avatar,
            }));
          }
        } catch {
          /* session parse optional */
        }
        if (err.response?.status === 401) {
          logout();
          router.push("/signin");
        }
      } finally {
        clearTimeout(profileTimeoutId);
        setIsLoading(false);
        fetchProfileRef.current = false;
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
    // Omit `router` from deps — it can change identity on client navigations and retrigger fetch + cooldown early-return without finally.
  }, [userId, logout, profileRetryNonce]);

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

  const hasCoverImage = Boolean(
    (tempCoverImage && String(tempCoverImage).length > 0) ||
      (profileuser.cover_image && String(profileuser.cover_image).trim().length > 0),
  );
  const resolvedCoverUrl =
    tempCoverImage ||
    (profileuser.cover_image && resolveProfileImageUrl(profileuser.cover_image)) ||
    profileuser.cover_image;

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
      toast.error("Profile ID is required. Try refreshing after profile loads.");
      return;
    }

    const phoneRaw = String(formData.get("phone") ?? "");
    if (!isValidProfilePhone(phoneRaw)) {
      toast.error(
        "Enter a valid phone number: 10 digits, or 11 digits starting with 0 (for example 08247009219). +91 optional."
      );
      return;
    }
    const phoneForApi = normalizeProfilePhone(phoneRaw);

    try {
      setIsSavingProfile(true);
      const addresses = profileuser.addresses.map((addr) => ({
        address: addr.address,
        isDefault: addr.isDefault,
      }));

      const updateFormData = new FormData();
      updateFormData.append("profile_id", profileuser.profile_id);
      updateFormData.append("name", formData.get("name") as string);
      updateFormData.append("phone_number", phoneForApi);
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
      toast.error(err?.response?.data?.message || "Failed to update profile");
      if (err.response?.status === 401) {
        logout();
        router.push("/signin");
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading && !isListingsTab) {
    const tab = searchParams.get("tab");
    const loadingLabel =
      tab === "listings" ? "Loading listings…" : tab === "reviews" ? "Loading reviews…" : "Loading profile…";
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border border-slate-200 border-t-blue-500 animate-spin"
            style={{ animationDuration: "0.85s" }}
          />
          <span className="text-sm text-slate-500 font-medium">{loadingLabel}</span>
        </div>
      </div>
    );
  }

  // Use unified profile page for both mobile and desktop so data is consistent

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-slate-100/30 to-white">
      <Header
        user={{ ...profileuser, avatar: resolveAvatarUrl(profileuser.avatar) || profileuser.avatar }}
        onSignOut={handleSignOut}
        minimal
      />
      <main className="flex-1 w-full min-w-0 max-w-6xl mx-auto box-border overflow-x-hidden py-6 md:py-10 px-4 md:px-6 pb-28 lg:pb-10">
        {isListingsTab && isLoading ? (
          <p className="mb-3 text-center text-xs font-medium text-slate-500" aria-live="polite">
            Updating profile in the background…
          </p>
        ) : null}
        {profileLoadError ? (
          <div
            role="alert"
            className="mb-4 flex flex-col gap-3 rounded-xl border border-amber-200/90 bg-amber-50/95 px-4 py-3 text-sm text-amber-950 shadow-sm ring-1 ring-amber-100 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="min-w-0 leading-snug">{profileLoadError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-300 bg-white text-amber-950 hover:bg-amber-100/80"
              onClick={() => {
                setProfileLoadError(null);
                lastFetchTimeRef.current = 0;
                fetchSuccessRef.current = false;
                fetchProfileRef.current = false;
                setProfileRetryNonce((n) => n + 1);
              }}
            >
              Retry
            </Button>
          </div>
        ) : null}
        {mainTab === "listings" ? (
          <div className="mb-3 flex min-w-0 items-center justify-between gap-2 sm:mb-4">
            <Link
              href="/dashboard"
              className="inline-flex min-w-0 items-center gap-1 text-sm font-semibold text-slate-700 transition-colors hover:text-emerald-700"
            >
              <span className="text-lg leading-none text-slate-400" aria-hidden>
                ←
              </span>
              <span className="truncate">Dashboard</span>
            </Link>
            <Link
              href="/wallet"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/80 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm ring-1 ring-slate-200/40 transition-colors hover:bg-emerald-50/80 active:scale-[0.98]"
            >
              <Wallet className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
              Wallet
            </Link>
          </div>
        ) : (
          <>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors mb-6 font-medium"
            >
              ← Back to Dashboard
            </Link>

            <Link
              href="/wallet"
              className="mb-4 flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-emerald-100/80 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/60 transition-colors hover:bg-emerald-50/40 active:scale-[0.99]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Wallet className="h-5 w-5 text-emerald-600" aria-hidden />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-semibold text-slate-900">Wallet</span>
                  <span className="block text-xs text-slate-500">Balance, UPI, and withdrawals</span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            </Link>

            <Link
              href="/referrals"
              className="mb-4 flex w-full min-w-0 items-center justify-between gap-3 rounded-xl border border-violet-100/80 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/60 transition-colors hover:bg-violet-50/40 active:scale-[0.99]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100">
                  <Gift className="h-5 w-5 text-violet-600" aria-hidden />
                </span>
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-semibold text-slate-900">Invite &amp; earn</span>
                  <span className="block text-xs text-slate-500">Share your link, get wallet credit</span>
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            </Link>
          </>
        )}

        <Tabs value={mainTab} onValueChange={onMainTabChange} className="mt-2 w-full min-w-0">
          <TabsList
            className="grid h-11 w-full grid-cols-3 gap-1 rounded-xl bg-slate-100/90 p-1 ring-1 ring-slate-200/60 sm:h-12"
            aria-label="Profile sections"
          >
            <TabsTrigger
              value="profile"
              className="h-9 rounded-lg px-2 text-xs font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-none sm:h-10 sm:text-sm"
            >
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="listings"
              className="h-9 rounded-lg px-2 text-[11px] font-semibold leading-tight text-slate-600 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-none sm:h-10 sm:px-3 sm:text-sm whitespace-nowrap"
            >
              <span className="sm:hidden">Listings</span>
              <span className="hidden sm:inline">Listings &amp; workspace</span>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="h-9 rounded-lg px-2 text-xs font-semibold text-slate-600 data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-none sm:h-10 sm:text-sm"
            >
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-4 min-w-0 focus-visible:outline-none md:mt-6" tabIndex={-1}>
          <Card className="border-0 rounded-2xl overflow-visible bg-white relative z-10 gap-0 py-0 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70">
            {(hasCoverImage || profileuser.isEditing) && (
              <div
                className={`rounded-t-2xl bg-slate-100 relative overflow-hidden ${
                  hasCoverImage ? "h-20 sm:h-24 bg-cover bg-center bg-no-repeat" : "h-12 sm:h-14"
                }`}
                style={
                  hasCoverImage && resolvedCoverUrl
                    ? { backgroundImage: `url(${resolvedCoverUrl})` }
                    : undefined
                }
              >
                {hasCoverImage && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/[0.06]" aria-hidden />
                )}
                {profileuser.isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={triggerCoverImageInput}
                      className={`absolute inset-0 flex items-center justify-center transition-colors rounded-t-2xl ${
                        hasCoverImage ? "bg-black/25 hover:bg-black/35" : "bg-transparent hover:bg-slate-200/60"
                      }`}
                    >
                      <div className="rounded-full bg-white/95 p-2 shadow-sm ring-1 ring-slate-200/80">
                        <Camera className="h-5 w-5 text-emerald-700" />
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
                        className="absolute top-1.5 right-1.5 rounded-full bg-red-500 p-1.5 shadow-md hover:bg-red-600 z-10"
                      >
                        <X className="h-3.5 w-3.5 text-white" />
                      </button>
                    )}
                  </>
                )}
              </div>
            )}
            <CardHeader
              className={`flex flex-col items-center relative px-4 border-0 shadow-none bg-transparent ${
                hasCoverImage
                  ? "-mt-[3rem] sm:-mt-[4.25rem] pt-0 pb-1"
                  : "pt-5 pb-1"
              }`}
            >
              {profileuser.isEditing ? (
                <div className="relative -mt-1">
                  <Avatar className="h-[6.75rem] w-[6.75rem] sm:h-36 sm:w-36 ring-[3px] ring-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18)] border border-white/80 overflow-hidden">
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
                <div className="relative -mt-1 shrink-0 drop-shadow-lg">
                  <Avatar className="h-[6.75rem] w-[6.75rem] sm:h-36 sm:w-36 ring-[3px] ring-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18)] border border-white/80 overflow-hidden">
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
                  {verificationStatus.bank.completed && (
                    <span
                      className="absolute bottom-0.5 right-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md ring-2 ring-white"
                      title="Verified"
                      aria-label="Bank verified"
                    >
                      <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden />
                    </span>
                  )}
                </div>
              )}
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 mt-2 mb-0">
                Your profile
              </p>
              <div className="text-center px-2 mt-1">
                <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight capitalize">
                  {profileuser.name}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-slate-500 mt-0.5 break-all leading-snug">
                  {profileuser.email}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 pb-6 px-4 sm:px-5">
              {!profileuser.isEditing && (
                <>
                  <TrustBadges
                    variant="strip"
                    stripAccent="emerald"
                    heading="Your data is safe with JobPool"
                    subtext="Encrypted and handled under DPDP-aligned practices."
                  />
                  {payoutBonusPreview.remaining > 0 && (
                    <WelcomeBonusProcessHint
                      variant="compact"
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
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      style={PROFILE_FIELD_TEXT}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      defaultValue={profileuser.phone}
                      placeholder="9876543210 or 09876543210"
                    />
                    <p className="text-xs text-slate-500">
                      10-digit mobile is standard. Numbers starting with 0 (then 10 digits) are accepted and stored without the leading 0.
                    </p>
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
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={toggleEditProfile}
                      disabled={isLoading || isSavingProfile}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isLoading || isSavingProfile}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <Accordion type="single" collapsible defaultValue="contact" className="w-full">
                    <AccordionItem value="contact" className="border-0">
                      <AccordionTrigger className="text-sm font-semibold text-slate-800 py-2.5 hover:no-underline">
                        Contact &amp; profile details
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="space-y-3">
                          <div className="flex justify-end">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full px-4 border-slate-200/90 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                              onClick={toggleEditProfile}
                            >
                              <Edit className="mr-2 h-3.5 w-3.5" />
                              Edit profile
                            </Button>
                          </div>
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
                              <p className="font-medium text-slate-800">
                                {profileuser.phone?.trim() ? profileuser.phone : (
                                  <span className="text-slate-400 font-normal">Add in details</span>
                                )}
                              </p>
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
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="verification" className="border-0 border-t border-slate-100">
                      <AccordionTrigger className="text-sm font-semibold text-slate-800 py-2.5 hover:no-underline">
                        Verification &amp; bank
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
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
                        </div>
                        <div className="mt-4 space-y-4 border-t border-slate-200/90 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Bank account (payouts)
                          </p>
                          <div className="space-y-4">
                            {profileuser.bank_info &&
                            (profileuser.bank_info.bank_account_number || profileuser.bank_info.ifsc_code) ? (
                              <>
                                {verificationStatus.bank.completed && (
                                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-emerald-800">
                                    <div className="flex items-center gap-3">
                                      <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                                      <p className="font-semibold">Bank verification complete</p>
                                    </div>
                                  </div>
                                )}
                                {!verificationStatus.bank.completed && (
                                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-amber-800">
                                    <p className="font-medium">Verification pending</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                      Details are saved. Complete verification to receive payments.
                                    </p>
                                  </div>
                                )}
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                                    <p className="text-xs font-semibold uppercase text-slate-500">Account number</p>
                                    <p className="font-medium text-slate-800 mt-1 tabular-nums">
                                      {maskString(profileuser.bank_info.bank_account_number, 0, 4)}
                                    </p>
                                  </div>
                                  <div className="rounded-xl bg-slate-50 px-4 py-3 border border-slate-100">
                                    <p className="text-xs font-semibold uppercase text-slate-500">IFSC</p>
                                    <p className="font-medium text-slate-800 mt-1 tabular-nums">
                                      {maskString(profileuser.bank_info.ifsc_code, 0, 4)}
                                    </p>
                                  </div>
                                </div>
                                <Button asChild variant="outline" className="w-full sm:w-auto rounded-xl border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                                  <Link href="/bankverification">Edit bank details</Link>
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                                  <p className="font-medium text-slate-700">No bank details yet</p>
                                  <p className="text-sm text-slate-500 mt-1">Add your account to receive payouts after verification.</p>
                                </div>
                                {!verificationStatus.bank.completed && (
                                  <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
                                    <Link
                                      href={
                                        user?.verification_status === 2
                                          ? "/bankverification"
                                          : "/verification"
                                      }
                                    >
                                      Start verification
                                    </Link>
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              )}
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="listings" className="mt-4 min-w-0 focus-visible:outline-none md:mt-6" tabIndex={-1}>
          <Card className="relative z-0 gap-0 overflow-hidden rounded-2xl border-0 bg-white py-0 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/70">
            <CardHeader className="space-y-1 border-b border-slate-100/90 bg-gradient-to-br from-white to-emerald-50/20 px-4 py-4 sm:px-6 sm:py-5">
              <CardTitle className="text-left text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Your listing workspace
              </CardTitle>
              <CardDescription className="text-left text-sm leading-relaxed text-slate-600">
                Manage what you sell, your gallery, and new booking leads — one focused step per tab.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 bg-slate-50/40 px-3 pb-6 pt-4 sm:px-5 sm:pt-5">
              <Tabs
                value={listingsWorkspaceSection}
                onValueChange={onListingsWorkspaceChange}
                className="w-full min-w-0"
              >
                <TabsList
                  className="grid h-12 min-h-0 w-full grid-cols-3 gap-1 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200/70 sm:h-[3.25rem]"
                  aria-label="Listing workspace sections"
                >
                  <TabsTrigger
                    value="offerings"
                    className="h-10 rounded-lg px-1.5 py-1 text-[10px] font-semibold leading-tight text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-none sm:h-[2.75rem] sm:px-2 sm:text-xs"
                  >
                    <span className="flex items-center justify-center gap-1 text-center sm:gap-1.5">
                      <Package className="h-3.5 w-3.5 shrink-0 opacity-80 sm:h-4 sm:w-4" aria-hidden />
                      <span className="max-[360px]:text-[9px] whitespace-nowrap">My listings</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="portfolio"
                    className="h-10 rounded-lg px-1.5 py-1 text-[10px] font-semibold leading-tight text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-none sm:h-[2.75rem] sm:px-2 sm:text-xs"
                  >
                    <span className="flex items-center justify-center gap-1 sm:gap-1.5">
                      <Images className="h-3.5 w-3.5 shrink-0 opacity-80 sm:h-4 sm:w-4" aria-hidden />
                      <span className="max-[360px]:text-[9px] whitespace-nowrap">Portfolio</span>
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="bookings"
                    className="h-10 rounded-lg px-1.5 py-1 text-[10px] font-semibold leading-tight text-slate-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-none sm:h-[2.75rem] sm:px-2 sm:text-xs"
                  >
                    <span className="flex items-center justify-center gap-1 sm:gap-1.5">
                      <Inbox className="h-3.5 w-3.5 shrink-0 opacity-80 sm:h-4 sm:w-4" aria-hidden />
                      <span className="max-[360px]:text-[9px] whitespace-nowrap">Bookings</span>
                    </span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="offerings" id="profile-offerings" className="mt-4 min-w-0 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60 sm:p-4">
                  {userId ? (
                    <ProfileOfferingsPanel userId={userId} />
                  ) : (
                    <p className="text-sm text-slate-500">Sign in to manage offerings.</p>
                  )}
                </TabsContent>

                <TabsContent value="portfolio" id="profile-portfolio" className="mt-4 min-w-0 space-y-4">
                  {userId ? (
                    <>
                      <ProfilePortfolioSlider userId={userId} viewerIsOwner />
                      <div className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60 sm:p-4">
                        <PortfolioEditorPanel userId={userId} />
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Sign in to manage your portfolio.</p>
                  )}
                </TabsContent>

                <TabsContent value="bookings" className="mt-4 min-w-0 rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200/60 sm:p-4">
                  {userId ? (
                    <ListingRequestsPanel userId={userId} />
                  ) : (
                    <p className="text-sm text-slate-500">Sign in to see booking requests.</p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 min-w-0 focus-visible:outline-none md:mt-6" tabIndex={-1}>
            <Card className="border-0 gap-0 py-0 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.1)] rounded-2xl overflow-hidden bg-white ring-1 ring-slate-200/70">
              <CardHeader className="border-b border-slate-100/90 bg-white py-3.5 sm:py-4 px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight text-left">
                  Reviews
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 px-3 sm:px-6 pb-6 bg-slate-50/30">
                <Tabs defaultValue="tasker" className="space-y-4">
                  <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-slate-100/80 p-1.5 min-h-12">
                    <TabsTrigger
                      value="tasker"
                      className="rounded-lg px-2 py-2 text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-700 data-[state=active]:font-semibold sm:text-sm"
                    >
                      As tasker
                    </TabsTrigger>
                    <TabsTrigger
                      value="taskmaster"
                      className="rounded-lg px-2 py-2 text-xs font-medium transition-all data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-emerald-700 data-[state=active]:font-semibold sm:text-sm"
                    >
                      As taskmaster
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}