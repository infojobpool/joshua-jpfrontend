"use client";

import {
  feeLineDisplayLabel,
  formatInr,
  taskerEstimatedNet,
  taskerFeeLinesForDisplay,
  type TaskerFeeData,
} from "@/lib/feePreview";

type TaskerFeeBreakdownProps = {
  data: TaskerFeeData;
  bidFallback: number;
};

export function TaskerFeeBreakdown({ data, bidFallback }: TaskerFeeBreakdownProps) {
  const displayLines = taskerFeeLinesForDisplay(data.lines);
  const estimatedNet = taskerEstimatedNet(data, bidFallback);

  if (data.promo_fees_waived) {
    return (
      <div className="space-y-2">
        {displayLines.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            {displayLines.map((line, idx) => (
              <div key={line.id || `${line.label}-${idx}`} className="flex justify-between gap-2">
                <span className="text-slate-600">{feeLineDisplayLabel(line)}</span>
                <span className="font-medium tabular-nums text-slate-900">{formatInr(Number(line.amount))}</span>
              </div>
            ))}
          </div>
        ) : null}
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
          Promo active: platform fees are waived — you receive the full bid amount shown above.
        </p>
        <div className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/60 px-3 py-2 text-sm font-semibold text-emerald-950">
          <span>You receive (est.)</span>
          <span className="tabular-nums text-emerald-800">{formatInr(estimatedNet)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      {displayLines.length > 0 ? (
        displayLines.map((line, idx) => (
          <div key={line.id || `${line.label}-${idx}`} className="flex justify-between gap-2">
            <span className="text-slate-600">{feeLineDisplayLabel(line)}</span>
            <span className="font-medium tabular-nums text-slate-900">{formatInr(Number(line.amount))}</span>
          </div>
        ))
      ) : (
        <>
          {data.platform_fee != null && (
            <div className="flex justify-between gap-2 text-slate-600">
              <span>Platform fee</span>
              <span className="tabular-nums">{formatInr(Number(data.platform_fee))}</span>
            </div>
          )}
          {(data.gst_amount != null || data.reference_taxes != null) && (
            <div className="flex justify-between gap-2 text-slate-600">
              <span>GST on platform fee</span>
              <span className="tabular-nums">
                {formatInr(Number(data.gst_amount ?? data.reference_taxes ?? 0))}
              </span>
            </div>
          )}
        </>
      )}
      <div className="flex items-center justify-between border-t border-green-100 bg-green-50/80 px-2 py-2 text-base font-bold">
        <span className="text-gray-800">You receive (est.)</span>
        <span className="tabular-nums text-green-600">{formatInr(estimatedNet)}</span>
      </div>
    </div>
  );
}
