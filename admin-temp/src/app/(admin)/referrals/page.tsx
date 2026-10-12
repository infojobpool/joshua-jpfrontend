"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Gift,
  IndianRupee,
  Loader2,
  RefreshCw,
  Search,
  UserCircle2,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { aggregateByReferrer } from "@/lib/adminReferralAggregates";
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

function PersonCell({
  name,
  email,
  userId,
}: {
  name: string;
  email?: string | null;
  userId?: string | null;
}) {
  return (
    <div className="min-w-[140px]">
      <p className="font-medium text-slate-900">{name}</p>
      {email ? <p className="text-xs text-muted-foreground truncate max-w-[220px]">{email}</p> : null}
      {userId ? (
        <p className="text-[10px] font-mono text-muted-foreground/80 truncate max-w-[220px]" title={userId}>
          ID {userId}
        </p>
      ) : null}
    </div>
  );
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
        r.referrer_user_id,
        r.referee_user_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search, statusFilter]);

  const referrers = useMemo(() => aggregateByReferrer(rows), [rows]);

  const filteredReferrers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return referrers;
    return referrers.filter((agg) => {
      const hay = [
        agg.referrer_name,
        agg.referrer_email,
        agg.referrer_user_id,
        agg.referral_code_used,
        ...agg.referee_names,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [referrers, search]);

  const stats = useMemo(() => {
    let verifying = 0;
    let verified = 0;
    for (const r of rows) {
      const s = String(r.status).toLowerCase();
      if (s === "pending") verifying++;
      else if (s === "qualified" || s === "credited") verified++;
    }
    const uniqueReferrers = referrers.length;
    return {
      pairs: rows.length,
      verifying,
      verified,
      uniqueReferrers,
      milestonesEst: referrers.reduce((n, a) => n + a.milestones_estimated, 0),
    };
  }, [rows, referrers]);

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
      "referrer_user_id",
      "referee_name",
      "referee_email",
      "referee_user_id",
      "referrer_reward_inr",
      "referee_reward_inr",
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

  const filtersRow = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative max-w-md flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search referrer, referee, email, code, user id…"
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
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      <Toaster />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Gift className="h-5 w-5" />
            </span>
            Referrals
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            See <strong>who referred whom</strong>, verification status, and wallet rewards. Milestone rule: ₹25 per
            3 verified referees · ₹25 welcome for new users.
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Referral pairs", value: stats.pairs, icon: Users },
          { label: "Unique referrers", value: stats.uniqueReferrers, icon: UserCircle2 },
          { label: "Verifying", value: stats.verifying, icon: Gift },
          { label: "Verified", value: stats.verified, icon: Users },
          { label: "Milestones (est.)", value: stats.milestonesEst, icon: IndianRupee },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-violet-100/80">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                  <Icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xl font-bold tabular-nums">{value}</p>
                  <p className="text-[11px] text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      ) : null}

      <Tabs defaultValue="pairs" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pairs">Who referred whom</TabsTrigger>
          <TabsTrigger value="referrers">By referrer</TabsTrigger>
        </TabsList>

        <TabsContent value="pairs" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Referrer → Referee</CardTitle>
              <CardDescription>Each row is one signup attributed to a referrer&apos;s code at registration.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {filtersRow}
              {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Loading referrals…
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                  {rows.length === 0
                    ? "No referrals yet."
                    : "No rows match your search or filter."}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[280px]">Relationship</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Welcome ₹</TableHead>
                        <TableHead>Signed up</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                              <PersonCell
                                name={r.referrer_name}
                                email={r.referrer_email}
                                userId={r.referrer_user_id}
                              />
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                                <ArrowRight className="h-4 w-4" aria-hidden />
                              </span>
                              <PersonCell
                                name={r.referee_name}
                                email={r.referee_email}
                                userId={r.referee_user_id}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-semibold">
                              {r.referral_code_used || "—"}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={referralStatusBadgeClass(r.status)}>
                              {referralStatusLabel(r.status)}
                            </Badge>
                            {r.referee_credited_at ? (
                              <p className="text-[10px] text-emerald-700 mt-1">Welcome paid</p>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {formatInr(r.referee_reward_inr)}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrers" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Referrer leaderboard</CardTitle>
              <CardDescription>
                How many people each referrer invited and how many finished verification (milestone = floor(verified ÷
                3)).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search referrer…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : filteredReferrers.length === 0 ? (
                <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                  No referrers to show.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Referrer</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-center">Invited</TableHead>
                        <TableHead className="text-center">Verifying</TableHead>
                        <TableHead className="text-center">Verified</TableHead>
                        <TableHead className="text-center">Milestones</TableHead>
                        <TableHead>Recent referees</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReferrers.map((agg) => (
                        <TableRow key={agg.key}>
                          <TableCell>
                            <PersonCell
                              name={agg.referrer_name}
                              email={agg.referrer_email}
                              userId={agg.referrer_user_id}
                            />
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {agg.referral_code_used || "—"}
                            </code>
                          </TableCell>
                          <TableCell className="text-center font-semibold tabular-nums">
                            {agg.invited_total}
                          </TableCell>
                          <TableCell className="text-center tabular-nums text-amber-800">{agg.verifying}</TableCell>
                          <TableCell className="text-center tabular-nums text-emerald-800">{agg.verified}</TableCell>
                          <TableCell className="text-center tabular-nums">{agg.milestones_estimated}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                            {agg.referee_names.slice(0, 4).join(", ")}
                            {agg.referee_names.length > 4 ? ` +${agg.referee_names.length - 4}` : ""}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!loading && filtered.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          Showing {filtered.length} of {rows.length} referral pair{rows.length === 1 ? "" : "s"}.
        </p>
      ) : null}
    </div>
  );
}
