"use client"

import { BadgeCheck } from "lucide-react"

interface VerifiedBadgeProps {
  /** Size variant - 'sm' for compact (mobile), 'md' for desktop header */
  size?: "sm" | "md"
  /** Optional additional class names */
  className?: string
}

export function VerifiedBadge({ size = "sm", className = "" }: VerifiedBadgeProps) {
  const iconSizes = size === "sm" ? "h-4 w-4" : "h-5 w-5"
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1"

  return (
    <span
      title="Verified Account"
      className={`inline-flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200/60 dark:border-emerald-700/50 ${padding} ${className}`}
    >
      <BadgeCheck className={`${iconSizes} text-emerald-600 dark:text-emerald-400`} strokeWidth={2.5} />
    </span>
  )
}
