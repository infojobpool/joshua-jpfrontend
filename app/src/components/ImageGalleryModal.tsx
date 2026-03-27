"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

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
 * Full-screen lightbox centered in the visible viewport. Uses explicit dvh-based max-height
 * so mobile WebViews don’t resolve % heights into a tall scroll area with the image at the bottom.
 */
export function ImageGalleryModal({
  show,
  images,
  currentIndex,
  closeGallery,
  nextImage,
  prevImage,
}: ImageGalleryModalProps) {
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  if (!show || images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] flex h-dvh max-h-dvh w-full flex-col overflow-hidden bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Task images"
      onClick={closeGallery}
    >
      <div
        className="flex shrink-0 items-center justify-end px-3 pt-[max(12px,env(safe-area-inset-top))] pb-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          onClick={closeGallery}
          aria-label="Close gallery"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* flex-1 + min-h-0 + overflow-hidden: bounded strip for the photo; no document-height scroll */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 sm:px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex w-full max-w-4xl items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[currentIndex].url}
            alt={images[currentIndex].alt}
            className="mx-auto h-auto max-h-[calc(100dvh-9.5rem)] w-auto max-w-full object-contain"
          />
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 sm:left-2"
                onClick={prevImage}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white hover:bg-black/80 sm:right-2"
                onClick={nextImage}
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      </div>

      <div
        className="shrink-0 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2 text-center text-sm text-white/90"
        onClick={(e) => e.stopPropagation()}
      >
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
