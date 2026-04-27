"use client";

import Image from "next/image";

type BrandedPageLoaderProps = {
  /** Primary line under the mark (e.g. "Opening profile") */
  subtitle?: string;
};

/**
 * Full-viewport loader: soft “incoming” glow, dual ring motion, mark-only logo, tagline + dots.
 * Safe for client pages and server `loading.tsx` via composition.
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
      <div className="flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="relative h-[4.75rem] w-[4.75rem] md:h-[5.25rem] md:w-[5.25rem]">
          <div
            className="absolute -inset-3 rounded-full bg-blue-500/15 blur-md animate-loader-breathe motion-reduce:animate-none"
            aria-hidden
          />
          <div
            className="absolute -inset-1 rounded-full border border-blue-200/60 animate-loader-breathe motion-reduce:animate-none [animation-delay:150ms]"
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-full border-2 border-slate-200/90 border-t-blue-500 shadow-[0_4px_24px_rgba(37,99,235,0.1)] motion-reduce:animate-none motion-safe:animate-[spin_1.35s_linear_infinite]"
            aria-hidden
          />
          <div
            className="absolute inset-[5px] rounded-full border border-blue-100/90 border-b-blue-600/70 motion-reduce:animate-none motion-safe:animate-[spin_0.95s_linear_infinite_reverse]"
            aria-hidden
          />
          <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-white/95 shadow-inner">
            <Image
              src="/images/jobpool-mark.svg"
              alt=""
              width={44}
              height={44}
              className="h-9 w-9 object-contain animate-loader-nudge motion-reduce:animate-none md:h-10 md:w-10"
              priority
            />
          </div>
        </div>

        <div className="flex max-w-xs flex-col items-center gap-1.5 text-center">
          {subtitle ? (
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-slate-600">{subtitle}</p>
          ) : (
            <p className="text-[0.8125rem] font-semibold uppercase tracking-[0.18em] text-slate-600">
              Getting things ready
            </p>
          )}
          <p className="text-sm font-medium leading-snug text-blue-700/90 motion-reduce:opacity-90 motion-safe:animate-pulse">
            Something great is coming in…
          </p>
        </div>

        <div className="flex items-center gap-2" aria-hidden>
          <span
            className="h-2 w-2 rounded-full bg-blue-400/90 animate-loader-dot-bob motion-reduce:animate-none"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-blue-600/90 animate-loader-dot-bob motion-reduce:animate-none"
            style={{ animationDelay: "160ms" }}
          />
          <span
            className="h-2 w-2 rounded-full bg-blue-700/85 animate-loader-dot-bob motion-reduce:animate-none"
            style={{ animationDelay: "320ms" }}
          />
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
