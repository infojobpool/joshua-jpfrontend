"use client";

import { useCallback, useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PortfolioSlide } from "@/lib/portfolio/types";
import {
  loadPortfolio,
  newSlideId,
  PORTFOLIO_MAX_IMAGE_BYTES,
  PORTFOLIO_MAX_SLIDES,
  savePortfolio,
} from "@/lib/portfolio/storage";
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

  const refresh = useCallback(() => {
    setSlides(loadPortfolio(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const persist = useCallback(
    (next: PortfolioSlide[]) => {
      savePortfolio(userId, next);
      setSlides(next);
      notifyPortfolioUpdated();
    },
    [userId]
  );

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const current = loadPortfolio(userId);
    const room = PORTFOLIO_MAX_SLIDES - current.length;
    if (room <= 0) {
      toast.error(`You can add up to ${PORTFOLIO_MAX_SLIDES} portfolio images.`);
      return;
    }
    const next = [...current];
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
    persist(next);
    if (next.length > current.length) toast.success("Portfolio updated");
  };

  const removeAt = (index: number) => {
    const next = loadPortfolio(userId).filter((_, i) => i !== index);
    persist(next);
  };

  const setCaption = (index: number, caption: string) => {
    const next = loadPortfolio(userId).map((s, i) =>
      i === index ? { ...s, caption: caption.slice(0, 120) } : s
    );
    persist(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        This showcase appears above your offerings. Listing cards can still use their own photos — portfolio is for a
        broader gallery (projects, products, team, etc.).
      </p>

      <div className="flex flex-wrap gap-3">
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
                onClick={() => removeAt(i)}
                className="absolute top-2 right-2 rounded-full bg-slate-900/85 p-1.5 text-white hover:bg-slate-900"
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
                  setCaption(i, v);
                }}
                placeholder="e.g. Kitchen remodel — Hitech City"
                className="rounded-lg text-sm h-9"
              />
            </div>
          </div>
        ))}

        {slides.length < PORTFOLIO_MAX_SLIDES && (
          <label className="flex min-h-[140px] min-w-[140px] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-500 hover:border-emerald-400 hover:text-emerald-700 transition-colors sm:max-w-[200px]">
            <ImagePlus className="h-8 w-8" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-wide">Add image</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                void addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Up to {PORTFOLIO_MAX_SLIDES} images, {Math.round(PORTFOLIO_MAX_IMAGE_BYTES / 1024)} KB each. Stored on this
        device until a cloud portfolio API is available.
      </p>

      {slides.length > 0 && (
        <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={() => persist([])}>
          Clear all
        </Button>
      )}
    </div>
  );
}
