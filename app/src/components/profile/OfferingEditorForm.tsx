"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Offering, OfferingType } from "@/lib/offerings/types";
import {
  countSlotsUsed,
  getMaxOfferingSlots,
  validateForPublish,
  PROHIBITED_OFFERING_KEYWORDS,
} from "@/lib/offerings/policy";
import {
  loadOfferings,
  upsertOffering,
  readOfferingSubscriptionMock,
} from "@/lib/offerings/storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PROFILE_FIELD_TEXT = {
  color: "#0f172a",
  WebkitTextFillColor: "#0f172a",
  caretColor: "#0f172a",
} as const;

type Props = {
  userId: string;
  initial: Offering;
  isNew: boolean;
};

export function OfferingEditorForm({ userId, initial, isNew }: Props) {
  const router = useRouter();
  const [o, setO] = useState<Offering>(initial);
  const maxSlots = getMaxOfferingSlots(readOfferingSubscriptionMock());

  const update = useCallback((patch: Partial<Offering>) => {
    setO((prev) => ({ ...prev, ...patch, updatedAt: Date.now() }));
  }, []);

  const saveProgress = () => {
    if (o.status !== "draft") {
      const err = validateForPublish({
        title: o.title,
        description: o.description,
        category: o.category,
        locationText: o.locationText,
        startingPriceInr: o.startingPriceInr,
        attestationAccepted: o.attestationAccepted,
      });
      if (err) {
        toast.error(err);
        return;
      }
    }
    const next: Offering = {
      ...o,
      status: o.status === "draft" ? "draft" : o.status,
      updatedAt: Date.now(),
    };
    upsertOffering(userId, next);
    setO(next);
    toast.success(next.status === "draft" ? "Draft saved" : "Changes saved");
    router.push("/profile");
  };

  const publish = () => {
    const err = validateForPublish({
      title: o.title,
      description: o.description,
      category: o.category,
      locationText: o.locationText,
      startingPriceInr: o.startingPriceInr,
      attestationAccepted: o.attestationAccepted,
    });
    if (err) {
      toast.error(err);
      return;
    }
    const all = loadOfferings(userId);
    const used = countSlotsUsed(all);
    const wasSlot = o.status === "published" || o.status === "paused";
    const nextUsed = wasSlot ? used : used + 1;
    if (nextUsed > maxSlots) {
      toast.error(
        `You can have up to ${maxSlots} public listings on your plan. Pause or remove one, or upgrade your subscription.`
      );
      return;
    }
    const next: Offering = { ...o, status: "published", updatedAt: Date.now() };
    upsertOffering(userId, next);
    toast.success("Offering published — visible on your profile");
    router.push("/profile");
  };

  const pause = () => {
    const next: Offering = { ...o, status: "paused", updatedAt: Date.now() };
    upsertOffering(userId, next);
    setO(next);
    toast.success("Offering hidden from public");
  };

  const resume = () => {
    const all = loadOfferings(userId);
    const used = countSlotsUsed(all.filter((x) => x.id !== o.id));
    if (used >= maxSlots) {
      toast.error(`Active slot limit (${maxSlots}) reached. Pause another listing or upgrade.`);
      return;
    }
    const next: Offering = { ...o, status: "published", updatedAt: Date.now() };
    upsertOffering(userId, next);
    setO(next);
    toast.success("Offering is live again");
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8 md:px-0">
      <div className="flex items-center justify-between gap-3">
        <Link href="/profile" className="text-sm font-medium text-emerald-700 hover:underline">
          ← Back to profile
        </Link>
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">{isNew ? "New offering" : "Edit offering"}</h1>
        <p className="mt-1 text-sm text-slate-500">Service or product — separate from tasks. Public when published.</p>
      </div>

      <div className="flex rounded-xl bg-slate-100 p-1">
        {(["service", "product"] as OfferingType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => update({ type: t })}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
              o.type === t ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600 hover:text-slate-800"
            )}
          >
            {t === "service" ? "Service" : "Product"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="off-title">Title</Label>
        <Input
          id="off-title"
          value={o.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="e.g. Weekend home cleaning"
          className="rounded-xl"
          style={PROFILE_FIELD_TEXT}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="off-cat">Category (you define)</Label>
        <Input
          id="off-cat"
          value={o.category}
          onChange={(e) => update({ category: e.target.value })}
          placeholder="e.g. Cleaning, Tutoring, Handmade goods"
          className="rounded-xl"
          style={PROFILE_FIELD_TEXT}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="off-desc">Description</Label>
        <Textarea
          id="off-desc"
          value={o.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="What you offer, what’s included, your experience…"
          rows={5}
          className="rounded-xl resize-y min-h-[120px]"
          style={PROFILE_FIELD_TEXT}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="off-loc">Location / service area (text only)</Label>
        <Input
          id="off-loc"
          value={o.locationText}
          onChange={(e) => update({ locationText: e.target.value })}
          placeholder="e.g. Hyderabad — within 10 km of Gachibowli"
          className="rounded-xl"
          style={PROFILE_FIELD_TEXT}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="off-price">Starting from (₹)</Label>
        <Input
          id="off-price"
          type="number"
          min={0}
          step={1}
          value={Number.isNaN(o.startingPriceInr) ? "" : o.startingPriceInr}
          onChange={(e) => update({ startingPriceInr: Math.max(0, parseInt(e.target.value, 10) || 0) })}
          className="rounded-xl"
          style={PROFILE_FIELD_TEXT}
        />
        <p className="text-xs text-slate-500">Shown publicly as &quot;Starting from ₹…&quot;</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rules</p>
        <ul className="text-xs text-slate-600 list-disc pl-4 space-y-1">
          <li>No prohibited goods or services (e.g. weapons, illegal items, exploitation).</li>
          <li>Use only your own description; do not impersonate another business or person.</li>
        </ul>
        <p className="text-[11px] text-slate-500">
          Automated checks include keywords such as: {PROHIBITED_OFFERING_KEYWORDS.slice(0, 6).join(", ")}…
        </p>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={o.attestationAccepted}
            onChange={(e) => update({ attestationAccepted: e.target.checked })}
            className="mt-1 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">
            I confirm this listing is accurate, uses my own wording, and does not impersonate anyone else.
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="button" variant="outline" className="rounded-xl border-slate-300" onClick={saveProgress}>
          {o.status === "draft" ? "Save draft" : "Save changes"}
        </Button>
        {o.status === "draft" && (
          <Button type="button" className="rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={publish}>
            Publish
          </Button>
        )}
        {o.status === "published" && (
          <Button type="button" variant="secondary" className="rounded-xl" onClick={pause}>
            Pause (hide)
          </Button>
        )}
        {o.status === "paused" && (
          <Button type="button" variant="secondary" className="rounded-xl" onClick={resume}>
            Resume
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Free plan: up to {maxSlots} published or paused listings.{" "}
        <Link href="/settings" className="font-medium text-emerald-700 underline-offset-2 hover:underline">
          Subscription
        </Link>{" "}
        unlocks more when available.
      </p>
    </div>
  );
}
