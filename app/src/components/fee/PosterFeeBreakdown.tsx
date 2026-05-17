"use client";

import {
  POSTER_INCLUSIVE_FEE_NOTE,
  feeLinesForDisplay,
  formatInr,
  posterPayableAmount,
  posterTaskerNetAmount,
  type PosterFeeData,
} from "@/lib/feePreview";

type PosterFeeBreakdownProps = {
  data: PosterFeeData;
  bidFallback: number;
  /** Compact text for post-task review step */
  compact?: boolean;
};

export function PosterFeeBreakdown({ data, bidFallback, compact = false }: PosterFeeBreakdownProps) {
  const displayLines = feeLinesForDisplay(data.lines);
  const youPay = posterPayableAmount(data, bidFallback);
  const taskerNet = posterTaskerNetAmount(data);
  const noteClass = compact ? "text-slate-500" : "text-muted-foreground";
  const rowLabelClass = compact ? "text-slate-600" : "text-muted-foreground";
  const deductionClass = compact ? "text-slate-500" : "text-muted-foreground";

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
      <p className={`text-xs ${noteClass}`}>{POSTER_INCLUSIVE_FEE_NOTE}</p>
      {displayLines.length > 0 ? (
        displayLines.map((line, idx) => (
          <div key={line.id || `${line.label}-${idx}`} className="flex justify-between gap-2 text-sm">
            <span className={rowLabelClass}>{line.label}</span>
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
            <div className={`flex justify-between gap-2 text-sm ${deductionClass}`}>
              <span>Platform fee (from budget)</span>
              <span className="tabular-nums">{formatInr(Number(data.commission_amount ?? data.platform_fee ?? 0))}</span>
            </div>
          )}
          {data.gst_amount != null && (
            <div className={`flex justify-between gap-2 text-sm ${deductionClass}`}>
              <span>GST (from budget)</span>
              <span className="tabular-nums">{formatInr(Number(data.gst_amount))}</span>
            </div>
          )}
          {taskerNet != null && (
            <div className={`flex justify-between gap-2 text-sm ${deductionClass}`}>
              <span>Tasker receives (approx.)</span>
              <span className="tabular-nums">{formatInr(taskerNet)}</span>
            </div>
          )}
        </>
      )}
      {youPay != null && (
        <div
          className={`flex justify-between gap-2 font-semibold ${
            compact ? "mt-1 border-t border-slate-100 pt-1 text-slate-900" : "mt-3 border-t pt-3 text-base"
          }`}
        >
          <span>You pay</span>
          <span className={`tabular-nums ${compact ? "" : "text-green-600"}`}>{formatInr(youPay)}</span>
        </div>
      )}
    </div>
  );
}
