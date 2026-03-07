"use client";

import Link from "next/link";
import { Headphones } from "lucide-react";

export function SupportPill() {
  return (
    <Link
      href="/supportpage"
      className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-[9999] flex items-center gap-2.5 px-4 py-2.5 md:px-5 md:py-3 rounded-full bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_28px_rgba(37,99,235,0.5)] ring-2 ring-white/25 hover:ring-white/50 transition-all duration-300 active:scale-[0.97] backdrop-blur-sm"
      aria-label="Contact support - Get help from our team"
      title="Contact support - We're here to help"
    >
      <div className="flex h-7 w-7 md:h-8 md:w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
        <Headphones className="h-3.5 w-3.5 md:h-4 md:w-4" />
      </div>
      <span className="text-xs md:text-sm font-semibold tracking-tight">Contact Support</span>
    </Link>
  );
}
