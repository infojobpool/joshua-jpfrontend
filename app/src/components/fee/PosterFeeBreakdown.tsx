"use client";

import {
  POSTER_FEES_ON_TOP_NOTE,
  feeLineDisplayLabel,
  formatInr,
  posterFeeLinesForDisplay,
  posterPayableAmount,
  type PosterFeeData,
} from "@/lib/feePreview";

type PosterFeeBreakdownProps = {
  data: PosterFeeData;
  bidFallback: number;
  /** Compact text for post-task review step */
  compact?: boolean;
};

export function PosterFeeBreakdown({ data, bidFallback, compact = false }: PosterFeeBreakdownProps) {
  const displayLines = posterFeeLinesForDisplay(data.lines);
  const totalToPay = posterPayableAmount(data, bidFallback);
  const noteClass = compact ? "text-slate-500" : "text-muted-foreground";
  const rowLabelClass = compact ? "text-slate-600" : "text-muted-foreground";
  const extraClass = compact ? "text-slate-500" : "text-muted-foreground";

  if (data.promo_fees_waived) {
    return (
      <p
        className={
          compact
            ? "text-emerald-800"
            : "rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900"
        }
      >
        Fees and taxes are waived — you pay the task budget only (
        {formatInr(Number(data.bid_amount ?? bidFallback))}).
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className={`text-xs ${noteClass}`}>{POSTER_FEES_ON_TOP_NOTE}</p>
      {displayLines.length > 0 ? (
        displayLines.map((line, idx) => (
          <div key={line.id || `${line.label}-${idx}`} className="flex justify-between gap-2 text-sm">
            <span className={rowLabelClass}>{feeLineDisplayLabel(line)}</span>
            <span className="font-medium tabular-nums">{formatInr(Number(line.amount))}</span>
          </div>
        ))
      ) : (
        <>
          <div className="flex justify-between gap-2 text-sm">
            <span className={rowLabelClass}>Task budget</span>
            <span className="font-medium tabular-nums">{formatInr(Number(data.bid_amount ?? bidFallback))}</span>
          </div>
          {(data.commission_amount != null || data.platform_fee != null) && (
            <div className={`flex justify-between gap-2 text-sm ${extraClass}`}>
              <span>Platform fee</span>
              <span className="tabular-nums">{formatInr(Number(data.commission_amount ?? data.platform_fee ?? 0))}</span>
            </div>
          )}
          {(data.gst_amount != null || data.taxes != null) && (
            <div className={`flex justify-between gap-2 text-sm ${extraClass}`}>
              <span>GST on platform fee</span>
              <span className="tabular-nums">{formatInr(Number(data.gst_amount ?? data.taxes ?? 0))}</span>
            </div>
          )}
        </>
      )}
      {totalToPay != null && (
        <div
          className={`flex justify-between gap-2 font-semibold ${
            compact ? "mt-1 border-t border-slate-100 pt-1 text-slate-900" : "mt-3 border-t pt-3 text-base"
          }`}
        >
          <span>Total to pay</span>
          <span className={`tabular-nums ${compact ? "" : "text-green-600"}`}>{formatInr(totalToPay)}</span>
        </div>
      )}
    </div>
  );
}
