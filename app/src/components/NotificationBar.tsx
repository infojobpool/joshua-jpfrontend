"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Bell, Check, MessageSquare, Gavel } from "lucide-react";
import useStore from "@/lib/Zustand";
import { shallow } from "zustand/shallow";
import axiosInstance from "@/lib/axiosInstance";
import Link from "next/link";

interface ApiListResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

interface MessageItem {
  id: string;
  task_id: string;
  task_title?: string;
  content?: string;
  created_at: string;
}

interface BidRequestItem {
  bid_id: string;
  task_id: string;
  task_title?: string;
  bid_amount?: number;
  created_at: string;
}

function NotificationBar() {
  // Select individually to avoid creating a new object/array every render
  const userId = useStore((s) => s.userId);
  const unreadCount = useStore((s) => s.unreadCount);
  const items = useStore((s) => s.items);
  const addNotifications = useStore((s) => s.addNotifications);
  const markAllRead = useStore((s) => s.markAllRead);
  const [open, setOpen] = useState(false);
  const fetchedIdsRef = useRef<Set<string>>(new Set());
  const lastTimestampRef = useRef<number>(0);
  const lastChatIdRef = useRef<string | null>(null);
  const prevUnreadRef = useRef<number>(0);
  const [wiggle, setWiggle] = useState(false);

  const topFive = useMemo(() => items.slice(0, 5), [items]);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    // pause polling while dropdown open to avoid UI flicker
    if (!open) {
      interval = setInterval(fetchLatest, 20000);
      // prime immediately when closed
      fetchLatest();
    }

    async function fetchLatest() {
      try {
        // Fetch recent bid requests to the current user (as poster)
        const bidsRes = await axiosInstance.get<ApiListResponse<{ bids: BidRequestItem[] }>>(
          `/get-user-requested-bids/${userId}/`
        );
        const bids = bidsRes.data?.data?.bids || [];

        // Fetch recent messages via chat APIs
        let messages: any[] = [];
        try {
          const chatRes = await axiosInstance.get<any>(`/api/v1/get-chat-id/`);
          const chatId =
            chatRes.data?.data?.chat_id ||
            chatRes.data?.chat_id ||
            chatRes.data?.id || null;
          if (chatId) {
            lastChatIdRef.current = String(chatId);
            const msgRes = await axiosInstance.get<any>(
              `/api/v1/get-messages/${chatId}`
            );
            messages =
              msgRes.data?.data?.messages ||
              msgRes.data?.messages ||
              (Array.isArray(msgRes.data) ? msgRes.data : []);
          }
        } catch (_) {}

        if (!mounted) return;

        const newItems = [] as {
          id: string;
          type: "message" | "bid" | "system";
          title: string;
          description?: string;
          createdAt: string;
          read: boolean;
          link?: string;
        }[];

        for (const b of bids) {
          const id = `bid:${b.bid_id}`;
          const createdTs = Date.parse(b.created_at);
          if (!Number.isNaN(createdTs) && createdTs <= lastTimestampRef.current) {
            // older or same, skip
          } else if (!fetchedIdsRef.current.has(id)) {
            fetchedIdsRef.current.add(id);
            // Try to derive bidder (tasker) and taskmaster (poster) names if present in API
            const bidderName = (b as any).bidder_name || (b as any).tasker_name || (b as any).user_name || (b as any).user || (b as any).bidder || (b as any).offered_by;
            const posterName = (b as any).posted_by_name || (b as any).poster_name || (b as any).taskmaster_name || (b as any).owner_name || (b as any).posted_by;
            const who = [
              bidderName ? `By ${bidderName}` : null,
              posterName ? `To ${posterName}` : null,
            ].filter(Boolean).join(" • ");
            newItems.push({
              id,
              type: "bid",
              title: `New bid on ${b.task_title || "your task"}`,
              description: `${b.bid_amount ? `Offer: ₹${b.bid_amount}` : ""}${who ? (b.bid_amount ? " • " : "") + who : ""}`,
              createdAt: b.created_at,
              read: false,
              link: `/tasks/${b.task_id}`,
            });
          }
        }

        for (const m of messages) {
          const mid = m.id || m.message_id || m.msg_id || m._id || Math.random().toString(36).slice(2);
          const id = `msg:${mid}`;
          const createdTs = Date.parse(m.created_at);
          if (!Number.isNaN(createdTs) && createdTs <= lastTimestampRef.current) {
            // older or same, skip
          } else if (!fetchedIdsRef.current.has(id)) {
            fetchedIdsRef.current.add(id);
            newItems.push({
              id,
              type: "message",
              title: m.task_title ? `New message on ${m.task_title}` : "New message",
              description: m.content || m.text || m.message,
              createdAt: m.created_at || m.timestamp || new Date().toISOString(),
              read: false,
              link: lastChatIdRef.current ? `/messages/${lastChatIdRef.current}` : "/messages",
            });
          }
        }

        // Only update the store if we actually have new items to avoid re-render flicker
        if (newItems.length > 0) {
          addNotifications(newItems);
          // advance the last timestamp using any new items
          const maxTs = Math.max(
            lastTimestampRef.current,
            ...newItems.map((n) => Date.parse(n.createdAt)).filter((n) => !Number.isNaN(n))
          );
          if (Number.isFinite(maxTs)) lastTimestampRef.current = maxTs;
        }
      } catch (err) {
        // Fail silently; the UI should still work with existing items
      }
    }

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [userId, addNotifications, open]);

  // Trigger a subtle bell wiggle only when unread increases
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setWiggle(true);
      const t = setTimeout(() => setWiggle(false), 700);
      prevUnreadRef.current = unreadCount;
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Remove auto-marking as read to keep the list stable while user is viewing

  return (
    <div className="relative">
      {/* scoped keyframes for wiggle */}
      <style jsx>{`
        @keyframes jp-wiggle { 
          0% { transform: rotate(0deg); }
          15% { transform: rotate(-6deg); }
          30% { transform: rotate(5deg); }
          45% { transform: rotate(-4deg); }
          60% { transform: rotate(3deg); }
          75% { transform: rotate(-2deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 px-3 py-2 shadow-sm hover:shadow-md transition-all"
        aria-label="Notifications"
      >
        <Bell className={`h-5 w-5 ${wiggle ? 'motion-safe:[animation:jp-wiggle_1.2s_ease]' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 text-[10px] flex items-center justify-center rounded-full bg-red-500 text-white font-bold transition-transform duration-200 will-change-transform">
            {unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden transition-all duration-200 ease-out ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
        aria-hidden={!open}
      >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold text-gray-800">Notifications</span>
            <button onClick={markAllRead} className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700">
              <Check className="h-3 w-3" /> Mark all read
            </button>
          </div>
          <ul className="max-h-96 overflow-auto divide-y">
            {topFive.length === 0 ? (
              <li className="px-4 py-6 text-sm text-gray-500">No notifications yet</li>
            ) : (
              topFive.map((n) => (
                <li key={n.id} className={`px-4 py-3 ${n.read ? "bg-white" : "bg-blue-50/50"}`}>
                  <Link href={n.link || "#"} className="flex items-start gap-3">
                    <span className="mt-0.5">
                      {n.type === "bid" ? (
                        <Gavel className="h-4 w-4 text-amber-600" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 line-clamp-2">{n.title}</p>
                      {n.description && (
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{n.description}</p>
                      )}
                      <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <div className="px-4 py-2 text-center text-sm">
            <Link href="/notifications" className="text-blue-600 hover:text-blue-700 font-medium">View all</Link>
          </div>
      </div>
    </div>
  );
}
export default memo(NotificationBar);

