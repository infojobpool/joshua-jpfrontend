"use client"

import { Shield, Lock, FileCheck, BadgeCheck, Cloud } from "lucide-react"
import { cn } from "@/lib/utils"

const BADGES = [
  { icon: Lock, label: "Secure & Encrypted" },
  { icon: Shield, label: "Privacy Protected" },
  { icon: FileCheck, label: "DPDP Compliant" },
  { icon: BadgeCheck, label: "Verified Platform" },
  { icon: Cloud, label: "Secure Storage" },
] as const

interface TrustBadgesProps {
  /** Compact for tight spaces; `strip` = single horizontal row for mobile */
  variant?: "default" | "compact" | "landing" | "strip"
  /** Center content (for landing page) */
  centered?: boolean
  /** Optional heading */
  heading?: string
  /** Optional subtext */
  subtext?: string
  className?: string
  /** Strip only: `emerald` matches profile / wallet accents; default stays blue */
  stripAccent?: "blue" | "emerald"
}

export function TrustBadges({
  variant = "default",
  centered = false,
  heading = "Your data is safe with JobPool",
  subtext = "Industry-standard security to protect your information",
  className = "",
  stripAccent = "blue",
}: TrustBadgesProps) {
  const isLanding = variant === "landing"

  if (variant === "strip") {
    const isEmerald = stripAccent === "emerald"
    return (
      <div
        className={cn(
          "rounded-xl px-3 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1",
          isEmerald
            ? "border-0 bg-gradient-to-r from-emerald-50/90 via-white to-slate-50/90 ring-emerald-100/80 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/70 dark:ring-emerald-900/30"
            : "border border-blue-100/90 bg-gradient-to-r from-blue-50/95 via-white to-sky-50/80 dark:border-blue-900/40 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-slate-900/70",
          className
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "shrink-0 rounded-lg p-1.5",
              isEmerald
                ? "bg-emerald-600 dark:bg-emerald-500"
                : "bg-blue-600 dark:bg-blue-500"
            )}
          >
            <Shield className="h-4 w-4 text-white" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight truncate">
              {heading}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2 sm:line-clamp-1">
              {subtext}
            </p>
          </div>
          <Lock
            className={cn(
              "shrink-0 h-3.5 w-3.5 stroke-[2]",
              isEmerald
                ? "text-emerald-600/85 dark:text-emerald-400"
                : "text-blue-600/80 dark:text-blue-400"
            )}
            aria-hidden
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={[
        "rounded-2xl p-5 md:p-6",
        isLanding
          ? "border border-blue-100 bg-gradient-to-br from-blue-50/60 via-white to-blue-50/40 shadow-lg shadow-blue-900/5 dark:from-slate-900/50 dark:to-slate-800/30 dark:border-blue-900/30"
          : "border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-800/30 dark:border-slate-700/50",
        className,
      ].join(" ")}
    >
      <div
        className={`flex gap-4 ${centered || isLanding ? "flex-col items-center text-center" : "items-start"}`}
      >
        <div
          className={`flex-shrink-0 rounded-xl p-3 ${
            isLanding
              ? "bg-blue-600 dark:bg-blue-500"
              : "bg-slate-900 dark:bg-slate-100"
          }`}
        >
          <Shield
            className={`h-6 w-6 ${isLanding ? "text-white" : "text-white dark:text-slate-900"}`}
            strokeWidth={2}
          />
        </div>
        <div className={centered || isLanding ? "max-w-xl" : "min-w-0 flex-1"}>
          <h3
            className={`font-semibold tracking-tight ${
              isLanding
                ? "text-lg md:text-xl text-gray-900 dark:text-white [font-family:var(--font-archivo),var(--font-geist-sans),system-ui,sans-serif]"
                : "text-base md:text-lg text-slate-900 dark:text-white"
            }`}
          >
            {heading}
          </h3>
          {subtext && (
            <p
              className={`mt-1 ${
                isLanding
                  ? "text-sm text-gray-600 dark:text-slate-400 leading-relaxed"
                  : "text-sm text-slate-500 dark:text-slate-400"
              }`}
            >
              {subtext}
            </p>
          )}
          <div
            className={`flex flex-wrap gap-2 mt-4 ${
              variant === "compact" ? "gap-1.5" : ""
            } ${centered || isLanding ? "justify-center" : ""}`}
          >
            {BADGES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className={[
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium",
                  isLanding
                    ? "bg-blue-100/80 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                    : "bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300",
                  variant === "compact" ? "text-xs px-2.5 py-0.5 gap-1" : "text-xs",
                ].join(" ")}
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    isLanding ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                  }`}
                  strokeWidth={2}
                />
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
