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

    let isNative = false;

    const recompute = () => {
      /** Align with Tailwind `lg` (min-width 1024px): compact only below that. */
      const narrow = window.matchMedia("(max-width: 1023px)").matches;
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setCompact(isNative || narrow || standalone);
    };

    recompute();

    const mq = window.matchMedia("(max-width: 1023px)");
    mq.addEventListener("change", recompute);
    window.addEventListener("resize", recompute);

    let cancelled = false;
    void import("@capacitor/core")
      .then(({ Capacitor }) => {
        if (cancelled) return;
        if (Capacitor.isNativePlatform()) {
          isNative = true;
          recompute();
        }
      })
      .catch(() => {
        /* web: keep narrow / standalone only */
      });

    return () => {
      cancelled = true;
      mq.removeEventListener("change", recompute);
      window.removeEventListener("resize", recompute);
    };
  }, []);

  return compact;
}
