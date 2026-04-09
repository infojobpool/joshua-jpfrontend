"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Users } from "lucide-react";
import useStore from "@/lib/Zustand";

/**
 * Mobile home hero: full-bleed premium band + search (logo in MainHeader).
 * Headline uses system Impact-style stack (Impact / Arial Black fallbacks).
 */
export function MobileHeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const user = useStore((s) => s.user);
  const firstName =
    user?.name?.trim().split(/\s+/)[0] || (isAuthenticated ? "there" : "");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/browse/?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/browse/");
    }
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
              <p
                className="mb-3 text-center text-[0.8125rem] font-semibold tracking-wide text-white/95 sm:text-sm"
                style={{
                  fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                  textShadow: "0 1px 8px rgba(0,0,0,0.35)",
                }}
              >
                Welcome back, {firstName}!
              </p>
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
            <div
              className="mx-auto mt-4 h-px w-14 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              aria-hidden
            />
            <p
              className="mx-auto mt-4 max-w-[19.5rem] text-center text-[0.8125rem] leading-relaxed text-blue-100/90 sm:text-sm font-medium"
              style={{
                fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                letterSpacing: "0.01em",
              }}
            >
              Post a task or search what you need — local helpers, clear offers.
            </p>
          </div>

          <form
            onSubmit={onSearch}
            className="mt-7"
            role="search"
            aria-label="Search tasks"
          >
            <div className="flex gap-2.5 items-stretch">
              <div className="flex-1 min-w-0 rounded-2xl border border-white/20 bg-white shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.95)] ring-1 ring-black/5 transition-[box-shadow,ring] duration-200 focus-within:border-blue-400/80 focus-within:ring-2 focus-within:ring-blue-300/50 focus-within:shadow-[0_12px_40px_-10px_rgba(37,99,235,0.45)]">
                <input
                  type="search"
                  enterKeyHint="search"
                  placeholder="What do you need help with?"
                  className="w-full min-h-[3.35rem] rounded-2xl bg-transparent px-4 py-3.5 text-[0.9375rem] text-slate-900 placeholder:text-slate-400 placeholder:font-medium outline-none antialiased"
                  style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="shrink-0 flex items-center justify-center self-stretch min-w-[3.35rem] rounded-2xl bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-950/30 ring-1 ring-white/20 transition active:scale-[0.98] hover:from-blue-400 hover:to-blue-600"
                aria-label="Search tasks"
              >
                <Search className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-col gap-2.5">
            <Link href="/post-task/" className="block">
              <Button
                type="button"
                className="h-12 w-full rounded-2xl border-0 bg-gradient-to-r from-sky-400 via-blue-500 to-blue-600 text-[15px] font-semibold text-white shadow-[0_8px_28px_-6px_rgba(37,99,235,0.65)] ring-1 ring-white/25 hover:brightness-105"
              >
                Post your task — it&apos;s free
              </Button>
            </Link>
            <Link href="/dashboard/" className="block">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-2xl border-2 border-white/40 bg-white/10 text-[15px] font-semibold text-white backdrop-blur-sm hover:bg-white/18 hover:text-white"
              >
                Browse available tasks
              </Button>
            </Link>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-[11px] font-medium uppercase tracking-wider text-white/55">
            <Users className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="normal-case tracking-normal text-white/70">
              Verified users · Pay safely on the platform
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
