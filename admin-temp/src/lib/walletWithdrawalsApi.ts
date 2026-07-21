import axiosInstance from "@/lib/axiosInstance";

export type WithdrawalStatusFilter = "all" | "pending" | "in_process" | "completed" | "failed";

export interface AdminWithdrawal {
  id?: string | number;
  transaction_id?: string | number;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  amount: number;
  upi_vpa?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  note?: string;
  admin_note?: string;
  utr_reference?: string;
  paid_at?: string;
  payment_remark?: string;
}

/** Map backend status strings/numbers onto admin filter buckets. */
export function normalizeWithdrawalStatus(statusRaw?: string): WithdrawalStatusFilter {
  const s = (statusRaw || "pending")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .trim();
  if (s === "in_process" || s === "processing" || s === "processed" || s === "in_progress") {
    return "in_process";
  }
  if (
    s === "completed" ||
    s === "complete" ||
    s === "success" ||
    s === "paid" ||
    s === "done" ||
    s === "credited" ||
    s === "2"
  ) {
    return "completed";
  }
  if (s === "failed" || s === "failure" || s === "rejected" || s === "cancelled" || s === "3") {
    return "failed";
  }
  if (s === "1") return "in_process";
  return "pending";
}

function coerceWithdrawalStatus(raw: Record<string, unknown>): string {
  const keys = [
    "transaction_status",
    "payment_status",
    "withdrawal_status",
    "status",
    "tx_status",
  ] as const;
  for (const key of keys) {
    const val = raw[key];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (typeof val === "number" && Number.isFinite(val)) {
      if (val === 0) return "pending";
      if (val === 1) return "in_process";
      if (val === 2) return "completed";
      if (val === 3) return "failed";
      return String(val);
    }
  }
  const paidAt = raw.paid_at ?? raw.paidAt;
  const utr = raw.utr_reference ?? raw.utr;
  if (
    (typeof paidAt === "string" && paidAt.trim()) ||
    (typeof utr === "string" && utr.trim())
  ) {
    return "completed";
  }
  return "pending";
}

export function normalizeWithdrawal(raw: Record<string, unknown>): AdminWithdrawal | null {
  if (!raw || typeof raw !== "object") return null;
  const amountRaw = raw.amount ?? raw.withdrawal_amount;
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : typeof amountRaw === "string"
        ? parseFloat(amountRaw)
        : NaN;
  if (Number.isNaN(amount)) return null;
  return {
    id: raw.id as string | number | undefined,
    transaction_id: (raw.transaction_id ?? raw.tx_id) as string | number | undefined,
    user_id: raw.user_id as string | undefined,
    user_name: (raw.user_name ?? raw.name) as string | undefined,
    user_email: (raw.user_email ?? raw.email) as string | undefined,
    amount,
    upi_vpa: (raw.upi_vpa ?? raw.upi) as string | undefined,
    status: coerceWithdrawalStatus(raw),
    created_at: (raw.created_at ?? raw.createdAt) as string | undefined,
    updated_at: (raw.updated_at ?? raw.updatedAt) as string | undefined,
    note: (raw.note ?? raw.notes) as string | undefined,
    admin_note: raw.admin_note as string | undefined,
    utr_reference: raw.utr_reference as string | undefined,
    paid_at: (raw.paid_at ?? raw.paidAt) as string | undefined,
    payment_remark: raw.payment_remark as string | undefined,
  };
}

export function extractWithdrawalsList(payload: unknown): AdminWithdrawal[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const candidates = [
    data.withdrawals,
    data.items,
    data.results,
    data.records,
    root.withdrawals,
    Array.isArray(data) ? data : null,
    Array.isArray(root) ? root : null,
  ];
  for (const c of candidates) {
    if (!Array.isArray(c)) continue;
    const out: AdminWithdrawal[] = [];
    for (const item of c) {
      if (!item || typeof item !== "object") continue;
      const w = normalizeWithdrawal(item as Record<string, unknown>);
      if (w) out.push(w);
    }
    if (out.length) return out;
  }
  return [];
}

function withdrawalKey(w: AdminWithdrawal): string {
  return String(w.transaction_id ?? w.id ?? "").trim();
}

function mergeWithdrawalLists(lists: AdminWithdrawal[][]): AdminWithdrawal[] {
  const byId = new Map<string, AdminWithdrawal>();
  for (const list of lists) {
    for (const w of list) {
      const key = withdrawalKey(w);
      if (!key) continue;
      byId.set(key, w);
    }
  }
  return [...byId.values()].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });
}

function listHasNonPending(rows: AdminWithdrawal[]): boolean {
  return rows.some((w) => normalizeWithdrawalStatus(w.status) !== "pending");
}

/**
 * Backend historically returned all statuses; some deploys only return pending unless
 * `include_all=true` (or similar) is passed — try those variants and keep the richest list.
 */
export async function fetchAdminWithdrawals(): Promise<AdminWithdrawal[]> {
  const paths = ["/admin/wallet/withdrawals/", "/admin/wallet/withdrawals"];
  const paramVariants: Record<string, string>[] = [
    { include_all: "true" },
    { all_statuses: "true" },
    { status: "all" },
    {},
  ];

  let best: AdminWithdrawal[] = [];
  let lastErr: unknown;

  for (const path of paths) {
    for (const params of paramVariants) {
      try {
        const response = await axiosInstance.get(path, { params });
        const wrapped = response.data?.data ?? response.data;
        const list = extractWithdrawalsList(wrapped ?? response.data);
        if (list.length > best.length) best = list;
        if (listHasNonPending(list)) return list;
      } catch (err) {
        lastErr = err;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 404) throw err;
      }
    }
  }

  if (best.length) return best;
  throw lastErr ?? new Error("Failed to load withdrawals");
}

export function indexWithdrawalsByUserId(
  withdrawals: AdminWithdrawal[]
): Map<string, AdminWithdrawal[]> {
  const map = new Map<string, AdminWithdrawal[]>();
  for (const w of withdrawals) {
    const uid = String(w.user_id ?? "").trim();
    if (!uid) continue;
    const list = map.get(uid) ?? [];
    list.push(w);
    map.set(uid, list);
  }
  return map;
}

export function pickLatestWithdrawal(withdrawals: AdminWithdrawal[]): AdminWithdrawal | null {
  if (!withdrawals.length) return null;
  return [...withdrawals].sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  })[0];
}

export function withdrawalStatusLabel(statusRaw?: string): string {
  const key = normalizeWithdrawalStatus(statusRaw);
  if (key === "in_process") return "In process";
  if (key === "completed") return "Completed";
  if (key === "failed") return "Failed";
  return "Pending";
}

/** True when every row is pending — often means API returned pending-only queue. */
export function withdrawalsLookPendingOnly(withdrawals: AdminWithdrawal[]): boolean {
  if (!withdrawals.length) return false;
  return withdrawals.every((w) => normalizeWithdrawalStatus(w.status) === "pending");
}
