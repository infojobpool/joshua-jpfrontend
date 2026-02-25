"use client";

import { useEffect, useRef } from "react";
import useStore from "@/lib/Zustand";
import axiosInstance from "@/lib/axiosInstance";

const POLL_INTERVAL_MS = 10000; // 10 seconds - more prompt

function mapApiNotificationToItem(n: any): {
  id: string;
  type: "message" | "bid" | "system";
  title: string;
  description?: string;
  createdAt: string;
  read: boolean;
  link?: string;
  direction?: "received" | "sent";
  taskId?: string;
  bidId?: string;
  status?: string;
  deleted?: boolean;
} {
  const id = n.id ?? n.notification_id ?? `n-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const type = (n.type ?? n.notification_type ?? "system") as "message" | "bid" | "system";
  const title = n.title ?? n.subject ?? n.message ?? "Notification";
  const description = n.description ?? n.body ?? n.text ?? n.content;
  const createdAt = n.created_at ?? n.createdAt ?? n.timestamp ?? new Date().toISOString();
  const read = n.read ?? n.is_read ?? false;
  const link = n.link ?? n.url ?? n.task_id ? `/tasks/${n.task_id}` : undefined;
  return {
    id,
    type,
    title,
    description,
    createdAt,
    read,
    link,
    direction: type === "bid" ? "received" : undefined,
    taskId: n.task_id ?? n.post_id,
    bidId: n.bid_id,
    status: n.status,
    deleted: n.deleted,
  };
}

/**
 * Polls for notifications so the bell icon updates promptly (bid, message, task complete, etc.).
 * Runs when user is authenticated and on a page that needs notifications (dashboard, etc.).
 */
export function NotificationPoller() {
  const userId = useStore((s) => s.userId);
  const checkAuth = useStore((s) => s.checkAuth);
  const addNotifications = useStore((s) => s.addNotifications);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resolve userId: store may not have hydrated yet, fallback to localStorage
  const effectiveUserId =
    userId ||
    (typeof window !== "undefined" && (() => {
      try {
        const user = localStorage.getItem("user");
        if (user) {
          const parsed = JSON.parse(user);
          return parsed?.id || null;
        }
        return localStorage.getItem("userId");
      } catch {
        return null;
      }
    })());

  useEffect(() => {
    checkAuth(); // Ensure auth is hydrated
  }, [checkAuth]);

  useEffect(() => {
    if (!effectiveUserId) return;

    const getToken = () =>
      (typeof window !== "undefined" && localStorage.getItem("token")) ||
      (typeof window !== "undefined" && sessionStorage.getItem("token")) ||
      null;

    const fetchNotifications = async () => {
      if (!getToken()) return;
      try {
        // Try common notification endpoints (backend may use get-notifications or get-user-notifications)
        const endpoints = [
          `/get-notifications/`,
          `/get-user-notifications/${effectiveUserId}/`,
          `/notifications/`,
        ];

        for (const endpoint of endpoints) {
          try {
            const res = await axiosInstance.get(endpoint);
            const data = res.data;
            const list = data?.data ?? data?.notifications ?? data?.results ?? (Array.isArray(data) ? data : []);
            if (Array.isArray(list) && list.length > 0) {
              const items = list.map(mapApiNotificationToItem);
              addNotifications(items);
              return;
            }
            if (Array.isArray(list)) return;
          } catch {
            continue;
          }
        }
      } catch {
        // Silently ignore - no notifications API or network error
      }
    };

    fetchNotifications();

    intervalRef.current = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [effectiveUserId, addNotifications]);

  // Fetch immediately when user returns to tab (switching back from another app/tab)
  useEffect(() => {
    if (!effectiveUserId) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) return;
        axiosInstance.get("/get-notifications/").then((res) => {
          const data = res.data;
          const list = data?.data ?? data?.notifications ?? (Array.isArray(data) ? data : []);
          if (Array.isArray(list) && list.length > 0) {
            useStore.getState().addNotifications(list.map(mapApiNotificationToItem));
          }
        }).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [effectiveUserId]);

  return null;
}
