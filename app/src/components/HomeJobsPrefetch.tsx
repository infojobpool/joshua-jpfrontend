"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { warmHomeJobsCache } from "@/lib/homeJobsCache";

/** Starts `/get-all-jobs/` as soon as the home route mounts (before header hydration gates). */
export function HomeJobsPrefetch() {
  const pathname = usePathname() || "";
  useEffect(() => {
    if (pathname === "/" || pathname === "") {
      warmHomeJobsCache();
    }
  }, [pathname]);
  return null;
}
