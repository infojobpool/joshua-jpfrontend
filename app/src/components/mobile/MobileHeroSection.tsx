"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search, Users } from "lucide-react";

/** Search hints — browse filters by title/description via `q` (category IDs vary by API). */
const POPULAR = [
  { label: "Cleaning", q: "cleaning" },
  { label: "Moving", q: "moving" },
  { label: "Handyman", q: "handyman" },
  { label: "Assembly", q: "assembly" },
] as const;

/**
 * Mobile home hero: Airtasker-style contained card + TaskRabbit-style search,
 * then light secondary row for categories & steps (first glance stays calm).
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
        <div className="rounded-[28px] bg-gradient-to-br from-slate-900 via-[#0f3460] to-blue-800 text-white p-6 shadow-[0_20px_50px_-12px_rgba(30,58,138,0.45)] ring-1 ring-white/10">
          <div className="flex justify-center mb-4">
            <div className="rounded-2xl bg-white/95 p-1.5 shadow-lg ring-1 ring-black/5">
              <img
                src="/images/new-logo.png"
                alt="JobPool"
                className="h-10 w-auto"
              />
            </div>
          </div>

          <h1 className="task-title text-center text-[1.65rem] sm:text-[1.85rem] leading-[1.12] text-white tracking-tight">
            Get anything done
          </h1>
          <p className="text-center text-[0.9375rem] text-blue-100/90 mt-2.5 leading-snug px-1">
            Post a task or search what you need — local helpers, clear offers.
          </p>

          <form
            onSubmit={onSearch}
            className="mt-5 flex gap-1.5 rounded-2xl bg-white p-1.5 shadow-lg shadow-black/15 ring-1 ring-black/5"
            role="search"
            aria-label="Search tasks"
          >
            <input
              type="search"
              enterKeyHint="search"
              placeholder="What do you need help with?"
              className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-[0.9375rem] text-slate-900 placeholder:text-slate-400 outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              type="submit"
              className="shrink-0 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white w-11 h-11 transition-colors"
              aria-label="Search tasks"
            >
              <Search className="h-5 w-5" strokeWidth={2.25} />
            </button>
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

        {/* Light strip: categories + compact steps — below the fold psychologically */}
        <div className="rounded-2xl border border-slate-200/90 bg-white px-3.5 py-3.5 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 px-0.5 mb-2">
            Popular on JobPool
          </p>
          <div
            className="flex gap-2 overflow-x-auto pb-0.5 -mx-0.5 px-0.5"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {POPULAR.map(({ label, q }) => (
              <Link
                key={label}
                href={`/browse/?q=${encodeURIComponent(q)}`}
                className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-medium text-slate-800 active:scale-[0.98] transition-transform hover:bg-slate-100 hover:border-slate-300"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/browse/"
              className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-800 active:scale-[0.98] transition-transform hover:bg-blue-100"
            >
              All tasks
            </Link>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
            <div className="text-center px-1">
              <p className="text-xs font-bold text-blue-700">1 · Post</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                Describe it
              </p>
            </div>
            <div className="text-center px-1 border-x border-slate-100">
              <p className="text-xs font-bold text-blue-700">2 · Compare</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                Get offers
              </p>
            </div>
            <div className="text-center px-1">
              <p className="text-xs font-bold text-blue-700">3 · Done</p>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                Pay when ready
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
