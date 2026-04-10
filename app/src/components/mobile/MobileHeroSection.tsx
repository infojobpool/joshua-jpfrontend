"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useStore from "@/lib/Zustand";

/**
 * Mobile home hero: full-bleed band + task title → post-task with ?title= prefilled.
 */
export function MobileHeroSection() {
  const router = useRouter();
  const [taskTitle, setTaskTitle] = useState("");
  const checkAuth = useStore((s) => s.checkAuth);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const user = useStore((s) => s.user);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const firstName =
    user?.name?.trim().split(/\s+/)[0] || (isAuthenticated ? "there" : "");

  const goToPostTask = () => {
    const t = taskTitle.trim();
    if (t) {
      router.push(`/post-task?title=${encodeURIComponent(t)}`);
    } else {
      router.push("/post-task");
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    goToPostTask();
  };

  return (
    <section className="md:hidden w-full bg-white -mt-px">
      <div className="relative w-full overflow-hidden rounded-b-[1.25rem] bg-gradient-to-b from-blue-500 via-blue-700 to-[#0c1e4a] text-white shadow-[0_16px_48px_-12px_rgba(30,64,175,0.55)] ring-1 ring-white/10 sm:rounded-b-3xl">
        {/* Depth: soft top highlight + vignette */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-30%,rgba(255,255,255,0.22),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,rgba(0,0,0,0.35),transparent_45%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-lg px-4 pb-7 pt-4 sm:px-5 sm:pb-8 sm:pt-5">
          {isAuthenticated && firstName ? (
            <div
              className="mb-4 border-l-[3px] border-white/40 pl-3.5 text-left sm:mb-5 sm:pl-4"
              style={{ fontFamily: "var(--font-archivo), var(--font-geist-sans), system-ui, sans-serif" }}
            >
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-white/70">
                Welcome back
              </p>
              <p className="mt-1 text-[1.25rem] font-bold leading-snug tracking-[-0.02em] text-white [text-shadow:0_1px_20px_rgba(0,0,0,0.35)] sm:text-[1.5rem]">
                {firstName}
              </p>
            </div>
          ) : null}

          <div className="text-center">
            <h1
              className="font-hero-display text-center uppercase text-[2.15rem] text-white sm:text-[2.75rem] px-0.5"
              style={{
                textShadow:
                  "0 1px 0 rgba(0,0,0,0.45), 0 4px 24px rgba(0,0,0,0.38), 0 0 56px rgba(147,197,253,0.2)",
              }}
            >
              Get Everything Done
            </h1>
          </div>

          <form
            onSubmit={onFormSubmit}
            className="mt-5 space-y-3 sm:mt-6"
            aria-label="Start posting a task"
          >
            <input
              type="text"
              enterKeyHint="go"
              autoComplete="off"
              placeholder="e.g. title of the job you need done"
              className="w-full min-h-[3.125rem] rounded-2xl border-0 bg-white/95 px-4 py-3.5 text-[0.9375rem] text-slate-900 shadow-[0_10px_32px_-12px_rgba(0,0,0,0.45)] outline-none ring-1 ring-white/40 backdrop-blur-sm transition-shadow placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-white/80"
              style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <div className="flex justify-center pt-1">
              <button
                type="submit"
                className="relative min-h-[2.875rem] min-w-[11rem] overflow-hidden rounded-full border border-white/55 bg-gradient-to-b from-white/[0.22] to-white/[0.06] px-8 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_28px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-md transition-[transform,box-shadow,border-color,background-color] duration-300 hover:border-white/75 hover:from-white/[0.3] hover:shadow-[0_12px_36px_rgba(0,0,0,0.32)] active:scale-[0.98]"
                style={{ fontFamily: "var(--font-archivo), var(--font-geist-sans), system-ui, sans-serif" }}
              >
                <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">Post Now</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
