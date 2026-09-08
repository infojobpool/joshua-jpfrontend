"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureReferralFromSearchParams } from "@/lib/referral/referralStorage";

/** Persists ?ref= from any landing URL so signup can attach the referrer later. */
export function ReferralCapture() {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const ref = searchParams.get("ref") ?? searchParams.get("referral") ?? searchParams.get("invite");
    if (ref) {
      captureReferralFromSearchParams(`?ref=${encodeURIComponent(ref)}`);
      return;
    }
    if (pathname === "/signup" || pathname === "/signin") {
      captureReferralFromSearchParams(typeof window !== "undefined" ? window.location.search : "");
    }
  }, [pathname, searchParams]);

  return null;
}
