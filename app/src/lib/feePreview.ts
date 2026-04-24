import axiosInstance from "@/lib/axiosInstance";

export type FeePreviewRole = "poster" | "tasker";

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
  promo_fees_waived?: boolean;
  promo_waiver_amount?: number;
  lines?: FeeLine[];
  /** When role is poster, backend may include a nested tasker net estimate. */
  tasker_net_preview?: TaskerFeeData;
  [key: string]: unknown;
}

/** Tasker-side estimate (what you receive after deductions). */
export interface TaskerFeeData {
  bid_amount?: number;
  platform_fee?: number;
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

export function feeTotalLine(lines: FeeLine[] | undefined): FeeLine | undefined {
  return lines?.find((l) => (l.kind || "").toLowerCase() === "total");
}

/** Build payment_description text from preview lines (poster). */
export function buildPaymentDescriptionFromPosterPreview(
  taskTitle: string,
  d: PosterFeeData,
): string {
  const parts = [`Payment for: ${taskTitle}`, "", "Cost breakdown:"];
  const lines = d.lines?.length
    ? d.lines
    : [
        { label: "Bid amount", amount: d.bid_amount ?? 0 },
        ...(d.commission_amount != null
          ? [{ label: "Platform / commission", amount: d.commission_amount }]
          : []),
        ...(d.gst_amount != null ? [{ label: "Taxes (GST)", amount: d.gst_amount }] : []),
      ];
  for (const row of lines) {
    parts.push(`• ${row.label}: ${formatInr(Number(row.amount))}`);
  }
  const total = d.payable_amount ?? feeTotalLine(d.lines)?.amount;
  if (total != null) parts.push(`• Total: ${formatInr(Number(total))}`);
  return parts.join("\n");
}
