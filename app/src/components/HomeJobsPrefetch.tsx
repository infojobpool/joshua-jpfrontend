"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { warmHomeJobsCache } from "@/lib/homeJobsCache";
import { warmHomeOfferingsCache } from "@/lib/homeOfferingsCache";

/** Starts home data fetches as soon as the home route mounts (overlaps first paint). */
export function HomeJobsPrefetch() {
  const pathname = usePathname() || "";
  useEffect(() => {
    if (pathname === "/" || pathname === "") {
      warmHomeJobsCache();
      warmHomeOfferingsCache();
    }
  }, [pathname]);
  return null;
}
