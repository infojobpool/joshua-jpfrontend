"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchRefereeStatus, type RefereeStatus } from "@/lib/referral/referralApi";
import {
  dismissRefereeBanner,
  isRefereeBannerDismissed,
} from "@/lib/referral/referralStorage";

type Props = {
  userId: string;
};

export function ReferralRefereeBanner({ userId }: Props) {
  const [status, setStatus] = useState<RefereeStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(isRefereeBannerDismissed());
    void fetchRefereeStatus(userId).then(setStatus);
  }, [userId]);

  if (dismissed || !status) return null;
  if (!status.was_referred || status.status === "credited" || status.status === "none") {
    return null;
  }

  const creditedSoon = status.status === "qualified";

  return (
    <div
      className="relative rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/95 via-violet-50/80 to-white px-4 py-3.5 shadow-sm ring-1 ring-indigo-100/80"
      role="status"
    >
      <button
        type="button"
        onClick={() => {
          dismissRefereeBanner();
          setDismissed(true);
        }}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-white/80 hover:text-slate-700"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3 pr-8">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
          <Gift className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            {creditedSoon ? "Referral bonus on the way" : "Unlock your referral bonus"}
          </p>
          <p className="mt-0.5 text-xs text-slate-600 leading-snug">
            {creditedSoon
              ? "Your first qualifying task is done. Wallet credit should appear shortly."
              : "You joined with a friend’s invite. Complete your first paid task on JobPool to receive wallet credit."}
            {status.referral_code_used ? (
              <>
                {" "}
                Code: <span className="font-mono font-semibold">{status.referral_code_used}</span>
              </>
            ) : null}
          </p>
          {!creditedSoon ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button asChild size="sm" className="h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700">
                <Link href="/dashboard?tab=available">Browse tasks</Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-8 rounded-lg">
                <Link href="/referral-terms">Terms</Link>
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" variant="outline" className="mt-2 h-8 rounded-lg">
              <Link href="/wallet">View wallet</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
