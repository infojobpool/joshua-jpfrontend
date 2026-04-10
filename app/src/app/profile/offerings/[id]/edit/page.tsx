"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useStore from "@/lib/Zustand";
import { OfferingEditorForm } from "@/components/profile/OfferingEditorForm";
import { loadOfferings } from "@/lib/offerings/storage";
import Header from "@/components/Header";
import Link from "next/link";
import { resolveProfileImageUrl } from "@/lib/profileImage";

export default function EditOfferingPage() {
  const router = useRouter();
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const checkAuth = useStore((s) => s.checkAuth);
  const logout = useStore((s) => s.logout);
  const userId = useStore((s) => s.userId);
  const user = useStore((s) => s.user);
  const [authChecked, setAuthChecked] = useState(false);

  const offering = useMemo(() => {
    if (!userId || !id) return null;
    return loadOfferings(userId).find((x) => x.id === id) ?? null;
  }, [userId, id]);

  useEffect(() => {
    checkAuth();
    setAuthChecked(true);
  }, [checkAuth]);

  useEffect(() => {
    if (!authChecked) return;
    if (!userId) router.replace("/signin");
  }, [authChecked, userId, router]);

  if (!authChecked || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-slate-600">Offering not found.</p>
        <Link href="/profile" className="text-emerald-700 font-medium hover:underline">
          Back to profile
        </Link>
      </div>
    );
  }

  const avatar =
    (user?.profile_image && resolveProfileImageUrl(user.profile_image)) ||
    user?.profile_image ||
    "/images/placeholder.svg";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Header
        user={{
          name: user?.name || "User",
          avatar,
        }}
        onSignOut={() => {
          logout();
          router.push("/");
        }}
      />
      <main className="container mx-auto max-w-2xl pb-16">
        <OfferingEditorForm userId={userId} initial={offering} isNew={false} />
      </main>
    </div>
  );
}
