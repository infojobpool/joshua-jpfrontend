"use client";

import React from "react";
import Link from "next/link";

export function MobileShowcase() {
  return (
    <div className="md:hidden space-y-2 bg-white px-4 py-3">
      <div className="rounded-2xl border border-gray-200/70 bg-white p-3 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">Be your own boss</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Find flexible work on JobPool — no subscription fees, secure payouts.
        </p>
        <Link
          href="/signup"
          className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Become a Helper →
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-200/70 bg-white p-3 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900">Post your first task</h3>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">
          Describe the job, set a budget, and pick the best offer — fast.
        </p>
        <Link
          href="/post-task"
          className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Post a task →
        </Link>
      </div>

      <div className="pb-1 pt-0.5 text-center">
        <Link href="/how-it-works" className="text-[11px] font-medium text-slate-500 hover:text-blue-600">
          How JobPool works
        </Link>
      </div>
    </div>
  );
}

export default MobileShowcase;
