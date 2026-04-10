"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Briefcase } from "lucide-react";
import {
  getAllJobsForHomeCached,
  selectOpenRecentTaskCards,
  type HomeTaskCard,
} from "@/lib/homeJobsCache";
import { prefetchBidsForTask } from "@/lib/taskNavCache";

const PLACEHOLDER = "/images/placeholder.svg";
const DESKTOP_MAX = 12;
/** Mobile recent-tasks strip: auto-scroll speed (px/s) — time-based; keep modest so swipe still feels natural */
const MOBILE_RECENT_AUTO_SCROLL_PX_PER_SEC = 52;
const DESKTOP_RECENT_AUTO_SCROLL_PX_PER_SEC = 42;

function formatBudget(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

function TaskCardImage({ url, alt }: { url: string; alt: string }) {
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

export function RecentAvailableTasks({ variant }: { variant: "mobile" | "desktop" }) {
  const [tasks, setTasks] = useState<HomeTaskCard[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const jobs = await getAllJobsForHomeCached();
        const rows = selectOpenRecentTaskCards(jobs, DESKTOP_MAX);
        if (!cancelled) setTasks(rows);
      } catch {
        if (!cancelled) setTasks([]);
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

  /** Mobile strip: auto-advance via scrollLeft + seamless loop (pauses on touch / user scroll). */
  useEffect(() => {
    if (variant !== "mobile" || tasks.length === 0) return;
    const el = mobileScrollRef.current;
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

    const tick = (now: number) => {
      const dt = Math.min(48, Math.max(0, now - lastTs));
      lastTs = now;

      if (!reducedMotion && !marqueePausedRef.current && !autoScrollFromUserRef.current) {
        const half = el.scrollWidth / 2;
        if (half > 1) {
          fracCarry += (MOBILE_RECENT_AUTO_SCROLL_PX_PER_SEC / 1000) * dt;
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
  }, [variant, tasks.length, registerUserHorizontalScroll]);

  useEffect(() => {
    const onVis = () => setMarqueePaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (variant === "mobile") {
    if (loading) {
      return (
        <div className="md:hidden px-4 py-4 bg-white">
          <div className="mb-3 h-5 w-48 animate-pulse rounded bg-gray-200" />
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 w-64 shrink-0 animate-pulse rounded-2xl bg-gray-100"
              />
            ))}
          </div>
        </div>
      );
    }

    if (tasks.length === 0) {
      return (
        <div className="md:hidden px-4 py-6 bg-white">
          <h3 className="font-home-section-title text-lg text-gray-900">Recent available tasks</h3>
          <p className="font-home-section-desc mt-1 text-sm text-gray-500">Open tasks you can apply for right now</p>
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-gray-100 bg-gray-50 py-8">
            <Briefcase className="mb-2 h-10 w-10 text-gray-300" />
            <p className="text-sm font-medium text-gray-600">No open tasks yet</p>
            <Link href="/post-task" className="mt-3 text-sm font-medium text-blue-600 hover:underline">
              Post a task
            </Link>
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
        <div className="md:hidden px-4 py-4 bg-white">
          <h3 className="font-home-section-title mb-1 text-lg text-gray-900">Recent available tasks</h3>
          <p className="font-home-section-desc mb-3 text-sm text-gray-500">Open tasks you can apply for right now</p>
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
            {loop.map((t, idx) => (
              <Link
                key={`${t.id}-${idx}`}
                href={`/tasks/${t.id}`}
                className="group w-64 shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-lg shadow-black/5 [scroll-snap-stop:always]"
                onMouseEnter={() => {
                  try {
                    prefetchBidsForTask(t.id);
                  } catch {
                    /* ignore */
                  }
                }}
                onTouchStart={() => {
                  try {
                    prefetchBidsForTask(t.id);
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <div className="relative h-32 w-full overflow-hidden bg-gray-50">
                  <TaskCardImage
                    url={t.imageUrl || PLACEHOLDER}
                    alt=""
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
                    <span className="truncate rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-gray-800">
                      {t.category_name}
                    </span>
                    <span className="shrink-0 text-[11px] font-semibold text-white drop-shadow">
                      {formatBudget(t.budget)}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <h4 className="task-title line-clamp-2 min-w-0 overflow-hidden break-words text-sm text-gray-900">
                    {t.title}
                  </h4>
                  {t.location ? (
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-gray-500">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{t.location}</span>
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
      <section className="hidden py-12 md:block bg-gray-50 overflow-hidden">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto mb-8 h-10 max-w-md animate-pulse rounded-lg bg-gray-200" />
          <div className="mx-auto flex max-w-7xl justify-center gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-72 w-64 shrink-0 animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (tasks.length === 0) {
    return (
      <section className="hidden py-12 md:block bg-gray-50 overflow-hidden">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div
            className="mb-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-home-section-title mb-2 text-2xl text-gray-900 md:text-3xl">
              Recent available tasks
            </h2>
            <p className="font-home-section-desc mx-auto max-w-2xl text-sm text-gray-600 md:text-base">
              Open tasks you can browse and apply for right now
            </p>
          </motion.div>
          <div className="mx-auto max-w-7xl rounded-2xl border border-gray-100 bg-white py-12 text-center">
            <Briefcase className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-600">No open tasks yet</p>
            <p className="mt-1 text-sm text-gray-400">Be the first to post one</p>
            <Link
              href="/post-task"
              className="mt-4 inline-block font-medium text-blue-600 hover:underline"
            >
              Post a task
            </Link>
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
    <section className="hidden py-12 md:block bg-gray-50 overflow-hidden">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="font-home-section-title mb-2 text-2xl text-gray-900 md:text-3xl">
            Recent available tasks
          </h2>
          <p className="font-home-section-desc mx-auto max-w-2xl text-sm text-gray-600 md:text-base">
            Open tasks you can browse and apply for right now
          </p>
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
              <div className="flex w-max gap-4 transform-gpu will-change-transform">
                {loopDesktop.map((task, idx) => (
                <div
                  key={`${task.id}-${idx}`}
                  className="w-56 flex-shrink-0 scroll-snap-start sm:w-60 md:w-64"
                >
                  <Link
                    href={`/tasks/${task.id}`}
                    className="group block overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-shadow duration-300 hover:shadow-lg"
                    onMouseEnter={() => {
                      try {
                        prefetchBidsForTask(task.id);
                      } catch {
                        /* ignore */
                      }
                    }}
                    onTouchStart={() => {
                      try {
                        prefetchBidsForTask(task.id);
                      } catch {
                        /* ignore */
                      }
                    }}
                  >
                    <div className="relative h-32 overflow-hidden bg-gray-100">
                      <TaskCardImage
                        url={task.imageUrl || PLACEHOLDER}
                        alt=""
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                      <div className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-gray-800 backdrop-blur-sm">
                        {task.category_name}
                      </div>
                      <div className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-blue-700 backdrop-blur-sm">
                        {formatBudget(task.budget)}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="task-title line-clamp-2 min-w-0 overflow-hidden break-words text-base text-gray-900">
                        {task.title}
                      </h3>
                      {task.location ? (
                        <p className="mt-2 flex min-w-0 items-center gap-1 text-sm text-gray-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{task.location}</span>
                        </p>
                      ) : null}
                    </div>
                  </Link>
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
