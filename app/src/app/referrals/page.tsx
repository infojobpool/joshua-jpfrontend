"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Gift, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import useStore from "@/lib/Zustand";
import { resolveProfileImageUrl } from "@/lib/profileImage";
import { ReferralInvitePanel } from "@/components/referral/ReferralInvitePanel";

export default function ReferralsPage() {
  const router = useRouter();
  const userId = useStore((s) => s.userId);
  const user = useStore((s) => s.user);
  const checkAuth = useStore((s) => s.checkAuth);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    checkAuth();
    setAuthReady(true);
  }, [checkAuth]);

  useEffect(() => {
    if (!authReady) return;
    if (!userId) router.replace("/signin?redirect=/referrals");
  }, [authReady, userId, router]);

  if (!authReady || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-indigo-50/20 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const headerUser = {
    name: user?.name ?? "User",
    avatar: resolveProfileImageUrl(user?.profile_image) ?? "/images/placeholder.svg",
  };

  return (
    <div className="flex min-h-screen min-w-0 w-full max-w-full flex-col overflow-x-hidden bg-gradient-to-b from-slate-50 via-indigo-50/20 to-white">
      <Header
        user={headerUser}
        onSignOut={() => {
          useStore.getState().logout();
          router.push("/");
        }}
        minimal
      />
      <main className="container mx-auto min-w-0 max-w-2xl flex-1 px-4 py-6 md:px-6 pb-28">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Gift className="h-7 w-7 text-indigo-600" />
          Invite &amp; earn
        </h1>

        <ReferralInvitePanel userId={userId} userName={user?.name} />
      </main>
    </div>
  );
}
