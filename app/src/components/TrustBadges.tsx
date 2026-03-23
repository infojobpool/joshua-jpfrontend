"use client"

import { Lock, Shield, FileCheck, BadgeCheck, Cloud, UserCheck } from "lucide-react"

const BADGES = [
  { icon: Lock, label: "Secure & Encrypted" },
  { icon: Shield, label: "Privacy Protected" },
  { icon: FileCheck, label: "DPDP Compliant (India)" },
  { icon: BadgeCheck, label: "Verified Platform" },
  { icon: Cloud, label: "Secure Cloud Storage" },
  { icon: UserCheck, label: "User Data Protected" },
] as const

interface TrustBadgesProps {
  /** Compact single-row for tight spaces (verification sidebar) */
  variant?: "default" | "compact"
  /** Optional heading - e.g. "Your details are safe" */
  heading?: string
  /** Optional subtext */
  subtext?: string
  className?: string
}

export function TrustBadges({
  variant = "default",
  heading,
  subtext,
  className = "",
}: TrustBadgesProps) {
  return (
    <div className={`rounded-xl border border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/20 p-4 ${className}`}>
      {heading && (
        <div className="mb-3">
          <p className="font-semibold text-emerald-800 dark:text-emerald-200 text-sm">
            {heading}
          </p>
          {subtext && (
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
              {subtext}
            </p>
          )}
        </div>
      )}
      <div
        className={
          variant === "compact"
            ? "grid grid-cols-2 gap-2"
            : "grid grid-cols-2 sm:grid-cols-3 gap-3"
        }
      >
        {BADGES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className={`flex items-center gap-2 ${
              variant === "compact" ? "text-xs" : "text-sm"
            }`}
          >
            <div className="flex-shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/50 p-1.5">
              <Icon className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-emerald-800 dark:text-emerald-200 font-medium">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
