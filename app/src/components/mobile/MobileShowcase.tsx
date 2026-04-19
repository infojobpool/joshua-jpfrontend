"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export function MobileShowcase() {
  return (
    <div className="md:hidden bg-white">
      <section className="px-4 py-3">
        <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm overflow-hidden">
          <div className="p-3">
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
          <div className="relative h-32 w-full bg-gray-100">
            <Image
              src="/images/land.png"
              alt="Tasker opportunities on JobPool"
              fill
              className="object-cover object-[50%_35%]"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="px-4 pb-3">
        <div className="rounded-2xl border border-gray-200/70 bg-white shadow-sm overflow-hidden">
          <div className="p-3">
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
          <div className="relative h-32 w-full bg-gray-100">
            <Image
              src="/images/post%20a%20task.png"
              alt="Post a task on JobPool"
              fill
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
        </div>
      </section>

      <div className="px-4 pb-2 text-center">
        <Link href="/how-it-works" className="text-[11px] font-medium text-slate-500 hover:text-blue-600">
          How JobPool works
        </Link>
      </div>
    </div>
  );
}

export default MobileShowcase;
