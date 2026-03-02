"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, User, MessageCircle } from "lucide-react";
import { useIsMobile } from "./MobileWrapper";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isMobile } = useIsMobile();

  if (!isMobile) return null;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/dashboard", icon: Search, label: "Browse" },
    { href: "/post-task", icon: Plus, label: "Post" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div 
      className="fixed left-0 right-0 bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)] z-50 md:hidden mobile-nav-appear"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center py-2.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || 
            (href !== "/" && pathname.startsWith(href));
          
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-all duration-200 active:scale-95 touch-manipulation ${
                isActive
                  ? "text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-slate-700"
                  : "text-gray-700 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-[#60a5fa] hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}







