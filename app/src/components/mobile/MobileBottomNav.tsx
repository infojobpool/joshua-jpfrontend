"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, User, MessageCircle } from "lucide-react";
import { useIsMobile } from "./MobileWrapper";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { isMobile } = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!isMobile) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show nav when scrolling up or at top, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile, lastScrollY]);

  if (!isMobile) return null;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/browse-tasks", icon: Search, label: "Browse" },
    { href: "/post-task", icon: Plus, label: "Post" },
    { href: "/messages", icon: MessageCircle, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div 
      className={`fixed left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 z-50 md:hidden transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{ bottom: 0 }}
    >
      <div className="flex justify-around items-center py-2 pb-safe">
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







