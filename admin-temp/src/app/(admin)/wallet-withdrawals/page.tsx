"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Wallet,
  Check,
  X,
  IndianRupee,
  User,
  LogIn,
  Hash,
  Calendar,
} from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface Withdrawal {
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

type StatusFilter = "all" | "pending" | "in_process" | "completed" | "failed";

const NOTE_MAX = 500;

function normalizeStatus(statusRaw?: string): StatusFilter {
  const s = (statusRaw || "pending")
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .trim();
  if (s === "in_process" || s === "processing" || s === "processed") return "in_process";
  if (s === "completed" || s === "complete" || s === "success" || s === "paid" || s === "done") {
    return "completed";
  }
  if (s === "failed" || s === "failure" || s === "rejected" || s === "cancelled") return "failed";
  return "pending";
}

function normalizeWithdrawal(raw: Record<string, unknown>): Withdrawal | null {
  if (!raw || typeof raw !== "object") return null;
  const amountRaw = raw.amount ?? raw.withdrawal_amount;
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : typeof amountRaw === "string"
        ? parseFloat(amountRaw)
        : NaN;
  if (Number.isNaN(amount)) return null;
  const status =
    typeof raw.transaction_status === "string"
      ? raw.transaction_status
      : typeof raw.payment_status === "string"
        ? raw.payment_status
        : typeof raw.status === "string"
          ? raw.status
          : "pending";
  return {
    id: raw.id as string | number | undefined,
    transaction_id: (raw.transaction_id ?? raw.tx_id) as string | number | undefined,
    user_id: raw.user_id as string | undefined,
    user_name: (raw.user_name ?? raw.name) as string | undefined,
    user_email: (raw.user_email ?? raw.email) as string | undefined,
    amount,
    upi_vpa: (raw.upi_vpa ?? raw.upi) as string | undefined,
    status,
    created_at: (raw.created_at ?? raw.createdAt) as string | undefined,
    updated_at: (raw.updated_at ?? raw.updatedAt) as string | undefined,
    note: (raw.note ?? raw.notes) as string | undefined,
    admin_note: raw.admin_note as string | undefined,
    utr_reference: raw.utr_reference as string | undefined,
    paid_at: (raw.paid_at ?? raw.paidAt) as string | undefined,
    payment_remark: raw.payment_remark as string | undefined,
  };
}

function extractMetaFromNote(note?: string): { utr: string; paidAt: string; remark: string } {
  const text = (note ?? "").trim();
  if (!text) return { utr: "", paidAt: "", remark: "" };
  const lines = text.split("\n").map((l) => l.trim());
  const get = (prefix: string) => {
    const line = lines.find((l) => l.toLowerCase().startsWith(prefix.toLowerCase()));
    return line ? line.slice(prefix.length).trim() : "";
  };
  return {
    utr: get("UTR:"),
    paidAt: get("Paid at:"),
    remark: get("Remark:"),
  };
}

function payoutDetails(w: Withdrawal, noteText?: string): { utr: string; paidAt: string; remark: string } {
  const nativeUtr = (w.utr_reference ?? "").trim();
  const nativePaidAt = (w.paid_at ?? "").trim();
  const nativeRemark = (w.payment_remark ?? "").trim();
  if (nativeUtr || nativePaidAt || nativeRemark) {
    return {
      utr: nativeUtr,
      paidAt: nativePaidAt,
      remark: nativeRemark,
    };
  }
  return extractMetaFromNote(noteText);
}

function extractWithdrawalsList(payload: unknown): Withdrawal[] {
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
    const out: Withdrawal[] = [];
    for (const item of c) {
      if (!item || typeof item !== "object") continue;
      const w = normalizeWithdrawal(item as Record<string, unknown>);
      if (w) out.push(w);
    }
    if (out.length) return out;
  }
  return [];
}

export default function WalletWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteSaving, setNoteSaving] = useState<string | null>(null);
  /** Draft text per transaction id */
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [paidTxId, setPaidTxId] = useState("");
  const [paidUtr, setPaidUtr] = useState("");
  const [paidRemark, setPaidRemark] = useState("");
  const [paidSubmitting, setPaidSubmitting] = useState(false);
  /** null = ok or not loaded; 'auth' = 401 / invalid token; 'other' = other error */
  const [loadError, setLoadError] = useState<null | "auth" | "other">(null);

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await axiosInstance.get("/admin/wallet/withdrawals");
      const wrapped = response.data?.data ?? response.data;
      const list = extractWithdrawalsList(wrapped ?? response.data);
      setWithdrawals(list);
    } catch (err: unknown) {
      console.error("Withdrawals fetch error:", err);
      const anyErr = err as { response?: { status?: number } };
      const status = anyErr.response?.status;
      const detail = getApiErrorMessage(err).toLowerCase();
      const isAuth =
        status === 401 ||
        status === 403 ||
        detail.includes("invalid") ||
        detail.includes("expired") ||
        detail.includes("unauthorized") ||
        detail.includes("not enough permissions") ||
        detail.includes("forbidden");
      setLoadError(isAuth ? "auth" : "other");
      const msg = isAuth
        ? status === 403
          ? "Admin access required. Sign in via the admin portal (admin-login), not the regular user login."
          : "Admin session expired or invalid. Log in again."
        : getApiErrorMessage(err) || "Failed to load withdrawals";
      toast.error(msg);
      setWithdrawals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  useEffect(() => {
    setNoteDrafts((prev) => {
      const next = { ...prev };
      for (const w of withdrawals) {
        const id = String(w.transaction_id ?? w.id ?? "").trim();
        if (!id) continue;
        if (!(id in next)) {
          const fromApi = (w.note || w.admin_note || "").trim();
          next[id] = fromApi;
        }
      }
      return next;
    });
  }, [withdrawals]);

  const getTxId = (w: Withdrawal) =>
    String(w.transaction_id ?? w.id ?? "").trim();

  const filteredWithdrawals = useMemo(() => {
    if (statusFilter === "all") return withdrawals;
    return withdrawals.filter(
      (w) => {
        const s = normalizeStatus(w.status);
        return s === statusFilter;
      }
    );
  }, [withdrawals, statusFilter]);

  const counts = useMemo(() => {
    const c = { all: withdrawals.length, pending: 0, in_process: 0, completed: 0, failed: 0 };
    const amount = { all: 0, pending: 0, in_process: 0, completed: 0, failed: 0 };
    for (const w of withdrawals) {
      const s = normalizeStatus(w.status);
      const v = Number.isFinite(w.amount) ? w.amount : 0;
      amount.all += v;
      amount[s] += v;
      c[s] += 1;
    }
    return { count: c, amount };
  }, [withdrawals]);

  const serverNotesById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const w of withdrawals) {
      const id = getTxId(w);
      if (!id) continue;
      map[id] = (w.note || w.admin_note || "").trim();
    }
    return map;
  }, [withdrawals]);

  const updateStatus = async (
    w: Withdrawal,
    status: "completed" | "failed" | "in_process"
  ) => {
    const id = getTxId(w);
    if (!id) return;
    try {
      setActionLoading(id);
      await axiosInstance.patch(`/admin/wallet-transaction/${id}`, { status });
      toast.success(`Withdrawal marked as ${status}`);
      fetchWithdrawals();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const openMarkPaid = (w: Withdrawal) => {
    const id = getTxId(w);
    if (!id) return;
    const current = noteDrafts[id] ?? serverNotesById[id] ?? "";
    const parsed = payoutDetails(w, current);
    setPaidTxId(id);
    setPaidUtr(parsed.utr);
    setPaidRemark(parsed.remark);
    setMarkPaidOpen(true);
  };

  const submitMarkPaid = async () => {
    const txId = paidTxId.trim();
    const utr = paidUtr.trim();
    if (!txId) return;
    if (!utr) {
      toast.error("UTR / reference number is required");
      return;
    }
    const paidAtIso = new Date().toISOString();
    try {
      setPaidSubmitting(true);
      setActionLoading(txId);
      await axiosInstance.patch(`/admin/wallet-transaction/${txId}`, {
        status: "completed",
        utr_reference: utr.slice(0, 128),
        paid_at: paidAtIso,
        payment_remark: paidRemark.trim().slice(0, NOTE_MAX),
      });
      toast.success("Withdrawal marked as completed");
      setMarkPaidOpen(false);
      await fetchWithdrawals();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || "Failed to mark as paid");
    } finally {
      setPaidSubmitting(false);
      setActionLoading(null);
    }
  };

  const saveNote = async (txId: string) => {
    const text = (noteDrafts[txId] ?? "").slice(0, NOTE_MAX);
    setNoteDrafts((p) => ({ ...p, [txId]: text }));
    setNoteSaving(txId);
    try {
      await axiosInstance.patch(`/admin/wallet-transaction/${txId}`, { note: text });
      toast.success("Note saved");
      await fetchWithdrawals();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err) || "Failed to save note");
    }
    setNoteSaving(null);
  };

  const handleNoteBlur = (txId: string) => {
    if (!txId || noteSaving === txId) return;
    const draft = (noteDrafts[txId] ?? "").trim().slice(0, NOTE_MAX);
    const saved = (serverNotesById[txId] ?? "").trim();
    if (draft !== saved) {
      void saveNote(txId);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const statusBadge = (statusRaw?: string) => {
    const s = normalizeStatus(statusRaw);
    if (s === "completed") {
      return (
        <Badge className="bg-emerald-600 hover:bg-emerald-600/90 text-white border-0">
          Completed
        </Badge>
      );
    }
    if (s === "failed") {
      return <Badge variant="destructive">Failed</Badge>;
    }
    if (s === "in_process") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-900 border-blue-200">
          In Process
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-amber-50 text-amber-900 border-amber-200">
        Pending
      </Badge>
    );
  };

  const formatInr = (value: number) => `₹${Math.round(value || 0).toLocaleString("en-IN")}`;

  const filterTabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: `All (${counts.count.all}) • ${formatInr(counts.amount.all)}` },
    { key: "pending", label: `Pending (${counts.count.pending}) • ${formatInr(counts.amount.pending)}` },
    {
      key: "in_process",
      label: `In Process (${counts.count.in_process}) • ${formatInr(counts.amount.in_process)}`,
    },
    {
      key: "completed",
      label: `Completed (${counts.count.completed}) • ${formatInr(counts.amount.completed)}`,
    },
    { key: "failed", label: `Failed (${counts.count.failed}) • ${formatInr(counts.amount.failed)}` },
  ];

  return (
    <div className="space-y-6">
      <Toaster />
      <Dialog open={markPaidOpen} onOpenChange={setMarkPaidOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark withdrawal as paid</DialogTitle>
            <DialogDescription>
              Enter payment reference details before confirming completion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="paid-utr">UTR / Reference number</Label>
              <Textarea
                id="paid-utr"
                rows={2}
                maxLength={128}
                placeholder="e.g. 41234423525234"
                value={paidUtr}
                onChange={(e) => setPaidUtr(e.target.value.slice(0, 128))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paid-remark">Remark (optional)</Label>
              <Textarea
                id="paid-remark"
                rows={2}
                maxLength={180}
                placeholder="Any internal comment"
                value={paidRemark}
                onChange={(e) => setPaidRemark(e.target.value.slice(0, 180))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMarkPaidOpen(false)}
              disabled={paidSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => void submitMarkPaid()}
              disabled={paidSubmitting}
            >
              {paidSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-7 w-7 text-emerald-600" />
          Wallet Withdrawals
        </h1>
        <p className="text-muted-foreground mt-1">
          All UPI withdrawal requests with user and payout details. Add <strong>short notes</strong> per
          row and save (stored server-side).
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-muted-foreground">Loading withdrawals...</span>
        </div>
      ) : loadError === "auth" ? (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50">
          <CardContent className="pt-6">
            <div className="text-center py-10 px-4 max-w-md mx-auto space-y-4">
              <LogIn className="h-12 w-12 mx-auto text-amber-600 dark:text-amber-500" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Admin sign-in required</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Use the <strong>admin</strong> login page (same JWT as{" "}
                  <code className="text-xs bg-muted px-1 rounded">POST /admin-login/</code>), not the
                  regular app login. If your token expired and refresh did not return a new token, sign
                  in again.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                  <Link href="/">Go to admin login</Link>
                </Button>
                <Button variant="outline" onClick={() => fetchWithdrawals()}>
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : loadError === "other" ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">Could not load withdrawals.</p>
              <Button onClick={() => fetchWithdrawals()}>Try again</Button>
            </div>
          </CardContent>
        </Card>
      ) : withdrawals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No withdrawals yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                The API returned no rows. If users have requested withdrawals, confirm the backend{" "}
                <code className="text-xs bg-muted px-1 rounded">GET /admin/wallet/withdrawals</code>{" "}
                returns all statuses you need (not only an empty list).
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {filterTabs.map(({ key, label }) => (
              <Button
                key={key}
                type="button"
                variant={statusFilter === key ? "default" : "outline"}
                size="sm"
                className={statusFilter === key ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </Button>
            ))}
            <Button type="button" variant="ghost" size="sm" onClick={() => fetchWithdrawals()}>
              Refresh
            </Button>
          </div>

          {filteredWithdrawals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground py-8">
                  No withdrawals match this filter.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop table */}
              <Card className="hidden md:block overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40 text-left">
                        <th className="p-3 font-semibold">Txn ID</th>
                        <th className="p-3 font-semibold">Amount</th>
                        <th className="p-3 font-semibold">Status</th>
                        <th className="p-3 font-semibold">User</th>
                        <th className="p-3 font-semibold">UPI</th>
                        <th className="p-3 font-semibold">Requested</th>
                        <th className="p-3 font-semibold min-w-[190px]">Payment Details</th>
                        <th className="p-3 font-semibold min-w-[200px] max-w-[260px]">Notes</th>
                        <th className="p-3 font-semibold w-[180px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWithdrawals.map((w) => {
                        const id = getTxId(w);
                        const status = normalizeStatus(w.status);
                        const pending = status === "pending" || status === "in_process";
                        const meta = payoutDetails(w, noteDrafts[id] ?? serverNotesById[id] ?? "");
                        return (
                          <tr key={id || `${w.created_at}-${w.amount}`} className="border-b last:border-0">
                            <td className="p-3 align-top">
                              <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                                <Hash className="h-3 w-3" />
                                {id || "—"}
                              </span>
                            </td>
                            <td className="p-3 align-top font-semibold tabular-nums">
                              ₹{w.amount.toLocaleString("en-IN")}
                            </td>
                            <td className="p-3 align-top">{statusBadge(w.status)}</td>
                            <td className="p-3 align-top">
                              <div className="space-y-0.5">
                                {(w.user_name || w.user_id) && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                    <span>{w.user_name || w.user_id}</span>
                                  </div>
                                )}
                                {w.user_email && (
                                  <div className="text-xs text-muted-foreground">{w.user_email}</div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 align-top font-mono text-xs break-all max-w-[200px]">
                              {w.upi_vpa || "—"}
                            </td>
                            <td className="p-3 align-top text-xs text-muted-foreground whitespace-nowrap">
                              <div className="flex items-start gap-1">
                                <Calendar className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <span>
                                  {formatDate(w.created_at)}
                                  {w.updated_at && w.updated_at !== w.created_at && (
                                    <span className="block text-[10px] mt-0.5">
                                      Updated {formatDate(w.updated_at)}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 align-top">
                              {meta.utr || meta.paidAt || meta.remark ? (
                                <div className="space-y-1 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">UTR: </span>
                                    <span className="font-mono break-all">{meta.utr || "—"}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Paid at: </span>
                                    <span>{meta.paidAt ? formatDate(meta.paidAt) : "—"}</span>
                                  </div>
                                  {meta.remark && (
                                    <div>
                                      <span className="text-muted-foreground">Remark: </span>
                                      <span className="break-words">{meta.remark}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="p-3 align-top">
                              <div className="space-y-1.5">
                                {meta.utr && <div className="text-[11px] text-muted-foreground">UTR: {meta.utr}</div>}
                                <Label htmlFor={`note-${id}`} className="sr-only">
                                  Note for transaction {id}
                                </Label>
                                <Textarea
                                  id={`note-${id}`}
                                  placeholder="Short internal note…"
                                  rows={2}
                                  maxLength={NOTE_MAX}
                                  className="min-h-[52px] text-xs resize-y max-w-[240px]"
                                  value={noteDrafts[id] ?? ""}
                                  onChange={(e) =>
                                    setNoteDrafts((p) => ({
                                      ...p,
                                      [id]: e.target.value.slice(0, NOTE_MAX),
                                    }))
                                  }
                                  onBlur={() => handleNoteBlur(id)}
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className="h-7 text-xs"
                                  disabled={noteSaving === id}
                                  onClick={() => saveNote(id)}
                                >
                                  {noteSaving === id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    "Save note"
                                  )}
                                </Button>
                              </div>
                            </td>
                            <td className="p-3 align-top">
                              {pending ? (
                                <div className="flex flex-wrap gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8"
                                    disabled={actionLoading === id}
                                    onClick={() => updateStatus(w, "in_process")}
                                  >
                                    In Process
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-700 h-8"
                                    disabled={actionLoading === id}
                                    onClick={() => openMarkPaid(w)}
                                  >
                                    {actionLoading === id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <>
                                        <Check className="h-3 w-3 mr-1" />
                                        Done
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-8"
                                    disabled={actionLoading === id}
                                    onClick={() => updateStatus(w, "failed")}
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Fail
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Mobile cards */}
              <div className="md:hidden space-y-4">
                {filteredWithdrawals.map((w) => {
                  const id = getTxId(w);
                  const status = normalizeStatus(w.status);
                  const pending = status === "pending" || status === "in_process";
                  const meta = payoutDetails(w, noteDrafts[id] ?? serverNotesById[id] ?? "");
                  return (
                    <Card key={id || `${w.created_at}-${w.amount}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <IndianRupee className="h-5 w-5 text-emerald-600" />
                            ₹{w.amount.toLocaleString("en-IN")}
                          </CardTitle>
                          {statusBadge(w.status)}
                        </div>
                        <CardDescription className="space-y-2 pt-2">
                          <div className="font-mono text-xs text-muted-foreground">
                            Txn: {id || "—"}
                          </div>
                          {(w.user_name || w.user_id) && (
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {w.user_name || w.user_id}
                            </span>
                          )}
                          {w.user_email && <span>{w.user_email}</span>}
                          {w.upi_vpa && (
                            <span className="font-medium text-foreground block">UPI: {w.upi_vpa}</span>
                          )}
                          <span className="block">{formatDate(w.created_at)}</span>
                          {w.updated_at && w.updated_at !== w.created_at && (
                            <span className="block text-xs">
                              Updated: {formatDate(w.updated_at)}
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2 border-t">
                        {(meta.utr || meta.paidAt || meta.remark) && (
                          <div className="rounded-md border bg-muted/30 p-2 space-y-1">
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                              Payment Details
                            </div>
                            <div className="text-xs">
                              <span className="text-muted-foreground">UTR: </span>
                              <span className="font-mono break-all">{meta.utr || "—"}</span>
                            </div>
                            <div className="text-xs">
                              <span className="text-muted-foreground">Paid at: </span>
                              <span>{meta.paidAt ? formatDate(meta.paidAt) : "—"}</span>
                            </div>
                            {meta.remark && (
                              <div className="text-xs">
                                <span className="text-muted-foreground">Remark: </span>
                                <span className="break-words">{meta.remark}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {meta.utr && <div className="text-[11px] text-muted-foreground">UTR: {meta.utr}</div>}
                        <Label htmlFor={`note-m-${id}`} className="text-xs font-medium">
                          Notes
                        </Label>
                        <Textarea
                          id={`note-m-${id}`}
                          placeholder="Short internal note…"
                          rows={3}
                          maxLength={NOTE_MAX}
                          className="min-h-[72px] text-sm"
                          value={noteDrafts[id] ?? ""}
                          onChange={(e) =>
                            setNoteDrafts((p) => ({
                              ...p,
                              [id]: e.target.value.slice(0, NOTE_MAX),
                            }))
                          }
                          onBlur={() => handleNoteBlur(id)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="w-full"
                          disabled={noteSaving === id}
                          onClick={() => saveNote(id)}
                        >
                          {noteSaving === id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Save note"
                          )}
                        </Button>
                      </CardContent>
                      {pending && (
                        <CardContent className="pt-0 flex gap-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            disabled={actionLoading === id}
                            onClick={() => updateStatus(w, "in_process")}
                          >
                            In Process
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                            disabled={actionLoading === id}
                            onClick={() => openMarkPaid(w)}
                          >
                            {actionLoading === id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Completed
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            disabled={actionLoading === id}
                            onClick={() => updateStatus(w, "failed")}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Failed
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
