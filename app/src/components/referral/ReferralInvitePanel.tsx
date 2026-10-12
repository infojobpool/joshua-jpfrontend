"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Copy,
  Gift,
  Loader2,
  MessageCircle,
  Share2,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  enrichSummaryFromReferrals,
  fetchReferralList,
  fetchReferralSummary,
  referralStatusLabel,
  type ReferralEntry,
  type ReferralSummary,
} from "@/lib/referral/referralApi";
import {
  REFERRAL_INVITE_TAGLINE,
  REFERRAL_MILESTONE_REWARD_INR,
  REFERRAL_MILESTONE_VERIFIED_COUNT,
  REFERRAL_QUALIFYING_COPY,
  WELCOME_BONUS_INR,
} from "@/lib/referral/constants";
import {
  buildWhatsAppShareUrl,
  copyReferralCode,
  copyReferralLink,
} from "@/lib/referral/referralShare";
import { ReferralMilestoneDots } from "@/components/referral/ReferralMilestoneDots";
type Props = {
  userId: string;
  userName?: string;
  compact?: boolean;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatInr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

function statusBadgeClass(status: ReferralEntry["status"]): string {
  switch (status) {
    case "credited":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "qualified":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "pending":
      return "bg-amber-100 text-amber-900 border-amber-200";
    case "expired":
    case "cancelled":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function ReferralInvitePanel({ userId, userName, compact = false }: Props) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [referrals, setReferrals] = useState<ReferralEntry[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, list] = await Promise.all([
        fetchReferralSummary(userId),
        fetchReferralList(userId),
      ]);
      setReferrals(list);
      setSummary(enrichSummaryFromReferrals(s, list));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const milestoneUi = useMemo(() => {
    if (!summary) return null;
    const required = summary.milestone_verified_required || REFERRAL_MILESTONE_VERIFIED_COUNT;
    const toward = summary.milestone_progress_toward_next;
    const progressPercent =
      toward === 0 && summary.verified_referee_count > 0
        ? 100
        : Math.round((toward / required) * 100);
    const remaining = toward === 0 ? required : required - toward;
    return { required, toward, progressPercent, remaining };
  }, [summary]);

  const onCopyCode = async () => {
    if (!summary) return;
    const ok = await copyReferralCode(summary.referral_code);
    toast.success(ok ? "Referral code copied" : "Could not copy — select and copy manually");
  };

  const onCopyLink = async () => {
    if (!summary) return;
    const ok = await copyReferralLink(summary.referral_code);
    toast.success(ok ? "Invite link copied" : "Could not copy link");
  };

  const onWhatsApp = () => {
    if (!summary) return;
    window.open(buildWhatsAppShareUrl(summary.referral_code, userName), "_blank", "noopener,noreferrer");
  };

  if (loading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm">Loading your invite link…</p>
      </div>
    );
  }

  if (!summary || !milestoneUi) return null;

  const steps = [
    {
      title: "Share your link",
      body: "Invite as many friends as you like — anyone can sign up with your code or link.",
    },
    {
      title: "They verify their profile",
      body: `Each friend gets ₹${WELCOME_BONUS_INR} welcome bonus after they complete the same payout checklist as you (PAN, Aadhaar, name, mobile, UPI, etc.).`,
    },
    {
      title: `You earn ₹${REFERRAL_MILESTONE_REWARD_INR} per ${REFERRAL_MILESTONE_VERIFIED_COUNT} verified friends`,
      body: `When ${REFERRAL_MILESTONE_VERIFIED_COUNT} invited friends finish full verification, ₹${REFERRAL_MILESTONE_REWARD_INR} is added to your wallet. Every ${REFERRAL_MILESTONE_VERIFIED_COUNT} after that pays again — they can invite others the same way.`,
    },
  ];

  const progressLabel =
    milestoneUi.toward === 0 && summary.verified_referee_count > 0
      ? `${milestoneUi.required} of ${milestoneUi.required} verified — milestone complete`
      : `${milestoneUi.toward} of ${milestoneUi.required} verified toward next ${formatInr(summary.milestone_reward_inr)}`;

  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <Card className="overflow-hidden border-0 shadow-xl shadow-indigo-500/20 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700 text-white relative">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)]"
          aria-hidden
        />
        <CardHeader className="pb-2 relative">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
              <Gift className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <CardTitle className="text-xl text-white">Invite friends, earn wallet credit</CardTitle>
              <CardDescription className="text-indigo-100/95 mt-1">{REFERRAL_INVITE_TAGLINE}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-2 relative">
          <div className="rounded-xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-[2px]">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100/90">Your code</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-wide">{summary.referral_code}</p>
            <p className="mt-2 break-all text-sm text-indigo-100/90">{summary.referral_link}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="bg-white text-indigo-900 hover:bg-indigo-50"
              onClick={() => void onCopyCode()}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy code
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="bg-white/95 text-indigo-900 hover:bg-white"
              onClick={() => void onCopyLink()}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Copy link
            </Button>
            <Button
              type="button"
              className="bg-[#25D366] hover:bg-[#20bd5a] text-white border-0"
              onClick={onWhatsApp}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              WhatsApp
            </Button>
          </div>
          <p className="text-xs text-indigo-100/85">
            <Link href="/referral-terms" className="underline underline-offset-2 hover:text-white">
              Referral terms
            </Link>{" "}
            apply.
          </p>
        </CardContent>
      </Card>

      {!compact ? (
        <Card className="rounded-2xl border-violet-200/80 shadow-md bg-gradient-to-br from-white to-violet-50/40">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-violet-600" aria-hidden />
              <CardTitle className="text-base">Next ₹{summary.milestone_reward_inr} reward</CardTitle>
            </div>
            <CardDescription>{progressLabel}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ReferralMilestoneDots
              toward={milestoneUi.toward}
              required={milestoneUi.required}
              milestoneJustCompleted={
                milestoneUi.toward === 0 && summary.verified_referee_count > 0
              }
              className="max-w-full"
            />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100">
                <p className="text-xs text-slate-500">Referral earnings</p>
                <p className="font-bold text-slate-900 tabular-nums">{formatInr(summary.total_earned_inr)}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100">
                <p className="text-xs text-slate-500">Milestones paid</p>
                <p className="font-bold text-slate-900 tabular-nums">{summary.milestones_completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {!compact ? (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Verifying", value: summary.pending_count, icon: Users },
            { label: "Verified", value: summary.verified_referee_count, icon: Gift },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="rounded-xl border-slate-200/80 shadow-sm">
              <CardContent className="p-4 text-center">
                <Icon className="mx-auto h-5 w-5 text-indigo-600 mb-2" aria-hidden />
                <p className="text-lg font-bold text-slate-900 tabular-nums">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!compact ? (
        <Card className="rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">How it works</CardTitle>
            <CardDescription>{REFERRAL_QUALIFYING_COPY}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{step.body}</p>
                </div>
              </div>
            ))}
            <Link
              href="/wallet"
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800"
            >
              <Wallet className="h-4 w-4" />
              View wallet balance
            </Link>
          </CardContent>
        </Card>
      ) : null}

      {!compact ? (
        <Card className="rounded-2xl border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Your invites</CardTitle>
            <CardDescription>
              {referrals.length === 0
                ? "No invites yet — share your link to get started."
                : `${referrals.length} friend${referrals.length === 1 ? "" : "s"} invited`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {referrals.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">
                When someone signs up with your link, they will appear here.
              </p>
            ) : (
              <ul className="space-y-2">
                {referrals.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-violet-700 ring-1 ring-violet-100">
                        {(row.referee_name?.[0] ?? "?").toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{row.referee_name}</p>
                        <p className="text-xs text-slate-500">Joined {formatDate(row.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={statusBadgeClass(row.status)}>
                      {referralStatusLabel(row.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
