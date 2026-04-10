"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Package } from "lucide-react";
import type { Offering } from "@/lib/offerings/types";
import { getHomeOfferingsCached } from "@/lib/homeOfferingsCache";
import { cn } from "@/lib/utils";
import useStore from "@/lib/Zustand";

const PLACEHOLDER = "/images/placeholder.svg";
const DESKTOP_MAX = 12;
const MOBILE_AUTO_SCROLL_PX_PER_SEC = 48;
const DESKTOP_OFFERINGS_AUTO_SCROLL_PX_PER_SEC = 40;

function formatFromPriceParts(n: number) {
  const amount = `₹${Math.round(n).toLocaleString("en-IN")}`;
  return { prefix: "From", amount };
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

/** Distinct from task cards: editorial image ratio, emerald treatment, Archivo typography, price on image rail. */
function PremiumOfferingCard({
  o,
  href,
  widthClass,
  scrollSnap,
}: {
  o: Offering;
  href: string;
  widthClass: string;
  scrollSnap?: boolean;
}) {
  const category = o.category || (o.type === "product" ? "Product" : "Service");
  const { prefix, amount } = formatFromPriceParts(o.startingPriceInr);
  const archivo = { fontFamily: "var(--font-archivo), var(--font-geist-sans), system-ui, sans-serif" } as const;

  return (
    <Link
      href={href}
      className={cn(
        "group block shrink-0 overflow-hidden",
        widthClass,
        scrollSnap && "snap-start [scroll-snap-stop:always]",
      )}
    >
      <article
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl bg-white md:rounded-[1.35rem]",
          "shadow-[0_22px_52px_-30px_rgba(6,78,59,0.32)] ring-1 ring-emerald-950/[0.06]",
          "transition-all duration-300 ease-out",
          "hover:-translate-y-1 hover:shadow-[0_32px_64px_-28px_rgba(6,78,59,0.38)] hover:ring-emerald-800/12",
        )}
      >
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-200">
          <OfferingCardImage url={o.photoUrls?.[0] || PLACEHOLDER} alt="" />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-900/25 to-emerald-900/5" />
          <div className="absolute inset-x-0 bottom-0 px-3 pb-2.5 pt-10 md:px-3.5 md:pb-3">
            <div className="flex items-end justify-between gap-2 border-t border-white/25 pt-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-100/95 md:text-[10px]" style={archivo}>
                {prefix}
              </span>
              <span
                className="text-right text-base font-bold tabular-nums tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] md:text-lg"
                style={archivo}
              >
                {amount}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1 px-3.5 pb-3 pt-2.5 md:gap-1.5 md:px-4 md:pb-4 md:pt-3">
          <p
            className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-800/75 md:text-[10px] md:tracking-[0.2em]"
            style={archivo}
          >
            {category}
          </p>
          <h3
            className="line-clamp-2 min-w-0 text-[0.9375rem] font-bold leading-snug tracking-[-0.025em] text-slate-900 md:text-[1.0625rem]"
            style={archivo}
          >
            {o.title || "Listing"}
          </h3>
          {o.providerDisplayName ? (
            <p className="truncate text-[11px] font-semibold text-emerald-900/88 md:text-[0.8125rem]" style={archivo}>
              {o.providerDisplayName}
            </p>
          ) : null}
          {o.locationText ? (
            <p className="mt-auto flex items-center gap-1 truncate pt-0.5 text-[10px] font-medium text-slate-500 md:text-xs">
              <MapPin className="h-3 w-3 shrink-0 text-emerald-700/45" />
              <span className="truncate">{o.locationText}</span>
            </p>
          ) : (
            <p className="mt-auto flex items-center gap-1 pt-0.5 text-[10px] font-semibold text-emerald-800/75 md:text-xs">
              <Package className="h-3 w-3 shrink-0 text-emerald-700/60" />
              View profile to book
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

export function HomePublishedOfferings({ variant }: { variant: "mobile" | "desktop" }) {
  const [rows, setRows] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = useStore((s) => s.user?.id ?? null);
  const visibleRows = useMemo(() => {
    if (!currentUserId) return rows;
    return rows.filter((o) => String(o.userId) !== String(currentUserId));
  }, [rows, currentUserId]);
  const [marqueePaused, setMarqueePaused] = useState(false);
  const resumeMarqueeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
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
    if (variant !== "mobile" || visibleRows.length === 0) return;
    const el = mobileScrollRef.current;
    if (!el) return;

    const reducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /** See recent-available-tasks mobile marquee: avoid scroll listener on mobile WebKit. */
    let rafId = 0;
    let lastTs = performance.now();
    let fracCarry = 0;

    const clearProgrammaticSoon = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollProgrammaticRef.current = false;
        });
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(48, Math.max(0, now - lastTs));
      lastTs = now;

      if (!reducedMotion && !marqueePausedRef.current && !autoScrollFromUserRef.current) {
        const sw = el.scrollWidth;
        const cw = el.clientWidth;
        if (sw > cw + 2) {
          const half = sw / 2;
          fracCarry += (MOBILE_AUTO_SCROLL_PX_PER_SEC / 1000) * dt;
          const steps = Math.floor(fracCarry);
          fracCarry -= steps;
          if (steps > 0) {
            scrollProgrammaticRef.current = true;
            el.scrollLeft += steps;
            if (el.scrollLeft >= half) el.scrollLeft -= half;
            clearProgrammaticSoon();
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (resumeUserScrollTimerRef.current) clearTimeout(resumeUserScrollTimerRef.current);
    };
  }, [variant, visibleRows.length, registerUserHorizontalScroll]);

  useEffect(() => {
    if (variant !== "desktop" || visibleRows.length === 0) return;
    const el = desktopScrollRef.current;
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

    const clearProgrammaticSoon = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollProgrammaticRef.current = false;
        });
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(48, Math.max(0, now - lastTs));
      lastTs = now;

      if (!reducedMotion && !marqueePausedRef.current && !autoScrollFromUserRef.current) {
        const half = el.scrollWidth / 2;
        if (half > 1) {
          fracCarry += (DESKTOP_OFFERINGS_AUTO_SCROLL_PX_PER_SEC / 1000) * dt;
          const steps = Math.floor(fracCarry);
          fracCarry -= steps;
          if (steps > 0) {
            scrollProgrammaticRef.current = true;
            el.scrollLeft += steps;
            if (el.scrollLeft >= half) el.scrollLeft -= half;
            clearProgrammaticSoon();
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
  }, [variant, visibleRows.length, registerUserHorizontalScroll]);

  useEffect(() => {
    const onVis = () => setMarqueePaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const title = "Service listings & direct hire";
  const subtitle = "Hire pros with clear starting prices — open their profile to book";

  if (variant === "mobile") {
    if (loading) {
      return (
        <div className="md:hidden border-t border-emerald-100/70 bg-gradient-to-b from-emerald-50/45 via-gray-50/90 to-gray-50 px-4 py-4">
          <div className="mb-3 h-5 w-56 animate-pulse rounded bg-emerald-100/60" />
          <div className="flex gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[17.5rem] w-[17.25rem] shrink-0 animate-pulse rounded-2xl bg-emerald-100/35 ring-1 ring-emerald-900/5"
              />
            ))}
          </div>
        </div>
      );
    }

    if (visibleRows.length === 0) {
      const feedEmpty = rows.length === 0;
      return (
        <div className="md:hidden border-t border-emerald-100/70 bg-gradient-to-b from-emerald-50/45 via-gray-50/90 to-gray-50 px-4 py-5">
          <h3 className="font-home-section-title text-lg text-gray-900">{title}</h3>
          <p className="font-home-section-desc mt-1 text-sm text-gray-500">{subtitle}</p>
          <div className="mt-4 rounded-2xl border border-dashed border-emerald-200/90 bg-white p-6 text-center shadow-sm">
            <Package className="mx-auto h-10 w-10 text-emerald-200" />
            <p className="mt-2 text-sm font-medium text-gray-800">
              {feedEmpty ? "No public listings here yet" : "No other providers in the feed right now"}
            </p>
            <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
              {feedEmpty ? (
                <>
                  Published services from the public feed appear here. If this is empty, check that{" "}
                  <span className="font-medium text-gray-600">GET /offerings/feed/</span> is deployed and returning rows.
                </>
              ) : (
                <>
                  Your own listings are not shown in this row. Manage them under{" "}
                  <span className="font-medium text-gray-600">Profile → Listings</span>.
                </>
              )}
            </p>
            <Link
              href="/profile?tab=listings"
              className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline"
            >
              {feedEmpty ? "Publish a listing from Profile" : "Open your listings"}
            </Link>
          </div>
        </div>
      );
    }

    const loop = [...visibleRows, ...visibleRows];

    const scheduleMarqueeResume = () => {
      if (resumeMarqueeTimerRef.current) clearTimeout(resumeMarqueeTimerRef.current);
      resumeMarqueeTimerRef.current = setTimeout(() => {
        resumeMarqueeTimerRef.current = null;
        setMarqueePaused(false);
      }, 500);
    };

    return (
      <div className="md:hidden w-full min-w-0 max-w-full border-t border-emerald-100/70 bg-gradient-to-b from-emerald-50/45 via-gray-50/90 to-gray-50 px-4 py-4">
        <h3 className="font-home-section-title mb-1 text-lg text-gray-900">{title}</h3>
        <p className="font-home-section-desc mb-3 text-sm text-gray-500">{subtitle}</p>
        <div
          ref={mobileScrollRef}
          className="w-full min-w-0 max-w-full overflow-x-scroll overflow-y-hidden overscroll-x-contain touch-pan-x pb-2 [overflow-anchor:none] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
          onWheel={registerUserHorizontalScroll}
        >
          <div className="flex w-max gap-4 pr-1">
            {loop.map((o, idx) => (
              <PremiumOfferingCard
                key={`${o.id}-${idx}`}
                o={o}
                href={profileHref(o)}
                widthClass="w-[17.25rem]"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // desktop
  if (loading) {
    return (
      <section className="hidden border-t border-emerald-100/60 py-12 md:block overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-white">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto mb-8 h-10 max-w-md animate-pulse rounded-lg bg-emerald-100/50" />
          <div className="mx-auto flex max-w-7xl justify-center gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[19.5rem] w-[17.75rem] shrink-0 animate-pulse rounded-[1.35rem] bg-emerald-100/40 ring-1 ring-emerald-900/5 md:w-[18.5rem]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (visibleRows.length === 0) {
    const feedEmpty = rows.length === 0;
    return (
      <section className="hidden border-t border-emerald-100/60 py-10 md:block overflow-hidden bg-gradient-to-b from-emerald-50/35 via-white to-white">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div
            className="mb-6 text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="font-home-section-title mb-2 text-2xl text-gray-900 md:text-3xl">{title}</h2>
            <p className="font-home-section-desc mx-auto max-w-2xl text-sm text-gray-600 md:text-base">{subtitle}</p>
          </motion.div>
          <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-emerald-200/90 bg-slate-50/80 py-10 px-6 text-center">
            <Package className="mx-auto h-12 w-12 text-emerald-200" />
            <p className="mt-3 font-medium text-gray-800">
              {feedEmpty ? "No public listings to show yet" : "No other providers in the feed right now"}
            </p>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">
              {feedEmpty ? (
                <>
                  Published offerings from providers will appear in this row. Until the feed returns data here, visitors
                  can still open any public profile to book a service.
                </>
              ) : (
                <>
                  Your own listings are omitted here so this strip highlights other pros. Edit yours under Profile →
                  Listings.
                </>
              )}
            </p>
            <Link
              href="/profile?tab=listings"
              className="mt-5 inline-block text-sm font-semibold text-emerald-700 hover:underline"
            >
              {feedEmpty ? "Publish a listing from Profile" : "Open your listings"}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const loopDesktop = [...visibleRows, ...visibleRows];

  const scheduleMarqueeResumeDesktop = () => {
    if (resumeMarqueeTimerRef.current) clearTimeout(resumeMarqueeTimerRef.current);
    resumeMarqueeTimerRef.current = setTimeout(() => {
      resumeMarqueeTimerRef.current = null;
      setMarqueePaused(false);
    }, 500);
  };

  return (
    <section className="hidden border-t border-emerald-100/60 py-12 md:block overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-white">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="font-home-section-title mb-2 text-2xl text-gray-900 md:text-3xl">{title}</h2>
          <p className="font-home-section-desc mx-auto max-w-2xl text-sm text-gray-600 md:text-base">{subtitle}</p>
        </motion.div>

        <div className="relative mx-auto max-w-7xl">
          <div className="flex justify-center">
            <div
              ref={desktopScrollRef}
              className="max-w-full overflow-x-auto overscroll-x-contain touch-pan-x scroll-auto pb-6 pl-12 pr-12 md:pl-14 md:pr-14 [overflow-anchor:none] scrollbar-hide"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                scrollSnapType: "x mandatory",
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "auto",
              }}
              onPointerDown={() => {
                if (resumeMarqueeTimerRef.current) clearTimeout(resumeMarqueeTimerRef.current);
                setMarqueePaused(true);
              }}
              onPointerUp={scheduleMarqueeResumeDesktop}
              onPointerCancel={scheduleMarqueeResumeDesktop}
              onMouseEnter={() => setMarqueePaused(true)}
              onMouseLeave={() => setMarqueePaused(false)}
              onWheel={registerUserHorizontalScroll}
            >
              <div className="flex w-max gap-5 md:gap-6 transform-gpu will-change-transform">
                {loopDesktop.map((o, idx) => (
                  <div key={`${o.id}-${idx}`} className="flex-shrink-0 scroll-snap-start">
                    <PremiumOfferingCard o={o} href={profileHref(o)} widthClass="w-[17.75rem] md:w-[18.5rem]" />
                  </div>
                ))}
              </div>
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
