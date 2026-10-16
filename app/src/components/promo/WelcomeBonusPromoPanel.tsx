"use client";

import Link from "next/link";
import { Smartphone, UserCheck, Wallet } from "lucide-react";
import { WelcomeBonusPromoArt } from "./WelcomeBonusPromoArt";

type Props = {
  showSteps?: boolean;
};

/** Full promo panel for popup (no ₹100 image assets). */
export function WelcomeBonusPromoPanel({ showSteps = true }: Props) {
  return (
    <div className="bg-white dark:bg-slate-950">
      <WelcomeBonusPromoArt variant="popup" />
      <div className="px-6 py-5 space-y-4">
        {showSteps ? (
          <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
            <li className="flex gap-3">
              <Smartphone className="h-4 w-4 shrink-0 text-violet-600 mt-0.5" aria-hidden />
              <span>
                <strong className="text-slate-900 dark:text-white">Install</strong> or open JobPool on your phone.
              </span>
            </li>
            <li className="flex gap-3">
              <UserCheck className="h-4 w-4 shrink-0 text-violet-600 mt-0.5" aria-hidden />
              <span>
                <strong className="text-slate-900 dark:text-white">Sign up</strong> and complete verification.
              </span>
            </li>
            <li className="flex gap-3">
              <Wallet className="h-4 w-4 shrink-0 text-violet-600 mt-0.5" aria-hidden />
              <span>
                <strong className="text-slate-900 dark:text-white">Finish payout setup</strong> — bonus credits when
                eligible.
              </span>
            </li>
          </ol>
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-violet-600 text-sm font-semibold text-white shadow-md hover:bg-violet-700 transition-colors"
          >
            Get started
          </Link>
          <Link
            href="/wallet"
            className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            Wallet setup
          </Link>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          New eligible accounts only. One welcome bonus per user. T&amp;Cs apply.
        </p>
      </div>
    </div>
  );
}
