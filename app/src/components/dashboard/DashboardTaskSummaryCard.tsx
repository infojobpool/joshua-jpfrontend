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
  /** Tighter padding and vertical rhythm (e.g. available task list). */
  density?: "default" | "compact";
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
  density = "default",
}: DashboardTaskSummaryCardProps) {
  const compact = density === "compact";
  const pad = compact ? (isMobile ? "p-3" : "p-4") : isMobile ? "p-4" : "p-6";
  const defaultFooter = statusLabel || footerTrailing;
  const stackedPriceShare = Boolean(compact && share);

  const pricePill = (
    <span
      className={cn(
        "inline-flex items-center rounded-lg border border-blue-200/90 bg-gradient-to-b from-blue-50 via-white to-blue-50/30 font-bold tabular-nums text-blue-950 shadow-sm ring-1 ring-blue-600/10 dark:border-blue-800/60 dark:from-blue-950/50 dark:via-slate-900 dark:to-blue-950/30 dark:text-blue-100 dark:ring-blue-400/15",
        compact ? "px-2 py-1 text-sm" : "px-2.5 py-1.5 text-base md:text-lg",
        priceClassName,
      )}
    >
      {price}
    </span>
  );

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
        {!stackedPriceShare && share ? (
          <div
            className={cn(
              "absolute z-10 opacity-90 hover:opacity-100",
              compact ? "right-3 top-3 md:right-4 md:top-4" : "right-4 top-4 md:right-6 md:top-6",
            )}
          >
            {share}
          </div>
        ) : null}

        {stackedPriceShare ? (
          <>
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "task-title min-w-0 flex-1 text-balance leading-snug text-slate-900 dark:text-slate-100",
                  isMobile ? "text-[0.9375rem] font-semibold leading-tight" : "text-base font-semibold",
                  titleClassName,
                )}
              >
                {title}
              </h3>
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              {pricePill}
              <div className="shrink-0 opacity-95 hover:opacity-100 [&_button]:touch-manipulation">{share}</div>
            </div>
          </>
        ) : (
          <div className={cn("flex items-start justify-between", compact ? "gap-2 pr-9" : "gap-3 pr-10")}>
            <h3
              className={cn(
                "task-title min-w-0 flex-1 text-balance leading-snug text-slate-900 dark:text-slate-100",
                compact
                  ? isMobile
                    ? "text-[0.9375rem] font-semibold leading-tight"
                    : "text-base font-semibold"
                  : isMobile
                    ? "text-base font-semibold"
                    : "text-lg font-semibold md:text-xl",
                titleClassName,
              )}
            >
              {title}
            </h3>
            {pricePill}
          </div>
        )}

        {belowTitle ? <div className={compact ? "mt-1.5" : "mt-2"}>{belowTitle}</div> : null}

        {metaRows && metaRows.length > 0 ? (
          <div className={cn(compact ? "mt-2 space-y-1" : "mt-3 space-y-2")}>
            {metaRows.map((row) => (
              <div
                key={row.key}
                className={cn(
                  "flex items-start leading-snug text-slate-600 dark:text-slate-400",
                  compact ? "gap-2 text-[13px]" : "gap-2.5 text-sm",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 shrink-0 text-slate-400 dark:text-slate-500",
                    compact ? "[&_svg]:h-3.5 [&_svg]:w-3.5" : "[&_svg]:h-4 [&_svg]:w-4",
                  )}
                >
                  {row.icon}
                </span>
                <span className="min-w-0">{row.text}</span>
              </div>
            ))}
          </div>
        ) : null}

        {extra ? <div className={compact ? "mt-2" : "mt-3"}>{extra}</div> : null}

        {footer != null ? (
          <div
            className={cn(
              "border-t border-slate-100 dark:border-slate-700/60",
              compact ? "mt-2 pt-2" : "mt-4 pt-3",
            )}
          >
            {footer}
          </div>
        ) : defaultFooter ? (
          <div
            className={cn(
              "flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-700/60",
              compact ? "mt-2 pt-2" : "mt-4 gap-3 pt-3",
            )}
          >
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
              footer != null || defaultFooter
                ? compact
                  ? "mt-2 border-t border-slate-100 pt-2 dark:border-slate-700/60"
                  : "mt-4 border-t border-slate-100 pt-3 dark:border-slate-700/60"
                : compact
                  ? "mt-2"
                  : "mt-4",
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
