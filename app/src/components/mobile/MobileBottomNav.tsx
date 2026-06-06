"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Search, Plus, MessageSquare, LayoutList } from "lucide-react";
import { isMobileBottomNavHidden } from "@/lib/mobileNavVisibility";
import { HOME_BROWSE_ALL_TASKS_HREF } from "@/lib/homeSectionNav";
import axiosInstance from "@/lib/axiosInstance";
import useStore from "@/lib/Zustand";

type NavLinkItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  /** When set, active only on /profile with this ?tab= value */
  activeProfileTab?: string;
  tourId?: string;
};

export function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userId = useStore((s) => s.userId);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const unreadRef = useRef(0);

  useEffect(() => {
    unreadRef.current = unreadChatCount;
  }, [unreadChatCount]);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setUnreadChatCount(0);
      return;
    }

    let cancelled = false;
    const readUnread = async () => {
      try {
        const res = await axiosInstance.get("/my-chats/", {
          params: { user_id: String(userId), limit: 50, offset: 0 },
          timeout: 12_000,
        });
        const root = (res?.data ?? {}) as Record<string, unknown>;
        if (root.status_code != null && Number(root.status_code) !== 200) return;
        const data = (root.data && typeof root.data === "object" ? root.data : root) as Record<string, unknown>;
        const rows = Array.isArray(data.chats) ? (data.chats as Record<string, unknown>[]) : [];
        const next = rows.reduce((sum, c) => {
          const raw = c.unread_count ?? c.unreadCount ?? 0;
          const n =
            typeof raw === "number" && Number.isFinite(raw)
              ? Math.max(0, Math.floor(raw))
              : Math.max(0, parseInt(String(raw), 10) || 0);
          return sum + n;
        }, 0);
        if (!cancelled && next !== unreadRef.current) {
          setUnreadChatCount(next);
        }
      } catch {
        // Non-blocking; keep previous badge
      }
    };

    void readUnread();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void readUnread();
    }, 12_000);
    const onFocus = () => {
      if (document.visibilityState === "visible") void readUnread();
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [isAuthenticated, userId]);

  if (isMobileBottomNavHidden(pathname)) {
    return null;
  }

  const postTaskButton = (
    <Link
      href="/post-task"
      data-tour="tour-nav-post"
      className="flex-shrink-0 -mt-5 flex items-center justify-center w-[3.25rem] h-[3.25rem] rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95 transition-all duration-200 ease-out touch-manipulation border-[3px] border-white dark:border-slate-900"
      aria-label="Post a task"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );

  const navItems: (NavLinkItem | { type: "post" })[] = [
    { href: "/", icon: Home, label: "Home", tourId: "tour-nav-home" },
    { href: HOME_BROWSE_ALL_TASKS_HREF, icon: Search, label: "Tasks", tourId: "tour-nav-tasks" },
    { type: "post" },
    { href: "/messages", icon: MessageSquare, label: "Chat", tourId: "tour-nav-chat" },
    {
      href: "/profile?tab=listings",
      icon: LayoutList,
      label: "Listings",
      activeProfileTab: "listings",
      tourId: "tour-nav-listings",
    },
  ];

  const navLinkClass =
    "flex flex-col items-center justify-center gap-0 py-0.5 px-1.5 rounded-lg transition-all duration-200 ease-out active:scale-90 touch-manipulation min-w-0 flex-1";

  return (
    <div
      className="fixed left-0 right-0 bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-50 md:hidden mobile-nav-appear"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between px-2 py-1.5 max-w-lg mx-auto gap-0.5">
        {navItems.map((item) => {
          if (item.type === "post") {
            return (
            <div key="post" className="flex-shrink-0 flex justify-center">
              {postTaskButton}
            </div>
          );
          }
          const { href, icon: Icon, label, activeProfileTab, tourId } = item;
          const pathOnly = href.split("?")[0];
          const isActive = activeProfileTab
            ? pathname.startsWith("/profile") && searchParams.get("tab") === activeProfileTab
            : pathname === pathOnly || (pathOnly !== "/" && pathname.startsWith(pathOnly));
          return (
            <Link
              key={href}
              href={href}
              data-tour={tourId}
              className={`${navLinkClass} ${
                isActive
                  ? "text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-slate-700"
                  : "text-gray-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-[#60a5fa] hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <span className="relative inline-flex">
                <Icon className="h-5 w-5 shrink-0" />
                {label === "Chat" && unreadChatCount > 0 ? (
                  <span
                    className="absolute -right-2 -top-2 inline-flex min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold leading-4 text-white ring-2 ring-white dark:ring-slate-900"
                    aria-label={`${unreadChatCount} unread chats`}
                  >
                    {unreadChatCount > 99 ? "99+" : unreadChatCount}
                  </span>
                ) : null}
              </span>
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
