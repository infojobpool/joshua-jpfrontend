"use client";

import { Home, Search, Plus, MessageSquare, LayoutList } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GuideNavKey } from "@/lib/appFeatureGuide";

const ITEMS: { key: GuideNavKey; icon: typeof Home; label: string }[] = [
  { key: "home", icon: Home, label: "Home" },
  { key: "tasks", icon: Search, label: "Tasks" },
  { key: "post", icon: Plus, label: "Post" },
  { key: "chat", icon: MessageSquare, label: "Chat" },
  { key: "listings", icon: LayoutList, label: "Listings" },
];

export function GuideNavPreview({ highlight }: { highlight?: GuideNavKey }) {
  if (!highlight) return null;

  return (
    <div
      className="mx-auto w-full max-w-xs rounded-2xl border border-slate-200/90 bg-white/95 px-2 py-2 shadow-md ring-1 ring-slate-900/[0.04] dark:border-slate-700 dark:bg-slate-900/90"
      aria-hidden
    >
      <div className="flex items-center justify-between gap-0.5">
        {ITEMS.map(({ key, icon: Icon, label }) => {
          const active = key === highlight;
          if (key === "post") {
            return (
              <div key={key} className="flex flex-1 justify-center">
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-white shadow-lg transition-all dark:border-slate-900",
                    active
                      ? "scale-110 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white ring-2 ring-blue-300/60"
                      : "bg-gradient-to-br from-[#2563eb]/40 to-[#1d4ed8]/40 text-white/80"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </div>
              </div>
            );
          }
          return (
            <div
              key={key}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-1 transition-colors",
                active
                  ? "bg-[#eff6ff] text-[#2563eb] dark:bg-slate-700 dark:text-[#60a5fa]"
                  : "text-slate-400 dark:text-slate-500"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-[9px] font-medium truncate">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
