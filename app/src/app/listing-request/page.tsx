"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  MessageSquare,
  Package,
  ShieldCheck,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import useStore from "@/lib/Zustand";
import { resolveProfileImageUrl } from "@/lib/profileImage";
import type { OfferingType } from "@/lib/offerings/types";
import { newBookingId, saveBookingRequest } from "@/lib/listingBookings/storage";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const STEPS = [
  { n: 1, label: "Listing" },
  { n: 2, label: "Schedule" },
  { n: 3, label: "Budget" },
  { n: 4, label: "Confirm" },
] as const;

const TIME_WINDOWS = [
  { value: "morning", label: "Morning (before 12:00)" },
  { value: "afternoon", label: "Afternoon (12:00–17:00)" },
  { value: "evening", label: "Evening (after 17:00)" },
  { value: "flexible", label: "Flexible — discuss in chat" },
] as const;

export default function ListingRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userId, user, checkAuth, logout } = useStore();

  const providerId = (searchParams.get("providerId") || "").trim();
  const providerName = searchParams.get("providerName") || "Provider";
  const offeringId = searchParams.get("offeringId") || undefined;
  const offeringTitle = searchParams.get("title") || "";
  const listingType = (searchParams.get("type") === "product" ? "product" : "service") as OfferingType;
  const priceParam = searchParams.get("price");
  const listingStartingInr = Math.max(0, parseInt(priceParam || "0", 10) || 0);
  const locationText = searchParams.get("location") || "";

  const [step, setStep] = useState(1);
  const [preferredDate, setPreferredDate] = useState("");
  const [timeWindow, setTimeWindow] = useState<string>("flexible");
  /** String so the field can be cleared while typing; avoid `parseInt('') || 0` snapping back to 0 */
  const [budgetInput, setBudgetInput] = useState(() =>
    listingStartingInr > 0 ? String(listingStartingInr) : "",
  );
  const [notes, setNotes] = useState("");
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    setBudgetInput(listingStartingInr > 0 ? String(listingStartingInr) : "");
  }, [listingStartingInr]);

  const proposedBudgetInr = useMemo(() => {
    const n = parseInt(budgetInput.replace(/\s/g, ""), 10);
    return Number.isNaN(n) ? 0 : Math.max(0, n);
  }, [budgetInput]);

  const canProceed = useMemo(() => {
    if (step === 2) return Boolean(preferredDate.trim());
    if (step === 3) return budgetInput.trim() !== "" && proposedBudgetInr > 0;
    if (step === 4) return policyAccepted;
    return true;
  }, [step, preferredDate, budgetInput, proposedBudgetInr, policyAccepted]);

  const startMessageUrl = useMemo(() => {
    if (!userId || !providerId) return "/messages";
    const q = new URLSearchParams({
      receiver: providerId,
      receiverName: providerName,
    });
    if (offeringId) q.set("offering_id", offeringId);
    if (offeringTitle) q.set("context", `Hi — I'm interested in "${offeringTitle.slice(0, 80)}". `);
    return `/messages/new?${q.toString()}`;
  }, [userId, providerId, providerName, offeringId, offeringTitle]);

  const handleSignOut = useCallback(() => {
    logout();
    router.push("/");
  }, [logout, router]);

  const headerUser = useMemo(() => {
    const name = user?.name || "User";
    const raw = user?.profile_image || "";
    const avatar = raw ? resolveProfileImageUrl(raw) || raw : "/images/placeholder.svg";
    return { name, avatar };
  }, [user]);

  const submit = useCallback(() => {
    if (!userId) {
      toast.error("Please sign in to send a booking request.");
      return;
    }
    if (!providerId) {
      toast.error("Missing provider.");
      return;
    }
    if (!offeringTitle.trim()) {
      toast.error("Missing listing details. Open this flow from the profile listing card.");
      return;
    }
    if (!policyAccepted) {
      toast.error("Please confirm you understand payment and cancellation are agreed with the provider.");
      return;
    }
    const id = newBookingId();
    saveBookingRequest({
      id,
      providerId,
      providerName,
      requesterId: userId,
      offeringId,
      offeringTitle: offeringTitle.trim(),
      listingType,
      listingStartingInr,
      proposedBudgetInr,
      preferredDate: preferredDate.trim(),
      timeWindow,
      notes: notes.trim(),
      policyAccepted,
      status: "pending",
      createdAt: Date.now(),
    });
    setSubmittedId(id);
    toast.success("Request saved. Message the provider to confirm time and payment.");
  }, [
    userId,
    providerId,
    providerName,
    offeringId,
    offeringTitle,
    listingType,
    listingStartingInr,
    proposedBudgetInr,
    preferredDate,
    timeWindow,
    notes,
    policyAccepted,
  ]);

  if (!userId) {
    const next = `/listing-request?${searchParams.toString()}`;
    return (
      <div className="min-h-screen bg-slate-50">
        <Toaster />
        <div className="container max-w-lg mx-auto px-4 py-16 text-center">
          <Package className="h-12 w-12 text-slate-300 mx-auto" />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Sign in to request a booking</h1>
          <p className="mt-2 text-sm text-slate-600">
            Listing requests are separate from posting a task. You’ll confirm schedule and payment with the provider.
          </p>
          <Button asChild className="mt-6 rounded-xl bg-blue-600 hover:bg-blue-700">
            <Link href={`/signin?next=${encodeURIComponent(next)}`}>Sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!providerId || !offeringTitle.trim()) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Toaster />
        <div className="container max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-slate-700 font-medium">This page needs a listing link from a profile.</p>
          <Button asChild variant="outline" className="mt-4 rounded-xl">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (submittedId) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <Toaster />
        <Header user={headerUser} onSignOut={handleSignOut} minimal />
        <div className="container max-w-lg mx-auto px-4 py-10 pb-24">
          <Card className="border-0 shadow-lg rounded-2xl ring-1 ring-slate-200/80 overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-white border-b border-slate-100">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl mt-4">Request sent</CardTitle>
              <CardDescription>
                Your listing request is saved. Final time, price, and payment still need to be confirmed with{" "}
                <span className="font-medium text-slate-700">{providerName}</span> — use chat or your usual JobPool
                task flow when you’re ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Listing:</span> {offeringTitle}
              </p>
              <p>
                <span className="font-semibold text-slate-800">Preferred date:</span> {preferredDate}{" "}
                <span className="text-slate-500">({TIME_WINDOWS.find((t) => t.value === timeWindow)?.label})</span>
              </p>
              <p>
                <span className="font-semibold text-slate-800">Your budget line:</span> ₹
                {Math.round(proposedBudgetInr).toLocaleString("en-IN")}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="w-full rounded-xl bg-blue-600 hover:bg-blue-700">
                <Link href={startMessageUrl}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message {providerName}
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full rounded-xl">
                <Link href={providerId ? `/profilepage/${providerId}` : "/dashboard"}>Back to profile</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/80">
      <Toaster />
      <Header user={headerUser} onSignOut={handleSignOut} minimal />
      <div className="container max-w-xl mx-auto px-4 py-6 pb-28 lg:pb-12">
        <div className="mb-6">
          <Link
            href={providerId ? `/profilepage/${providerId}` : "/dashboard"}
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-slate-900 tracking-tight">Request a listing</h1>
          <p className="mt-1 text-sm text-slate-600">
            Separate from <span className="font-medium text-slate-800">Post a task</span> — this flow is for a specific
            service or product on someone’s profile.
          </p>
        </div>

        <div className="flex gap-1 mb-8">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className={`flex-1 h-1 rounded-full transition-colors ${step >= s.n ? "bg-blue-600" : "bg-slate-200"}`}
              aria-hidden
            />
          ))}
        </div>

        <Card className="border-0 shadow-lg rounded-2xl ring-1 ring-slate-200/80 overflow-hidden">
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg">Listing details</CardTitle>
                <CardDescription>You’re requesting this public listing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">{listingType}</p>
                  <p className="mt-1 font-semibold text-slate-900 text-base">{offeringTitle}</p>
                  {locationText ? <p className="mt-2 text-slate-600">{locationText}</p> : null}
                  <p className="mt-2 font-bold text-blue-800 tabular-nums">
                    Starting from ₹{Math.round(listingStartingInr).toLocaleString("en-IN")}
                  </p>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Instant confirmation and in-app payment for listings will arrive with a future update. For now, this
                  request records what you want and helps you open a direct chat with the provider.
                </p>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Schedule
                </CardTitle>
                <CardDescription>Pick a preferred date and time window.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pref-date">Preferred date</Label>
                  <Input
                    id="pref-date"
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time window</Label>
                  <div className="grid gap-2">
                    {TIME_WINDOWS.map((tw) => (
                      <label
                        key={tw.value}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                          timeWindow === tw.value
                            ? "border-blue-600 bg-blue-50/50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="tw"
                          value={tw.value}
                          checked={timeWindow === tw.value}
                          onChange={() => setTimeWindow(tw.value)}
                          className="text-blue-600"
                        />
                        {tw.label}
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <IndianRupee className="h-5 w-5 text-blue-600" />
                  Budget line
                </CardTitle>
                <CardDescription>
                  Shown as your proposed budget. The provider may confirm or adjust before any payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Proposed amount (₹)</Label>
                  <Input
                    id="budget"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder={listingStartingInr > 0 ? String(listingStartingInr) : "e.g. 500"}
                    value={budgetInput}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "");
                      setBudgetInput(digits);
                    }}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes for the provider (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Need 3 hours, materials included…"
                    rows={4}
                    className="rounded-xl resize-y min-h-[100px]"
                  />
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="text-lg">Confirm</CardTitle>
                <CardDescription>Payment and cancellation are not automated for listings yet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong className="text-slate-800">Payment:</strong> Agree amount and method (e.g. wallet, UPI,
                    task-based payment) directly with the provider or via a JobPool task if you choose that path.
                  </li>
                  <li>
                    <strong className="text-slate-800">Cancellation:</strong> Follow what you agree in chat and
                    JobPool’s general rules. No automatic refund is tied to this request until checkout ships.
                  </li>
                </ul>
                <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <Checkbox checked={policyAccepted} onCheckedChange={(v) => setPolicyAccepted(v === true)} className="mt-0.5" />
                  <span>I understand final price, payment, and cancellation terms are confirmed with the provider (or via a task), not by this button alone.</span>
                </label>
              </CardContent>
            </>
          )}

          <CardFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between border-t border-slate-100 bg-slate-50/50 py-4">
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              disabled={step <= 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            {step < 4 ? (
              <Button
                type="button"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                disabled={!canProceed}
                onClick={() => setStep((s) => Math.min(4, s + 1))}
              >
                Continue
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-xl bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                disabled={!canProceed}
                onClick={submit}
              >
                Submit request
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
