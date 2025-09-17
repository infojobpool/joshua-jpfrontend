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
  const baseIntervalMs = 300000; // Reduced from 15s to 5 minutes to prevent DB overload
  const maxIntervalMs = 600000; // Max 10 minutes
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

  const topThreeBids = useMemo(() => items.filter((n) => n.type === 'bid').slice(0, 3), [items]);
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
        // Check cache first to prevent excessive API calls
        const cacheKey = `notifications_${userId}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          const cacheAge = Date.now() - cachedData.timestamp;
          if (cacheAge < 120000) { // 2 minutes cache
            console.log("Using cached notifications data");
            if (cachedData.notifications) {
              addNotifications(cachedData.notifications);
            }
            return;
          }
        }
        
        // Only fetch bids RECEIVED on tasks posted by this user (incoming bids only)
        const jobsRes = await axiosInstance.get<ApiListResponse<{ jobs: any[] }>>(
          `/get-user-jobs/${userId}/`
        );
        const jobs = jobsRes.data?.data?.jobs || [];
        const recentJobs = [...jobs]
          .sort((a, b) => Date.parse(b.timestamp || b.job_due_date || '') - Date.parse(a.timestamp || a.job_due_date || ''))
          .slice(0, 5); // Reduced from 50 to 5 to prevent DB overload

        const bidsArrays = await Promise.all(
          recentJobs.map(async (job) => {
            try {
              // Add timeout to prevent hanging requests
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
              
              const r = await axiosInstance.get<ApiListResponse<any[]>>(`/get-bids/${job.job_id}/`, {
                signal: controller.signal
              });
              clearTimeout(timeoutId);
              
              const data = Array.isArray(r.data?.data) ? r.data.data : [];
              return data
                // Ignore bids that are deleted/withdrawn/canceled if backend tags them
                .filter((b: any) => {
                  const status = (b.status || b.bid_status || '').toString().toLowerCase();
                  const deleted = Boolean(b.deleted || b.is_deleted);
                  return !deleted && status !== 'deleted' && status !== 'withdrawn' && status !== 'canceled';
                })
                .map((b: any) => ({ ...b, job }));
            } catch (e: any) {
              // Handle timeout and other errors gracefully
              if (e.name === 'AbortError') {
                console.log("Bid request timed out for job", job.job_id);
              } else {
                console.warn("Failed to fetch bids for job", job.job_id, e.message);
              }
              return [] as any[];
            }
          })
        );
        const allBids = bidsArrays.flat();

        // Only show bids NOT by me (incoming bids only)
        // Treat as received if the bidder is NOT me. Backend may use different keys.
        const bidsReceived = allBids.filter((b: any) => {
          const bidder = String(b.tasker_id || b.user_id || b.bidder_id || b.bidder || b.offered_by || "");
          return bidder !== String(userId);
        });

        if (!mounted) return;

        const newItems = [] as {
          id: string;
          type: "bid";
          title: string;
          description?: string;
          createdAt: string;
          read: boolean;
          link?: string;
          // enrich to cooperate with store filters
          direction: "received";
          taskId?: string;
          bidId?: string;
          status?: string;
          deleted?: boolean;
        }[];

        // Only process incoming bids (no sent bids, no messages)
        for (const b of bidsReceived) {
          const bidId = String(b.bid_id || b.id || `${b.job?.job_id || b.task_id}-unknown`);
          const id = `bid:${bidId}`;
          const createdStr = b.created_at || b.createdAt || b.bid_time || b.timestamp || b.updated_at || b.updatedAt;
          const createdTs = Date.parse(createdStr || "");
          if (!Number.isNaN(createdTs) && createdTs <= lastTimestampRef.current) {
            // older or same, skip
          } else if (!fetchedIdsRef.current.has(id)) {
            fetchedIdsRef.current.add(id);
            const bidderName = (b as any).bidder_name || (b as any).tasker_name || (b as any).user_name || (b as any).user || (b as any).bidder || (b as any).offered_by;
            newItems.push({
              id,
              type: "bid",
              title: `New bid on ${b.task_title || b.job?.job_title || b.title || "your task"}`,
              description: `${(b.bid_amount || b.amount || b.offer_amount) ? `Offer: ₹${b.bid_amount || b.amount || b.offer_amount}` : ""}${bidderName ? ((b.bid_amount || b.amount || b.offer_amount) ? " • " : "") + `By ${bidderName}` : ""}`,
              createdAt: createdStr || new Date().toISOString(),
              read: false,
              link: `/tasks/${b.task_id || b.job?.job_id || b.job_id || b.task?.id || ""}`,
              direction: "received",
              taskId: String(b.task_id || b.job?.job_id || b.job_id || b.task?.id || ""),
              bidId: bidId,
              status: (b.status || b.bid_status || b.state || "active").toString().toLowerCase(),
              deleted: Boolean(b.deleted || b.is_deleted || b.removed || false),
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
          
          // Cache the notifications to prevent repeated API calls
          localStorage.setItem(cacheKey, JSON.stringify({
            notifications: newItems,
            timestamp: Date.now()
          }));
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
      try {
        // Reset seen markers so existing recent bids can surface again
        fetchedIdsRef.current.clear();
        lastTimestampRef.current = 0;
        fetchRef.current();
      } catch {}
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
        className={`relative transition-transform ${open ? 'scale-95' : 'hover:scale-105'}`}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="p-2.5 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow-md">
          <div className="relative">
            <Bell className="h-5 w-5 text-gray-800" />
            <div
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-4 px-1 text-[10px] flex items-center justify-center rounded-full bg-emerald-600 text-white font-semibold ring-2 ring-white"
              style={{ visibility: unreadCount > 0 ? 'visible' : 'hidden' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </div>
          </div>
        </div>
      </button>

      {mounted && createPortal(
        <div
          ref={panelRef}
          style={{ position: 'fixed', top: panelPos.top, left: panelPos.left, width: 360 }}
          className={`bg-white rounded-2xl shadow-xl border border-gray-200 z-[2147483647] overflow-hidden transition-[opacity,transform] duration-150 ${open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-1 pointer-events-none'}`}
          aria-hidden={!open}
        >
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900">Notifications</span>
              <span className="text-[11px] text-gray-500">Latest received bids</span>
            </div>
            <button onClick={markAllRead} className="text-xs text-gray-600 hover:text-gray-900">Mark all read</button>
          </div>
          <ul className="max-h-96 overflow-auto">
            {topThreeBids.length === 0 ? (
              <li className="px-5 py-8 text-sm text-gray-500 text-center">No notifications yet</li>
            ) : (
              topThreeBids.map((n) => {
                const isBid = n.type === 'bid';
                const dateMs = Date.parse(n.createdAt);
                const hasValidDate = !Number.isNaN(dateMs);
                return (
                <li
                  key={n.id}
                  className={`px-5 py-3.5 transition-colors ${n.read ? 'bg-white' : 'bg-emerald-50/40'} hover:bg-emerald-50`}
                >
                  <Link href={n.link || '#'} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border border-emerald-200 bg-emerald-50`}>
                      <Gavel className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">{n.title}</p>
                        {hasValidDate && (
                          <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">{new Date(n.createdAt).toLocaleString()}</span>
                        )}
                      </div>
                      {n.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.description}</p>
                      )}
                      <div className="mt-2">
                        <span className="inline-flex items-center text-[11px] font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">Received bid</span>
                      </div>
                    </div>
                  </Link>
                </li>
              );})
            )}
          </ul>
          <div className="px-5 py-2.5 text-center border-t border-gray-100 bg-white/60">
            <Link href="/notifications" className="text-gray-800 hover:text-gray-900 text-sm font-medium">View all</Link>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
export default memo(NotificationBar);

