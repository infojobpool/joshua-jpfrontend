"use client";

import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TaskOfferCtaButtonProps = {
  /** User has already submitted an offer on this task. */
  hasOffer: boolean;
  className?: string;
};

/**
 * Dashboard / browse CTA: primary “Make an offer” vs outline “View my offer”.
 */
export function TaskOfferCtaButton({ hasOffer, className }: TaskOfferCtaButtonProps) {
  return (
    <Button
      type="button"
      variant={hasOffer ? "outline" : "default"}
      className={cn(
        "w-full gap-1.5 rounded-xl py-1.5 text-sm font-semibold sm:py-2",
        hasOffer
          ? "border-blue-600 bg-white text-blue-700 shadow-xs hover:bg-blue-50 dark:border-blue-500 dark:bg-slate-900 dark:text-blue-300 dark:hover:bg-blue-950/80"
          : "bg-blue-600 text-white hover:bg-blue-700",
        className,
      )}
    >
      {hasOffer ? (
        <>
          <Eye className="h-4 w-4 shrink-0" aria-hidden />
          View my offer
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          Make an offer
        </>
      )}
    </Button>
  );
}

export function TaskOfferSubmittedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800",
        className,
      )}
    >
      Offer submitted
    </span>
  );
}
