"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { usePublicTestimonials } from "@/hooks/usePublicTestimonials";
import { cn } from "@/lib/utils";

function StarRow({ rating }: { rating: number }) {
  const clamped = Math.min(5, Math.max(0, rating));
  const filledCount = Math.min(5, Math.max(0, Math.round(clamped)));
  return (
    <div className="flex items-center gap-0.5" aria-label={`${clamped.toFixed(1)} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < filledCount;
        return (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              filled ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300",
            )}
            strokeWidth={filled ? 0 : 1.25}
            aria-hidden
          />
        );
      })}
      <span className="ml-1 text-[11px] font-semibold tabular-nums tracking-tight text-slate-600">
        {clamped.toFixed(1)}
      </span>
    </div>
  );
}

export function MobileTestimonials() {
  const { items } = usePublicTestimonials();
  const prefersReducedMotion = useReducedMotion() === true;
  const [marqueePaused, setMarqueePaused] = useState(false);

  if (items.length === 0) {
    return null;
  }

  const loop = [...items, ...items];
  const runMarquee = !prefersReducedMotion && items.length > 1;

  return (
    <div className="md:hidden relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/90 px-4 pb-6 pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-200/80 to-transparent" />
      <div className="mb-5 text-center">
        <h3 className="font-[family-name:var(--font-archivo)] text-xl font-bold tracking-tight text-slate-900 sm:text-[1.35rem]">
          What people say
        </h3>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-500">Real stories from customers and Helpers on JobPool</p>
      </div>

      <div
        className={cn("-mx-1 pb-1 pt-0.5", runMarquee ? "overflow-hidden" : "overflow-x-auto scroll-smooth snap-x snap-mandatory")}
        onMouseEnter={() => setMarqueePaused(true)}
        onMouseLeave={() => setMarqueePaused(false)}
      >
        <div
          className={cn(
            "flex w-max gap-4 px-1 will-change-transform",
            runMarquee && "animate-marquee-smooth",
          )}
          style={
            runMarquee
              ? { animationPlayState: marqueePaused ? "paused" : "running" }
              : undefined
          }
        >
          {loop.map((t, idx) => {
            const subtitle = t.role || t.category || "";
            return (
              <article
                key={`${t.id}-${idx}`}
                className="shrink-0 snap-start rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-[0_18px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.03] backdrop-blur-sm w-[min(20rem,calc(100vw-2.5rem))]"
              >
                <div className="flex items-start gap-3">
                  {t.avatarUrl ? (
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl shadow-md ring-2 ring-white">
                      {/* eslint-disable-next-line @next/next/no-img-element -- remote avatar URLs from API */}
                      <img
                        src={t.avatarUrl}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-sm font-bold text-white shadow-md ring-2 ring-white">
                      {(t.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="truncate font-semibold leading-tight text-slate-900">{t.name}</div>
                    {subtitle ? (
                      <div className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-wide text-slate-500">
                        {subtitle}
                      </div>
                    ) : null}
                    <div className="mt-2">
                      <StarRow rating={t.rating} />
                    </div>
                  </div>
                </div>
                <div className="relative mt-4 border-t border-slate-100/90 pt-4">
                  <span
                    className="absolute left-0 top-2 font-serif text-4xl leading-none text-blue-600/[0.12]"
                    aria-hidden
                  >
                    &ldquo;
                  </span>
                  <p className="relative pl-1 text-[13px] leading-[1.55] text-slate-600 line-clamp-4">{t.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee-smooth {
          from {
            transform: translate3d(0, 0, 0);
          }
          to {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .animate-marquee-smooth {
          animation: marquee-smooth 42s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee-smooth {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}

export default MobileTestimonials;
