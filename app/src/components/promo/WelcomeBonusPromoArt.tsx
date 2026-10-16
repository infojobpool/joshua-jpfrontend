"use client";

import { Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { welcomeBonusInrLabel } from "@/lib/welcomeBonus";

type Props = {
  className?: string;
  /** Tighter layout for mobile home card */
  variant?: "hero" | "popup";
};

/** ₹25 welcome bonus — replaces legacy PNG/JPG creatives that showed ₹100. */
export function WelcomeBonusPromoArt({ className, variant = "hero" }: Props) {
  const isPopup = variant === "popup";

  return (
    <div
      className={cn(
        "relative overflow-hidden text-white",
        isPopup
          ? "rounded-t-2xl sm:rounded-t-3xl bg-gradient-to-br from-indigo-700 via-violet-700 to-blue-800 px-6 py-8"
          : "rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-blue-700 px-5 py-6",
        className
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-amber-400/15 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start gap-3">
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 shadow-inner",
            isPopup ? "h-14 w-14" : "h-12 w-12"
          )}
        >
          <Gift className={isPopup ? "h-7 w-7" : "h-6 w-6"} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-100/95">
              Welcome bonus
            </p>
            <Sparkles className="h-3.5 w-3.5 text-amber-300" aria-hidden />
          </div>
          <p
            className={cn(
              "font-bold tracking-tight text-white tabular-nums",
              isPopup ? "text-4xl mt-1" : "text-3xl mt-0.5"
            )}
          >
            {welcomeBonusInrLabel()}
          </p>
          <p className={cn("text-indigo-100/90 leading-snug", isPopup ? "text-sm mt-2" : "text-xs mt-1.5")}>
            In your JobPool wallet after you complete profile &amp; payout verification.
          </p>
        </div>
      </div>
    </div>
  );
}
