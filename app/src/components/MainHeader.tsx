"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, User, Plus } from "lucide-react";
import useStore from "@/lib/Zustand";

const MainHeader: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout, checkAuth } = useStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = usePathname();

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

  // Hide header on key authenticated app pages to reduce clutter (they use their own Header)
  const hideOnPrefixes = [
    "/dashboard",
    "/post-task",
    "/tasks",
    "/browse",
    "/browse-tasks",
    "/profile",
    "/messages",
    "/wallet",
    "/settings",
  ];
  if (isAuthenticated && pathname && hideOnPrefixes.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 md:h-24 lg:h-28 items-center justify-between pt-3 md:pt-4 lg:pt-5 gap-3">
          {/* Logo — mobile: full JOB POOL lockup PNG; desktop: wide mark */}
          <Link
            href="/"
            className="flex min-w-0 flex-1 items-center gap-2 group flex-shrink-0 md:flex-initial"
          >
            <img
              src="/images/jobpool-logo-header.png"
              alt="JobPool"
              className="h-11 w-auto max-w-[min(240px,60vw)] object-contain object-left md:hidden"
            />
            <img
              src="/images/new_logo_22-removebg-preview.png"
              alt="JobPool"
              className="hidden md:block h-9 md:h-10 lg:h-11 w-auto object-contain drop-shadow-sm transition-all duration-300 group-hover:drop-shadow-md group-hover:opacity-90"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/how-it-works" className="text-gray-600 hover:text-blue-600 transition-colors">
              How It Works
            </Link>
            <Link href="/categories" className="text-gray-600 hover:text-blue-600 transition-colors">
              Categories
            </Link>
            <Link href="/aboutus" className="text-gray-600 hover:text-blue-600 transition-colors">
              About Us
            </Link>
            <Link href="/support" className="text-gray-600 hover:text-blue-600 transition-colors">
              Support
            </Link>
          </nav>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/post-task">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Post Task
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                  <Link href="/dashboard">
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                  <Button variant="ghost" onClick={handleLogout} className="text-gray-600 hover:text-red-600">
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

          {/* Mobile menu — larger tap target, clearer affordance */}
          <button
            type="button"
            className="md:hidden flex h-12 min-w-[3rem] shrink-0 items-center justify-center rounded-2xl border-2 border-blue-100 bg-gradient-to-b from-white to-blue-50/80 text-blue-800 shadow-[0_2px_12px_rgba(37,99,235,0.12)] ring-1 ring-blue-200/40 hover:border-blue-200 hover:from-blue-50 hover:to-blue-100/90 hover:text-blue-900 active:scale-[0.97] transition-all"
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
                    <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-50">
                        <User className="h-4 w-4 mr-2" />
                        Dashboard
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