"use client";

import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Consistent copy: full journey (signup → email → verification → profile) for ₹100 wallet bonus.
 */
export function WelcomeBonusProcessHint({
  variant = "signup",
  className,
}: {
  variant?: "signup" | "flow" | "step" | "profile" | "compact";
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <p className={cn("text-xs text-emerald-900 leading-snug", className)} role="note">
        <Gift className="inline h-3.5 w-3.5 -mt-0.5 mr-1 text-emerald-600 align-middle" aria-hidden />
        <span className="font-semibold">₹100 welcome bonus:</span> Finish signup, verification, and your
        profile in the app — bonus credits to your wallet when requirements are met. T&amp;Cs apply.
      </p>
    );
  }

  if (variant === "step") {
    return (
      <div
        className={cn(
          "rounded-lg border border-emerald-200/90 bg-emerald-50/95 px-3 py-2 text-xs text-emerald-950 leading-relaxed",
          className
        )}
        role="note"
      >
        <span className="font-semibold">₹100 welcome bonus — </span>
        Complete this step, then finish any remaining verification and your profile in the app. Credited to
        your wallet when eligible. T&amp;Cs apply.
      </div>
    );
  }

  const title = "₹100 welcome bonus";
  const body =
    variant === "signup"
      ? "Complete the full journey to qualify: create your account, verify your email, finish identity verification (PAN & Aadhaar), and complete your profile in the JobPool app. Your bonus is credited to your in-app wallet when all requirements are met. T&Cs apply."
      : variant === "profile"
        ? "Add your details (name, phone, photo, addresses, UPI for wallet) and save. The ₹100 welcome bonus is credited when signup, verification, and profile completion criteria are satisfied. T&Cs apply."
        : "Keep going — finish PAN & Aadhaar verification, then complete your profile in the app. Your ₹100 welcome bonus is credited to your JobPool wallet when the full process is done. T&Cs apply.";

  return (
    <div
      className={cn(
        "rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-teal-50/70 p-3.5 text-sm text-slate-800 shadow-sm",
        className
      )}
      role="note"
    >
      <div className="flex gap-2.5">
        <Gift className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
        <div>
          <p className="font-semibold text-emerald-900">{title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-700">{body}</p>
        </div>
      </div>
    </div>
  );
}
