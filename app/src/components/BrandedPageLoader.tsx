"use client";

import Image from "next/image";

type BrandedPageLoaderProps = {
  /** Primary line under the mark (e.g. "Opening profile") */
  subtitle?: string;
};

/**
 * Full-viewport loader shown on route `loading.tsx` and heavy client transitions.
 * Premium treatment: soft ambient light, elevated logo, indeterminate shimmer bar.
 */
export function BrandedPageLoader({ subtitle }: BrandedPageLoaderProps) {
  return (
    <div
      className="relative flex min-h-[100dvh] min-w-0 w-full flex-col items-center justify-center overflow-hidden bg-white px-6"
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Ambient layers */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.14),transparent_55%),radial-gradient(ellipse_90%_60%_at_100%_100%,rgba(99,102,241,0.1),transparent_50%),radial-gradient(ellipse_70%_50%_at_0%_100%,rgba(14,165,233,0.08),transparent_45%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-[min(480px,120vw)] w-[min(480px,120vw)] -translate-x-1/2 rounded-full bg-gradient-to-b from-blue-400/25 via-blue-500/10 to-transparent blur-3xl motion-safe:animate-loader-orb-float"
        style={{ animationDelay: "0s" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-24 right-[-10%] h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl motion-safe:animate-loader-orb-float"
        style={{ animationDelay: "0.8s" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(248,250,252,0.92))]"
        aria-hidden
      />

      <div className="relative z-10 flex max-w-sm flex-col items-center gap-8 motion-safe:animate-loader-logo-rise">
        <div className="relative">
          <div
            className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-blue-500/12 via-transparent to-indigo-600/10 blur-2xl"
            aria-hidden
          />
          <div className="relative rounded-3xl border border-slate-200/80 bg-white/95 p-7 shadow-[0_32px_64px_-24px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.8)_inset] ring-1 ring-slate-900/[0.04] backdrop-blur-md md:p-8">
            <Image
              src="/images/jobpool-logo-header.png"
              alt="JobPool"
              width={280}
              height={112}
              className="h-[3.25rem] w-auto object-contain object-center md:h-14"
              priority
            />
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col items-center gap-5 px-1">
          <div className="relative h-[5px] w-[min(240px,72vw)] overflow-hidden rounded-full bg-slate-200/90 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)]">
            <div
              className="motion-reduce:hidden absolute inset-y-0 left-0 w-[42%] rounded-full bg-gradient-to-r from-sky-400 via-blue-600 to-indigo-600 shadow-[0_0_24px_rgba(37,99,235,0.35)] motion-safe:animate-loader-premium-bar"
              aria-hidden
            />
            <div
              className="hidden motion-reduce:block absolute inset-y-1 left-1/2 w-[36%] -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"
              aria-hidden
            />
          </div>

          <div className="flex flex-col items-center gap-1 text-center">
            {subtitle ? (
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-slate-500">
                {subtitle}
              </p>
            ) : (
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.22em] text-slate-500">
                Loading
              </p>
            )}
            <p className="text-sm font-medium leading-snug text-slate-600">
              Preparing your workspace…
            </p>
          </div>
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
