import axiosInstance from "@/lib/axiosInstance";

export type FeePreviewRole = "poster" | "tasker";

/** Poster checkout: fees are deducted from the task budget, not added on top. */
export const POSTER_INCLUSIVE_FEE_NOTE =
  "You pay the task budget only. Platform fee and GST are deducted from that amount, not added on top.";

/** Line item in the fee breakdown (`kind` may include `"total"` for a summary row). */
export interface FeeLine {
  id?: string;
  label: string;
  amount: number;
  kind?: string;
}

/** Poster-side fee preview (checkout / post-task estimate). */
export interface PosterFeeData {
  bid_amount?: number;
  platform_fee?: number;
  taxes?: number;
  commission_amount?: number;
  gst_amount?: number;
  payable_amount?: number;
  /** Approx. tasker payout after deductions from the task budget. */
  tasker_net_amount?: number;
  promo_fees_waived?: boolean;
  promo_waiver_amount?: number;
  lines?: FeeLine[];
  /** Legacy nested preview — prefer `tasker_net_amount`. */
  tasker_net_preview?: TaskerFeeData;
  [key: string]: unknown;
}

/** Tasker-side estimate (what you receive after deductions). No GST on tasker. */
export interface TaskerFeeData {
  bid_amount?: number;
  platform_fee?: number;
  /** Legacy — do not show on tasker UI. */
  reference_taxes?: number;
  commission_amount?: number;
  gst_amount?: number;
  estimated_net?: number;
  payable_amount?: number;
  promo_fees_waived?: boolean;
  promo_waiver_amount?: number;
  lines?: FeeLine[];
  [key: string]: unknown;
}

type FeePreviewApiEnvelope = {
  status_code?: number;
  message?: string;
  data?: PosterFeeData | TaskerFeeData;
};

/**
 * POST /fee-preview/ — single source of truth for fee math (matches backend fee_breakdown).
 */
export async function fetchFeePreview(
  bidAmount: number,
  role: FeePreviewRole,
): Promise<PosterFeeData | TaskerFeeData> {
  const { data: raw } = await axiosInstance.post<FeePreviewApiEnvelope | PosterFeeData | TaskerFeeData>(
    "/fee-preview/",
    { bid_amount: bidAmount, role },
  );

  const body = raw as FeePreviewApiEnvelope;
  if (body && typeof body === "object" && "status_code" in body) {
    if (body.status_code !== 200 || body.data == null) {
      throw new Error(body.message || "Unable to load fees");
    }
    return body.data;
  }

  return raw as PosterFeeData | TaskerFeeData;
}

export function formatInr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Non-total lines for display; total row often has kind === "total". */
export function feeLinesForDisplay(lines: FeeLine[] | undefined): FeeLine[] {
  if (!lines?.length) return [];
  return lines.filter((l) => (l.kind || "").toLowerCase() !== "total");
}

/** Tasker UI: hide GST / tax rows (tasker has platform fee only). */
export function taskerFeeLinesForDisplay(lines: FeeLine[] | undefined): FeeLine[] {
  return feeLinesForDisplay(lines).filter((l) => !/\bgst\b|tax/i.test(l.label));
}

export function feeTotalLine(lines: FeeLine[] | undefined): FeeLine | undefined {
  return lines?.find((l) => (l.kind || "").toLowerCase() === "total");
}

export function posterPayableAmount(d: PosterFeeData, bidFallback: number): number | undefined {
  const fromApi = d.payable_amount ?? feeTotalLine(d.lines)?.amount;
  if (fromApi != null && Number.isFinite(Number(fromApi))) return Number(fromApi);
  const bid = d.bid_amount ?? bidFallback;
  return bid > 0 ? bid : undefined;
}

export function posterTaskerNetAmount(d: PosterFeeData): number | undefined {
  if (d.tasker_net_amount != null && Number.isFinite(Number(d.tasker_net_amount))) {
    return Number(d.tasker_net_amount);
  }
  const nested = d.tasker_net_preview;
  if (nested?.estimated_net != null) return Number(nested.estimated_net);
  return undefined;
}

export function taskerEstimatedNet(d: TaskerFeeData, bidFallback: number): number {
  return Number(
    d.estimated_net ?? d.payable_amount ?? d.bid_amount ?? bidFallback,
  );
}

/** Build payment_description text from preview lines (poster). */
export function buildPaymentDescriptionFromPosterPreview(
  taskTitle: string,
  d: PosterFeeData,
): string {
  const parts = [`Payment for: ${taskTitle}`, "", POSTER_INCLUSIVE_FEE_NOTE, "", "Cost breakdown:"];
  const lines = d.lines?.length
    ? d.lines
    : [
        { label: "Task budget", amount: d.bid_amount ?? 0 },
        ...(d.commission_amount != null
          ? [{ label: "Platform fee (from budget)", amount: d.commission_amount }]
          : []),
        ...(d.gst_amount != null ? [{ label: "GST (from budget)", amount: d.gst_amount }] : []),
      ];
  for (const row of lines) {
    parts.push(`• ${row.label}: ${formatInr(Number(row.amount))}`);
  }
  const taskerNet = posterTaskerNetAmount(d);
  if (taskerNet != null) {
    parts.push(`• Tasker receives (approx.): ${formatInr(taskerNet)}`);
  }
  const youPay = posterPayableAmount(d, Number(d.bid_amount ?? 0));
  if (youPay != null) parts.push(`• You pay: ${formatInr(youPay)}`);
  return parts.join("\n");
}
