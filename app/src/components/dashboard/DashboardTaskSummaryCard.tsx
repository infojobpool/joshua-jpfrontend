"use client";

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Shared shell: browse-style depth, consistent across dashboard tabs. */
export const dashboardTaskSummaryShell =
  "group flex h-full min-h-0 flex-col bg-white dark:bg-slate-800/95 border border-slate-200/60 dark:border-slate-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_6px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06),0_12px_24px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.25),0_12px_24px_rgba(0,0,0,0.35)] hover:-translate-y-0.5 transition-all duration-300 rounded-2xl overflow-hidden";

export type DashboardTaskCardAccent = "none" | "blue" | "emerald" | "amber" | "rose";

const accentClass: Record<DashboardTaskCardAccent, string> = {
  none: "",
  blue: "border-l-[3px] border-l-blue-500 dark:border-l-blue-400",
  emerald: "border-l-[3px] border-l-emerald-500 dark:border-l-emerald-400",
  amber: "border-l-[3px] border-l-amber-500 dark:border-l-amber-400",
  rose: "border-l-[3px] border-l-rose-500 dark:border-l-rose-400",
};

export type DashboardTaskSummaryStatusTone = "open" | "progress" | "success" | "warning" | "danger" | "neutral";

function defaultStatusClass(tone: DashboardTaskSummaryStatusTone): string {
  switch (tone) {
    case "open":
      return "text-[#2563eb] dark:text-blue-400 font-semibold text-sm";
    case "progress":
      return "text-blue-600 dark:text-blue-400 font-semibold text-sm";
    case "success":
      return "text-emerald-600 dark:text-emerald-400 font-semibold text-sm";
    case "warning":
      return "text-amber-700 dark:text-amber-400 font-semibold text-sm";
    case "danger":
      return "text-red-600 dark:text-red-400 font-semibold text-sm";
    default:
      return "text-slate-600 dark:text-slate-400 text-sm font-medium";
  }
}

export type DashboardTaskMetaRow = {
  key: string;
  icon: ReactNode;
  text: string;
};

export type DashboardTaskSummaryCardProps = {
  title: string;
  titleClassName?: string;
  price: string;
  priceClassName?: string;
  accent?: DashboardTaskCardAccent;
  className?: string;
  bodyClassName?: string;
  /** Full-width blocks inside the card above the padded body (banners, alerts). */
  lead?: ReactNode;
  /** Thin progress strip along the top of the padded body (assigned active). */
  showTopProgressBar?: boolean;
  share?: ReactNode;
  /** Thumbnails, badge rows, etc. directly under the title/price row. */
  belowTitle?: ReactNode;
  metaRows?: DashboardTaskMetaRow[];
  /** Maps, cancellation copy, “waiting for…” callouts — between meta and footer. */
  extra?: ReactNode;
  /** When set, replaces the default status + trailing footer row. */
  footer?: ReactNode;
  statusLabel?: string;
  statusTone?: DashboardTaskSummaryStatusTone;
  statusClassName?: string;
  footerTrailing?: ReactNode;
  actions?: ReactNode;
  actionsWrapperClassName?: string;
  isMobile: boolean;
};

export function DashboardTaskSummaryCard({
  title,
  titleClassName,
  price,
  priceClassName,
  accent = "none",
  className,
  bodyClassName,
  lead,
  showTopProgressBar,
  share,
  belowTitle,
  metaRows,
  extra,
  footer,
  statusLabel,
  statusTone = "neutral",
  statusClassName,
  footerTrailing,
  actions,
  actionsWrapperClassName,
  isMobile,
}: DashboardTaskSummaryCardProps) {
  const pad = isMobile ? "p-4" : "p-6";
  const defaultFooter = statusLabel || footerTrailing;

  return (
    <Card className={cn(dashboardTaskSummaryShell, accentClass[accent], className)}>
      {lead}
      <div className={cn("relative flex min-h-0 flex-1 flex-col", pad, bodyClassName)}>
        {showTopProgressBar ? (
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600"
            aria-hidden
          />
        ) : null}
        {share ? (
          <div className="absolute right-4 top-4 z-10 opacity-90 hover:opacity-100 md:right-6 md:top-6">{share}</div>
        ) : null}

        <div className="flex items-start justify-between gap-3 pr-10">
          <h3
            className={cn(
              "task-title min-w-0 flex-1 text-balance leading-snug text-slate-900 dark:text-slate-100",
              isMobile ? "text-base font-semibold" : "text-lg font-semibold md:text-xl",
              titleClassName,
            )}
          >
            {title}
          </h3>
          <span
            className={cn(
              "shrink-0 text-right text-base font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-100 md:text-lg",
              priceClassName,
            )}
          >
            {price}
          </span>
        </div>

        {belowTitle ? <div className="mt-2">{belowTitle}</div> : null}

        {metaRows && metaRows.length > 0 ? (
          <div className="mt-3 space-y-2">
            {metaRows.map((row) => (
              <div
                key={row.key}
                className="flex items-start gap-2.5 text-sm leading-snug text-slate-600 dark:text-slate-400"
              >
                <span className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500 [&_svg]:h-4 [&_svg]:w-4">
                  {row.icon}
                </span>
                <span className="min-w-0">{row.text}</span>
              </div>
            ))}
          </div>
        ) : null}

        {extra ? <div className="mt-3">{extra}</div> : null}

        {footer != null ? (
          <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-700/60">{footer}</div>
        ) : defaultFooter ? (
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-700/60">
            {statusLabel ? (
              <span className={cn("min-w-0", statusClassName ?? defaultStatusClass(statusTone))}>{statusLabel}</span>
            ) : (
              <span />
            )}
            {footerTrailing ? <div className="flex shrink-0 items-center gap-2">{footerTrailing}</div> : null}
          </div>
        ) : null}

        {actions ? (
          <div
            className={cn(
              "flex flex-wrap gap-2",
              footer != null || defaultFooter ? "mt-4 border-t border-slate-100 pt-3 dark:border-slate-700/60" : "mt-4",
              actionsWrapperClassName,
            )}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
