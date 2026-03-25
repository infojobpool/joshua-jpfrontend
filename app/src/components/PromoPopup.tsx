"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const PROMO_DELAY_MS = 5000;
const AUTO_SLIDE_MS = 5500;
const STORAGE_KEY = "jobpool_promo_dismissed";

export interface PromoSlide {
  src: string;
  alt: string;
}

const DEFAULT_SLIDES: PromoSlide[] = [
  {
    src: "/images/welcome-bonus-banner.png",
    alt: "JobPool — join us and earn. Download the app.",
  },
  {
    src: "/images/promo-popup-slide-2.png",
    alt: "JobPool — early user launch rewards and benefits.",
  },
];

interface PromoPopupProps {
  /** Ordered slides; first is shown when the popup opens. */
  slides?: PromoSlide[];
  delayMs?: number;
  /** Time between automatic slide changes while the popup is open. */
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

  const transitionClass = reduceMotionRef.current ? "" : "transition-transform duration-500 ease-out";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-[95vw] sm:max-w-xl md:max-w-3xl overflow-hidden rounded-2xl shadow-2xl bg-[#0f172a]"
        role="dialog"
        aria-modal="true"
        aria-label="Promotion"
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-2 top-2 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60 active:scale-95"
          aria-label="Close promo"
        >
          <X className="size-5" />
        </button>

        <div className="relative w-full overflow-hidden">
          <div
            className={cn("flex", transitionClass)}
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {slides.map((slide) => (
              <div
                key={slide.src}
                className="w-full shrink-0 flex justify-center items-center bg-[#0f172a]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.src}
                  alt={slide.alt}
                  className="block w-full h-auto max-h-[85vh] object-contain"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {slides.length > 1 && (
          <div className="flex items-center justify-center gap-2 py-3 bg-black/30">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === index ? "w-6 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
                )}
                aria-label={`Show promotion ${i + 1} of ${slides.length}`}
                aria-current={i === index ? "true" : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
