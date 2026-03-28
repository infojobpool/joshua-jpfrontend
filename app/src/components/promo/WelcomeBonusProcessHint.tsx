"use client";

import { Gift } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ₹100 wallet bonus journey. On logged-in screens pass real `percent` from getPayoutCompletionStats;
 * when percent reaches 100, renders nothing. `variant` fallbacks are for marketing (e.g. signup) only.
 */
export function WelcomeBonusProcessHint({
  variant = "signup",
  className,
  percent: percentProp,
  label: labelProp,
}: {
  variant?: "signup" | "flow" | "step" | "profile" | "compact";
  className?: string;
  /** Real completion % (e.g. from getPayoutCompletionStats) — overrides variant */
  percent?: number;
  /** Short line under the bar — overrides variant */
  label?: string;
}) {
  const fallback =
    variant === "signup"
      ? { percent: 15, label: "Start your wallet journey" }
      : variant === "flow"
      ? { percent: 45, label: "Verification in progress" }
      : variant === "step"
      ? { percent: 60, label: "Complete this step to move ahead" }
      : variant === "profile"
      ? { percent: 85, label: "Profile finishing step" }
      : { percent: 70, label: "Keep going to unlock bonus" };

  const pct =
    typeof percentProp === "number" && !Number.isNaN(percentProp)
      ? Math.min(100, Math.max(0, Math.round(percentProp)))
      : fallback.percent;
  const meta = {
    percent: pct,
    label: (labelProp != null && String(labelProp).trim() !== "" ? labelProp : fallback.label) as string,
  };

  if (meta.percent >= 100) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50/95 via-white to-teal-50/70 p-3 shadow-sm",
        className
      )}
      role="note"
    >
      <div className="flex items-start gap-2.5">
        <Gift className="h-4.5 w-4.5 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-900">
              ₹100 Welcome Bonus
            </p>
            <span className="text-xs font-semibold text-emerald-800 tabular-nums">
              {meta.percent}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-[width] duration-500"
              style={{ width: `${meta.percent}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
            {meta.label}. Credited to your wallet when fully eligible. T&amp;Cs apply.
          </p>
        </div>
      </div>
    </div>
  );
}
