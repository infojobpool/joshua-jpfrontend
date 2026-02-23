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
    try {
      setLoading(true);
      const { data } = await axiosInstance.get<{
        status_code?: number;
        data?: NotificationItem[] | { data?: NotificationItem[]; unread_count?: number };
      }>("/get-notifications/");

      if (data?.status_code === 200 && data?.data) {
        const payload = data.data;
        if (Array.isArray(payload)) {
          setItems(payload);
          setUnreadCount(payload.filter((n) => !n.read).length);
        } else if (payload && typeof payload === "object" && "data" in payload) {
          const list = (payload as { data?: NotificationItem[]; unread_count?: number }).data ?? [];
          setItems(list);
          setUnreadCount((payload as { unread_count?: number }).unread_count ?? list.filter((n) => !n.read).length);
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

  return { items, unreadCount, loading, fetchNotifications, markAsRead };
}
