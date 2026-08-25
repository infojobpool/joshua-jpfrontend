"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { resolveApiMediaUrl } from "@/lib/profileImage";

interface Image {
  id: string;
  url: string;
  alt: string;
}

interface ImageGalleryModalProps {
  show: boolean;
  images: Image[];
  currentIndex: number;
  closeGallery: () => void;
  nextImage: (e: React.MouseEvent) => void;
  prevImage: (e: React.MouseEvent) => void;
}

/**
 * Full-screen lightbox. Resolves relative API paths for reliable mobile WebView loads;
 * high-contrast close control; counter in header with close (consistent layout).
 */
export function ImageGalleryModal({
  show,
  images,
  currentIndex,
  closeGallery,
  nextImage,
  prevImage,
}: ImageGalleryModalProps) {
  const [imgFailed, setImgFailed] = useState(false);

  const len = images.length;
  const safeIndex = len > 0 ? Math.max(0, Math.min(currentIndex, len - 1)) : 0;
  const current = len > 0 ? images[safeIndex] : null;
  const resolvedSrc = resolveApiMediaUrl(current?.url);

  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  useEffect(() => {
    setImgFailed(false);
  }, [show, safeIndex, resolvedSrc]);

  if (!show || len === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      onClick={closeGallery}
    >
      <header
        className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/10 bg-black/60 px-3 pb-3 pt-[max(12px,env(safe-area-inset-top))] backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="justify-self-start text-sm font-semibold tracking-tight text-white">Photos</span>
        <span className="justify-self-center text-sm tabular-nums text-white/90">
          {safeIndex + 1} / {len}
        </span>
        <div className="justify-self-end">
          <button
            type="button"
            className="inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-full bg-white px-4 text-slate-900 shadow-lg ring-2 ring-white/80 hover:bg-slate-100 active:scale-[0.98]"
            onClick={closeGallery}
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" strokeWidth={2.25} />
          </button>
        </div>
      </header>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 sm:px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex h-full w-full max-w-4xl items-center justify-center">
          <button
            type="button"
            className="absolute right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-20 inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-full bg-white px-4 text-slate-900 shadow-lg ring-2 ring-white/80 hover:bg-slate-100 active:scale-[0.98] sm:right-3"
            onClick={closeGallery}
            aria-label="Close gallery"
          >
            <X className="h-6 w-6" strokeWidth={2.25} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgFailed ? "/images/placeholder.svg" : resolvedSrc}
            alt={current?.alt || "Photo"}
            className="mx-auto max-h-[min(72dvh,calc(100dvh-11rem))] w-auto max-w-full object-contain select-none"
            decoding="async"
            fetchPriority="high"
            onError={() => setImgFailed(true)}
          />
          {len > 1 && (
            <>
              <button
                type="button"
                className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 p-2.5 text-white shadow-md ring-1 ring-white/20 hover:bg-black/85 sm:left-2"
                onClick={prevImage}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 p-2.5 text-white shadow-md ring-1 ring-white/20 hover:bg-black/85 sm:right-2"
                onClick={nextImage}
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  );
}
