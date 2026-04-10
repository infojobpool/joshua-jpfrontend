"use client";

import Image from "next/image";

type BrandedPageLoaderProps = {
  /** Short line under the logo (e.g. "Opening profile") */
  subtitle?: string;
};

/**
 * Full-viewport branded loader (spinner ring + logo + pulsing dots).
 * Safe to use from client pages and from server `loading.tsx` via composition.
 */
export function BrandedPageLoader({ subtitle }: BrandedPageLoaderProps) {
  return (
    <div
      className="flex min-h-[100dvh] min-w-0 w-full flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-blue-50/40 px-6"
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="relative h-[4.5rem] w-[4.5rem] md:h-20 md:w-20">
          <div
            className="absolute inset-0 rounded-full border-2 border-slate-200/90 border-t-blue-600 shadow-[0_4px_24px_rgba(37,99,235,0.12)] animate-spin"
            style={{ animationDuration: "0.88s" }}
            aria-hidden
          />
          <div className="absolute inset-0 flex items-center justify-center p-2">
            <Image
              src="/images/jobpool-logo.svg"
              alt=""
              width={48}
              height={48}
              className="h-10 w-10 object-contain md:h-11 md:w-11"
              priority
            />
          </div>
        </div>
        {subtitle ? (
          <p className="text-center text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
            {subtitle}
          </p>
        ) : null}
        <div className="flex items-center gap-2" aria-hidden>
          <span
            className="h-2 w-2 rounded-full bg-blue-500/80 animate-loading-dot"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-blue-600/80 animate-loading-dot"
            style={{ animationDelay: "200ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-blue-700/75 animate-loading-dot"
            style={{ animationDelay: "400ms" }}
          />
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
