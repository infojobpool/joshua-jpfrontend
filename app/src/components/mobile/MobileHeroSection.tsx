"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import useStore from "@/lib/Zustand";

/**
 * Mobile home hero: full-bleed band + task title → post-task with ?title= prefilled.
 */
export function MobileHeroSection() {
  const router = useRouter();
  const [taskTitle, setTaskTitle] = useState("");
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const user = useStore((s) => s.user);
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
    <section className="md:hidden w-full bg-slate-100 pb-2">
      <div className="relative w-full overflow-hidden bg-gradient-to-b from-blue-500 via-blue-700 to-[#0c1e4a] text-white shadow-[0_16px_48px_-12px_rgba(30,64,175,0.55)] ring-1 ring-white/10">
        {/* Depth: soft top highlight + vignette */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-30%,rgba(255,255,255,0.22),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,rgba(0,0,0,0.35),transparent_45%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-lg px-4 pb-8 pt-6 sm:px-5">
          <div className="text-center">
            {isAuthenticated && firstName ? (
              <div
                className="mx-auto mb-5 flex max-w-[17.5rem] flex-col items-center gap-1 rounded-2xl border border-white/30 bg-gradient-to-b from-white/[0.18] to-white/[0.06] px-5 py-3 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] backdrop-blur-xl sm:max-w-xs"
                style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
              >
                <div className="flex items-center gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.28em] text-amber-100/95">
                  <Sparkles className="h-3 w-3 text-amber-200/90" aria-hidden />
                  <span>Welcome back</span>
                </div>
                <p className="text-lg font-semibold leading-tight tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)] sm:text-xl">
                  {firstName}
                </p>
              </div>
            ) : null}
            <h1
              className="font-impact-hero text-center uppercase text-[2.4rem] leading-[1.02] tracking-[0.03em] text-white sm:text-[2.95rem] px-0.5"
              style={{
                textShadow:
                  "0 1px 0 rgba(0,0,0,0.5), 0 3px 20px rgba(0,0,0,0.4), 0 0 48px rgba(147,197,253,0.18)",
              }}
            >
              Get Everything Done
            </h1>
          </div>

          <form
            onSubmit={onFormSubmit}
            className="mt-6 space-y-3 sm:mt-7"
            aria-label="Start posting a task"
          >
            <input
              type="text"
              enterKeyHint="go"
              autoComplete="off"
              placeholder="e.g. title of the job you need done"
              className="w-full min-h-[3.25rem] rounded-2xl border-0 bg-white px-4 py-3.5 text-[0.9375rem] text-slate-900 shadow-[0_8px_28px_-10px_rgba(0,0,0,0.35)] outline-none ring-1 ring-black/[0.06] transition-shadow placeholder:text-slate-400 placeholder:font-normal focus:ring-2 focus:ring-white/70"
              style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <Button
              type="submit"
              className="h-12 w-full rounded-2xl border-0 bg-white text-[15px] font-semibold text-blue-700 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.35)] hover:bg-blue-50"
            >
              Next
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
