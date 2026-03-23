"use client"

import { Shield, Lock, ShieldCheck, FileCheck, BadgeCheck, Cloud } from "lucide-react"

const BADGES = [
  { icon: Lock, label: "Secure & Encrypted" },
  { icon: Shield, label: "Privacy Protected" },
  { icon: FileCheck, label: "DPDP Compliant" },
  { icon: BadgeCheck, label: "Verified Platform" },
  { icon: Cloud, label: "Secure Storage" },
] as const

interface TrustBadgesProps {
  /** Compact for tight spaces */
  variant?: "default" | "compact"
  /** Optional heading */
  heading?: string
  /** Optional subtext */
  subtext?: string
  className?: string
}

export function TrustBadges({
  variant = "default",
  heading = "Your data is safe with JobPool",
  subtext = "Industry-standard security to protect your information",
  className = "",
}: TrustBadgesProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 dark:border-slate-700/50 p-5 md:p-6 ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 rounded-xl bg-slate-900 dark:bg-slate-100 p-3">
          <Shield className="h-6 w-6 text-white dark:text-slate-900" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
            {heading}
          </h3>
          {subtext && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {subtext}
            </p>
          )}
          <div
            className={`mt-3 flex flex-wrap gap-2 ${
              variant === "compact" ? "gap-1.5" : ""
            }`}
          >
            {BADGES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 text-slate-600 dark:text-slate-300 ${
                  variant === "compact" ? "text-xs px-2.5 py-0.5 gap-1" : "text-xs font-medium"
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500 dark:text-slate-400" strokeWidth={2} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
