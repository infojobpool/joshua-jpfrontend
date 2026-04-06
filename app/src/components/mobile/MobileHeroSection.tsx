"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Users } from "lucide-react";

/**
 * Mobile home hero: Airtasker-style contained card + TaskRabbit-style search.
 */
export function MobileHeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");

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
    <section className="md:hidden bg-slate-100 pb-2">
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] max-w-md mx-auto space-y-4">
        {/* Dark hero card — single focal block */}
        <div className="rounded-[28px] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white p-6 shadow-[0_20px_50px_-12px_rgba(37,99,235,0.5)] ring-1 ring-white/20">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-white/95 p-1.5 shadow-lg ring-1 ring-black/5">
              <img
                src="/images/new-logo.png"
                alt="JobPool"
                className="h-10 w-auto"
              />
            </div>
          </div>

          <h1 className="task-title text-center text-[1.65rem] sm:text-[1.85rem] leading-[1.1] text-white tracking-[-0.03em] font-extrabold">
            Get Everything Done
          </h1>
          <p
            className="text-center text-[0.9375rem] text-blue-50/95 mt-2.5 leading-snug px-1 font-medium tracking-tight"
            style={{
              fontFamily:
                "var(--font-archivo), var(--font-geist-sans), system-ui, sans-serif",
            }}
          >
            Post a task or search what you need — local helpers, clear offers.
          </p>

          <form
            onSubmit={onSearch}
            className="mt-5 space-y-2"
            role="search"
            aria-label="Search tasks"
          >
            <p
              className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-100/80"
              style={{
                fontFamily:
                  "var(--font-archivo), var(--font-geist-sans), system-ui, sans-serif",
              }}
            >
              What you need
            </p>
            <div className="flex gap-2 items-stretch">
              <div
                className="flex-1 min-w-0 rounded-2xl border-2 border-blue-200/90 bg-slate-50 shadow-[inset_0_1px_2px_rgba(15,23,42,0.04)] transition-[box-shadow,border-color,ring] duration-200 ease-out focus-within:border-blue-500 focus-within:ring-[3px] focus-within:ring-blue-500/30 focus-within:shadow-[0_0_0_1px_rgba(59,130,246,0.35),0_8px_32px_-6px_rgba(37,99,235,0.45)]"
              >
                <input
                  type="search"
                  enterKeyHint="search"
                  placeholder="What do you need help with?"
                  className="w-full min-h-[3.25rem] rounded-2xl bg-transparent px-4 py-3.5 text-[0.9375rem] text-slate-900 placeholder:text-slate-400 placeholder:font-normal outline-none antialiased tracking-tight"
                  style={{
                    fontFamily:
                      "var(--font-geist-sans), system-ui, sans-serif",
                  }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="shrink-0 flex items-center justify-center self-stretch min-w-[3.25rem] rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white shadow-md shadow-blue-900/20 transition-all"
                aria-label="Search tasks"
              >
                <Search className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>
          </form>

          <Link href="/post-task/" className="block mt-4">
            <Button
              type="button"
              className="w-full h-12 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white font-semibold text-base shadow-md border-0"
            >
              Post your task — it&apos;s free
            </Button>
          </Link>

          <Link href="/dashboard/" className="block mt-2.5">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-2xl border-2 border-white/35 bg-white/10 text-white hover:bg-white/15 hover:text-white font-semibold"
            >
              Browse available tasks
            </Button>
          </Link>

          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-white/65">
            <Users className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
            <span>Verified users · Pay safely on the platform</span>
          </p>
        </div>
      </div>
    </section>
  );
}
