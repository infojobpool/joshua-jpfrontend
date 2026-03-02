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
      className="fixed left-0 right-0 bottom-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || 
            (href !== "/" && pathname.startsWith(href));
          
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 active:scale-95 touch-manipulation ${
                isActive
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
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







