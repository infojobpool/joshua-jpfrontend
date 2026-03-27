"use client";

import { useLayoutEffect, useState } from "react";

/**
 * True when the UI runs inside the Capacitor native shell (iOS/Android), either
 * from a mobile export build (NEXT_PUBLIC_MOBILE_SHELL) or at runtime via Capacitor.
 */
export function useCompactAppFooter(): boolean {
  const [compact, setCompact] = useState(
    () => process.env.NEXT_PUBLIC_MOBILE_SHELL === "true",
  );

  useLayoutEffect(() => {
    if (process.env.NEXT_PUBLIC_MOBILE_SHELL === "true") return;
    let cancelled = false;
    void import("@capacitor/core").then(({ Capacitor }) => {
      if (cancelled) return;
      if (Capacitor.isNativePlatform()) setCompact(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return compact;
}
