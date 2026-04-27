"use client";

import { TrustBadges } from "@/components/TrustBadges";

/** Trust strip — mobile homepage only (hidden from md breakpoint up). */
export function TrustBadgesSection() {
  return (
    <section className="bg-gradient-to-b from-slate-50/50 to-white py-6 dark:from-slate-900/20 dark:to-slate-950 md:hidden">
      <div className="mx-auto w-full max-w-4xl px-4">
        <TrustBadges
          variant="strip"
          heading="Your data is safe with JobPool"
          subtext="Encrypted, DPDP-ready — industry-standard protection"
        />
      </div>
    </section>
  );
}
