"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, MessageCircle, Plus } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();

  const postTaskButton = (
    <Link
      href="/post-task"
      className="flex-shrink-0 -mt-6 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95 transition-all duration-200 ease-out touch-manipulation border-4 border-white dark:border-slate-900"
      aria-label="Post a task"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </Link>
  );

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/dashboard", icon: Search, label: "Browse" },
    { type: "post" as const },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  const navLinkClass =
    "flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-200 ease-out active:scale-90 touch-manipulation min-w-0 flex-1";

  return (
    <div
      className="fixed left-0 right-0 bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-50 md:hidden mobile-nav-appear"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between px-3 py-2 max-w-lg mx-auto gap-1">
        {navItems.map((item) => {
          if (item.type === "post") {
            return (
            <div key="post" className="flex-shrink-0 flex justify-center">
              {postTaskButton}
            </div>
          );
          }
          const { href, icon: Icon, label } = item as {
            href: string;
            icon: React.ComponentType<{ className?: string }>;
            label: string;
          };
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`${navLinkClass} ${
                isActive
                  ? "text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-slate-700"
                  : "text-gray-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-[#60a5fa] hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
