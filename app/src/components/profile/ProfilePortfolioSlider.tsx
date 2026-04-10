"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";
import { loadPortfolio } from "@/lib/portfolio/storage";
import { PORTFOLIO_UPDATE_EVENT } from "@/lib/portfolio/events";
import { ImageGalleryModal } from "@/components/ImageGalleryModal";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  viewerIsOwner?: boolean;
  className?: string;
};

export function ProfilePortfolioSlider({ userId, viewerIsOwner, className }: Props) {
  const [tick, setTick] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTick((t) => t + 1);
  }, [userId]);

  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    const onPortfolio = () => setTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    window.addEventListener(PORTFOLIO_UPDATE_EVENT, onPortfolio);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(PORTFOLIO_UPDATE_EVENT, onPortfolio);
    };
  }, []);

  const items = useMemo(() => {
    void tick;
    return loadPortfolio(userId);
  }, [userId, tick]);

  const galleryImages = useMemo(
    () =>
      items.map((x) => ({
        id: x.id,
        url: x.url,
        alt: x.caption || "Portfolio",
      })),
    [items]
  );

  const openAt = (i: number) => {
    setGalleryIndex(i);
    setGalleryOpen(true);
  };

  const nextImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (galleryImages.length === 0) return;
      setGalleryIndex((i) => (i + 1) % galleryImages.length);
    },
    [galleryImages.length]
  );

  const prevImage = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (galleryImages.length === 0) return;
      setGalleryIndex((i) => (i - 1 + galleryImages.length) % galleryImages.length);
    },
    [galleryImages.length]
  );

  const scrollStrip = (dir: -1 | 1) => {
    const el = stripRef.current;
    if (!el) return;
    const delta = Math.min(300, Math.max(200, el.clientWidth * 0.75)) * dir;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (items.length === 0) {
    if (!viewerIsOwner) {
      return null;
    }
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed border-slate-200/90 bg-gradient-to-br from-slate-50/90 via-white to-emerald-50/25 p-5 sm:p-6",
          className
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
              <Images className="h-6 w-6" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Portfolio showcase</h3>
              <p className="mt-1 text-sm text-slate-600 max-w-lg">
                Add your own photos here — work samples, products, before/afters. This slider is separate from listing
                card images.
              </p>
            </div>
          </div>
          <Link
            href="/profile#profile-portfolio"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition-colors"
          >
            Build portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex items-end justify-between gap-3 mb-3 px-0.5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Portfolio</h3>
          <p className="text-sm font-medium text-slate-800 mt-0.5">Showcase — swipe or use arrows</p>
        </div>
        {viewerIsOwner ? (
          <Link
            href="/profile#profile-portfolio"
            className="text-xs font-semibold text-emerald-700 hover:underline shrink-0"
          >
            Edit portfolio
          </Link>
        ) : null}
      </div>

      <div className="relative -mx-1">
        {items.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => scrollStrip(-1)}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2 shadow-md ring-1 ring-slate-200/80 hover:bg-white hidden sm:flex"
              aria-label="Previous slides"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
            <button
              type="button"
              onClick={() => scrollStrip(1)}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/95 p-2 shadow-md ring-1 ring-slate-200/80 hover:bg-white hidden sm:flex"
              aria-label="Next slides"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          </>
        ) : null}

        <div
          ref={stripRef}
          className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 sm:px-10 snap-x snap-mandatory [scrollbar-width:thin] scroll-smooth"
        >
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openAt(idx)}
              className="group relative shrink-0 snap-start overflow-hidden rounded-2xl ring-1 ring-slate-900/10 shadow-md w-[min(92vw,300px)] aspect-[4/3] bg-slate-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent" />
              {item.caption ? (
                <span className="pointer-events-none absolute bottom-2.5 left-3 right-3 text-xs font-medium text-white line-clamp-2 drop-shadow-md">
                  {item.caption}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <ImageGalleryModal
        show={galleryOpen}
        images={galleryImages}
        currentIndex={galleryIndex}
        closeGallery={() => setGalleryOpen(false)}
        nextImage={nextImage}
        prevImage={prevImage}
      />
    </div>
  );
}
