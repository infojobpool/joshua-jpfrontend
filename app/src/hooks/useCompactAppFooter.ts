"use client";

import { useEffect, useState } from "react";

/**
 * True when the UI runs inside the Capacitor native shell (iOS/Android), either
 * from a mobile export build (NEXT_PUBLIC_MOBILE_SHELL) or at runtime via Capacitor.
 */
export function useCompactAppFooter(): boolean {
  const [compact, setCompact] = useState(
    () => process.env.NEXT_PUBLIC_MOBILE_SHELL === "true",
  );

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_MOBILE_SHELL === "true") return;

    const checkCompact = () => {
      const smallScreen = window.matchMedia("(max-width: 768px)").matches;
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      if (smallScreen || standalone) {
        setCompact(true);
      }
    };

    checkCompact();
    window.addEventListener("resize", checkCompact);

    let cancelled = false;
    void import("@capacitor/core")
      .then(({ Capacitor }) => {
        if (cancelled) return;
        if (Capacitor.isNativePlatform()) setCompact(true);
      })
      .catch(() => {
        // Keep compact mode based on mobile viewport / standalone fallback.
      });

    return () => {
      cancelled = true;
      window.removeEventListener("resize", checkCompact);
    };
  }, []);

  return compact;
}
