"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PortfolioSlide } from "@/lib/portfolio/types";
import { fetchPortfolioApi, putMyPortfolioApi } from "@/lib/portfolio/api";
import { newSlideId, PORTFOLIO_MAX_IMAGE_BYTES, PORTFOLIO_MAX_SLIDES } from "@/lib/portfolio/storage";
import { notifyPortfolioUpdated } from "@/lib/portfolio/events";
import { toast } from "sonner";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result ?? ""));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

type Props = {
  userId: string;
};

export function PortfolioEditorPanel({ userId }: Props) {
  const [slides, setSlides] = useState<PortfolioSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
    async (next: PortfolioSlide[]) => {
      setSaving(true);
      try {
        await putMyPortfolioApi(next);
        setSlides(next);
        notifyPortfolioUpdated();
      } catch {
        toast.error("Could not save portfolio. Try again.");
        await load();
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = PORTFOLIO_MAX_SLIDES - slides.length;
    if (room <= 0) {
      toast.error(`You can add up to ${PORTFOLIO_MAX_SLIDES} portfolio images.`);
      return;
    }
    const next = [...slides];
    for (const file of Array.from(files)) {
      if (next.length >= PORTFOLIO_MAX_SLIDES) break;
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image.`);
        continue;
      }
      if (file.size > PORTFOLIO_MAX_IMAGE_BYTES) {
        toast.error(`${file.name} is too large (max ${Math.round(PORTFOLIO_MAX_IMAGE_BYTES / 1024)} KB).`);
        continue;
      }
      try {
        const url = await readFileAsDataUrl(file);
        next.push({
          id: newSlideId(),
          url,
          caption: "",
          createdAt: Date.now(),
        });
      } catch {
        toast.error(`Could not read ${file.name}.`);
      }
    }
    if (next.length > slides.length) {
      await pushToServer(next);
      toast.success("Portfolio saved");
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

      <div className="flex flex-wrap gap-3 opacity-100" style={{ pointerEvents: saving ? "none" : undefined }}>
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
                disabled={saving}
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
                disabled={saving}
              />
            </div>
          </div>
        ))}

        {slides.length < PORTFOLIO_MAX_SLIDES && (
          <label
            className={`flex min-h-[140px] min-w-[140px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 hover:border-emerald-400 hover:text-emerald-700 transition-colors sm:max-w-[200px] ${saving ? "opacity-50 pointer-events-none" : ""}`}
          >
            <ImagePlus className="h-8 w-8" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Add image</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              disabled={saving}
              onChange={(e) => {
                void addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Up to {PORTFOLIO_MAX_SLIDES} images. For best results use compressed JPEG/WEBP; very large files may be rejected
        by the server.
      </p>

      {slides.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={saving}
          onClick={() => void pushToServer([])}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
