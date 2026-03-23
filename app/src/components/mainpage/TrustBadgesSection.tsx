"use client"

import { TrustBadges } from "@/components/TrustBadges"

export function TrustBadgesSection() {
  return (
    <section className="py-10 md:py-12 bg-gradient-to-b from-slate-50/50 to-white dark:from-slate-900/20 dark:to-slate-950">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-4xl mx-auto">
        <TrustBadges
          heading="Your data is safe with JobPool"
          subtext="We use industry-standard security to protect your information"
          variant="landing"
          centered
        />
      </div>
    </section>
  )
}
