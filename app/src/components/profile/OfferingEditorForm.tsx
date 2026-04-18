"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Offering, OfferingType } from "@/lib/offerings/types";
import {
  validateForPublish,
  PROHIBITED_OFFERING_KEYWORDS,
  getMaxOfferingSlots,
} from "@/lib/offerings/policy";
import {
  createOfferingApi,
  updateOfferingApi,
  isOfferingLimitError,
  OFFERING_LIMIT_TOAST,
  uploadOfferingImageApi,
} from "@/lib/offerings/api";
import { readOfferingSubscriptionMock } from "@/lib/offerings/storage";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImagePlus, X } from "lucide-react";

const MAX_OFFERING_PHOTOS = 6;
const MAX_PHOTO_BYTES = 650 * 1024;

function isUnsyncedDraftId(id: string): boolean {
  return id.startsWith("of_");
}

function apiErrorMessage(e: unknown): string {
  if (isAxiosError(e)) {
    if (e.code === "ERR_NETWORK" || e.message === "Network Error") {
      return "Can't reach the server. Check your connection, or try again in a moment.";
    }
    const d = e.response?.data as { message?: string; detail?: string } | undefined;
    const m = d?.message ?? d?.detail;
    if (m) return String(m);
    if (e.message) return e.message;
  }
  const ax = e as { response?: { data?: { message?: string; detail?: string } } };
  const m = ax.response?.data?.message ?? ax.response?.data?.detail;
  if (m) return String(m);
  if (e instanceof Error) return e.message;
  return "Something went wrong. Please try again.";
}

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

function isDataUrl(url: string): boolean {
  return url.trim().toLowerCase().startsWith("data:");
}

export function OfferingEditorForm({ userId, initial, isNew }: Props) {
  const router = useRouter();
  const [o, setO] = useState<Offering>(initial);
  const [saving, setSaving] = useState(false);
  /** Prevents double Publish / Save while the first request is in flight (avoids duplicate listings). */
  const saveLockRef = useRef(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [imageUrlDraft, setImageUrlDraft] = useState("");
  const maxSlots = getMaxOfferingSlots(readOfferingSubscriptionMock());

  const update = useCallback((patch: Partial<Offering>) => {
    setO((prev) => ({ ...prev, ...patch, updatedAt: Date.now() }));
  }, []);

  const handleLimitError = () => {
    toast.error(OFFERING_LIMIT_TOAST, {
      action: { label: "Settings", onClick: () => router.push("/settings") },
    });
  };

  const hasInvalidPhotoUrls = (): boolean => (o.photoUrls ?? []).some(isDataUrl);

  const addImageFromUrl = () => {
    const raw = imageUrlDraft.trim();
    if (!raw) {
      toast.error("Paste an image URL.");
      return;
    }
    if (!/^https?:\/\//i.test(raw)) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    const current = o.photoUrls ?? [];
    if (current.length >= MAX_OFFERING_PHOTOS) {
      toast.error(`Maximum ${MAX_OFFERING_PHOTOS} images.`);
      return;
    }
    if (current.includes(raw)) {
      toast.error("That URL is already added.");
      return;
    }
    update({ photoUrls: [...current, raw] });
    setImageUrlDraft("");
    toast.success("Image link added");
  };

  const saveProgress = async () => {
    if (saveLockRef.current) return;
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
    if (hasInvalidPhotoUrls()) {
      toast.error(
        "Remove images that are still local previews (data URLs). Re-upload those photos or use a hosted link."
      );
      return;
    }
    saveLockRef.current = true;
    setSaving(true);
    try {
      const payload: Offering = {
        ...o,
        userId,
        status: o.status === "draft" ? "draft" : o.status,
        updatedAt: Date.now(),
      };
      let next: Offering;
      if (isUnsyncedDraftId(o.id)) {
        next = await createOfferingApi(payload);
      } else {
        next = await updateOfferingApi(o.id, payload, o);
      }
      setO(next);
      toast.success(next.status === "draft" ? "Draft saved" : "Changes saved");
      router.push("/profile");
    } catch (e) {
      if (isOfferingLimitError(e)) handleLimitError();
      else toast.error(apiErrorMessage(e));
    } finally {
      saveLockRef.current = false;
      setSaving(false);
    }
  };

  const publish = async () => {
    if (saveLockRef.current) return;
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
    if (hasInvalidPhotoUrls()) {
      toast.error(
        "Remove images that are still local previews (data URLs). Re-upload those photos or use a hosted link."
      );
      return;
    }
    saveLockRef.current = true;
    setSaving(true);
    try {
      const payload: Offering = { ...o, userId, status: "published", updatedAt: Date.now() };
      let next: Offering;
      if (isUnsyncedDraftId(o.id)) {
        next = await createOfferingApi(payload);
      } else {
        next = await updateOfferingApi(o.id, payload, o);
      }
      setO(next);
      toast.success("Offering published — visible on your profile");
      router.push("/profile");
    } catch (e) {
      if (isOfferingLimitError(e)) handleLimitError();
      else toast.error(apiErrorMessage(e));
    } finally {
      saveLockRef.current = false;
      setSaving(false);
    }
  };

  const pause = async () => {
    if (isUnsyncedDraftId(o.id)) {
      toast.error("Save the draft first before pausing.");
      return;
    }
    setSaving(true);
    try {
      const next = await updateOfferingApi(o.id, { status: "paused", updatedAt: Date.now() }, o);
      setO(next);
      toast.success("Offering hidden from public");
    } catch (e) {
      toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const resume = async () => {
    if (isUnsyncedDraftId(o.id)) return;
    setSaving(true);
    try {
      const next = await updateOfferingApi(o.id, { status: "published", updatedAt: Date.now() }, o);
      setO(next);
      toast.success("Offering is live again");
    } catch (e) {
      if (isOfferingLimitError(e)) handleLimitError();
      else toast.error(apiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const addPhotosFromFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const current = o.photoUrls ?? [];
    const room = MAX_OFFERING_PHOTOS - current.length;
    if (room <= 0) {
      toast.error(`You can add up to ${MAX_OFFERING_PHOTOS} photos per listing.`);
      return;
    }
    setUploadingPhotos(true);
    const nextUrls = [...current];
    try {
      for (const file of Array.from(files)) {
        if (nextUrls.length >= MAX_OFFERING_PHOTOS) break;
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image.`);
          continue;
        }
        if (file.size > MAX_PHOTO_BYTES) {
          toast.error(`${file.name} is too large (max ${Math.round(MAX_PHOTO_BYTES / 1024)} KB).`);
          continue;
        }
        try {
          const url = await uploadOfferingImageApi(file);
          nextUrls.push(url);
        } catch (e) {
          toast.error(apiErrorMessage(e) || `Upload failed for ${file.name}`);
        }
      }
      if (nextUrls.length > current.length) {
        update({ photoUrls: nextUrls });
        toast.success(`Added ${nextUrls.length - current.length} photo(s)`);
      }
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removePhotoAt = (index: number) => {
    const next = (o.photoUrls ?? []).filter((_, i) => i !== index);
    update({ photoUrls: next });
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
        <p className="mt-1 text-sm text-slate-500">Service or product — saved to your account. Public when published.</p>
      </div>

      {o.adminHidden ? (
        <div
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <p className="font-semibold">This listing is hidden by an administrator</p>
          <p className="mt-1 text-amber-900/90 leading-relaxed">
            It won&apos;t appear on the public feed or on your profile for others until support turns visibility back on.
            You can still edit it here.
          </p>
        </div>
      ) : null}

      <div className="flex rounded-xl bg-slate-100 p-1">
        {(["service", "product"] as OfferingType[]).map((t) => (
          <button
            key={t}
            type="button"
            disabled={saving}
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
          disabled={saving}
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
          disabled={saving}
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
          disabled={saving}
          style={PROFILE_FIELD_TEXT}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
        <div>
          <Label className="text-base">Listing photos</Label>
          <p className="text-xs text-slate-500 mt-1">
            Upload photos from your device — each file is uploaded and a link is saved with your listing. You can also
            paste a hosted image URL.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="off-img-url" className="text-xs text-slate-600">
              Or paste image URL (optional)
            </Label>
            <Input
              id="off-img-url"
              value={imageUrlDraft}
              onChange={(e) => setImageUrlDraft(e.target.value)}
              placeholder="https://example.com/your-photo.jpg"
              className="rounded-xl text-sm"
              disabled={saving || uploadingPhotos}
              style={PROFILE_FIELD_TEXT}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            className="rounded-xl shrink-0"
            disabled={saving || uploadingPhotos || (o.photoUrls ?? []).length >= MAX_OFFERING_PHOTOS}
              onClick={addImageFromUrl}
          >
            Add link
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(o.photoUrls ?? []).map((url, i) => (
            <div
              key={`${url.slice(0, 48)}_${i}`}
              className="relative h-20 w-20 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              {isDataUrl(url) ? (
                <span className="absolute bottom-0 left-0 right-0 bg-amber-600/90 text-[8px] font-bold uppercase text-white text-center py-0.5">
                  Preview
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => removePhotoAt(i)}
                disabled={saving || uploadingPhotos}
                className="absolute top-1 right-1 rounded-full bg-slate-900/85 p-1 text-white hover:bg-slate-900"
                aria-label={`Remove photo ${i + 1}`}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {(o.photoUrls ?? []).length < MAX_OFFERING_PHOTOS && (
            <label
              className={`flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-white text-slate-500 hover:border-emerald-400 hover:text-emerald-800 transition-colors ${uploadingPhotos ? "pointer-events-none opacity-50" : ""}`}
            >
              <ImagePlus className="h-6 w-6" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-center leading-tight px-0.5">
                {uploadingPhotos ? "…" : "Upload"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={saving || uploadingPhotos}
                onChange={(e) => {
                  void addPhotosFromFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="off-loc">Location / service area (text only)</Label>
        <Input
          id="off-loc"
          value={o.locationText}
          onChange={(e) => update({ locationText: e.target.value })}
          placeholder="e.g. Hyderabad — within 10 km of Gachibowli"
          className="rounded-xl"
          disabled={saving}
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
          value={
            o.status === "draft" && o.startingPriceInr === 0
              ? ""
              : Number.isNaN(o.startingPriceInr)
                ? ""
                : o.startingPriceInr
          }
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") update({ startingPriceInr: 0 });
            else update({ startingPriceInr: Math.max(0, parseInt(v, 10) || 0) });
          }}
          placeholder="e.g. 500"
          className="rounded-xl"
          disabled={saving}
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
            disabled={saving}
            onChange={(e) => update({ attestationAccepted: e.target.checked })}
            className="mt-1 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">
            I confirm this listing is accurate, uses my own wording, and does not impersonate anyone else.
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          className="rounded-xl border-slate-300"
          disabled={saving}
          onClick={() => void saveProgress()}
        >
          {o.status === "draft" ? "Save draft" : "Save changes"}
        </Button>
        {o.status === "draft" && (
          <Button type="button" className="rounded-xl bg-emerald-600 hover:bg-emerald-700" disabled={saving} onClick={() => void publish()}>
            Publish
          </Button>
        )}
        {o.status === "published" && (
          <Button type="button" variant="secondary" className="rounded-xl" disabled={saving} onClick={() => void pause()}>
            Pause (hide)
          </Button>
        )}
        {o.status === "paused" && (
          <Button type="button" variant="secondary" className="rounded-xl" disabled={saving} onClick={() => void resume()}>
            Resume
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Typical free plan: up to {maxSlots} published or paused listings (server-enforced).{" "}
        <Link href="/settings" className="font-medium text-emerald-700 underline-offset-2 hover:underline">
          Settings
        </Link>{" "}
        for subscription when available.
      </p>
    </div>
  );
}
