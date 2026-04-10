"use client";

import React, { useCallback, useEffect, useId, useState } from "react";
import Image from "next/image";
import { ChevronDown, Smartphone, UserCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePayoutSetupIncomplete } from "@/hooks/usePayoutSetupIncomplete";

function WelcomeBonusCardSkeleton() {
  return (
    <section
      className="md:hidden scroll-mt-4 bg-slate-100 px-4 pt-1 pb-3"
      aria-busy="true"
      aria-label="Loading welcome offer"
    >
      <div className="max-w-md mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-2.5 pt-3 pb-1">
          <div className="relative w-full aspect-[512/341] overflow-hidden rounded-3xl bg-slate-200/80 animate-pulse" />
        </div>
        <div className="px-4 pt-3 pb-4 space-y-3">
          <div className="h-4 w-48 rounded-md bg-slate-200/90 animate-pulse" />
          <div className="h-3 w-full max-w-[18rem] rounded-md bg-slate-100 animate-pulse" />
          <div className="h-3 w-full max-w-[14rem] rounded-md bg-slate-100 animate-pulse" />
          <div className="mt-4 h-11 w-full rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    </section>
  );
}

/**
 * Mobile-only: minimal ₹100 welcome bonus card with expand/collapse (hash #welcome-bonus opens it).
 */
export function MobileWelcomeBonus() {
  const { ready, incomplete, awaitingEligibility } = usePayoutSetupIncomplete();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const headerId = useId();

  const syncHash = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#welcome-bonus") setOpen(true);
  }, []);

  useEffect(() => {
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [syncHash]);

  if (awaitingEligibility) {
    return <WelcomeBonusCardSkeleton />;
  }

  // Only mount the banner (and image) once eligibility is known. Showing while
  // `ready` is false caused a flash: complete users briefly saw the image, then it vanished.
  if (!ready || !incomplete) {
    return null;
  }

  return (
    <section
      id="welcome-bonus"
      className="md:hidden scroll-mt-4 bg-slate-100 px-4 pt-1 pb-3 animate-in fade-in duration-300"
      aria-labelledby={headerId}
    >
      <div className="max-w-md mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-2.5 pt-3 pb-1">
          <div className="relative w-full aspect-[512/341] overflow-hidden rounded-3xl bg-[#e3f2fb] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
            <Image
              src="/images/welcome-bonus-banner.png"
              alt="JobPool ₹100 welcome bonus — install the app, sign up, claim your bonus."
              fill
              className="object-cover object-center"
              sizes="(max-width: 768px) 100vw, 448px"
            />
          </div>
        </div>

        <div className="px-4 pt-3 pb-4">
        <div className="min-w-0">
          <h2 id={headerId} className="text-base font-bold text-slate-900 tracking-tight">
            Welcome bonus · ₹100
          </h2>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            For new users — credited to your{" "}
            <span className="font-semibold text-slate-700">JobPool wallet</span> after signup and profile in the app.
          </p>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <span className="text-sm font-semibold text-blue-600">How it works</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-300 ease-out",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </button>

        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          )}
        >
          <div id={panelId} aria-hidden={!open} className="min-h-0 overflow-hidden">
            <div className="pt-4 space-y-0 border-t border-slate-100 mt-3">
              <div className="flex gap-3 py-3 border-b border-slate-100 last:border-b-0">
                <Smartphone className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" strokeWidth={1.75} aria-hidden />
                <p className="text-sm text-slate-700 leading-snug">
                  <span className="font-semibold text-slate-900">Install</span> the JobPool app on your phone.
                </p>
              </div>
              <div className="flex gap-3 py-3 border-b border-slate-100 last:border-b-0">
                <UserCheck className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" strokeWidth={1.75} aria-hidden />
                <p className="text-sm text-slate-700 leading-snug">
                  <span className="font-semibold text-slate-900">Sign up</span> and complete verification.
                </p>
              </div>
              <div className="flex gap-3 py-3">
                <Wallet className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" strokeWidth={1.75} aria-hidden />
                <p className="text-sm text-slate-700 leading-snug">
                  <span className="font-semibold text-slate-900">Complete your profile</span> in the app. Bonus when
                  requirements are met.
                </p>
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500 pb-0.5">
              Eligibility: new accounts only; one welcome bonus per eligible user. Credited when criteria are satisfied.
              JobPool may change or end this offer. T&amp;Cs apply.
            </p>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
