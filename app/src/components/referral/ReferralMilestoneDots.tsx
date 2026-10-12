"use client";

import { Fragment } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type Props = {
  toward: number;
  required?: number;
  milestoneJustCompleted?: boolean;
  size?: "sm" | "md";
  className?: string;
};

export function ReferralMilestoneDots({
  toward,
  required = 3,
  milestoneJustCompleted = false,
  size = "md",
  className,
}: Props) {
  const filled = milestoneJustCompleted ? required : Math.min(required, Math.max(0, toward));
  const dotSize = size === "sm" ? "h-2.5 w-2.5" : "h-4 w-4";
  const checkSize = size === "sm" ? "h-1.5 w-1.5" : "h-2.5 w-2.5";

  return (
    <div className={cn("flex items-center w-full max-w-[140px]", className)} aria-hidden>
      {Array.from({ length: required }).map((_, i) => {
        const done = i < filled;
        const lineDone = i < filled - 1;
        return (
          <Fragment key={i}>
            <span
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                dotSize,
                done
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-violet-200 bg-white dark:border-violet-800 dark:bg-slate-900"
              )}
            >
              {done ? <Check className={checkSize} strokeWidth={3} /> : null}
            </span>
            {i < required - 1 ? (
              <span
                className={cn(
                  "mx-0.5 h-0.5 flex-1 rounded-full min-w-[10px]",
                  lineDone ? "bg-violet-500" : "bg-violet-200/90 dark:bg-violet-900/50"
                )}
              />
            ) : null}
          </Fragment>
        );
      })}
    </div>
  );
}
