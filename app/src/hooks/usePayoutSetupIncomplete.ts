"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import useStore from "@/lib/Zustand";
import {
  getMissingPayoutEligibilityItems,
  hasRealProfilePhotoUrl,
} from "@/lib/payoutProfileCompletion";

/**
 * For logged-out users, returns incomplete=true (acquisition copy still applies).
 * For logged-in users, fetches profile + wallet and returns whether payout checklist has any missing items.
 */
export function usePayoutSetupIncomplete(): {
  ready: boolean;
  incomplete: boolean;
  /** Logged in but fetch not finished — use for a stable placeholder, no image flash */
  awaitingEligibility: boolean;
} {
  const userId = useStore((s) => s.userId);
  const [ready, setReady] = useState(false);
  const [incomplete, setIncomplete] = useState(true);
  const mountedRef = useRef(false);
  const prevUserIdRef = useRef<string | null>(null);
  const fetchGenRef = useRef(0);

  const run = useCallback(async () => {
    const gen = ++fetchGenRef.current;
    const isStale = () => gen !== fetchGenRef.current;

    if (!userId) {
      if (isStale()) return;
      setIncomplete(true);
      setReady(true);
      return;
    }
    try {
      const cacheBuster = `?user_id=${userId}&_t=${Date.now()}`;
      const [pres, wres] = await Promise.all([
        axiosInstance.get(`/profile${cacheBuster}`),
        axiosInstance.get(`/wallet?user_id=${userId}&limit=1`),
      ]);
      const payload = pres.data?.data ?? pres.data;
      const wd = wres.data?.data ?? wres.data;
      const rawV = payload?.verification_status ?? payload?.verificationStatus;
      let vLevel = 0;
      if (rawV !== null && rawV !== undefined) {
        const n = typeof rawV === "string" ? parseInt(rawV, 10) : Number(rawV);
        if (!isNaN(n)) vLevel = n;
      }
      const img = payload?.profile_img ?? payload?.profile_image ?? "";
      const hasPhoto = hasRealProfilePhotoUrl(img);
      const addresses = Array.isArray(payload?.addresses) ? payload.addresses : [];
      const hasAddressFromList = addresses.some((a: unknown) => {
        if (!a) return false;
        if (typeof a === "string") return a.trim().length > 0;
        if (typeof a === "object" && a !== null) {
          const addr = (a as { address?: unknown }).address;
          return typeof addr === "string" && addr.trim().length > 0;
        }
        return false;
      });
      const fallbackAddress = payload?.address;
      const hasFallbackAddress =
        typeof fallbackAddress === "string" && fallbackAddress.trim().length > 0;
      const upiVpa = String(wd?.upi_vpa ?? wd?.upi ?? "").trim();
      const missing = getMissingPayoutEligibilityItems({
        verificationLevel: vLevel,
        hasProfilePhoto: hasPhoto,
        hasAddressOnProfile: hasAddressFromList || hasFallbackAddress,
        upiVpa: upiVpa || undefined,
      });
      if (isStale()) return;
      setIncomplete(missing.length > 0);
    } catch {
      if (isStale()) return;
      setIncomplete(true);
    } finally {
      if (!isStale()) setReady(true);
    }
  }, [userId]);

  useEffect(() => {
    if (mountedRef.current && prevUserIdRef.current !== userId) {
      setReady(false);
    }
    mountedRef.current = true;
    prevUserIdRef.current = userId;
    void run();
  }, [run, userId]);

  const awaitingEligibility = Boolean(userId) && !ready;

  return { ready, incomplete, awaitingEligibility };
}
