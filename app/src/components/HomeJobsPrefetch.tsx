"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { warmHomeJobsCache } from "@/lib/homeJobsCache";
import { warmHomeOfferingsCache } from "@/lib/homeOfferingsCache";
import { getTaskCategoriesCached } from "@/lib/taskCategories";

/** Starts home data fetches as soon as the home route mounts (overlaps first paint). */
export function HomeJobsPrefetch() {
  const pathname = usePathname() || "";
  useEffect(() => {
    if (pathname === "/" || pathname === "") {
      warmHomeJobsCache();
      warmHomeOfferingsCache();
      void getTaskCategoriesCached();
    }
  }, [pathname]);
  return null;
}
