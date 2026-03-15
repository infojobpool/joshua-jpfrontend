import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format date string for display. If backend sends full datetime (ISO with time),
 * shows "DD/MM/YYYY, h:mm am/pm". If date-only (e.g. 2026-03-05), shows "DD/MM/YYYY".
 */
export function formatDateWithTime(dateString?: string | null): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    const hasTime =
      typeof dateString === "string" &&
      /T\d{1,2}:\d{2}/.test(dateString) &&
      dateString.length > 10;
    if (hasTime) {
      return d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}
