"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const PROMO_DELAY_MS = 5000;
const AUTO_SLIDE_MS = 5000;
const STORAGE_KEY = "jobpool_promo_dismissed";

export interface PromoSlide {
  src: string;
  alt: string;
  /** Behind `object-contain` image — avoids wrong-color letterboxing. */
  panelClass: string;
}

const DEFAULT_SLIDES: PromoSlide[] = [
  {
    src: "/images/promopopup.JPG",
    alt: "JobPool — join us and earn. Download the app.",
    panelClass: "bg-[#0d2f66]",
  },
];

interface PromoPopupProps {
  slides?: PromoSlide[];
  delayMs?: number;
  autoSlideMs?: number;
}

export function PromoPopup({
  slides = DEFAULT_SLIDES,
  delayMs = PROMO_DELAY_MS,
  autoSlideMs = AUTO_SLIDE_MS,
}: PromoPopupProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      reduceMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const dismissedAt = typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY);
    if (dismissedAt) return;

    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [mounted, delayMs]);

  useEffect(() => {
    if (!visible || slides.length < 2) return;

    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, autoSlideMs);

    return () => window.clearInterval(id);
  }, [visible, slides.length, autoSlideMs]);

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  };

  const goTo = useCallback((i: number) => {
    setIndex(i);
  }, []);

  if (!visible) return null;

  const transitionClass = reduceMotionRef.current ? "" : "transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative w-full max-w-[min(96vw,400px)] sm:max-w-[min(94vw,440px)] overflow-hidden rounded-2xl sm:rounded-3xl",
          "shadow-[0_32px_64px_-16px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Promotion"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-20 flex size-10 items-center justify-center rounded-full bg-slate-950/55 text-white backdrop-blur-md transition hover:bg-slate-950/75 hover:scale-105 active:scale-95 ring-1 ring-white/15"
          aria-label="Close promo"
        >
          <X className="size-5" strokeWidth={2} />
        </button>

        <div className="relative w-full overflow-hidden">
          <div
            className={cn("flex", transitionClass)}
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide) => (
              <div
                key={slide.src}
                className={cn("w-full shrink-0 min-h-0", slide.panelClass)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="block w-full h-auto max-h-[min(88vh,760px)] object-cover object-center select-none"
                  draggable={false}
                />
              </div>
            ))}
          </div>

          {slides.length > 1 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-4 pt-16 bg-gradient-to-t from-black/35 via-black/10 to-transparent">
              <div
                className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/12 bg-black/30 px-3 py-2 backdrop-blur-md shadow-lg"
                role="tablist"
                aria-label="Promo slides"
              >
                {slides.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === index}
                    onClick={() => goTo(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      i === index
                        ? "w-7 bg-white shadow-[0_0_12px_rgba(255,255,255,0.35)]"
                        : "w-1.5 bg-white/45 hover:bg-white/70"
                    )}
                    aria-label={`Slide ${i + 1} of ${slides.length}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
