"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import useStore from "@/lib/Zustand";
import { OfferingEditorForm } from "@/components/profile/OfferingEditorForm";
import { createDraftShell } from "@/lib/offerings/storage";
import Header from "@/components/Header";
import { resolveProfileImageUrl } from "@/lib/profileImage";

export default function NewOfferingPage() {
  const router = useRouter();
  const checkAuth = useStore((s) => s.checkAuth);
  const logout = useStore((s) => s.logout);
  const userId = useStore((s) => s.userId);
  const user = useStore((s) => s.user);
  const [authChecked, setAuthChecked] = useState(false);

  const initial = useMemo(() => (userId ? createDraftShell(userId) : null), [userId]);

  useEffect(() => {
    checkAuth();
    setAuthChecked(true);
  }, [checkAuth]);

  useEffect(() => {
    if (!authChecked) return;
    if (!userId) router.replace("/signin");
  }, [authChecked, userId, router]);

  if (!authChecked || !userId || !initial) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
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
        <OfferingEditorForm userId={userId} initial={initial} isNew />
      </main>
    </div>
  );
}
