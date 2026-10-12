"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Gift, Loader2, Sparkles } from "lucide-react";
import useStore from "@/lib/Zustand";
import {
  REFERRAL_MILESTONE_REWARD_INR,
  REFERRAL_MILESTONE_VERIFIED_COUNT,
  WELCOME_BONUS_INR,
} from "@/lib/referral/constants";
import {
  enrichSummaryFromReferrals,
  fetchReferralList,
  fetchReferralSummary,
  type ReferralSummary,
} from "@/lib/referral/referralApi";
import { ReferralMilestoneDots } from "@/components/referral/ReferralMilestoneDots";
import { cn } from "@/lib/utils";

export function ReferralMobileHomeStrip() {
  const checkAuth = useStore((s) => s.checkAuth);
  const userId = useStore((s) => s.userId);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!userId) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const [s, list] = await Promise.all([
          fetchReferralSummary(userId),
          fetchReferralList(userId),
        ]);
        if (!cancelled) setSummary(enrichSummaryFromReferrals(s, list));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const href = userId ? "/referrals" : "/signin?redirect=/referrals";
  const required = summary?.milestone_verified_required ?? REFERRAL_MILESTONE_VERIFIED_COUNT;
  const toward = summary?.milestone_progress_toward_next ?? 0;
  const reward = summary?.milestone_reward_inr ?? REFERRAL_MILESTONE_REWARD_INR;
  const milestoneDone =
    Boolean(userId && summary && !loading && toward === 0 && (summary.verified_referee_count ?? 0) > 0);

  return (
    <section className="md:hidden px-4 py-3 bg-gradient-to-b from-indigo-50/40 to-white dark:from-slate-900/30 dark:to-slate-950">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href={href}
          className={cn(
            "group relative block overflow-hidden rounded-2xl p-[1px]",
            "bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500",
            "shadow-md shadow-violet-500/15 active:scale-[0.99] transition-transform"
          )}
        >
          <div className="relative rounded-[15px] bg-white/95 dark:bg-slate-950/95 px-3.5 py-3 backdrop-blur-sm">
            <div
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-400/10 blur-2xl"
              aria-hidden
            />
            <div className="flex items-start gap-3 min-w-0">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
                {loading && userId ? (
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                ) : (
                  <Gift className="h-5 w-5" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                    {userId ? "Invite & earn" : "Join & invite friends"}
                  </p>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-hidden />
                </div>
                <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                  {userId
                    ? loading
                      ? "Loading your progress…"
                      : milestoneDone
                        ? `Milestone hit — ₹${reward} in wallet. Keep inviting!`
                        : `₹${reward} for every ${required} verified friends · friends get ₹${WELCOME_BONUS_INR} welcome`
                    : `₹${WELCOME_BONUS_INR} welcome bonus · earn ₹${reward} per ${required} verified invites`}
                </p>
                {userId && summary && !loading ? (
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <ReferralMilestoneDots
                      toward={toward}
                      required={required}
                      milestoneJustCompleted={milestoneDone}
                      size="sm"
                      className="max-w-[120px]"
                    />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300 tabular-nums">
                      {milestoneDone ? `${required}/${required}` : `${toward}/${required}`} verified
                    </span>
                  </div>
                ) : null}
              </div>
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-violet-600 dark:text-violet-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
