"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  alt?: string;
};

export function PhotoLightbox({
  open,
  onOpenChange,
  images,
  index,
  onIndexChange,
  alt = "Photo",
}: Props) {
  if (!images.length) return null;

  const safe = Math.min(Math.max(0, index), images.length - 1);
  const src = images[safe] ?? images[0];
  const hasMulti = images.length > 1;

  const goPrev = () => onIndexChange((safe - 1 + images.length) % images.length);
  const goNext = () => onIndexChange((safe + 1) % images.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[92dvh] w-[min(96vw,920px)] max-w-[96vw] flex-col gap-0 overflow-hidden border-0 bg-black p-0 shadow-2xl sm:rounded-xl"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Photo viewer</DialogTitle>
        <div className="relative flex min-h-[50dvh] flex-1 items-center justify-center bg-black">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${alt} ${safe + 1} of ${images.length}`}
            className="max-h-[78dvh] w-full object-contain"
            draggable={false}
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {hasMulti ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow hover:bg-white"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow hover:bg-white"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                {safe + 1} / {images.length}
              </p>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
