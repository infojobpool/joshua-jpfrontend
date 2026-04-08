"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, MessageCircle, RefreshCw, Send, UserX } from "lucide-react";
import { sendIncompleteProfileReminders, type ReminderRecipient } from "@/lib/reminderApi";
import { useCanAdminWrite } from "@/lib/adminAuth";

/**
 * Rows from GET all-user-details/. Backend can add reminder stats per user, e.g.:
 * - profile_reminder_send_count / profile_reminder_count / incomplete_profile_reminder_count
 * - last_profile_reminder_at / last_reminder_sent_at (ISO string)
 */
interface CustomerRow {
  user_id: string;
  user_fullname: string;
  user_email: string;
  phone_number?: string;
  verification_status: number;
  created_at?: string;
  joined_at?: string;
  date_joined?: string;
  profile_reminder_send_count?: number;
  profile_reminder_count?: number;
  incomplete_profile_reminder_count?: number;
  verification_reminder_count?: number;
  last_profile_reminder_at?: string;
  last_incomplete_profile_reminder_at?: string;
  last_reminder_sent_at?: string;
}

function trim(s?: string) {
  return (s || "").trim();
}

function formatShortDate(d: Date): string {
  try {
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

/** Reads reminder stats from row; supports several backend field names until API is unified. */
function getReminderDisplay(c: CustomerRow): { count: number | null; lastLabel: string | null } {
  const raw: Record<string, unknown> = { ...c };
  const asNum = (v: unknown): number | null => {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
    return null;
  };
  const count =
    asNum(raw.profile_reminder_send_count) ??
    asNum(raw.profile_reminder_count) ??
    asNum(raw.incomplete_profile_reminder_count) ??
    asNum(raw.verification_reminder_count) ??
    asNum(raw.reminder_send_count);

  const lastRaw =
    (typeof raw.last_profile_reminder_at === "string" && raw.last_profile_reminder_at) ||
    (typeof raw.last_incomplete_profile_reminder_at === "string" && raw.last_incomplete_profile_reminder_at) ||
    (typeof raw.last_reminder_sent_at === "string" && raw.last_reminder_sent_at) ||
    (typeof raw.profile_reminder_last_at === "string" && raw.profile_reminder_last_at) ||
    null;

  let lastLabel: string | null = null;
  if (lastRaw) {
    const d = new Date(lastRaw);
    lastLabel = Number.isNaN(d.getTime()) ? lastRaw : formatShortDate(d);
  }
  return { count, lastLabel };
}

function needsReminder(c: CustomerRow): { flag: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const v = Number(c.verification_status ?? 0);
  if (v < 1) reasons.push("PAN not verified");
  else if (v < 2) reasons.push("Aadhaar not verified");
  if (!trim(c.user_fullname)) reasons.push("Profile: name missing");
  if (!trim(c.user_email)) reasons.push("Profile: email missing");
  if (!trim(c.phone_number)) reasons.push("Profile: phone missing");

  const incompleteKyc = v < 2;
  const incompleteProfile =
    !trim(c.user_fullname) || !trim(c.user_email) || !trim(c.phone_number);
  return { flag: incompleteKyc || incompleteProfile, reasons };
}

export default function VerificationRemindersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const canWrite = useCanAdminWrite();

  const fetchCustomers = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const response = await axiosInstance.get("all-user-details/");
      const raw = response.data?.data ?? response.data;
      const list = Array.isArray(raw) ? raw : [];
      setCustomers(list as CustomerRow[]);
    } catch {
      if (!opts?.silent) toast.error("Could not load users");
      setCustomers([]);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const candidates = useMemo(() => {
    return customers
      .map((c) => ({ c, ...needsReminder(c) }))
      .filter((x) => x.flag);
  }, [customers]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildRecipients = (userIds: string[]): ReminderRecipient[] => {
    const byId = new Map(customers.map((c) => [c.user_id, c]));
    const out: ReminderRecipient[] = [];
    for (const id of userIds) {
      const c = byId.get(id);
      if (!c) continue;
      out.push({
        user_id: c.user_id,
        email: trim(c.user_email) || undefined,
        phone: trim(c.phone_number) || undefined,
        name: trim(c.user_fullname) || undefined,
      });
    }
    return out;
  };

  const runSend = async (userIds: string[]) => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    if (userIds.length === 0) {
      toast.error("Select at least one user");
      return;
    }
    setSending(true);
    const recipients = buildRecipients(userIds);
    const result = await sendIncompleteProfileReminders(userIds, recipients);
    setSending(false);
    if (result.ok) {
      toast.success(result.message || "Reminders sent");
      setSelected(new Set());
      void fetchCustomers({ silent: true });
    } else if (result.noEndpoint) {
      toast.error("Backend endpoint missing", {
        description: result.error,
        duration: 12000,
      });
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-6">
      <Toaster />
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Send className="h-7 w-7 text-emerald-600" />
          Verification &amp; profile reminders
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl">
          Lists users who signed up but have not finished{" "}
          <strong>PAN + Aadhaar</strong> (KYC) and/or are missing basic profile fields. Use{" "}
          <strong>Send</strong> to request email + WhatsApp nudges via your API.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => fetchCustomers()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh list</span>
        </Button>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={sending || selected.size === 0 || !canWrite}
          title={!canWrite ? "Read-only role" : undefined}
          onClick={() => void runSend(Array.from(selected))}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
          Send email + WhatsApp to selected ({selected.size})
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={sending || candidates.length === 0 || !canWrite}
          title={!canWrite ? "Read-only role" : undefined}
          onClick={() => void runSend(candidates.map((x) => x.c.user_id))}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Send to everyone in list ({candidates.length})
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserX className="h-5 w-5 text-slate-600" />
            Needs attention ({candidates.length})
          </CardTitle>
          <CardDescription>
            PAN+Aadhaar = verification level ≥ 2. Rows include anyone below that or missing name / email /
            phone. &quot;Reminders sent&quot; shows counts when{" "}
            <code className="rounded bg-muted px-1 text-xs">all-user-details/</code> includes fields such as{" "}
            <code className="rounded bg-muted px-1 text-xs">profile_reminder_send_count</code> and{" "}
            <code className="rounded bg-muted px-1 text-xs">last_profile_reminder_at</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Loading users…
            </div>
          ) : candidates.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No users match incomplete KYC / profile rules.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b text-left">
                    <th className="p-3 w-10">
                      <Checkbox
                        checked={
                          candidates.length > 0 && selected.size === candidates.length
                        }
                        disabled={!canWrite}
                        onCheckedChange={(checked) => {
                          if (checked === true) {
                            setSelected(new Set(candidates.map((x) => x.c.user_id)));
                          } else {
                            setSelected(new Set());
                          }
                        }}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="p-3 font-semibold">User</th>
                    <th className="p-3 font-semibold">Contact</th>
                    <th className="p-3 font-semibold">Verification</th>
                    <th className="p-3 font-semibold">Why listed</th>
                    <th className="p-3 font-semibold min-w-[130px]">Reminders sent</th>
                    <th className="p-3 font-semibold w-[120px]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(({ c, reasons }) => {
                    const rem = getReminderDisplay(c);
                    return (
                    <tr key={c.user_id} className="border-b last:border-0">
                      <td className="p-3 align-top">
                        <Checkbox
                          checked={selected.has(c.user_id)}
                          disabled={!canWrite}
                          onCheckedChange={() => toggle(c.user_id)}
                          aria-label={`Select ${c.user_fullname || c.user_id}`}
                        />
                      </td>
                      <td className="p-3 align-top">
                        <div className="font-medium">{trim(c.user_fullname) || "—"}</div>
                        <div className="text-xs text-muted-foreground font-mono">{c.user_id}</div>
                      </td>
                      <td className="p-3 align-top">
                        <div className="text-xs">{trim(c.user_email) || "—"}</div>
                        <div className="text-xs text-muted-foreground">{trim(c.phone_number) || "—"}</div>
                      </td>
                      <td className="p-3 align-top tabular-nums">{c.verification_status ?? 0}</td>
                      <td className="p-3 align-top">
                        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
                          {reasons.map((r) => (
                            <li key={r}>{r}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3 align-top text-xs text-muted-foreground">
                        {rem.count != null || rem.lastLabel ? (
                          <div className="space-y-0.5">
                            {rem.count != null ? (
                              <div>
                                <span className="font-medium text-slate-700 tabular-nums">{rem.count}</span>{" "}
                                {rem.count === 1 ? "time" : "times"}
                              </div>
                            ) : (
                              <div className="text-slate-400">—</div>
                            )}
                            {rem.lastLabel ? <div>Last: {rem.lastLabel}</div> : null}
                          </div>
                        ) : (
                          <span className="text-slate-400" title="Add counts to all-user-details API response">
                            —
                          </span>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={sending || !canWrite}
                          title={!canWrite ? "Read-only role" : undefined}
                          onClick={() => void runSend([c.user_id])}
                        >
                          Send
                        </Button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
