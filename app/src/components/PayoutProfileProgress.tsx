"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function PayoutProfileProgress({
  percent,
  completed,
  total,
  remaining,
  variant = "dashboard",
  className,
}: {
  percent: number;
  completed: number;
  total: number;
  remaining: number;
  variant?: "dashboard" | "wallet";
  className?: string;
}) {
  if (remaining === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3.5 shadow-sm",
        "border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900/50 dark:to-slate-950/30 dark:border-slate-800",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.14em]",
            "text-slate-500 dark:text-slate-400"
          )}
        >
          {variant === "wallet" ? "Payout setup" : "Wallet readiness"}
        </p>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            "text-slate-900 dark:text-slate-100"
          )}
        >
          {percent}%
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-800">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500 ease-out",
            "bg-gradient-to-r from-slate-700 via-emerald-600 to-teal-500 dark:from-slate-500 dark:via-emerald-500"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {completed} of {total}
        </span>{" "}
        complete
        {" "}
        · <span className="text-slate-700 dark:text-slate-300">{remaining} left</span>
      </p>
      {variant === "dashboard" && (
        <Link
          href="/wallet"
          className="mt-3 inline-flex items-center gap-0.5 text-xs font-medium text-emerald-700 transition hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          Finish in Wallet
          <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
