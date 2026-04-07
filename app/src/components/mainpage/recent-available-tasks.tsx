"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
  const trackRef = useRef<HTMLDivElement | null>(null);

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
    if (variant !== "mobile" || !tasks.length) return;
    const el = trackRef.current;
    if (!el) return;

    let paused = false;
    /** Slow, smooth drift (~0.4px/frame ≈ 24px/s at 60fps) */
    const speed = 0.4;
    let rafId = 0;

    const tick = () => {
      if (!paused && el) {
        const half = el.scrollWidth / 2;
        if (half > el.clientWidth + 2) {
          el.scrollLeft += speed;
          if (el.scrollLeft >= half - 1) {
            el.scrollLeft -= half;
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    const startId = window.setTimeout(() => {
      rafId = requestAnimationFrame(tick);
    }, 80);

    const onEnter = () => {
      paused = true;
    };
    const onLeave = () => {
      paused = false;
    };
    const onVisibility = () => {
      paused = document.hidden;
    };

    el.addEventListener("touchstart", onEnter, { passive: true });
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("touchend", onLeave, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(startId);
      cancelAnimationFrame(rafId);
      el.removeEventListener("touchstart", onEnter);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("touchend", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [variant, tasks.length]);

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
          <h3 className="text-lg font-semibold text-gray-900">Recent available tasks</h3>
          <p className="mt-1 text-sm text-gray-500">Open tasks you can apply for right now</p>
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

    return (
      <div className="md:hidden px-4 py-4 bg-white">
        <h3 className="mb-1 text-lg font-semibold text-gray-900">Recent available tasks</h3>
        <p className="mb-3 text-sm text-gray-500">Open tasks you can apply for right now</p>
        <div
          ref={trackRef}
          className="overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max gap-3 pr-1">
            {loop.map((t, idx) => (
              <Link
                key={`${t.id}-${idx}`}
                href={`/tasks/${t.id}`}
                className="group shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-lg shadow-black/5 w-64"
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
                  <h4 className="task-title line-clamp-2 text-sm font-semibold text-gray-900">
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
            <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
              Recent available tasks
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-gray-600 md:text-base">
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
          <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
            Recent available tasks
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-gray-600 md:text-base">
            Open tasks you can browse and apply for right now
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-7xl">
          <div className="flex justify-center">
            <div
              className="flex gap-4 overflow-x-auto pb-6 pl-12 pr-12 md:pl-14 md:pr-14 scrollbar-hide"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                scrollSnapType: "x mandatory",
              }}
            >
              {tasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  className="w-56 flex-shrink-0 scroll-snap-start sm:w-60 md:w-64"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.5 }}
                  viewport={{ once: true }}
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
                      <h3 className="task-title line-clamp-2 min-h-[2.75rem] text-base font-semibold leading-snug text-gray-900">
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
