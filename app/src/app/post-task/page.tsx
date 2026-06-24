"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Toaster } from "../../components/ui/sonner";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, IndianRupee, Loader, Pencil, Upload, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import axiosInstance from "../../lib/axiosInstance";
import {
  fetchFeePreview,
  type PosterFeeData,
} from "@/lib/feePreview";
import { PosterFeeBreakdown } from "@/components/fee/PosterFeeBreakdown";
import useStore from "../../lib/Zustand";
import { handleAxiosError } from "../../lib/handleAxiosError";
import LocationDetector from "../../components/LocationDetector";
import Header from "@/components/Header";
import { WelcomeBonusProcessHint } from "@/components/promo/WelcomeBonusProcessHint";
import {
  getPayoutEligibilityStats,
} from "@/lib/payoutProfileCompletion";

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

const TOTAL_STEPS = 4;
const WIZARD_DRAFT_KEY = "jobpool_post_task_wizard_v1";

const WIZARD_STEPS = [
  {
    step: 1,
    label: "What you need",
    title: "Let's start with the basics",
    hint: "A clear title and description help taskers respond faster.",
  },
  {
    step: 2,
    label: "Category & budget",
    title: "How should taskers find this?",
    hint: "Pick the closest category and a fair budget.",
  },
  {
    step: 3,
    label: "Where & when",
    title: "Location and timing",
    hint: "Taskers need to know where to show up.",
  },
  {
    step: 4,
    label: "Photos & review",
    title: "Almost there",
    hint: "Add photos if it helps, then check the summary and post.",
  },
] as const;

/** Get a fallback category ID when user types their own. Tries to match by name first, then Other/General, then first. */
function getFallbackCategoryId(categories: Category[], customName?: string): string | null {
  if (!categories.length) return null;
  const lower = (s: string) => (s || "").toLowerCase().trim();
  const custom = lower(customName || "");

  // If user typed something, try to find a category whose name contains it (e.g. "delivery" → "Delivery & Moving")
  if (custom) {
    const matched = categories.find((c) => {
      const n = lower(c.name);
      return n.includes(custom) || custom.includes(n);
    });
    if (matched) return matched.id;
  }

  const other = categories.find((c) => lower(c.name).includes("other"));
  if (other) return other.id;
  const general = categories.find((c) => lower(c.name).includes("general"));
  if (general) return general.id;
  return categories[0].id;
}

export default function PostTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  /** Synchronous guard — React state updates are async, so double-tap can fire two POSTs before isSubmitting flips. */
  const postInFlightRef = useRef(false);
  const [currentStep, setCurrentStep] = useState(1);
  /** Avoid accidental post when the same tap lands on "Post task" after Continue swaps the footer (mobile / flex-col-reverse). */
  const [postActionUnlocked, setPostActionUnlocked] = useState(false);
  const [minDate, setMinDate] = useState("");
  const [dueDateFlexible, setDueDateFlexible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const { userId } = useStore();
  const [payoutBonusPreview, setPayoutBonusPreview] = useState<{
    percent: number;
    completed: number;
    total: number;
    remaining: number;
  } | null>(null);
  const [posterFeePreview, setPosterFeePreview] = useState<PosterFeeData | null>(null);
  const [posterFeePreviewLoading, setPosterFeePreviewLoading] = useState(false);
  const [posterFeePreviewError, setPosterFeePreviewError] = useState<string | null>(null);
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
        const [response, walletRes] = await Promise.all([
          axiosInstance.get(`/profile${cacheBuster}`),
          axiosInstance.get(`/wallet?user_id=${effectiveUserId}&limit=1`),
        ]);
        const data = response.data;
        const payload = data?.data ?? data;
        const wd = walletRes.data?.data ?? walletRes.data;

        // ₹100 bonus progress — same rules as Wallet (API missing_requirements when available)
        try {
          const stats = getPayoutEligibilityStats(wd, payload);
          setPayoutBonusPreview(stats);
        } catch {
          setPayoutBonusPreview(null);
        }

        // Check verification status from API
        const apiVerificationStatus =
          payload?.verification_status ??
          payload?.verificationStatus ??
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
        setPayoutBonusPreview(null);
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

  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (loading || !user || draftRestoredRef.current) return;
    draftRestoredRef.current = true;
    try {
      const raw = sessionStorage.getItem(WIZARD_DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as {
        formData?: Partial<FormData>;
        dueDateFlexible?: boolean;
        customCategoryName?: string;
        currentStep?: number;
      };
      if (d.formData && typeof d.formData === "object") {
        setFormData((prev) => ({ ...prev, ...d.formData }));
      }
      if (typeof d.dueDateFlexible === "boolean") setDueDateFlexible(d.dueDateFlexible);
      if (typeof d.customCategoryName === "string") setCustomCategoryName(d.customCategoryName);
      // Intentionally do NOT restore `currentStep` from draft — reopening "Post a task" should start
      // at step 1 so users are not dropped on the review screen with no context. Form fields still merge above.
    } catch {
      /* ignore corrupt draft */
    }
  }, [loading, user]);

  /** Prefill title from home hero (?title=...). Defer one tick so session draft merge applies first. */
  const urlTitleAppliedRef = useRef(false);
  useEffect(() => {
    if (loading || !user || urlTitleAppliedRef.current) return;
    const raw = searchParams.get("title");
    if (raw == null) return;
    const decoded = raw.trim();
    if (!decoded) return;
    urlTitleAppliedRef.current = true;
    const id = window.setTimeout(() => {
      setFormData((prev) => ({ ...prev, title: decoded }));
    }, 0);
    return () => window.clearTimeout(id);
  }, [loading, user, searchParams]);

  /** Prefill category from category landing pages (?category=category_id). */
  useEffect(() => {
    if (loading || !user || categories.length === 0) return;
    const catId = searchParams.get("category")?.trim();
    if (!catId) return;
    const exists = categories.some((c) => c.id === catId);
    if (!exists) return;
    setFormData((prev) => (prev.category === catId ? prev : { ...prev, category: catId }));
  }, [loading, user, searchParams, categories]);

  useEffect(() => {
    if (loading || !user) return;
    try {
      sessionStorage.setItem(
        WIZARD_DRAFT_KEY,
        JSON.stringify({
          formData,
          dueDateFlexible,
          customCategoryName,
        })
      );
    } catch {
      /* ignore quota */
    }
  }, [formData, dueDateFlexible, customCategoryName, currentStep, loading, user]);

  useEffect(() => {
    if (currentStep !== TOTAL_STEPS) {
      setPostActionUnlocked(false);
      return;
    }
    setPostActionUnlocked(false);
    const id = window.setTimeout(() => setPostActionUnlocked(true), 450);
    return () => window.clearTimeout(id);
  }, [currentStep]);

  // Must run unconditionally (same order every render) — was after `if (loading)` and caused Rules of Hooks crash.
  useEffect(() => {
    if (currentStep !== TOTAL_STEPS) {
      return;
    }
    const budgetAmt = parseFloat(String(formData.budget)) || 0;
    if (budgetAmt <= 0) {
      setPosterFeePreview(null);
      setPosterFeePreviewError(null);
      setPosterFeePreviewLoading(false);
      return;
    }
    let cancelled = false;
    setPosterFeePreviewLoading(true);
    setPosterFeePreviewError(null);
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const data = (await fetchFeePreview(budgetAmt, "poster")) as PosterFeeData;
          if (!cancelled) {
            setPosterFeePreview(data);
            setPosterFeePreviewError(null);
          }
        } catch (e: unknown) {
          if (!cancelled) {
            setPosterFeePreview(null);
            setPosterFeePreviewError(e instanceof Error ? e.message : "Unable to load fee estimate");
          }
        } finally {
          if (!cancelled) setPosterFeePreviewLoading(false);
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [currentStep, formData.budget]);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.title.trim()) {
          toast.error("Please add a task title");
          return false;
        }
        if (formData.title.trim().length < 3) {
          toast.error("Title is too short");
          return false;
        }
        if (!formData.description.trim()) {
          toast.error("Please add a short description");
          return false;
        }
        if (formData.description.trim().length < 10) {
          toast.error("Please add a bit more detail (at least 10 characters)");
          return false;
        }
        return true;
      case 2:
        if (!formData.category) {
          toast.error("Please select a category");
          return false;
        }
        if (formData.category === CUSTOM_CATEGORY_VALUE && !customCategoryName.trim()) {
          toast.error("Please type your category name, or select one from the list");
          return false;
        }
        {
          const b = parseFloat(String(formData.budget));
          if (!formData.budget || Number.isNaN(b) || b <= 0) {
            toast.error("Please enter a valid budget");
            return false;
          }
        }
        return true;
      case 3:
        if (!formData.location?.trim()) {
          toast.error("Please enter or detect your location");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goBack = () => {
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const getCategoryDisplayName = useCallback(() => {
    if (formData.category === CUSTOM_CATEGORY_VALUE) {
      return customCategoryName.trim() || "Custom category";
    }
    const c = categories.find((x) => x.id === formData.category);
    return c?.name || "—";
  }, [formData.category, customCategoryName, categories]);

  const handleFinalPost = async () => {
    if (isSubmitting || postInFlightRef.current) return;
    if (!validateStep(1)) {
      setCurrentStep(1);
      return;
    }
    if (!validateStep(2)) {
      setCurrentStep(2);
      return;
    }
    if (!validateStep(3)) {
      setCurrentStep(3);
      return;
    }
    await confirmPostSubmission();
  };

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
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const maxImages = 5;
    setImages((prev) => {
      const remaining = maxImages - prev.length;
      if (remaining <= 0) {
        toast.error("You can upload up to 5 images");
        return prev;
      }
      const slice = files.slice(0, remaining);
      if (files.length > remaining) {
        toast.message(`Only ${remaining} more image${remaining === 1 ? "" : "s"} allowed (max 5)`);
      }
      const newImages = slice.map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file),
        file,
      }));
      return [...prev, ...newImages];
    });
    e.target.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((image) => image.id !== id));
  };

  const confirmPostSubmission = async () => {
    if (postInFlightRef.current) return;
    postInFlightRef.current = true;
    setIsSubmitting(true);

    try {
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

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("user_id", userId || "");
    formDataToSubmit.append("title", formData.title);
    formDataToSubmit.append("description", formData.description);

    const isCustomCategory = formData.category === CUSTOM_CATEGORY_VALUE;
    if (isCustomCategory) {
      const fallbackId = getFallbackCategoryId(categories, customCategoryName);
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
        try {
          sessionStorage.removeItem(WIZARD_DRAFT_KEY);
        } catch {
          /* ignore */
        }
        toast.success("Your task has been posted!");
        router.push("/dashboard");
        return;
      }
      if (response.data.status_code === 403) {
        toast.error(response.data.message || "Please complete verification to post a job");
        if (response.data.data?.verification_status !== undefined) {
          console.log("Verification status:", response.data.data.verification_status);
        }
        return;
      }
      toast.error(response.data.message || "Failed to post task. Please try again.");
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
      postInFlightRef.current = false;
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

  const stepMeta = WIZARD_STEPS[currentStep - 1];

  return (
    <div className="flex min-h-screen flex-col">
      <Toaster />
      <Header
        user={{ name: user.name, avatar: "/images/placeholder.svg" }}
        onSignOut={handleSignOut}
        minimal
      />
      <main className="flex-1 container mx-auto max-w-3xl py-6 md:py-10 px-4 md:px-6">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 hover:underline mb-4 inline-block"
        >
          ← Back to Dashboard
        </Link>
        <div className="mb-4 space-y-3">
          {payoutBonusPreview && payoutBonusPreview.remaining > 0 && (
            <WelcomeBonusProcessHint
              variant="compact"
              percent={payoutBonusPreview.percent}
              label={`${payoutBonusPreview.completed} of ${payoutBonusPreview.total} steps toward ₹100 bonus · ${payoutBonusPreview.remaining} left`}
            />
          )}
          {error && (
            <div className="flex items-center justify-between gap-3 text-red-600 text-sm bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
              <span>{error}</span>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  void fetchCategories();
                }}
                className="px-2 py-1 text-xs font-medium bg-red-600 text-white rounded"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        <div>
          <Card className="border border-slate-200/90 shadow-xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Never post from implicit submit (Enter / mobile "Go" / layout-shift double tap).
                // Posting only happens from the explicit "Post task" button (type="button" + onClick).
              }}
            >
              <div className="h-1.5 w-full bg-slate-100">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 transition-[width] duration-300 ease-out"
                  style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
                  role="progressbar"
                  aria-valuenow={currentStep}
                  aria-valuemin={1}
                  aria-valuemax={TOTAL_STEPS}
                />
              </div>
              <CardHeader className="space-y-3 pb-2 pt-6 md:pt-8 px-4 md:px-8">
                <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-600/90">
                  Step {currentStep} of {TOTAL_STEPS}
                  <span className="text-slate-300 mx-2">·</span>
                  <span className="text-slate-500">{stepMeta.label}</span>
                </p>
                <CardTitle className="task-title text-[1.625rem] sm:text-[1.85rem] md:text-[2.125rem] text-slate-950 leading-[1.12]">
                  {stepMeta.title}
                </CardTitle>
                <CardDescription className="text-[0.9375rem] sm:text-base text-slate-600 leading-relaxed font-normal">
                  {stepMeta.hint}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 px-4 md:px-8 pb-2 min-h-[280px] md:min-h-[320px]">
                {currentStep === 1 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label htmlFor="title" className="task-title text-[0.9375rem] text-slate-900">
                        In a few words, what do you need done?
                      </Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="e.g., Help moving my sofa"
                        value={formData.title}
                        onChange={handleChange}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base focus-visible:ring-blue-600/30 focus-visible:border-blue-500"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="task-title text-[0.9375rem] text-slate-900">
                        Tell taskers the details
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe what you need done — timing, access, anything important..."
                        rows={6}
                        value={formData.description}
                        onChange={handleChange}
                        className="rounded-xl border-slate-200 bg-slate-50/50 text-base leading-relaxed focus-visible:ring-blue-600/30 focus-visible:border-blue-500 resize-y min-h-[140px]"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="category" className="task-title text-[0.9375rem] text-slate-900">
                          Category
                        </Label>
                        <button
                          type="button"
                          onClick={() => {
                            void fetchCategories();
                            toast.success("Categories refreshed");
                          }}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2"
                        >
                          Just added one? Refresh
                        </button>
                      </div>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => handleSelectChange("category", e.target.value)}
                        className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-600/25 focus:border-blue-500"
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
                        <div className="pt-2 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                          <Label htmlFor="customCategory" className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                            <Pencil className="h-3.5 w-3.5" />
                            Your category name
                          </Label>
                          <Input
                            id="customCategory"
                            placeholder="e.g., Event photography, Car wash"
                            value={customCategoryName}
                            onChange={(e) => setCustomCategoryName(e.target.value)}
                            className="h-11 rounded-xl border-blue-200 focus-visible:ring-blue-500/30"
                            maxLength={60}
                          />
                          <p className="text-xs text-slate-500">
                            We&apos;ll use the closest match for now. Admins can add your suggestion to the main list.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="task-title text-[0.9375rem] text-slate-900">
                        Budget <IndianRupee className="w-4 h-4 inline opacity-70" />
                      </Label>
                      <Input
                        id="budget"
                        name="budget"
                        type="number"
                        inputMode="decimal"
                        placeholder="e.g., 5000"
                        value={formData.budget}
                        onChange={handleChange}
                        className="h-12 rounded-xl border-slate-200 bg-slate-50/50 text-base focus-visible:ring-blue-600/30 focus-visible:border-blue-500"
                      />
                      <p className="text-xs text-slate-500">Fair budgets attract quality offers faster.</p>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label className="task-title text-[0.9375rem] text-slate-900">
                        Location <span className="text-red-500 font-sans font-normal">*</span>
                      </Label>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Enter a full address (street, area, city). Use <strong className="font-semibold text-slate-800">Detect</strong> or type and pick from suggestions.
                      </p>
                      <LocationDetector
                        key="post-task-location"
                        initialLine={formData.location}
                        onLocationChange={(location: string) =>
                          setFormData((prev) => ({ ...prev, location }))
                        }
                      />
                    </div>
                    <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="dueDate" className="task-title text-[0.9375rem] text-slate-900">
                          Due date <span className="font-sans font-normal text-slate-500 text-sm">(optional)</span>
                        </Label>
                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                          <Checkbox
                            id="dueDateFlexible"
                            checked={dueDateFlexible}
                            onCheckedChange={(checked) => {
                              setDueDateFlexible(!!checked);
                              if (checked) setFormData((prev) => ({ ...prev, dueDate: "" }));
                            }}
                          />
                          <span>I&apos;m flexible</span>
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
                        className="h-12 w-full rounded-xl border-slate-200 bg-white focus-visible:ring-blue-600/30 focus-visible:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    <div className="space-y-2">
                      <Label className="task-title text-base text-slate-950">Photos (optional)</Label>
                      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-gradient-to-b from-slate-50/80 to-white transition-colors hover:border-blue-300/80 hover:bg-blue-50/20">
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
                          className="cursor-pointer flex flex-col items-center gap-2 text-slate-600"
                        >
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                            <Upload className="h-6 w-6" />
                          </span>
                          <span className="font-semibold text-slate-800">Click to upload</span>
                          <span className="text-sm text-slate-500">Up to 5 images · JPG, PNG</span>
                        </Label>
                      </div>
                      {images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {images.map((image) => (
                            <div key={image.id} className="relative group">
                              <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                                <img
                                  src={image.url || "/images/placeholder.svg"}
                                  alt={image.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(image.id)}
                                className="absolute top-2 right-2 rounded-full bg-slate-900/70 text-white p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                                aria-label="Remove image"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 md:p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="task-title text-lg text-slate-950 tracking-tight">Summary</h3>
                        <span className="text-xs font-medium text-slate-500">Tap edit to jump back</span>
                      </div>
                      <dl className="space-y-3 text-sm">
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4 border-b border-slate-200/80 pb-3">
                          <dt className="text-slate-500 shrink-0">Task</dt>
                          <dd className="font-medium text-slate-900 text-right sm:text-left min-w-0">
                            <span className="line-clamp-2">{formData.title || "—"}</span>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              className="block text-xs font-semibold text-blue-600 mt-1 hover:underline"
                            >
                              Edit
                            </button>
                          </dd>
                        </div>
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:items-start sm:gap-4 border-b border-slate-200/80 pb-3">
                          <dt className="text-slate-500 shrink-0">Description</dt>
                          <dd className="text-slate-800 min-w-0 flex-1">
                            <p className="line-clamp-3 text-left">{formData.description || "—"}</p>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              className="text-xs font-semibold text-blue-600 mt-1 hover:underline"
                            >
                              Edit
                            </button>
                          </dd>
                        </div>
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4 border-b border-slate-200/80 pb-3">
                          <dt className="text-slate-500">Category & budget</dt>
                          <dd className="font-medium text-slate-900 text-right sm:text-left">
                            {getCategoryDisplayName()}
                            <span className="text-slate-500 font-normal"> · </span>
                            <IndianRupee className="w-3.5 h-3.5 inline opacity-70" />
                            {budgetAmount > 0 ? budgetAmount.toLocaleString("en-IN") : "—"}
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="block text-xs font-semibold text-blue-600 mt-1 hover:underline"
                            >
                              Edit
                            </button>
                          </dd>
                        </div>
                        <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between sm:gap-4 border-b border-slate-200/80 pb-3">
                          <dt className="text-slate-500">Where & when</dt>
                          <dd className="text-slate-800 text-right sm:text-left min-w-0">
                            <span className="line-clamp-2">{formData.location || "—"}</span>
                            <span className="block text-slate-600 mt-0.5">
                              {dueDateFlexible
                                ? "Flexible on date"
                                : formData.dueDate
                                  ? new Date(formData.dueDate + "T12:00:00").toLocaleDateString("en-IN", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : "No date set"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              className="text-xs font-semibold text-blue-600 mt-1 hover:underline"
                            >
                              Edit
                            </button>
                          </dd>
                        </div>
                        {budgetAmount > 0 ? (
                          <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs text-slate-600">
                            <p className="mb-1 font-medium text-slate-800">Payment estimate</p>
                            {posterFeePreviewError ? (
                              <p className="text-red-600">{posterFeePreviewError}</p>
                            ) : posterFeePreviewLoading || !posterFeePreview ? (
                              <p className="text-slate-500">Loading estimate…</p>
                            ) : (
                              <PosterFeeBreakdown data={posterFeePreview} bidFallback={budgetAmount} compact />
                            )}
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-gradient-to-b from-white to-slate-50/90 px-4 py-4 md:px-8 md:py-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:justify-between sm:items-center w-full">
                  {currentStep > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBack}
                      className="w-full sm:w-auto h-11 rounded-full border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1 shrink-0" />
                      Back
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => router.back()}
                      className="w-full sm:w-auto h-11 rounded-full text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </Button>
                  )}
                  {currentStep < TOTAL_STEPS ? (
                    <Button
                      type="button"
                      onClick={goNext}
                      className="w-full sm:w-auto h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 px-6"
                    >
                      Continue
                      <ChevronRight className="h-4 w-4 ml-1 shrink-0" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={
                        isSubmitting ||
                        verificationLoading ||
                        !postActionUnlocked
                      }
                      className="w-full sm:w-auto h-11 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 px-6 disabled:opacity-70"
                      onClick={() => void handleFinalPost()}
                    >
                      {isSubmitting ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : verificationLoading ? (
                        "Verifying…"
                      ) : (
                        "Post task"
                      )}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
      {/* Confirmation dialog removed per request; posting happens immediately */}
    </div>
  );
}