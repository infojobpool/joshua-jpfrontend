"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, X } from "lucide-react";
import {
  REFERRAL_MILESTONE_REWARD_INR,
  REFERRAL_MILESTONE_VERIFIED_COUNT,
} from "@/lib/referral/constants";
import {
  dismissReferralPromo,
  isReferralPromoDismissed,
} from "@/lib/referral/referralStorage";

export function ReferralDashboardPromo() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(isReferralPromoDismissed());
  }, []);

  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200/80 bg-gradient-to-r from-violet-50 via-white to-indigo-50 px-4 py-3 shadow-sm ring-1 ring-violet-100/80">
      <div className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-violet-300/20 blur-xl" />
      <button
        type="button"
        onClick={() => {
          dismissReferralPromo();
          setDismissed(true);
        }}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-white/80 hover:text-slate-700"
        aria-label="Dismiss invite promo"
      >
        <X className="h-4 w-4" />
      </button>
      <Link href="/referrals" className="flex items-center gap-3 pr-8 group relative">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm group-hover:scale-[1.02] transition-transform">
          <Gift className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-sm font-bold text-slate-900 group-hover:text-violet-800">
            Invite friends — earn ₹{REFERRAL_MILESTONE_REWARD_INR}
          </span>
          <span className="block text-xs text-slate-600 mt-0.5">
            Every {REFERRAL_MILESTONE_VERIFIED_COUNT} verified signups adds wallet credit. Tap to share your link.
          </span>
        </span>
      </Link>
    </div>
  );
}
