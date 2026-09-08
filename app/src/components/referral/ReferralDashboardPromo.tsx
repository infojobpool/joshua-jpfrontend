"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, X } from "lucide-react";
import { DEFAULT_REFERRER_REWARD_INR } from "@/lib/referral/constants";
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
    <div className="relative rounded-2xl border border-violet-200/70 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200/60">
      <button
        type="button"
        onClick={() => {
          dismissReferralPromo();
          setDismissed(true);
        }}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        aria-label="Dismiss invite promo"
      >
        <X className="h-4 w-4" />
      </button>
      <Link href="/referrals" className="flex items-center gap-3 pr-8 group">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 group-hover:bg-violet-200/80 transition-colors">
          <Gift className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-sm font-semibold text-slate-900 group-hover:text-violet-800">
            Invite friends — earn ₹{DEFAULT_REFERRER_REWARD_INR.toLocaleString("en-IN")} each
          </span>
          <span className="block text-xs text-slate-500 mt-0.5">
            Share your link on WhatsApp. Credit lands in your wallet when they complete a task.
          </span>
        </span>
      </Link>
    </div>
  );
}
