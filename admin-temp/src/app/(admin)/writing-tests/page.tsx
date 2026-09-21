"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Loader2, PenLine, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { formatAxiosApiError } from "@/lib/apiError";
import {
  fetchAdminWritingTests,
  type AdminWritingTestRow,
} from "@/lib/writingTestAdminApi";

function formatWhen(iso: string): string {
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

function csvEscape(v: unknown): string {
  const t = String(v ?? "");
  if (/[",\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

export default function WritingTestsAdminPage() {
  const [rows, setRows] = useState<AdminWritingTestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminWritingTestRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchAdminWritingTests();
      setRows(list);
    } catch (err) {
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.student_name, r.student_id, r.student_email, r.topic, r.content, r.id]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const exportCsv = () => {
    if (!filtered.length) {
      toast.message("Nothing to export");
      return;
    }
    const header = [
      "id",
      "student_name",
      "student_id",
      "student_email",
      "topic",
      "word_count",
      "duration_seconds",
      "submitted_reason",
      "started_at",
      "submitted_at",
      "content",
    ];
    const lines = [
      header.join(","),
      ...filtered.map((r) => header.map((k) => csvEscape(r[k as keyof AdminWritingTestRow])).join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `writing-tests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Toaster />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <PenLine className="h-7 w-7 text-blue-600" />
            Writing tests
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Student submissions from{" "}
            <code className="text-xs bg-muted px-1 rounded">/writing-test</code>. Production: backend{" "}
            <code className="text-xs bg-muted px-1 rounded">GET /admin/writing-test/submissions/</code> or user-site API
            with <code className="text-xs bg-muted px-1 rounded">WRITING_TEST_ADMIN_KEY</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Submissions</CardTitle>
          <CardDescription>
            Share test link:{" "}
            <span className="font-mono text-xs">
              {process.env.NEXT_PUBLIC_USER_SITE_URL || "https://www.jobpool.in"}/writing-test
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search name, topic, content…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          {error ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              {error}
            </div>
          ) : null}
          {loading ? (
            <div className="flex justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No submissions yet. Configure webhook or backend storage for production.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Words</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium">{r.student_name}</p>
                        {r.student_id ? (
                          <p className="text-xs text-muted-foreground">{r.student_id}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={r.topic}>
                        {r.topic}
                      </TableCell>
                      <TableCell className="tabular-nums">{r.word_count}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.submitted_reason}</TableCell>
                      <TableCell className="text-xs whitespace-nowrap">{formatWhen(r.submitted_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button type="button" size="sm" variant="outline" onClick={() => setSelected(r)}>
                          Read
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>{selected.student_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="text-muted-foreground">Topic:</span> {selected.topic}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selected.word_count} words · {selected.duration_seconds}s · {formatWhen(selected.submitted_at)}
                </p>
                <div className="rounded-lg border bg-muted/30 p-4 whitespace-pre-wrap leading-relaxed">
                  {selected.content}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
