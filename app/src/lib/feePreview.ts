import axiosInstance from "@/lib/axiosInstance";

export type FeePreviewRole = "poster" | "tasker";

/** Taskmaster checkout: platform fee + GST are added on top of the task budget. */
export const POSTER_FEES_ON_TOP_NOTE =
  "Platform fee and GST on that fee are added at checkout. Your total payment is shown below.";

/** @deprecated Use POSTER_FEES_ON_TOP_NOTE — kept for imports that may still reference the old name. */
export const POSTER_INCLUSIVE_FEE_NOTE = POSTER_FEES_ON_TOP_NOTE;

/** Line item in the fee breakdown (`kind` may include `"total"` for a summary row). */
export interface FeeLine {
  id?: string;
  label: string;
  amount: number;
  kind?: string;
}

/** Poster-side fee preview (checkout / post-task estimate). */
export interface PosterFeeData {
  role?: "poster";
  bid_amount?: number;
  platform_fee?: number;
  taxes?: number;
  commission_amount?: number;
  gst_amount?: number;
  payable_amount?: number;
  /** Razorpay total — task budget + platform fee + GST when fees_on_top. */
  fees_on_top?: boolean;
  /** Approx. tasker payout after tasker-side deductions from the bid. */
  tasker_net_amount?: number;
  promo_fees_waived?: boolean;
  promo_waiver_amount?: number;
  lines?: FeeLine[];
  tasker_net_preview?: TaskerFeeData;
  [key: string]: unknown;
}

/** Tasker-side estimate: platform fee + GST on fee deducted from the bid. */
export interface TaskerFeeData {
  role?: "tasker";
  bid_amount?: number;
  platform_fee?: number;
  platform_fee_rate?: number;
  gst_rate?: number;
  /** GST on platform fee (mirrors `gst_amount` when both are returned). */
  reference_taxes?: number;
  commission_amount?: number;
  gst_amount?: number;
  estimated_net?: number;
  payable_amount?: number;
  fees_deducted_from_bid?: boolean;
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

/** Tasker UI: API deduction lines only (net/total row is shown in the footer). */
export function taskerFeeLinesForDisplay(lines: FeeLine[] | undefined): FeeLine[] {
  return feeLinesForDisplay(lines).filter((l) => {
    const id = (l.id || "").toLowerCase();
    const kind = (l.kind || "").toLowerCase();
    if (kind === "total") return false;
    if (id === "net") return false;
    if (/estimated you receive|you receive/i.test(l.label)) return false;
    return true;
  });
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
  const note = d.promo_fees_waived
    ? "Promo active: fees waived — you pay the task budget only."
    : POSTER_FEES_ON_TOP_NOTE;
  const parts = [`Payment for: ${taskTitle}`, "", note, "", "Cost breakdown:"];
  const lines = d.lines?.length
    ? d.lines
    : [
        { label: "Task budget", amount: d.bid_amount ?? 0 },
        ...(d.commission_amount != null || d.platform_fee != null
          ? [{ label: "Platform fee", amount: Number(d.commission_amount ?? d.platform_fee ?? 0) }]
          : []),
        ...(d.gst_amount != null || d.taxes != null
          ? [{ label: "GST on platform fee", amount: Number(d.gst_amount ?? d.taxes ?? 0) }]
          : []),
      ];
  for (const row of lines) {
    if ((row.kind || "").toLowerCase() === "total") continue;
    parts.push(`• ${row.label}: ${formatInr(Number(row.amount))}`);
  }
  const taskerNet = posterTaskerNetAmount(d);
  if (taskerNet != null) {
    parts.push(`• Tasker receives (approx.): ${formatInr(taskerNet)}`);
  }
  const total = posterPayableAmount(d, Number(d.bid_amount ?? 0));
  if (total != null) parts.push(`• Total to pay: ${formatInr(total)}`);
  return parts.join("\n");
}
