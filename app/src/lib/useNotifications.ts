"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axiosInstance from "./axiosInstance";
import { playNotificationSound } from "./notificationSound";
import useStore from "./Zustand";

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

const POLL_INTERVAL_MS = 30000; // 30s is enough for notification badges
const CLEARED_IDS_KEY = "notification_cleared_ids";
const READ_IDS_KEY = "notification_read_ids";
const KEEP_LATEST = 10;

function toIsoSafe(raw: unknown): string {
  const s = raw != null && raw !== "" ? String(raw) : "";
  const t = Date.parse(s);
  if (Number.isFinite(t)) return new Date(t).toISOString();
  return new Date().toISOString();
}

/** Map API row to Zustand notification shape (for /notifications + header bell). */
function apiRowToZustandItem(n: NotificationItem) {
  const id = String(n.id ?? (n as any).notification_id ?? "");
  const raw = String((n as any).type ?? (n as any).notification_type ?? "system").toLowerCase();
  const type = raw === "bid" ? "bid" : raw === "message" ? "message" : "system";
  return {
    id,
    type,
    title: n.title || "Notification",
    description: String((n as any).description ?? (n as any).body ?? ""),
    createdAt: toIsoSafe((n as any).created_at ?? (n as any).createdAt),
    read: Boolean(n.read ?? (n as any).is_read),
    link: ((n as any).link ?? (n as any).url) || undefined,
    direction: type === "bid" ? ("received" as const) : undefined,
    taskId: (n as any).task_id != null ? String((n as any).task_id) : undefined,
    bidId: (n as any).bid_id != null ? String((n as any).bid_id) : undefined,
    status: (n as any).status != null ? String((n as any).status) : undefined,
    deleted: Boolean((n as any).deleted),
  };
}

/** When true, polls `/get-notifications/` and syncs badge + list into Zustand (marketing header, home hero). */
export function useNotifications(enabled: boolean) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bellAnimating, setBellAnimating] = useState(false);
  const prevUnreadRef = useRef(0);
  const firstFetchDoneRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;
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

      if ((Number(data?.status_code) === 200 || data?.status_code === 200) && data?.data) {
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
            let readIds = new Set<string>();
            try {
              const stored = sessionStorage.getItem(CLEARED_IDS_KEY);
              if (stored) clearedIds = new Set(JSON.parse(stored));
            } catch {}
            try {
              const storedRead = sessionStorage.getItem(READ_IDS_KEY);
              if (storedRead) readIds = new Set(JSON.parse(storedRead));
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
              .map((n) => {
                const id = String(n.id ?? (n as any).notification_id ?? "");
                if (id && readIds.has(id)) return { ...n, read: true };
                return n;
              })
              .sort((a, b) => new Date((b as any).created_at ?? b.createdAt ?? 0).getTime() - new Date((a as any).created_at ?? a.createdAt ?? 0).getTime())
              .slice(0, 50);
            const newUnread = merged.filter((n) => !n.read).length;
            const hadNew = firstFetchDoneRef.current && newUnread > prevUnreadRef.current;
            firstFetchDoneRef.current = true;
            prevUnreadRef.current = newUnread;
            setUnreadCount(newUnread);
            try {
              useStore.getState().setNotifications(merged.map(apiRowToZustandItem));
            } catch {
              /* ignore store sync */
            }
            if (hadNew) {
              playNotificationSound();
              try {
                window.dispatchEvent(new CustomEvent("notification-arrived"));
              } catch {
                /* ignore */
              }
              setTimeout(() => setBellAnimating(true), 0);
              setTimeout(() => setBellAnimating(false), 1500);
            }
            return merged;
          });
        } else {
          firstFetchDoneRef.current = true;
          prevUnreadRef.current = 0;
          setUnreadCount(0);
          try {
            useStore.getState().setNotifications([]);
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      // Silently ignore auth/network errors
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
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
  }, [enabled, fetchNotifications]);

  const markAsRead = useCallback(
    async (notificationId?: number | null) => {
      if (!enabled) return;
      const targetId =
        notificationId != null ? String(notificationId).trim() : null;
      setItems((prev) => {
        let readIds = new Set<string>();
        try {
          const stored = sessionStorage.getItem(READ_IDS_KEY);
          if (stored) readIds = new Set(JSON.parse(stored));
        } catch {}
        const next = prev.map((n) => {
          const id = String(n.id ?? (n as any).notification_id ?? "").trim();
          if (!id) return n;
          if (targetId == null || id === targetId) {
            readIds.add(id);
            return { ...n, read: true };
          }
          return n;
        });
        try {
          sessionStorage.setItem(READ_IDS_KEY, JSON.stringify([...readIds].slice(-500)));
        } catch {}
        const nextUnread = next.filter((n) => !n.read).length;
        prevUnreadRef.current = nextUnread;
        setUnreadCount(nextUnread);
        queueMicrotask(() => {
          try {
            useStore.getState().setNotifications(next.map(apiRowToZustandItem));
          } catch {
            /* ignore */
          }
        });
        return next;
      });
      try {
        await axiosInstance.patch("/notifications/mark-read/", {
          notification_id: notificationId ?? null,
        });
        await fetchNotifications();
      } catch {
        // Ignore
      }
    },
    [enabled, fetchNotifications]
  );

  /** Keep behavior consistent with "Mark all read": do not remove cards, only clear unread state. */
  const clearAll = useCallback(async () => {
    await markAsRead(null);
  }, [markAsRead]);

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
      queueMicrotask(() => {
        try {
          useStore.getState().setNotifications(kept.map(apiRowToZustandItem));
        } catch {
          /* ignore */
        }
      });
      return kept;
    });
  }, []);

  return { items, unreadCount, loading, fetchNotifications, markAsRead, clearAll, clearOldKeepLatest, bellAnimating };
}
