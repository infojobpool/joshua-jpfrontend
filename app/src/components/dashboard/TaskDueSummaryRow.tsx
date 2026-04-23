"use client";

import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLACEHOLDER_DUE_DISPLAY,
  daysLeftLabel,
  dueDisplayForListCard,
} from "@/lib/taskDueDisplay";

export function TaskDueSummaryRow({
  dueDate,
  dueDateFlexible,
  className,
}: {
  dueDate?: string;
  dueDateFlexible?: boolean;
  className?: string;
}) {
  const { display, showDaysBadge } = dueDisplayForListCard(dueDate, dueDateFlexible);
  const left = showDaysBadge && dueDate?.trim() ? daysLeftLabel(dueDate.trim()) : null;
  const isSoftCopy = display === PLACEHOLDER_DUE_DISPLAY || display === "Flexible";

  return (
    <div
      className={cn(
        "flex gap-1.5 border-t border-slate-100 pt-1.5 dark:border-slate-700/60",
        className,
      )}
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/40 sm:h-8 sm:w-8 sm:rounded-lg">
        <CalendarDays className="h-3 w-3 text-emerald-700 dark:text-emerald-400 sm:h-3.5 sm:w-3.5" aria-hidden />
      </div>
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            To be done
          </p>
          <p
            className={cn(
              "text-[13px] leading-tight sm:text-sm",
              isSoftCopy
                ? "font-medium text-slate-500 dark:text-slate-400"
                : "font-semibold text-slate-900 dark:text-slate-100",
            )}
          >
            {display}
          </p>
        </div>
        {left ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              left === "Past due"
                ? "bg-red-50 text-red-700 ring-1 ring-red-100 dark:bg-red-950/40 dark:text-red-300 dark:ring-red-900/50"
                : left === "Due today"
                  ? "bg-amber-50 text-amber-800 ring-1 ring-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-900/50"
                  : "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-900/50",
            )}
          >
            {left}
          </span>
        ) : null}
      </div>
    </div>
  );
}
