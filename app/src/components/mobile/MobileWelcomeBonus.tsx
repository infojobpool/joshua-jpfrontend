"use client";

import React from "react";
import { Gift, Smartphone, UserCheck, Wallet } from "lucide-react";

/**
 * Mobile-only block: explains ₹100 welcome bonus (aligned with marketing; confirm backend rules match).
 */
export function MobileWelcomeBonus() {
  return (
    <section
      id="welcome-bonus"
      className="md:hidden scroll-mt-4 bg-slate-50 px-4 py-5 border-b border-slate-100"
      aria-labelledby="welcome-bonus-heading"
    >
      <div className="max-w-md mx-auto rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-white to-emerald-50/40 shadow-sm p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-sm shrink-0">
            <Gift className="h-6 w-6" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2 id="welcome-bonus-heading" className="text-lg font-extrabold text-slate-900 leading-tight">
              Welcome bonus: ₹100
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              For new users who finish onboarding in the app — credited to your{" "}
              <span className="font-semibold text-slate-800">JobPool wallet</span>.
            </p>
          </div>
        </div>

        <ol className="mt-4 space-y-3">
          <li className="flex gap-3 text-sm text-slate-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              1
            </span>
            <span className="flex gap-2 min-w-0">
              <Smartphone className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
              <span>
                <strong className="text-slate-800">Install</strong> the JobPool app on your phone.
              </span>
            </span>
          </li>
          <li className="flex gap-3 text-sm text-slate-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              2
            </span>
            <span className="flex gap-2 min-w-0">
              <UserCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
              <span>
                <strong className="text-slate-800">Sign up</strong> and complete account verification steps.
              </span>
            </span>
          </li>
          <li className="flex gap-3 text-sm text-slate-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              3
            </span>
            <span className="flex gap-2 min-w-0">
              <Wallet className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" aria-hidden />
              <span>
                <strong className="text-slate-800">Complete profile setup</strong> in the app. Bonus applies when
                requirements are met.
              </span>
            </span>
          </li>
        </ol>

        <p className="mt-4 text-[11px] leading-relaxed text-slate-500 border-t border-slate-200/80 pt-3">
          Eligibility: new accounts only; one welcome bonus per eligible user. Amount is credited to your in-app
          wallet when signup and profile completion criteria are satisfied. JobPool may change or end this offer;
          see app terms. T&amp;Cs apply.
        </p>
      </div>
    </section>
  );
}
