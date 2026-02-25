"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const PROMO_DELAY_MS = 5000;
const STORAGE_KEY = "jobpool_promo_dismissed";

interface PromoPopupProps {
  imageSrc?: string;
  imageAlt?: string;
  delayMs?: number;
}

export function PromoPopup({
  imageSrc = "/images/promo-popup.png",
  imageAlt = "Promotional offer",
  delayMs = PROMO_DELAY_MS,
}: PromoPopupProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const dismissedAt = typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY);
    if (dismissedAt) return;

    const timer = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(timer);
  }, [mounted, delayMs]);

  const handleClose = () => {
    setVisible(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      {/* Popup card - larger on desktop, no white bleed, image extends to fill */}
      <div className="relative w-full max-w-[95vw] sm:max-w-xl md:max-w-3xl overflow-hidden rounded-2xl shadow-2xl bg-[#0f172a]">
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60 active:scale-95"
          aria-label="Close promo"
        >
          <X className="size-5" />
        </button>
        <div className="relative w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageSrc}
            alt={imageAlt}
            className="block w-full h-auto max-h-[85vh] object-contain"
          />
        </div>
      </div>
    </div>
  );
}
