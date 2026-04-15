"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { PayoutEligibilityItem } from "@/lib/payoutProfileCompletion";

/** Same pattern as Wallet “Next steps” — tap-through list for payout/bonus setup. */
export function RemainingPayoutStepsList({
  items,
  className = "",
}: {
  items: PayoutEligibilityItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <div
      className={`rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/95 to-orange-50/40 ring-1 ring-amber-100 shadow-sm ${className}`}
    >
      <div className="border-b border-amber-200/60 px-4 py-3">
        <p className="text-sm font-semibold text-amber-950">Still to do</p>
        <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
          Finish payout setup: bank details, profile items, and UPI where needed. This unlocks withdrawals and your ₹100
          welcome bonus where eligible. Tap an item to continue.
        </p>
      </div>
      <ul className="p-3 space-y-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className="flex items-center justify-between gap-2 rounded-xl border border-amber-200/60 bg-white/80 px-3 py-2.5 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-white hover:border-amber-300"
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  !
                </span>
                <span className="truncate">{item.label}</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-amber-700/80" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
