"use client";

import { formatInr, taskerEstimatedNet, type TaskerFeeData } from "@/lib/feePreview";

/** Confirm-bid modal — uses top-level API fields only (no `lines` parsing). */
export function SimpleTaskerFeeSummary({
  data,
  bidAmount,
}: {
  data: TaskerFeeData;
  bidAmount: number;
}) {
  if (!data || typeof data !== "object") {
    return (
      <p className="text-sm text-muted-foreground">
        Fee estimate unavailable. You can still submit your bid.
      </p>
    );
  }

  if (data.promo_fees_waived) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
        Promo active: platform fees are waived — you receive the full bid amount.
      </p>
    );
  }

  const platformFee = Number(data.platform_fee ?? data.commission_amount ?? NaN);
  const gst = Number(data.gst_amount ?? data.reference_taxes ?? NaN);
  const net = taskerEstimatedNet(data, bidAmount);

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      {Number.isFinite(platformFee) && platformFee > 0 ? (
        <div className="flex justify-between gap-2 text-slate-600">
          <span>Platform fee</span>
          <span className="tabular-nums font-medium text-slate-900">{formatInr(platformFee)}</span>
        </div>
      ) : null}
      {Number.isFinite(gst) && gst > 0 ? (
        <div className="flex justify-between gap-2 text-slate-600">
          <span>GST on platform fee</span>
          <span className="tabular-nums font-medium text-slate-900">{formatInr(gst)}</span>
        </div>
      ) : null}
      <div className="flex items-center justify-between border-t border-green-100 bg-green-50/80 px-2 py-2 text-base font-bold">
        <span className="text-gray-800">You receive (est.)</span>
        <span className="tabular-nums text-green-600">{formatInr(net)}</span>
      </div>
    </div>
  );
}
