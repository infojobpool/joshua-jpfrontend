"use client";

import { usePathname } from "next/navigation";
import useStore from "@/lib/Zustand";
import { useNotifications } from "@/lib/useNotifications";

/**
 * Keeps Zustand notification badge in sync on marketing / app shell routes.
 * Disabled on `/dashboard` because `DashboardClient` mounts its own `useNotifications` poller.
 */
export function NotificationBadgeSync() {
  const pathname = usePathname() || "";
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  /** Avoid two `/get-notifications/` pollers: dashboard + full page each mount their own hook. */
  const skipDedicatedPoller =
    pathname.startsWith("/dashboard") || pathname.startsWith("/notifications");
  useNotifications(!!isAuthenticated && !skipDedicatedPoller);
  return null;
}
