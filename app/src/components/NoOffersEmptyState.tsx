"use client";

import { IndianRupee, Loader2 } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center animate-fade-in-up">
      {isProcessing ? (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 shadow-inner ring-1 ring-blue-100 dark:bg-blue-950/50 dark:ring-blue-900/40">
          <Loader2
            className="h-10 w-10 text-blue-600 animate-spin dark:text-blue-400"
            strokeWidth={2}
            aria-hidden
          />
        </div>
      ) : (
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-blue-50 shadow-md ring-4 ring-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-blue-950/40 dark:ring-slate-800 animate-empty-state-float">
          <IndianRupee
            className="h-12 w-12 text-emerald-600 dark:text-emerald-400"
            strokeWidth={1.75}
            aria-hidden
          />
        </div>
      )}
      <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">{config.title}</h3>
      <p className="max-w-[280px] text-sm text-slate-600 dark:text-slate-400">{config.subtext}</p>
    </div>
  );
}
