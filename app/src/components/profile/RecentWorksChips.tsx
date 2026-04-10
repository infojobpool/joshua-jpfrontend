"use client";

import { Briefcase } from "lucide-react";

type ReviewLike = { project?: string; jobTitle?: string };

/**
 * Surfaces completed task titles from review payload as "recent work" until a dedicated API exists.
 */
export function RecentWorksChips({ reviews }: { reviews: ReviewLike[] }) {
  const titles = Array.from(
    new Set(
      reviews
        .map((r) => (r.project || r.jobTitle || "").trim())
        .filter((t) => t.length > 0)
    )
  ).slice(0, 10);

  if (titles.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
        <Briefcase className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-2 font-medium text-slate-600">No recent work to show yet</p>
        <p className="mt-1 text-sm text-slate-500">
          Completed jobs from reviews will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {titles.map((title) => (
        <li
          key={title}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1.5 text-sm font-medium text-emerald-900"
        >
          <Briefcase className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
          <span className="max-w-[220px] truncate">{title}</span>
        </li>
      ))}
    </ul>
  );
}
