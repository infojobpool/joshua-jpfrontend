"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";

interface NoOffersEmptyStateProps {
  /** poster = task owner waiting for offers; tasker = can make first offer; processing = offer submitted */
  variant: "poster" | "tasker" | "processing";
}

export function NoOffersEmptyState({ variant }: NoOffersEmptyStateProps) {
  const isPoster = variant === "poster";
  const isProcessing = variant === "processing";

  const config = isProcessing
    ? {
        title: "Your offer is being processed",
        subtext: "The task owner will review your offer soon. You'll be notified when they respond.",
      }
    : isPoster
      ? {
          title: "No offers yet",
          subtext: "Taskers are reviewing your task. Share it to get more offers!",
        }
      : {
          title: "No offers submitted yet",
          subtext: "Make the first offer and get ahead of the competition!",
        };

  return (
    <div className="flex flex-col items-center justify-center px-3 py-4 text-center animate-fade-in-up md:px-4 md:py-5">
      {isProcessing ? (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 shadow-inner ring-1 ring-blue-100 dark:bg-blue-950/50 dark:ring-blue-900/40">
          <Loader2
            className="h-7 w-7 text-blue-600 animate-spin dark:text-blue-400"
            strokeWidth={2}
            aria-hidden
          />
        </div>
      ) : (
        <div className="mb-3 flex w-full max-w-[200px] justify-center animate-empty-state-float sm:max-w-[220px]">
          <Image
            src="/images/empty-offers-illustration.png"
            alt=""
            width={220}
            height={100}
            className="h-[68px] w-auto max-h-[72px] object-contain object-center sm:h-[76px] sm:max-h-[80px]"
            sizes="(max-width: 640px) 200px, 220px"
          />
        </div>
      )}
      <h3 className="mb-0.5 text-base font-bold leading-snug text-slate-900 dark:text-slate-100 md:text-lg">
        {config.title}
      </h3>
      <p className="max-w-[280px] text-xs leading-snug text-slate-600 dark:text-slate-400 md:text-sm">
        {config.subtext}
      </p>
    </div>
  );
}
