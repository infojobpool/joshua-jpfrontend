"use client";

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "./axiosInstance";

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: string;
  created_at: string | null;
  read: boolean;
  task_id: string | null;
  link: string;
}

const POLL_INTERVAL_MS = 10000; // 10 seconds - in sync with emails

export function useNotifications(isAuthenticated: boolean) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    const token =
      (typeof window !== "undefined" && localStorage.getItem("token")) ||
      (typeof window !== "undefined" && sessionStorage.getItem("token"));
    if (!token) return;
    try {
      setLoading(true);
      const { data } = await axiosInstance.get<{
        status_code?: number;
        data?: NotificationItem[] | { data?: NotificationItem[]; unread_count?: number };
      }>("/get-notifications/");

      if (data?.status_code === 200 && data?.data) {
        const payload = data.data;
        let list: NotificationItem[] = [];
        if (Array.isArray(payload)) {
          list = payload;
        } else if (payload && typeof payload === "object" && "data" in payload) {
          list = (payload as { data?: NotificationItem[]; unread_count?: number }).data ?? [];
        }
        if (list.length > 0) {
          setItems((prev) => {
            const byId = new Map<string, NotificationItem>();
            [...list, ...prev].forEach((n) => {
              const id = String(n.id ?? (n as any).notification_id);
              if (id) byId.set(id, n);
            });
            const merged = Array.from(byId.values())
              .sort((a, b) => new Date((b as any).created_at ?? b.createdAt ?? 0).getTime() - new Date((a as any).created_at ?? a.createdAt ?? 0).getTime())
              .slice(0, 50);
            setUnreadCount(merged.filter((n) => !n.read).length);
            return merged;
          });
        }
      }
    } catch {
      // Silently ignore auth/network errors
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setItems([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId?: number | null) => {
      if (!isAuthenticated) return;
      try {
        await axiosInstance.patch("/notifications/mark-read/", {
          notification_id: notificationId ?? null,
        });
        await fetchNotifications();
      } catch {
        // Ignore
      }
    },
    [isAuthenticated, fetchNotifications]
  );

  const clearAll = useCallback(() => {
    setItems([]);
    setUnreadCount(0);
  }, []);

  return { items, unreadCount, loading, fetchNotifications, markAsRead, clearAll };
}
