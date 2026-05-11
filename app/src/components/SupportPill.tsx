"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headphones } from "lucide-react";

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

/** Support FAB overlaps chat composer on mobile; hide throughout /messages. */
function isMessagesRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  const p = normalizePathname(pathname);
  return p === "/messages" || p.startsWith("/messages/");
}

/** Scrollable card grid + bottom nav: FAB overlaps thumbnails; hide only on the browse index. */
function isListingsBrowseIndex(pathname: string | null): boolean {
  if (!pathname) return false;
  return normalizePathname(pathname) === "/listings";
}

export function SupportPill() {
  const pathname = usePathname();
  if (isMessagesRoute(pathname) || isListingsBrowseIndex(pathname)) return null;

  return (
    <Link
      href="/supportpage"
      className="fixed bottom-28 right-4 md:bottom-8 md:right-6 z-[9999] flex h-10 w-10 md:h-11 md:w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] text-white shadow-[0_4px_16px_rgba(37,99,235,0.4)] ring-2 ring-white/25 transition-all duration-300 active:scale-[0.95] hover:shadow-[0_6px_24px_rgba(37,99,235,0.5)] hover:ring-white/50 hover:scale-110 animate-support-pulse"
      aria-label="Contact support - Get help from our team"
      title="Contact support - We're here to help"
    >
      <Headphones className="h-3.5 w-3.5 md:h-4 md:w-4" />
    </Link>
  );
}
