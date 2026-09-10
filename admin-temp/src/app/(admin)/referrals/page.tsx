"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Gift,
  IndianRupee,
  Loader2,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  fetchAdminReferrals,
  referralStatusBadgeClass,
  referralStatusLabel,
  type AdminReferralRow,
  type AdminReferralStatus,
} from "@/lib/adminReferralsApi";
import { formatAxiosApiError } from "@/lib/apiError";

type StatusFilter = "all" | AdminReferralStatus;

function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export default function AdminReferralsPage() {
  const [rows, setRows] = useState<AdminReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchAdminReferrals();
      setRows(list);
    } catch (err) {
      console.error("Admin referrals fetch error:", err);
      const msg = formatAxiosApiError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(String(r.status).toLowerCase()));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && String(r.status).toLowerCase() !== statusFilter) {
        return false;
      }
      if (!q) return true;
      const hay = [
        r.id,
        r.referral_code_used,
        r.referrer_name,
        r.referrer_email,
        r.referee_name,
        r.referee_email,
        r.qualifying_job_id,
        r.referrer_user_id,
        r.referee_user_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter]);

  const stats = useMemo(() => {
    let pending = 0;
    let qualified = 0;
    let credited = 0;
    let referrerPaid = 0;
    let refereePaid = 0;
    for (const r of rows) {
      const s = String(r.status).toLowerCase();
      if (s === "pending") pending++;
      else if (s === "qualified") qualified++;
      else if (s === "credited") credited++;
      if (r.referrer_credited_at) referrerPaid += r.referrer_reward_inr;
      if (r.referee_credited_at) refereePaid += r.referee_reward_inr;
    }
    return {
      total: rows.length,
      pending,
      qualified,
      credited,
      referrerPaid,
      refereePaid,
      totalPaid: referrerPaid + refereePaid,
    };
  }, [rows]);

  const exportCsv = () => {
    if (!filtered.length) {
      toast.message("Nothing to export");
      return;
    }
    const header = [
      "id",
      "status",
      "referral_code_used",
      "referrer_name",
      "referrer_email",
      "referee_name",
      "referee_email",
      "referrer_reward_inr",
      "referee_reward_inr",
      "qualifying_job_id",
      "referrer_credited_at",
      "referee_credited_at",
      "created_at",
    ];
    const lines = [
      header.join(","),
      ...filtered.map((r) =>
        header.map((key) => csvEscape(r[key as keyof AdminReferralRow])).join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrals-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV downloaded");
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Toaster />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gift className="h-7 w-7 text-violet-600" />
            Referrals
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Who referred whom, referral status, and wallet rewards. Data from{" "}
            <code className="text-xs bg-muted px-1 rounded">GET /admin/referrals/</code>.
            Wallet lines use references{" "}
            <code className="text-xs bg-muted px-1 rounded">referral_referrer_bonus</code> and{" "}
            <code className="text-xs bg-muted px-1 rounded">referral_referee_welcome</code>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total referrals", value: stats.total, icon: Users },
          { label: "Pending signup", value: stats.pending, icon: Gift },
          { label: "Credited", value: stats.credited, icon: IndianRupee },
          {
            label: "Wallet paid out",
            value: formatInr(stats.totalPaid),
            icon: IndianRupee,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All referral pairs</CardTitle>
          <CardDescription>
            Referrer → referee, code used, rewards, and qualifying task when credited.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search name, email, code, job id…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={statusFilter === "all" ? "default" : "outline"}
                onClick={() => setStatusFilter("all")}
              >
                All ({rows.length})
              </Button>
              {statusOptions.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? "default" : "outline"}
                  onClick={() => setStatusFilter(s)}
                >
                  {referralStatusLabel(s)} ({rows.filter((r) => String(r.status).toLowerCase() === s).length})
                </Button>
              ))}
            </div>
          </div>

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading referrals…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              {rows.length === 0
                ? "No referrals yet — when someone signs up with a referral code, they will appear here."
                : "No rows match your search or filter."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Referrer</TableHead>
                    <TableHead>Referee</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Referrer ₹</TableHead>
                    <TableHead className="text-right">Referee ₹</TableHead>
                    <TableHead>Qualifying task</TableHead>
                    <TableHead>Credited</TableHead>
                    <TableHead>Signed up</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="min-w-[160px]">
                        <p className="font-medium">{r.referrer_name}</p>
                        {r.referrer_email ? (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {r.referrer_email}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="min-w-[160px]">
                        <p className="font-medium">{r.referee_name}</p>
                        {r.referee_email ? (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {r.referee_email}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                          {r.referral_code_used || "—"}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={referralStatusBadgeClass(r.status)}>
                          {referralStatusLabel(r.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatInr(r.referrer_reward_inr)}
                        {r.referrer_credited_at ? (
                          <p className="text-[10px] text-emerald-700">paid</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatInr(r.referee_reward_inr)}
                        {r.referee_credited_at ? (
                          <p className="text-[10px] text-emerald-700">paid</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        {r.qualifying_job_id ? (
                          <Link
                            href={`/tasks/${encodeURIComponent(r.qualifying_job_id)}`}
                            className="text-sm text-blue-600 hover:underline font-mono"
                          >
                            {r.qualifying_job_id}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.referrer_credited_at || r.referee_credited_at ? (
                          <div className="space-y-1">
                            {r.referrer_credited_at ? (
                              <p>
                                <span className="text-muted-foreground">Ref:</span>{" "}
                                {formatDate(r.referrer_credited_at)}
                              </p>
                            ) : null}
                            {r.referee_credited_at ? (
                              <p>
                                <span className="text-muted-foreground">New:</span>{" "}
                                {formatDate(r.referee_credited_at)}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                        {formatDate(r.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && filtered.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Showing {filtered.length} of {rows.length} referral
              {rows.length === 1 ? "" : "s"}.
              {stats.referrerPaid + stats.refereePaid > 0
                ? ` Referrer payouts ${formatInr(stats.referrerPaid)} · Referee welcome ${formatInr(stats.refereePaid)}.`
                : ""}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
