"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Plus, MessageSquare, Bell, Briefcase } from "lucide-react";
import useStore from "@/lib/Zustand";
import { cn } from "@/lib/utils";

const MainHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout, checkAuth } = useStore();
  const unreadCount = useStore((s) => s.unreadCount);
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = usePathname();
  const isMarketingHome = pathname === "/" || pathname === "";
  const isDashboard = pathname === "/dashboard";

  useEffect(() => {
    try {
      checkAuth();
    } finally {
      // Mark after first client pass to avoid SSR/client mismatch flashes
      setIsHydrated(true);
    }
  }, [checkAuth]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  // Hide header until hydrated to prevent flash of wrong auth state after refresh
  if (!isHydrated) {
    return null;
  }

  // Browse + listing detail use a slim sticky chrome (back / brand); avoid stacking two top bars.
  if (pathname?.startsWith("/listings")) {
    return null;
  }

  // Hide header on key authenticated app pages to reduce clutter (they use their own Header)
  const hideOnPrefixes = [
    "/post-task",
    "/tasks",
    "/browse",
    "/browse-tasks",
    "/dashboard",
    "/profile",
    "/messages",
    "/wallet",
    "/settings",
  ];
  if (isAuthenticated && pathname && hideOnPrefixes.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <header
      className={cn(
        "shrink-0 bg-white/95 backdrop-blur-sm sticky top-0 z-50",
        isMarketingHome ? "max-md:border-b-0 max-md:shadow-none" : "border-b border-gray-100",
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={cn(
            "flex items-center justify-between gap-3 md:min-h-0 md:h-[4.25rem] md:py-2 lg:h-[4.5rem] lg:py-2.5",
            isMarketingHome
              ? isAuthenticated
                ? "max-md:min-h-0 max-md:py-1 max-md:pb-1"
                : "max-md:min-h-0 max-md:py-0.5 max-md:pb-1"
              : isDashboard
                ? "max-md:min-h-0 max-md:py-1 max-md:pb-1"
                : "min-h-[5.75rem] py-2.5 md:min-h-0 md:py-2",
          )}
        >
          {/* Logo — mobile: full JOB POOL lockup PNG; desktop: wide mark */}
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2 group flex-shrink-0 md:flex-initial"
          >
            <img
              src="/images/jobpool-logo-header.png"
              alt="JobPool"
              className={cn(
                "w-auto max-w-[min(340px,82vw)] object-contain object-left md:hidden",
                isMarketingHome
                  ? isAuthenticated
                    ? "h-10 sm:h-11"
                    : "h-[3.75rem] sm:h-[4.125rem]"
                  : isDashboard
                    ? "h-10 sm:h-11"
                    : "h-[4.75rem] sm:h-[5.125rem]",
              )}
            />
            <img
              src="/images/new_logo_22-removebg-preview.png"
              alt="JobPool"
              className="hidden md:block h-9 md:h-10 lg:h-11 w-auto object-contain drop-shadow-sm transition-all duration-300 group-hover:drop-shadow-md group-hover:opacity-90"
            />
          </Link>

          {/* Desktop: marketing links only (Messages lives in the action cluster) */}
          <nav className="hidden min-w-0 md:flex flex-1 items-center justify-center gap-x-5 gap-y-1 px-4 text-sm font-medium text-slate-600 lg:gap-x-7">
            <Link href="/how-it-works" className="shrink-0 whitespace-nowrap transition-colors hover:text-blue-600">
              How It Works
            </Link>
            <Link href="/categories" className="shrink-0 whitespace-nowrap transition-colors hover:text-blue-600">
              Categories
            </Link>
            <Link href="/aboutus" className="shrink-0 whitespace-nowrap transition-colors hover:text-blue-600">
              About Us
            </Link>
            <Link href="/support" className="shrink-0 whitespace-nowrap transition-colors hover:text-blue-600">
              Support
            </Link>
          </nav>

          {/* Desktop auth: single primary CTA + compact icon actions (name shown on home hero, not repeated here) */}
          <div className="hidden shrink-0 md:flex items-center gap-2 lg:gap-2.5">
            {isAuthenticated ? (
              <>
                <Link href="/post-task">
                  <Button size="sm" className="bg-blue-600 px-4 hover:bg-blue-700 text-white shadow-sm">
                    <Plus className="h-4 w-4" />
                    <span className="hidden lg:inline">Post Task</span>
                    <span className="lg:hidden">Post</span>
                  </Button>
                </Link>
                <div className="ml-1 flex items-center gap-1 border-l border-slate-200/90 pl-2 lg:ml-2 lg:pl-3">
                  <Link href="/messages" title="Messages" aria-label="Messages">
                    <Button type="button" variant="outline" size="icon" className="rounded-lg border-slate-200 text-slate-700 shadow-none hover:bg-slate-50">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/dashboard" title="Tasks" aria-label="Tasks">
                    <Button type="button" variant="outline" size="icon" className="rounded-lg border-slate-200 text-slate-700 shadow-none hover:bg-slate-50">
                      <Briefcase className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout} className="px-2.5 text-slate-600 hover:text-red-600">
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link href="/signin">
                  <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile: notifications + menu */}
          <div className="md:hidden flex shrink-0 items-center gap-2">
            {isAuthenticated ? (
              <Link
                href="/notifications"
                className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-blue-100 bg-gradient-to-b from-white to-blue-50/80 text-blue-800 shadow-[0_2px_12px_rgba(37,99,235,0.12)] ring-1 ring-blue-200/40 hover:border-blue-200 hover:from-blue-50 hover:to-blue-100/90 hover:text-blue-900 active:scale-[0.97] transition-all"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="h-5 w-5" aria-hidden />
                {unreadCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold leading-none text-white shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            ) : null}
            <button
              type="button"
              className="flex h-12 min-w-[3rem] shrink-0 items-center justify-center rounded-2xl border-2 border-blue-100 bg-gradient-to-b from-white to-blue-50/80 text-blue-800 shadow-[0_2px_12px_rgba(37,99,235,0.12)] ring-1 ring-blue-200/40 hover:border-blue-200 hover:from-blue-50 hover:to-blue-100/90 hover:text-blue-900 active:scale-[0.97] transition-all"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 stroke-[2.5]" />
              ) : (
                <Menu className="h-6 w-6 stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-4 transition-all duration-200 ease-in-out">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="/how-it-works" 
                className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link 
                href="/categories" 
                className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Categories
              </Link>
              <Link 
                href="/aboutus" 
                className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About Us
              </Link>
              <Link 
                href="/support" 
                className="text-gray-600 hover:text-blue-600 transition-colors px-4 py-2 hover:bg-gray-50 rounded-md"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Support
              </Link>
              
              {/* Mobile Auth Section */}
              <div className="flex flex-col space-y-3 px-4 pt-4 border-t border-gray-100">
                {isAuthenticated ? (
                  <>
                    <Link href="/post-task" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
                        <Plus className="h-4 w-4" />
                        Post Task
                      </Button>
                    </Link>
                    <Link href="/messages" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Messages
                      </Button>
                    </Link>
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                        <Briefcase className="h-4 w-4 mr-2" />
                        Tasks
                      </Button>
                    </Link>
                    <Button variant="ghost" onClick={handleLogout} className="w-full text-gray-600 hover:text-red-600">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/signin" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default MainHeader;