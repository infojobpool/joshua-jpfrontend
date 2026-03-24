"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Mail, MessageCircle, RefreshCw, Send, UserX, AlertCircle } from "lucide-react";
import { sendIncompleteProfileReminders, type ReminderRecipient } from "@/lib/reminderApi";

interface CustomerRow {
  user_id: string;
  user_fullname: string;
  user_email: string;
  phone_number?: string;
  verification_status: number;
  created_at?: string;
  joined_at?: string;
  date_joined?: string;
}

function trim(s?: string) {
  return (s || "").trim();
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

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("all-user-details/");
      const raw = response.data?.data ?? response.data;
      const list = Array.isArray(raw) ? raw : [];
      setCustomers(list as CustomerRow[]);
    } catch {
      toast.error("Could not load users");
      setCustomers([]);
    } finally {
      setLoading(false);
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

      <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <AlertCircle className="h-5 w-5 shrink-0" />
            Backend-first (recommended)
          </CardTitle>
          <CardDescription className="text-amber-900/85 dark:text-amber-200/90 text-sm leading-relaxed">
            The admin app calls your <strong>FastAPI</strong> route first (
            <code className="text-xs bg-white/80 dark:bg-slate-900 px-1 rounded">
              POST /api/v1/admin/remind-incomplete-profile/
            </code>
            ). Implement that endpoint to use your email + WhatsApp services with keys stored only on the
            server. If it returns 404, the UI may fall back to the optional Vercel route (
            <code className="text-xs">REMINDER_*</code> in <code className="text-xs">.env.example</code>
            ). Daily automatic sends still need a <strong>cron</strong> on the backend.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => fetchCustomers()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Refresh list</span>
        </Button>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
          disabled={sending || selected.size === 0}
          onClick={() => void runSend(Array.from(selected))}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
          Send email + WhatsApp to selected ({selected.size})
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={sending || candidates.length === 0}
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
            phone.
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
                    <th className="p-3 font-semibold w-[120px]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map(({ c, reasons }) => (
                    <tr key={c.user_id} className="border-b last:border-0">
                      <td className="p-3 align-top">
                        <Checkbox
                          checked={selected.has(c.user_id)}
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
                      <td className="p-3 align-top">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={sending}
                          onClick={() => void runSend([c.user_id])}
                        >
                          Send
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
