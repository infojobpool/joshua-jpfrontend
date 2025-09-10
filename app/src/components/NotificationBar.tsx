"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const open = useStore((s) => s.notificationOpen);
  const setOpen = useStore((s) => s.setNotificationOpen);
  const errorCountRef = useRef<number>(0);
  const baseIntervalMs = 15000;
  const maxIntervalMs = 120000;
  const fetchedIdsRef = useRef<Set<string>>(new Set());
  const lastTimestampRef = useRef<number>(0);
  const lastChatIdRef = useRef<string | null>(null);
  const prevUnreadRef = useRef<number>(0);
  const [wiggle, setWiggle] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const fetchRef = useRef<() => void>(() => {});
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number }>({ top: 80, left: 16 });

  const topSeven = useMemo(() => items.slice(0, 7), [items]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!userId) return;
    let mounted = true;
    let interval: ReturnType<typeof setInterval> | null = null;

    // pause polling while dropdown open to avoid UI flicker
    if (!open) {
      if (interval) clearInterval(interval);
      interval = setInterval(fetchLatest, baseIntervalMs);
      fetchLatest(); // prime immediately
    }

    async function fetchLatest() {
      try {
        // Fetch bids RECEIVED on tasks posted by this user
        const jobsRes = await axiosInstance.get<ApiListResponse<{ jobs: any[] }>>(
          `/get-user-jobs/${userId}/`
        );
        const jobs = jobsRes.data?.data?.jobs || [];
        const recentJobs = [...jobs]
          .sort((a, b) => Date.parse(b.timestamp || b.job_due_date || '') - Date.parse(a.timestamp || a.job_due_date || ''))
          .slice(0, 5);

        const bidsArrays = await Promise.all(
          recentJobs.map(async (job) => {
            try {
              const r = await axiosInstance.get<ApiListResponse<any[]>>(`/get-bids/${job.job_id}/`);
              const data = Array.isArray(r.data?.data) ? r.data.data : [];
              return data.map((b: any) => ({ ...b, job }));
            } catch {
              return [] as any[];
            }
          })
        );
        const allBids = bidsArrays.flat();

        // only show bids NOT by me
        const bidsReceived = allBids.filter((b: any) => String(b.tasker_id || b.user_id || b.bidder_id) !== String(userId));

        // Fetch bids SENT by this user (your offers on others' tasks)
        let bidsSent: any[] = [];
        try {
          const sentRes = await axiosInstance.get<ApiListResponse<{ bids: BidRequestItem[] }>>(
            `/get-user-requested-bids/${userId}/`
          );
          bidsSent = sentRes.data?.data?.bids || [];
        } catch {}
        const messages: any[] = [];

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

        for (const b of bidsReceived) {
          const id = `bid:${b.bid_id}`;
          const createdTs = Date.parse(b.created_at);
          if (!Number.isNaN(createdTs) && createdTs <= lastTimestampRef.current) {
            // older or same, skip
          } else if (!fetchedIdsRef.current.has(id)) {
            fetchedIdsRef.current.add(id);
            const bidderName = (b as any).bidder_name || (b as any).tasker_name || (b as any).user_name || (b as any).user || (b as any).bidder || (b as any).offered_by;
            newItems.push({
              id,
              type: "bid",
              title: `New bid on ${b.task_title || b.job?.job_title || "your task"}`,
              description: `${b.bid_amount ? `Offer: ₹${b.bid_amount}` : ""}${bidderName ? (b.bid_amount ? " • " : "") + `By ${bidderName}` : ""}`,
              createdAt: b.created_at,
              read: false,
              link: `/tasks/${b.task_id || b.job?.job_id}`,
              direction: "received",
            });
          }
        }

        // Add sent bids (labelled)
        for (const b of bidsSent) {
          const id = `bid-sent:${b.bid_id}`;
          const createdTs = Date.parse(b.created_at);
          if (!Number.isNaN(createdTs) && createdTs <= lastTimestampRef.current) {
          } else if (!fetchedIdsRef.current.has(id)) {
            fetchedIdsRef.current.add(id);
            newItems.push({
              id,
              type: "bid",
              title: `Your bid on ${b.task_title || "a task"}`,
              description: `${b.bid_amount ? `Offer: ₹${b.bid_amount}` : ""}`,
              createdAt: b.created_at,
              read: false,
              link: `/tasks/${b.task_id}`,
              direction: "sent",
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

        // If dropdown is open, avoid updating store to prevent blinking/flicker
        if (open) {
          return;
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
        // success -> reset backoff
        errorCountRef.current = 0;
      } catch (err) {
        // Backoff on errors to avoid console spam and server load
        errorCountRef.current = Math.min(errorCountRef.current + 1, 6);
        const backoff = Math.min(baseIntervalMs * Math.pow(2, errorCountRef.current), maxIntervalMs);
        if (interval) {
          clearInterval(interval);
          interval = setInterval(fetchLatest, backoff);
        }
      }
    }

    // expose fetch to other effects (e.g., when opening the dropdown)
    fetchRef.current = fetchLatest;

    const onFocus = () => fetchLatest();
    window.addEventListener('focus', onFocus);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [userId, addNotifications, open]);

  // Reposition panel on open/resize so it stays under the bell
  useEffect(() => {
    function compute() {
      const btn = btnRef.current;
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const gap = 8;
      let left = Math.max(8, Math.min(window.innerWidth - 328, rect.right - 320));
      const top = rect.bottom + gap;
      setPanelPos({ top, left });
    }
    if (open) {
      compute();
      window.addEventListener('resize', compute, { passive: true });
    }
    return () => {
      window.removeEventListener('resize', compute as any);
    };
  }, [open]);

  // Close on Escape key (keeps open otherwise to avoid accidental closes)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // When opening the dropdown, fetch immediately to show latest (no auto mark-read)
  useEffect(() => {
    if (open) {
      try { fetchRef.current(); } catch {}
    }
  }, [open]);

  // Reduce visual motion to avoid perceived layout jumps: disable wiggle
  useEffect(() => {
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  // Remove auto-marking as read to keep the list stable while user is viewing

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="relative"
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50">
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-700" />
            <div className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4 px-1 text-[10px] flex items-center justify-center rounded-full bg-red-500 text-white font-semibold"
                 style={{ visibility: unreadCount > 0 ? 'visible' : 'hidden' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          </div>
        </div>
      </button>

      {mounted && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: panelPos.top, left: panelPos.left, width: 320 }}
          className={`bg-white rounded-xl shadow-lg border border-gray-200 z-[2147483647] overflow-hidden transition-[opacity,transform] duration-150 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
          aria-hidden={!open}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="font-semibold text-gray-800">Notifications</span>
            <button onClick={markAllRead} className="text-xs text-gray-600 hover:text-gray-800">Mark all read</button>
          </div>
          <ul className="max-h-96 overflow-auto divide-y divide-gray-100">
            {topSeven.length === 0 ? (
              <li className="px-4 py-6 text-sm text-gray-500">No notifications yet</li>
            ) : (
              topSeven.map((n) => {
                const inferredDirection = n.direction ?? (n.title?.toLowerCase().startsWith('your bid') ? 'sent' : 'received');
                const isBid = n.type === 'bid';
                const isReceived = inferredDirection === 'received';
                const dateMs = Date.parse(n.createdAt);
                const hasValidDate = !Number.isNaN(dateMs);
                return (
                <li
                  key={n.id}
                  className={`px-4 py-3 ${n.read ? 'bg-white' : 'bg-gray-50'} ` +
                    (isBid ? (isReceived ? 'border-l-4 border-emerald-400' : 'border-l-4 border-slate-300') : '')}
                >
                  <Link href={n.link || '#'} className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-md border border-gray-100 ` +
                      (isBid ? (isReceived ? 'bg-emerald-50' : 'bg-slate-50') : 'bg-blue-50')}>
                      {isBid ? (
                        <Gavel className={`h-4 w-4 ${isReceived ? 'text-emerald-600' : 'text-slate-600'}`} />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2 flex-1">{n.title}</p>
                        {isBid && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isReceived ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {isReceived ? 'Received' : 'Sent'}
                          </span>
                        )}
                      </div>
                      {n.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.description}</p>
                      )}
                      {hasValidDate && (
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      )}
                    </div>
                  </Link>
                </li>
              );})
            )}
          </ul>
          <div className="px-4 py-2 text-center border-t border-gray-100">
            <Link href="/notifications" className="text-gray-700 hover:text-gray-900 text-sm font-medium">View all</Link>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
export default memo(NotificationBar);

