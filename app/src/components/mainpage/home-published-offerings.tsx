"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Package } from "lucide-react";
import type { Offering } from "@/lib/offerings/types";
import { getHomeOfferingsCached } from "@/lib/homeOfferingsCache";

const PLACEHOLDER = "/images/placeholder.svg";
const DESKTOP_MAX = 12;
const MOBILE_AUTO_SCROLL_PX_PER_SEC = 48;

function formatFromPrice(n: number) {
  return `From ₹${Math.round(n).toLocaleString("en-IN")}`;
}

function profileHref(o: Offering): string {
  if (!o.userId) return "/browse-tasks";
  return `/profilepage/${encodeURIComponent(o.userId)}`;
}

function OfferingCardImage({ url, alt }: { url: string; alt: string }) {
  return (
    <img
      src={url}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={(e) => {
        const el = e.currentTarget;
        if (el.src !== PLACEHOLDER && !el.dataset.fallback) {
          el.dataset.fallback = "1";
          el.src = PLACEHOLDER;
        }
      }}
    />
  );
}

export function HomePublishedOfferings({ variant }: { variant: "mobile" | "desktop" }) {
  const [rows, setRows] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [marqueePaused, setMarqueePaused] = useState(false);
  const resumeMarqueeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const scrollProgrammaticRef = useRef(false);
  const autoScrollFromUserRef = useRef(false);
  const resumeUserScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const marqueePausedRef = useRef(false);

  const registerUserHorizontalScroll = useCallback(() => {
    autoScrollFromUserRef.current = true;
    if (resumeUserScrollTimerRef.current) clearTimeout(resumeUserScrollTimerRef.current);
    resumeUserScrollTimerRef.current = setTimeout(() => {
      resumeUserScrollTimerRef.current = null;
      autoScrollFromUserRef.current = false;
    }, 3200);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getHomeOfferingsCached(DESKTOP_MAX);
        if (!cancelled) setRows(data);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    marqueePausedRef.current = marqueePaused;
  }, [marqueePaused]);

  useEffect(() => {
    return () => {
      if (resumeMarqueeTimerRef.current) clearTimeout(resumeMarqueeTimerRef.current);
      if (resumeUserScrollTimerRef.current) clearTimeout(resumeUserScrollTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (variant !== "mobile" || rows.length === 0) return;
    const el = mobileScrollRef.current;
    if (!el) return;

    const reducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      if (scrollProgrammaticRef.current) return;
      registerUserHorizontalScroll();
    };
    el.addEventListener("scroll", onScroll, { passive: true });

    let rafId = 0;
    let lastTs = performance.now();
    let fracCarry = 0;

    const tick = (now: number) => {
      const dt = Math.min(48, Math.max(0, now - lastTs));
      lastTs = now;

      if (!reducedMotion && !marqueePausedRef.current && !autoScrollFromUserRef.current) {
        const half = el.scrollWidth / 2;
        if (half > 1) {
          fracCarry += (MOBILE_AUTO_SCROLL_PX_PER_SEC / 1000) * dt;
          const steps = Math.floor(fracCarry);
          fracCarry -= steps;
          if (steps > 0) {
            scrollProgrammaticRef.current = true;
            el.scrollLeft += steps;
            if (el.scrollLeft >= half) el.scrollLeft -= half;
            queueMicrotask(() => {
              scrollProgrammaticRef.current = false;
            });
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      el.removeEventListener("scroll", onScroll);
      if (resumeUserScrollTimerRef.current) clearTimeout(resumeUserScrollTimerRef.current);
    };
  }, [variant, rows.length, registerUserHorizontalScroll]);

  useEffect(() => {
    if (variant !== "mobile") return;
    const onVis = () => setMarqueePaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [variant]);

  const title = "Service listings & direct hire";
  const subtitle = "Hire pros with clear starting prices — open their profile to book";

  if (variant === "mobile") {
    if (loading) {
      return (
        <div className="md:hidden px-4 py-4 bg-gray-50">
          <div className="mb-3 h-5 w-56 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 w-64 shrink-0 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <div className="md:hidden px-4 py-5 bg-gray-50 border-t border-gray-100/80">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-4 rounded-2xl border border-dashed border-emerald-200/90 bg-white p-6 text-center shadow-sm">
            <Package className="mx-auto h-10 w-10 text-emerald-200" />
            <p className="mt-2 text-sm font-medium text-gray-800">No public listings here yet</p>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              Published services from the public feed appear here. If this is empty, check that{" "}
              <span className="font-medium text-gray-600">GET /offerings/feed/</span> is deployed and returning rows.
            </p>
            <Link
              href="/profile?tab=listings"
              className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline"
            >
              Publish a listing from Profile
            </Link>
          </div>
        </div>
      );
    }

    const loop = [...rows, ...rows];

    const scheduleMarqueeResume = () => {
      if (resumeMarqueeTimerRef.current) clearTimeout(resumeMarqueeTimerRef.current);
      resumeMarqueeTimerRef.current = setTimeout(() => {
        resumeMarqueeTimerRef.current = null;
        setMarqueePaused(false);
      }, 500);
    };

    return (
      <div className="md:hidden px-4 py-4 bg-gray-50">
        <h3 className="mb-1 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mb-3 text-sm text-gray-500">{subtitle}</p>
        <div
          ref={mobileScrollRef}
          className="overflow-x-auto overflow-y-hidden overscroll-x-contain touch-pan-x scroll-auto snap-x snap-mandatory pb-2 [overflow-anchor:none] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch", scrollBehavior: "auto" }}
          onPointerDown={() => {
            if (resumeMarqueeTimerRef.current) clearTimeout(resumeMarqueeTimerRef.current);
            setMarqueePaused(true);
          }}
          onPointerUp={scheduleMarqueeResume}
          onPointerCancel={scheduleMarqueeResume}
          onTouchStart={() => {
            if (resumeMarqueeTimerRef.current) clearTimeout(resumeMarqueeTimerRef.current);
            setMarqueePaused(true);
          }}
          onTouchEnd={scheduleMarqueeResume}
          onTouchCancel={scheduleMarqueeResume}
          onMouseEnter={() => setMarqueePaused(true)}
          onMouseLeave={() => setMarqueePaused(false)}
          onWheel={registerUserHorizontalScroll}
        >
          <div className="flex w-max gap-3 pr-1 transform-gpu will-change-transform">
            {loop.map((o, idx) => (
              <Link
                key={`${o.id}-${idx}`}
                href={profileHref(o)}
                className="group w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-emerald-200/40 bg-white shadow-lg shadow-black/5 [scroll-snap-stop:always]"
              >
                <div className="relative h-32 w-full overflow-hidden bg-gray-50">
                  <OfferingCardImage url={o.photoUrls?.[0] || PLACEHOLDER} alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
                    <span className="truncate rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-gray-800">
                      {o.category || (o.type === "product" ? "Product" : "Service")}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-white drop-shadow">
                      {formatFromPrice(o.startingPriceInr)}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="line-clamp-2 min-w-0 overflow-hidden break-words text-sm font-medium text-gray-900">
                    {o.title || "Listing"}
                  </h4>
                  {o.providerDisplayName ? (
                    <p className="mt-0.5 truncate text-[11px] font-medium text-emerald-700/90">
                      {o.providerDisplayName}
                    </p>
                  ) : null}
                  {o.locationText ? (
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-gray-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{o.locationText}</span>
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // desktop
  if (loading) {
    return (
      <section className="hidden py-12 md:block bg-white overflow-hidden">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto mb-8 h-10 max-w-md animate-pulse rounded-lg bg-gray-200" />
          <div className="mx-auto flex max-w-7xl justify-center gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 w-64 shrink-0 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (rows.length === 0) {
    return (
      <section className="hidden py-10 md:block bg-white overflow-hidden border-t border-gray-100">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div
            className="mb-6 text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">{title}</h2>
            <p className="mx-auto max-w-2xl text-sm text-gray-600 md:text-base">{subtitle}</p>
          </motion.div>
          <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-emerald-200/90 bg-slate-50/80 py-10 px-6 text-center">
            <Package className="mx-auto h-12 w-12 text-emerald-200" />
            <p className="mt-3 font-medium text-gray-800">No public listings to show yet</p>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              Published offerings from providers will appear in this row. Until the feed returns data here, visitors
              can still open any public profile to book a service.
            </p>
            <Link
              href="/profile?tab=listings"
              className="mt-5 inline-block text-sm font-semibold text-emerald-700 hover:underline"
            >
              Publish a listing from Profile
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hidden py-12 md:block bg-white overflow-hidden">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">{title}</h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 md:text-base">{subtitle}</p>
        </motion.div>

        <div className="relative mx-auto max-w-7xl">
          <div className="flex justify-center">
            <div
              className="flex gap-4 overflow-x-auto overscroll-x-contain touch-pan-x pb-6 pl-12 pr-12 md:pl-14 md:pr-14 scrollbar-hide"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {rows.map((o, index) => (
                <motion.div
                  key={o.id}
                  className="w-56 flex-shrink-0 scroll-snap-start sm:w-60 md:w-64"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.45 }}
                  viewport={{ once: true }}
                >
                  <Link
                    href={profileHref(o)}
                    className="group block overflow-hidden rounded-xl border border-emerald-100 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg hover:border-emerald-200/80"
                  >
                    <div className="relative h-32 overflow-hidden bg-gray-100">
                      <OfferingCardImage url={o.photoUrls?.[0] || PLACEHOLDER} alt="" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                      <div className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-800 backdrop-blur-sm">
                        {o.category || (o.type === "product" ? "Product" : "Service")}
                      </div>
                      <div className="absolute bottom-2 right-2 rounded-md bg-emerald-600/95 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                        {formatFromPrice(o.startingPriceInr)}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="line-clamp-2 min-w-0 overflow-hidden break-words text-base font-semibold text-gray-900">
                        {o.title || "Listing"}
                      </h3>
                      {o.providerDisplayName ? (
                        <p className="mt-1 truncate text-xs font-medium text-emerald-700">{o.providerDisplayName}</p>
                      ) : null}
                      {o.locationText ? (
                        <p className="mt-2 flex min-w-0 items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{o.locationText}</span>
                        </p>
                      ) : (
                        <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700 font-medium">
                          <Package className="h-3.5 w-3.5 shrink-0" />
                          View profile to book
                        </p>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>
    </section>
  );
}
