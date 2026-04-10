"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PortfolioSlide } from "@/lib/portfolio/types";
import { fetchPortfolioApi, putMyPortfolioApi, uploadPortfolioImageApi } from "@/lib/portfolio/api";
import { newSlideId, PORTFOLIO_MAX_IMAGE_BYTES, PORTFOLIO_MAX_SLIDES } from "@/lib/portfolio/storage";
import { notifyPortfolioUpdated } from "@/lib/portfolio/events";
import { toast } from "sonner";

function apiErr(e: unknown): string {
  const ax = e as { response?: { data?: { message?: string; detail?: string } } };
  const m = ax.response?.data?.message ?? ax.response?.data?.detail;
  if (m) return String(m);
  if (e instanceof Error) return e.message;
  return "Upload failed";
}

type Props = {
  userId: string;
};

export function PortfolioEditorPanel({ userId }: Props) {
  const [slides, setSlides] = useState<PortfolioSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [imageUrlDraft, setImageUrlDraft] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await fetchPortfolioApi(userId);
      setSlides(data);
    } catch {
      toast.error("Could not load portfolio.");
      setSlides([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pushToServer = useCallback(
    async (next: PortfolioSlide[]): Promise<boolean> => {
      setSaving(true);
      try {
        await putMyPortfolioApi(next);
        setSlides(next);
        notifyPortfolioUpdated();
        return true;
      } catch {
        toast.error("Could not save portfolio. Try again.");
        await load();
        return false;
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const addImageFromUrl = async () => {
    const raw = imageUrlDraft.trim();
    if (!raw) {
      toast.error("Paste an image URL.");
      return;
    }
    if (!/^https?:\/\//i.test(raw)) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    if (slides.length >= PORTFOLIO_MAX_SLIDES) {
      toast.error(`You can add up to ${PORTFOLIO_MAX_SLIDES} portfolio images.`);
      return;
    }
    if (slides.some((s) => s.url === raw)) {
      toast.error("That URL is already in your portfolio.");
      return;
    }
    const next: PortfolioSlide[] = [
      ...slides,
      { id: newSlideId(), url: raw, caption: "", createdAt: Date.now() },
    ];
    const ok = await pushToServer(next);
    if (ok) {
      setImageUrlDraft("");
      toast.success("Portfolio saved");
    }
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = PORTFOLIO_MAX_SLIDES - slides.length;
    if (room <= 0) {
      toast.error(`You can add up to ${PORTFOLIO_MAX_SLIDES} portfolio images.`);
      return;
    }
    setUploadingPhotos(true);
    try {
      const newSlides: PortfolioSlide[] = [];
      for (const file of Array.from(files)) {
        if (slides.length + newSlides.length >= PORTFOLIO_MAX_SLIDES) break;
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image.`);
          continue;
        }
        if (file.size > PORTFOLIO_MAX_IMAGE_BYTES) {
          toast.error(`${file.name} is too large (max ${Math.round(PORTFOLIO_MAX_IMAGE_BYTES / 1024)} KB).`);
          continue;
        }
        try {
          const url = await uploadPortfolioImageApi(file);
          newSlides.push({
            id: newSlideId(),
            url,
            caption: "",
            createdAt: Date.now(),
          });
        } catch (e) {
          toast.error(apiErr(e));
        }
      }
      if (newSlides.length === 0) return;
      const next = [...slides, ...newSlides];
      const ok = await pushToServer(next);
      if (ok) toast.success("Portfolio saved");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const removeAt = async (index: number) => {
    const next = slides.filter((_, i) => i !== index);
    await pushToServer(next);
  };

  const setCaption = async (index: number, caption: string) => {
    const next = slides.map((s, i) => (i === index ? { ...s, caption: caption.slice(0, 120) } : s));
    await pushToServer(next);
  };

  const busy = saving || uploadingPhotos;

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        This showcase appears above your offerings. Listing cards can still use their own photos — portfolio is for a
        broader gallery (projects, products, team, etc.). Saved to your account via the API.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor="portfolio-img-url" className="text-xs text-slate-600">
            Or add image by URL
          </Label>
          <Input
            id="portfolio-img-url"
            value={imageUrlDraft}
            onChange={(e) => setImageUrlDraft(e.target.value)}
            placeholder="https://…/your-photo.jpg"
            className="rounded-lg text-sm h-9"
            disabled={busy}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="rounded-lg shrink-0"
          disabled={busy || slides.length >= PORTFOLIO_MAX_SLIDES}
          onClick={() => void addImageFromUrl()}
        >
          Add link
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 opacity-100" style={{ pointerEvents: busy ? "none" : undefined }}>
        {slides.map((s, i) => (
          <div
            key={s.id}
            className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)] rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => void removeAt(i)}
                disabled={busy}
                className="absolute top-2 right-2 rounded-full bg-slate-900/85 p-1.5 text-white hover:bg-slate-900 disabled:opacity-50"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Caption (optional)</Label>
              <Input
                key={`${s.id}-cap`}
                defaultValue={s.caption}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v === s.caption) return;
                  void setCaption(i, v);
                }}
                placeholder="e.g. Kitchen remodel — Hitech City"
                className="rounded-lg text-sm h-9"
                disabled={busy}
              />
            </div>
          </div>
        ))}

        {slides.length < PORTFOLIO_MAX_SLIDES && (
          <label
            className={`flex min-h-[140px] min-w-[140px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 hover:border-emerald-400 hover:text-emerald-800 transition-colors sm:max-w-[200px] ${busy ? "opacity-50 pointer-events-none" : ""}`}
          >
            <ImagePlus className="h-8 w-8" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide text-center px-1">
              {uploadingPhotos ? "Uploading…" : "Upload photos"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                void addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Upload images from your device (stored via the API) or paste a hosted link. Up to {PORTFOLIO_MAX_SLIDES}{" "}
        images; very large files may be rejected by the server.
      </p>

      {slides.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={busy}
          onClick={() => void pushToServer([])}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
