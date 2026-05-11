"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getAllJobsForHomeCached,
  invalidateHomeJobsCache,
  readPersistedHomeSnapshot,
  selectOpenRecentTaskCards,
  type HomeTaskCard,
} from "@/lib/homeJobsCache";
import {
  prefetchBidsForTask,
  prefetchJobWithBidsForTask,
  storeTaskForNav,
} from "@/lib/taskNavCache";
import { HOME_BROWSE_ALL_TASKS_HREF, HOME_EXPLORE_ALL_TASKS_LABEL } from "@/lib/homeSectionNav";
import { cn } from "@/lib/utils";
import { toViewTransitionKey } from "@/lib/viewTransition";
import { TransitionLink } from "@/components/TransitionLink";

const DESKTOP_MAX = 12;
const SECTION_SUBTITLE = "See open tasks and apply.";
/** Mobile recent-tasks strip: auto-scroll speed (px/s) — time-based; keep modest so swipe still feels natural */
const MOBILE_RECENT_AUTO_SCROLL_PX_PER_SEC = 52;
const DESKTOP_RECENT_AUTO_SCROLL_PX_PER_SEC = 42;

function formatBudget(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

/** Text-only: same shell as listings, budget in a compact header strip (no task images). */
function PremiumRecentTaskCard({
  task,
  href,
  widthClass,
  scrollSnap,
  onPrefetch,
}: {
  task: HomeTaskCard;
  href: string;
  widthClass: string;
  scrollSnap?: boolean;
  onPrefetch?: () => void;
}) {
  const archivo = { fontFamily: "var(--font-archivo), var(--font-geist-sans), system-ui, sans-serif" } as const;
  const budget = formatBudget(task.budget);

  return (
    <TransitionLink
      href={href}
      className={cn(
        "group block shrink-0 overflow-hidden",
        widthClass,
        scrollSnap && "snap-start [scroll-snap-stop:always]",
      )}
      onMouseEnter={onPrefetch}
      onTouchStart={onPrefetch}
    >
      <motion.article
        className={cn(
          "flex h-full min-h-[10.5rem] flex-col overflow-hidden rounded-2xl bg-white md:min-h-[11rem] md:rounded-2xl",
          "shadow-[0_14px_44px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/90",
          "transition-all duration-300 ease-out",
          "hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-24px_rgba(37,99,235,0.22)] hover:ring-blue-200/70",
        )}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 360, damping: 28, mass: 0.55 }}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-3 py-2.5 md:px-3.5 md:py-3">
          <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-blue-100/90 md:text-[9px]" style={archivo}>
            Budget
          </span>
          <span
            className="text-right text-sm font-bold tabular-nums tracking-tight text-white md:text-base"
            style={archivo}
          >
            {budget}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3 pt-2.5 md:gap-1.5 md:px-3.5 md:pb-3.5 md:pt-3">
          <p
            className="truncate text-[8px] font-semibold uppercase tracking-[0.16em] text-blue-800/85 md:text-[9px] md:tracking-[0.18em]"
            style={archivo}
            title={task.category_name}
          >
            {task.category_name}
          </p>
          <h3
            className="task-title line-clamp-2 min-w-0 overflow-hidden break-words text-[0.875rem] font-bold leading-snug tracking-[-0.02em] text-slate-900 md:text-[0.9375rem]"
            style={{
              ...archivo,
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore viewTransitionName is supported in modern Chromium.
              viewTransitionName: `task-title-${toViewTransitionKey(task.id)}`,
            }}
          >
            {task.title}
          </h3>
          {task.location ? (
            <p className="mt-auto flex min-w-0 items-center gap-1 truncate pt-0.5 text-[10px] font-medium text-slate-500 md:text-[11px]">
              <MapPin className="h-3 w-3 shrink-0 text-blue-600/55" />
              <span className="truncate">{task.location}</span>
            </p>
          ) : (
            <p className="mt-auto flex items-center gap-1 pt-0.5 text-[10px] font-semibold text-blue-800/75 md:text-[11px]">
              <Briefcase className="h-3 w-3 shrink-0 text-blue-600/60" />
              Open listing
            </p>
          )}
        </div>
      </motion.article>
    </TransitionLink>
  );
}

export function RecentAvailableTasks({ variant }: { variant: "mobile" | "desktop" }) {
  const [tasks, setTasks] = useState<HomeTaskCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchFailed, setFetchFailed] = useState(false);

  /** Apply last session snapshot before paint (client-only; avoids SSR hydration mismatch). */
  useLayoutEffect(() => {
    const snap = readPersistedHomeSnapshot(DESKTOP_MAX);
    // Only skip skeleton when snapshot has real rows — empty snapshots still wait on network
    // so we do not flash "No open tasks" from a stale/blank disk write.
    if (snap.fromCache && snap.tasks.length > 0) {
      setTasks(snap.tasks);
      setLoading(false);
    }
  }, []);
  /** Pause auto-scroll while user touches / hovers the strip */
  const [marqueePaused, setMarqueePaused] = useState(false);
  const resumeMarqueeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const desktopScrollRef = useRef<HTMLDivElement>(null);
  const scrollProgrammaticRef = useRef(false);
  /** True after a user-driven scroll until idle timeout (swipe / trackpad). */
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

  const retryFetch = useCallback(() => {
    invalidateHomeJobsCache();
    setFetchFailed(false);
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const jobs = await getAllJobsForHomeCached();
        const rows = selectOpenRecentTaskCards(jobs, DESKTOP_MAX);
        if (!cancelled) {
          setFetchFailed(false);
          setTasks((prev) => {
            if (rows.length > 0) return rows;
            if (prev.length > 0) return prev;
            return rows;
          });
        }
      } catch {
        if (!cancelled) {
          setFetchFailed(true);
          setTasks((prev) => prev);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  useEffect(() => {
    marqueePausedRef.current = marqueePaused;
  }, [marqueePaused]);

  useEffect(() => {
    return () => {
      if (resumeMarqueeTimerRef.current) clearTimeout(resumeMarqueeTimerRef.current);
      if (resumeUserScrollTimerRef.current) clearTimeout(resumeUserScrollTimerRef.current);
    };
  }, []);

  /** Mobile strip: auto-advance via scrollLeft + seamless loop (pauses on touch / user scroll). */
  useEffect(() => {
    if (variant !== "mobile" || tasks.length === 0) return;
    const el = mobileScrollRef.current;
    if (!el) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /** Mobile WebKit often fires `scroll` after programmatic scrollLeft *after* our guard clears, which
     *  sets autoScrollFromUserRef and kills the marquee. Touch/pointer handlers already pause for real drags. */
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
          fracCarry += (MOBILE_RECENT_AUTO_SCROLL_PX_PER_SEC / 1000) * dt;
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
  }, [variant, tasks.length, registerUserHorizontalScroll]);

  /** Desktop strip: same seamless loop auto-scroll (pauses on hover / user scroll / tab hidden). */
  useEffect(() => {
    if (variant !== "desktop" || tasks.length === 0) return;
    const el = desktopScrollRef.current;
    if (!el) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
          fracCarry += (DESKTOP_RECENT_AUTO_SCROLL_PX_PER_SEC / 1000) * dt;
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
  }, [variant, tasks.length, registerUserHorizontalScroll]);

  useEffect(() => {
    const onVis = () => setMarqueePaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (variant === "mobile") {
    if (loading) {
      return (
        <motion.div
          className="md:hidden px-4 py-4 bg-white"
          initial={{ opacity: 0.55 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="mb-3 h-5 w-48 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[11.5rem] w-[15.5rem] shrink-0 animate-pulse rounded-2xl bg-slate-100/90 ring-1 ring-slate-200/80"
              />
            ))}
          </div>
        </motion.div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className="md:hidden px-4 py-6 bg-white">
          <h3 className="font-home-section-title border-l-[3px] border-blue-500 pl-2.5 text-lg text-slate-900">
            Recent available tasks
          </h3>
          <p className="font-home-section-desc mt-1 text-sm text-gray-500">{SECTION_SUBTITLE}</p>
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 py-8">
            <Briefcase className="mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No open tasks yet</p>
            <p className="mt-1 max-w-sm px-4 text-center text-xs text-gray-500 leading-relaxed">
              {fetchFailed
                ? "We couldn’t load tasks just now. Check your connection and tap Retry."
                : "Open tasks will show here when people post jobs you can apply for."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 rounded-xl border-slate-200"
              onClick={retryFetch}
            >
              Retry
            </Button>
            <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row">
              <Link href="/post-task" className="text-sm font-medium text-blue-600 hover:underline">
                Post a task
              </Link>
              <span className="hidden text-slate-300 sm:inline" aria-hidden>
                ·
              </span>
              <Link
                href={HOME_BROWSE_ALL_TASKS_HREF}
                aria-label={HOME_EXPLORE_ALL_TASKS_LABEL}
                className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
              >
                Explore more
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const loop = [...tasks, ...tasks];

    const scheduleMarqueeResume = () => {
      if (resumeMarqueeTimerRef.current) clearTimeout(resumeMarqueeTimerRef.current);
      resumeMarqueeTimerRef.current = setTimeout(() => {
        resumeMarqueeTimerRef.current = null;
        setMarqueePaused(false);
      }, 500);
    };

    return (
      <motion.div
        className="md:hidden w-full min-w-0 max-w-full px-4 py-4 bg-white"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
          <div className="mb-3 flex items-end justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-home-section-title border-l-[3px] border-blue-500 pl-2.5 text-lg text-slate-900">
                Recent available tasks
              </h3>
              <p className="font-home-section-desc mt-0.5 text-sm text-gray-500">{SECTION_SUBTITLE}</p>
            </div>
            <Link
              href={HOME_BROWSE_ALL_TASKS_HREF}
              aria-label={HOME_EXPLORE_ALL_TASKS_LABEL}
              className="group/explore inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full bg-blue-600 py-1 pl-2 pr-1.5 text-[8px] font-semibold uppercase leading-none tracking-[0.06em] text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98] min-[360px]:gap-1 min-[360px]:py-1.5 min-[360px]:pl-2.5 min-[360px]:pr-2 min-[360px]:text-[9px] min-[400px]:text-[10px]"
            >
              <span>Explore more</span>
              <ArrowRight className="h-2.5 w-2.5 shrink-0 opacity-95 transition group-hover/explore:translate-x-0.5 min-[360px]:h-3 min-[360px]:w-3" aria-hidden />
            </Link>
          </div>
        <div
          ref={mobileScrollRef}
          className="w-full min-w-0 max-w-full overflow-x-scroll overflow-y-hidden overscroll-x-contain touch-manipulation pb-2 [overflow-anchor:none] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
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
          <div className="flex w-max gap-3 pr-1">
            {loop.map((t, idx) => (
              <PremiumRecentTaskCard
                key={`${t.id}-${idx}`}
                task={t}
                href={`/tasks/${t.id}`}
                widthClass="w-[15.5rem]"
                onPrefetch={() => {
                  try {
                    storeTaskForNav({
                      id: t.id,
                      title: t.title,
                      description: t.description,
                      budget: t.budget,
                      location: t.location || undefined,
                      category: t.category_name,
                      posted_by: t.posted_by,
                      posted_by_id: t.posted_by_id,
                      posted_by_profile_image: t.posted_by_profile_image,
                      images: t.imageUrl
                        ? [{ url: t.imageUrl, alt: t.title }]
                        : [],
                    });
                  } catch {
                    /* ignore */
                  }
                  try {
                    prefetchBidsForTask(t.id);
                  } catch {
                    /* ignore */
                  }
                  prefetchJobWithBidsForTask(t.id);
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // desktop
  if (loading) {
    return (
      <motion.section
        className="hidden bg-gray-50 py-8 md:block md:py-10 overflow-hidden"
        initial={{ opacity: 0.55 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto mb-6 max-w-7xl">
            <div className="h-10 max-w-md animate-pulse rounded-lg bg-gray-200" />
          </div>
          <div className="mx-auto flex max-w-7xl justify-center gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[12rem] w-[16rem] shrink-0 animate-pulse rounded-2xl bg-slate-100/90 ring-1 ring-slate-200/80 md:w-[17rem]"
              />
            ))}
          </div>
        </div>
      </motion.section>
    );
  }

  if (tasks.length === 0) {
    return (
      <section className="hidden bg-gray-50 py-8 md:block md:py-10 overflow-hidden">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div
            className="mx-auto mb-6 max-w-7xl text-left"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-home-section-title mb-2 text-2xl text-slate-900 md:text-3xl">
              <span className="border-b-[3px] border-blue-500 pb-0.5">Recent available tasks</span>
            </h2>
            <p className="font-home-section-desc max-w-2xl text-sm text-gray-600 md:text-base">
              {SECTION_SUBTITLE}
            </p>
          </motion.div>
          <div className="mx-auto max-w-7xl rounded-2xl border border-gray-100 bg-white py-12 text-center">
            <Briefcase className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-600">No open tasks yet</p>
            <p className="mt-1 max-w-md px-4 text-sm text-gray-500">
              {fetchFailed
                ? "We couldn’t load tasks just now. Check your connection and tap Retry."
                : "Be the first to post one, or check back soon for new listings."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl border-slate-200"
              onClick={retryFetch}
            >
              Retry
            </Button>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Link href="/post-task" className="font-medium text-blue-600 hover:underline">
                Post a task
              </Link>
              <Link
                href={HOME_BROWSE_ALL_TASKS_HREF}
                aria-label={HOME_EXPLORE_ALL_TASKS_LABEL}
                className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
              >
                Explore more
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const loopDesktop = [...tasks, ...tasks];

  const scheduleMarqueeResumeDesktop = () => {
    if (resumeMarqueeTimerRef.current) clearTimeout(resumeMarqueeTimerRef.current);
    resumeMarqueeTimerRef.current = setTimeout(() => {
      resumeMarqueeTimerRef.current = null;
      setMarqueePaused(false);
    }, 500);
  };

  return (
    <motion.section
      className="hidden bg-gray-50 py-8 md:block md:py-10 overflow-hidden"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          className="mx-auto mb-6 max-w-7xl text-left"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="font-home-section-title mb-2 text-2xl text-slate-900 md:text-3xl">
            <span className="border-b-[3px] border-blue-500 pb-0.5">Recent available tasks</span>
          </h2>
          <p className="font-home-section-desc max-w-2xl text-sm text-gray-600 md:text-base">
            {SECTION_SUBTITLE}
          </p>
          <Link
            href={HOME_BROWSE_ALL_TASKS_HREF}
            aria-label={HOME_EXPLORE_ALL_TASKS_LABEL}
            className="group/explore-desk mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
          >
            Explore more
            <ArrowRight className="h-3.5 w-3.5 transition group-hover/explore-desk:translate-x-0.5" aria-hidden />
          </Link>
        </motion.div>

        <div className="relative mx-auto max-w-7xl">
          <div className="flex justify-center">
            <div
              ref={desktopScrollRef}
              className="max-w-full overflow-x-auto overscroll-x-contain touch-manipulation scroll-auto pb-6 pl-12 pr-12 md:pl-14 md:pr-14 [overflow-anchor:none] scrollbar-hide"
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
              <div className="flex w-max gap-4 md:gap-5 transform-gpu will-change-transform">
                {loopDesktop.map((task, idx) => (
                  <PremiumRecentTaskCard
                    key={`${task.id}-${idx}`}
                    task={task}
                    href={`/tasks/${task.id}`}
                    widthClass="w-[16rem] md:w-[17rem]"
                    scrollSnap
                    onPrefetch={() => {
                      try {
                        storeTaskForNav({
                          id: task.id,
                          title: task.title,
                          description: task.description,
                          budget: task.budget,
                          location: task.location || undefined,
                          category: task.category_name,
                          posted_by: task.posted_by,
                          posted_by_id: task.posted_by_id,
                          posted_by_profile_image: task.posted_by_profile_image,
                          images: task.imageUrl
                            ? [{ url: task.imageUrl, alt: task.title }]
                            : [],
                        });
                      } catch {
                        /* ignore */
                      }
                      try {
                        prefetchBidsForTask(task.id);
                      } catch {
                        /* ignore */
                      }
                      prefetchJobWithBidsForTask(task.id);
                    }}
                  />
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
    </motion.section>
  );
}
