"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Images } from "lucide-react";
import { loadOfferings } from "@/lib/offerings/storage";
import { ImageGalleryModal } from "@/components/ImageGalleryModal";
import { cn } from "@/lib/utils";

type Props = {
  userId: string;
  viewerIsOwner?: boolean;
  className?: string;
};

export function OfferingsPortfolioHero({ userId, viewerIsOwner, className }: Props) {
  const [tick, setTick] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    setTick((t) => t + 1);
  }, [userId]);

  useEffect(() => {
    const onFocus = () => setTick((t) => t + 1);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const items = useMemo(() => {
    void tick;
    const published = loadOfferings(userId).filter((o) => o.status === "published");
    const flat: { url: string; title: string; id: string }[] = [];
    for (const o of published) {
      const urls = o.photoUrls ?? [];
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        if (typeof url === "string" && url.length > 0) {
          flat.push({ url, title: o.title || "Portfolio", id: `${o.id}_${i}` });
        }
      }
    }
    return flat;
  }, [userId, tick]);

  const galleryImages = useMemo(
    () => items.map((x) => ({ id: x.id, url: x.url, alt: x.title })),
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
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Portfolio &amp; catalogue</h3>
              <p className="mt-1 text-sm text-slate-600 max-w-lg">
                Upload photos on each live offering — they appear here so visitors see your work first.
              </p>
            </div>
          </div>
          <Link
            href="/profile#profile-offerings"
            className="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 transition-colors"
          >
            Add photos in Offerings
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
          <p className="text-sm font-medium text-slate-800 mt-0.5">Photos from your public listings</p>
        </div>
        {viewerIsOwner ? (
          <Link
            href="/profile#profile-offerings"
            className="text-xs font-semibold text-emerald-700 hover:underline shrink-0"
          >
            Manage listings
          </Link>
        ) : null}
      </div>
      <div className="relative -mx-1">
        <div className="flex gap-3 overflow-x-auto pb-2 pt-1 px-1 snap-x snap-mandatory [scrollbar-width:thin]">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openAt(idx)}
              className="group relative shrink-0 snap-start overflow-hidden rounded-2xl ring-1 ring-slate-900/10 shadow-md w-[min(92vw,280px)] aspect-[4/3] bg-slate-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt=""
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/60 via-slate-950/10 to-transparent" />
              <span className="pointer-events-none absolute bottom-2.5 left-3 right-3 text-xs font-medium text-white line-clamp-2 drop-shadow-md">
                {item.title}
              </span>
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
