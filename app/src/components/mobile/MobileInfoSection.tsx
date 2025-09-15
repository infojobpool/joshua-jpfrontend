"use client";

import React from "react";

export function MobileInfoSection() {
  return (
    <div className="md:hidden px-4 py-5 bg-white">
      <div className="rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-md p-4 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Be your own boss</h3>
        <p className="text-sm text-gray-600 mb-3">
          Find flexible work nearby. Post your skills, receive offers, and get paid securely on JobPool.
        </p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" /> Free access to thousands of jobs</li>
          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" /> No subscription or credit fees</li>
          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" /> Earn extra income on a flexible schedule</li>
          <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600" /> Grow your business and client base</li>
        </ul>
      </div>

      <div className="mt-4 rounded-2xl border border-gray-200/70 bg-white/80 backdrop-blur-md p-4 shadow-sm">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Post your first task in seconds</h3>
        <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
          <li>Describe what you need done</li>
          <li>Set your budget</li>
          <li>Receive quotes and pick the best Tasker</li>
        </ol>
      </div>
    </div>
  );
}

export default MobileInfoSection;


