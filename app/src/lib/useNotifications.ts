"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "./axiosInstance";
import { playNotificationSound } from "./notificationSound";

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
const CLEARED_IDS_KEY = "notification_cleared_ids";
const KEEP_LATEST = 10;

export function useNotifications(isAuthenticated: boolean) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);
  const prevUnreadRef = useRef(0);
  const firstFetchDoneRef = useRef(false);

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
            let clearedIds = new Set<string>();
            try {
              const stored = sessionStorage.getItem(CLEARED_IDS_KEY);
              if (stored) clearedIds = new Set(JSON.parse(stored));
            } catch {}
            const byId = new Map<string, NotificationItem>();
            [...list, ...prev]
              .filter((n) => {
                const id = String(n.id ?? (n as any).notification_id);
                return id && !clearedIds.has(id);
              })
              .forEach((n) => {
                const id = String(n.id ?? (n as any).notification_id);
                if (id) byId.set(id, n);
              });
            const merged = Array.from(byId.values())
              .sort((a, b) => new Date((b as any).created_at ?? b.createdAt ?? 0).getTime() - new Date((a as any).created_at ?? a.createdAt ?? 0).getTime())
              .slice(0, 50);
            const newUnread = merged.filter((n) => !n.read).length;
            const hadNew = firstFetchDoneRef.current && newUnread > prevUnreadRef.current;
            firstFetchDoneRef.current = true;
            prevUnreadRef.current = newUnread;
            setUnreadCount(newUnread);
            if (hadNew) {
              playNotificationSound();
              setTimeout(() => setBellAnimating(true), 0);
              setTimeout(() => setBellAnimating(false), 1500);
            }
            return merged;
          });
        } else {
          firstFetchDoneRef.current = true;
          prevUnreadRef.current = 0;
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
    const onArrival = () => {
      setBellAnimating(true);
      setTimeout(() => setBellAnimating(false), 1500);
    };
    window.addEventListener("notification-arrived", onArrival);
    return () => {
      clearInterval(interval);
      window.removeEventListener("notification-arrived", onArrival);
    };
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

  const clearOldKeepLatest = useCallback(() => {
    setItems((prev) => {
      const sorted = [...prev].sort(
        (a, b) =>
          new Date((b as any).created_at ?? b.createdAt ?? 0).getTime() -
          new Date((a as any).created_at ?? a.createdAt ?? 0).getTime()
      );
      const kept = sorted.slice(0, KEEP_LATEST);
      const toRemove = sorted.slice(KEEP_LATEST);
      try {
        const existing: string[] = JSON.parse(sessionStorage.getItem(CLEARED_IDS_KEY) || "[]");
        const newCleared = [...existing, ...toRemove.map((n) => String(n.id ?? (n as any).notification_id))].filter(Boolean);
        sessionStorage.setItem(CLEARED_IDS_KEY, JSON.stringify([...new Set(newCleared)].slice(-500)));
      } catch {}
      const newUnread = kept.filter((n) => !n.read).length;
      prevUnreadRef.current = newUnread;
      setUnreadCount(newUnread);
      return kept;
    });
  }, []);

  return { items, unreadCount, loading, fetchNotifications, markAsRead, clearAll, clearOldKeepLatest, bellAnimating };
}
