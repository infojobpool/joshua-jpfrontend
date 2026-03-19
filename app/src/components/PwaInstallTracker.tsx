"use client";

import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

/**
 * Listens for the beforeinstallprompt / appinstalled events and tracks PWA installs.
 * Renders nothing; fires analytics.pwaInstalled() when user adds the app to home screen.
 */
export function PwaInstallTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => analytics.pwaInstalled();
    window.addEventListener("appinstalled", handler);
    return () => window.removeEventListener("appinstalled", handler);
  }, []);
  return null;
}
