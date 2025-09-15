"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MobileHeroSection() {
  return (
    <div className="relative min-h-[100dvh] h-[100dvh] overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex items-center justify-center px-4 pt-[calc(env(safe-area-inset-top)+56px)] pb-[calc(env(safe-area-inset-bottom)+72px)]">

      <div className="relative w-full max-w-md text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-xl font-bold shadow-lg shadow-black/10">
          JP
        </div>
        <h1 className="text-3xl font-extrabold leading-tight tracking-tight">Get Any Task Done</h1>
        <p className="text-blue-100/90">Post a task. Get offers from local helpers. Done safely.</p>
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-blue-100/90">
          <span className="px-2 py-1 rounded-full bg-white/10 border border-white/20">1k+ customers</span>
          <span className="px-2 py-1 rounded-full bg-white/10 border border-white/20">5k+ tasks done</span>
          <span className="px-2 py-1 rounded-full bg-white/10 border border-white/20">★ 4.9 rating</span>
        </div>
        <div className="pt-1">
          <div className="flex gap-1.5 overflow-x-auto pb-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
            {['Cleaning','Moving','Handyman','Assembly','Delivery','Plumbing','Electrical','Mounting'].map((label) => (
              <span key={label} className="shrink-0 px-3 py-1.5 rounded-full text-sm bg-white/10 border border-white/20 text-blue-100">
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* How it works (compact) */}
        <div className="pt-2">
          <div className="grid grid-cols-3 gap-1.5 text-left">
            <div className="bg-white/10 border border-white/20 rounded-xl p-2">
              <p className="text-white text-sm font-semibold">1. Post</p>
              <p className="text-[11px] text-blue-100">Describe the task</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl p-2">
              <p className="text-white text-sm font-semibold">2. Compare</p>
              <p className="text-[11px] text-blue-100">Get offers fast</p>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl p-2">
              <p className="text-white text-sm font-semibold">3. Done</p>
              <p className="text-[11px] text-blue-100">Pay when complete</p>
            </div>
          </div>
        </div>
        <Link href="/post-task" className="block">
          <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 rounded-3xl h-12 text-base font-semibold shadow-xl shadow-black/10 active:scale-[0.98] transition-transform">Post a Task - It's Free</Button>
        </Link>
      </div>
    </div>
  );
}