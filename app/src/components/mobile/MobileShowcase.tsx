"use client";

import React from "react";
import Image from "next/image";

export function MobileShowcase() {
  return (
    <div className="md:hidden bg-white">
      {/* Section 1: Be your own boss */}
      <section className="px-4 py-6 mt-4">
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-md shadow-sm overflow-hidden">
          <div className="p-4">
            <h3 className="text-2xl font-extrabold text-gray-900">Be your own boss</h3>
            <p className="text-sm text-gray-600 mt-2">
              Whether you're a spreadsheet guru or a diligent carpenter, find your next job on JobPool.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"></span> Free access to thousands of opportunities</li>
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"></span> No subscription or credit fees</li>
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"></span> Flexible schedule and secure payments</li>
              <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600"></span> Grow your business and client base</li>
            </ul>
          </div>
          <div className="relative h-56 w-full rounded-b-2xl overflow-hidden bg-black">
            <Image src="/images/pottery.JPG" alt="Tasker at work" fill className="object-contain" sizes="(max-width: 768px) 100vw, 600px" priority />
          </div>
        </div>
      </section>

      {/* Section 2: Post your first task */}
      <section className="px-4 pb-6">
        <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-md shadow-sm overflow-hidden">
          <div className="p-4">
            <h3 className="text-2xl font-extrabold text-gray-900">Post your first task</h3>
            <p className="text-sm text-gray-600 mt-2">Save yourself hours and get your to-do list completed.</p>
            <ol className="mt-3 space-y-2 text-sm text-gray-700 list-decimal list-inside">
              <li>Describe what you need done</li>
              <li>Set your budget</li>
              <li>Receive quotes and pick the best Tasker</li>
            </ol>
          </div>
          <div className="relative h-56 w-full rounded-b-2xl overflow-hidden bg-black">
            <Image src="/images/eldercare.JPG" alt="Eldercare help" fill className="object-contain" sizes="(max-width: 768px) 100vw, 600px" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default MobileShowcase;


