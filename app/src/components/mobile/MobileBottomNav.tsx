"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, MessageCircle, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import useStore from "@/lib/Zustand";
import axiosInstance from "@/lib/axiosInstance";

interface ChatSummary {
  chatid: string;
  otherUser: string;
  lastMessage: string;
}

function getUserId(storeUserId: string | null): string {
  if (storeUserId) return String(storeUserId);
  if (typeof window === "undefined") return "";
  try {
    const fromStorage = localStorage.getItem("userId");
    if (fromStorage) return fromStorage;
    const userRaw = localStorage.getItem("user");
    if (userRaw) {
      const user = JSON.parse(userRaw);
      if (user?.id) return String(user.id);
    }
  } catch {}
  return "";
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { userId, user } = useStore();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);
  const [chatsLoading, setChatsLoading] = useState(false);

  // When popover opens, fetch chats from API (same logic as Messages page)
  useEffect(() => {
    if (!messagesOpen) return;
    const uid = getUserId(userId);
    if (!uid) return;
    const fetchChats = async () => {
      setChatsLoading(true);
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1";
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const taskChatOtherUser: Record<string, string> = {};
        let chatIds: string[] = [];
        let tasksWithChats: { posterId: string; taskerId: string; jobId: string; otherUserName: string }[] = [];
        try {
          const raw = localStorage.getItem("userChats");
          chatIds = raw ? JSON.parse(raw) : [];
        } catch {}

        if (token && uid) {
          tasksWithChats = [];
          const jobsRes = await fetch(`${API_BASE}/get-user-jobs/${uid}/`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "omit",
          });
          if (jobsRes.ok) {
            const jobsData = await jobsRes.json();
            const jobs = jobsData?.data?.jobs || [];
            for (const j of jobs) {
              const posterId = String(j.user_ref_id || j.posted_by_id || j.user_id || "");
              const taskerId = String(j.assigned_tasker_id || j.assigned_user_id || j.accepted_bidder_id || "");
              const hasAssignedTasker = posterId && taskerId && (j.status === "in_progress" || j.status === "completed" || j.bid_accepted || j.offer_accepted || j.assigned_tasker_id || j.payment_status);
              if (hasAssignedTasker) {
                tasksWithChats.push({ posterId, taskerId, jobId: String(j.job_id), otherUserName: String(j.assigned_tasker_name || j.tasker_name || j.posted_by || "Tasker") });
              }
            }
          }
          const assignedRes = await fetch(`${API_BASE}/get-user-assigned-bids/${uid}/`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "omit",
          });
          if (assignedRes.ok) {
            const assignedData = await assignedRes.json();
            const assignedJobs = assignedData?.data?.jobs || assignedData?.data?.assigned_jobs || assignedData?.jobs || [];
            for (const j of Array.isArray(assignedJobs) ? assignedJobs : []) {
              const posterId = String(j.user_ref_id || j.posted_by_id || j.poster_id || j.user_id || "");
              const taskerId = String(j.assigned_tasker_id || j.assigned_user_id || uid);
              if (posterId && taskerId) {
                tasksWithChats.push({ posterId, taskerId, jobId: String(j.job_id || j.id), otherUserName: String(j.posted_by || j.poster_name || "Task Poster") });
              }
            }
          }
          // Completed tasks (poster or tasker) - get-user-assigned-bids only returns in-progress
          const completedRes = await fetch(`${API_BASE}/fetch-completed-tasks/${uid}/`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "omit",
          });
          if (completedRes.ok) {
            const completedData = await completedRes.json();
            const completedJobs = completedData?.data?.jobs || completedData?.data || completedData?.jobs || [];
            const seen = new Set(tasksWithChats.map((t) => t.jobId));
            for (const j of Array.isArray(completedJobs) ? completedJobs : []) {
              const posterId = String(j.user_ref_id || j.posted_by_id || j.poster_id || j.user_id || "");
              const taskerId = String(j.assigned_tasker_id || j.assigned_user_id || j.confirmed_bid_id || j.accepted_bidder_id || "");
              const jobId = String(j.job_id || j.id);
              if (posterId && taskerId && jobId && !seen.has(jobId)) {
                seen.add(jobId);
                const isPoster = posterId === uid;
                const otherUserName = isPoster
                  ? String(j.assigned_tasker_name || j.tasker_name || "Tasker")
                  : String(j.posted_by || j.poster_name || "Task Poster");
                tasksWithChats.push({ posterId, taskerId, jobId, otherUserName });
              }
            }
          }
          for (const { posterId, taskerId, jobId, otherUserName } of tasksWithChats) {
            try {
              const chatResp = await axiosInstance.get("/create-or-get-chat/", {
                params: { sender: posterId, receiver: taskerId, job_id: jobId },
              });
              if (chatResp.data?.status_code === 200 && chatResp.data?.data?.chat_id) {
                const cid = chatResp.data.data.chat_id;
                if (cid && !chatIds.includes(cid)) {
                  chatIds.push(cid);
                  taskChatOtherUser[cid] = otherUserName;
                }
              }
            } catch (_) { /* skip */ }
          }
        }

        const summaries: ChatSummary[] = [];
        for (const chatId of chatIds) {
          try {
            const response = await axiosInstance.get(`/get-messages/${chatId}`);
            if (response.data.status_code === 200 && response.data.data) {
              const messages = response.data.data.messages || [];
              if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                const otherUserName = lastMessage.sender_id === userId ? lastMessage.receiver_name : lastMessage.sender_name;
                summaries.push({
                  chatid: chatId,
                  otherUser: otherUserName || taskChatOtherUser[chatId] || "Unknown",
                  lastMessage: lastMessage.description,
                });
              } else if (taskChatOtherUser[chatId]) {
                summaries.push({
                  chatid: chatId,
                  otherUser: taskChatOtherUser[chatId],
                  lastMessage: "No messages yet",
                });
              }
            }
          } catch (_) {
            // get-messages returns 404 for empty chats - still show if we have otherUser from task
            if (taskChatOtherUser[chatId]) {
              summaries.push({
                chatid: chatId,
                otherUser: taskChatOtherUser[chatId],
                lastMessage: "No messages yet",
              });
            }
          }
        }
        summaries.sort((a, b) => {
          if (!a.lastMessage || !b.lastMessage) return 0;
          return 0;
        });
        setChatSummaries(summaries);
        if (summaries.length === 0 && typeof window !== "undefined") {
          console.log("[Messages popover] No chats:", { chatIdsCount: chatIds.length, hasToken: !!token, uid: uid ? "set" : "missing" });
        }
        try {
          localStorage.setItem("chatSummaries", JSON.stringify(summaries));
        } catch {}
      } catch (_) {
        try {
          const raw = localStorage.getItem("chatSummaries");
          if (raw) {
            const parsed = JSON.parse(raw) as ChatSummary[];
            setChatSummaries(Array.isArray(parsed) ? parsed : []);
          }
        } catch {}
      } finally {
        setChatsLoading(false);
      }
    };
    fetchChats();
  }, [messagesOpen, userId, pathname]);

  // Fallback: read from localStorage when popover opens (before fetch completes)
  useEffect(() => {
    if (!messagesOpen) return;
    try {
      const raw = localStorage.getItem("chatSummaries");
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSummary[];
        setChatSummaries((prev) => (prev.length === 0 && Array.isArray(parsed) ? parsed : prev));
      }
    } catch {}
  }, [messagesOpen]);

  const isMessagesActive = pathname === "/messages" || pathname.startsWith("/messages/");

  const messagesNav = (
    <Popover open={messagesOpen} onOpenChange={setMessagesOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-200 ease-out active:scale-90 touch-manipulation w-full min-w-0 ${
            isMessagesActive
              ? "text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-slate-700"
              : "text-gray-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-[#60a5fa] hover:bg-gray-50 dark:hover:bg-slate-800"
          }`}
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium truncate">Messages</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-[min(calc(100vw-2rem),320px)] p-0 rounded-xl border shadow-lg"
      >
        <div className="p-2 border-b bg-muted/30">
          <p className="text-sm font-semibold text-center">Recent Chats</p>
        </div>
        <ScrollArea className="max-h-[min(50vh,280px)]">
          {chatsLoading ? (
            <div className="p-6 flex flex-col items-center justify-center gap-2">
              <div className="h-6 w-6 rounded-full border-2 border-blue-500/30 border-t-blue-600 animate-spin" />
              <span className="text-xs text-muted-foreground">Loading chats...</span>
            </div>
          ) : chatSummaries.length > 0 ? (
            <div className="p-1">
              {chatSummaries.map((chat) => (
                <Link
                  key={chat.chatid}
                  href={`/messages/${chat.chatid}`}
                  onClick={() => setMessagesOpen(false)}
                  className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors"
                >
                  <span className="text-sm font-medium truncate">{chat.otherUser || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {chat.lastMessage || "No messages yet"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No chats yet. Start a conversation from a task.
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t bg-muted/30">
          <Link
            href="/messages"
            onClick={() => setMessagesOpen(false)}
            className="block text-center text-sm font-medium text-[#2563eb] dark:text-[#60a5fa] py-2"
          >
            View all messages
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );

  const postTaskButton = (
    <Link
      href="/post-task"
      className="flex-shrink-0 -mt-6 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95 transition-all duration-200 ease-out touch-manipulation border-4 border-white dark:border-slate-900"
      aria-label="Post a task"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </Link>
  );

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/dashboard", icon: Search, label: "Browse" },
    { type: "post" as const },
    { type: "messages" as const, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  const navLinkClass =
    "flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-200 ease-out active:scale-90 touch-manipulation min-w-0 flex-1";

  return (
    <div
      className="fixed left-0 right-0 bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-50 md:hidden mobile-nav-appear"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between px-3 py-2 max-w-lg mx-auto gap-1">
        {navItems.map((item) => {
          if (item.type === "post") {
            return (
            <div key="post" className="flex-shrink-0 flex justify-center">
              {postTaskButton}
            </div>
          );
          }
          if (item.type === "messages") {
            return (
              <div key="messages" className="flex-1 flex justify-center min-w-0">
                {messagesNav}
              </div>
            );
          }
          const { href, icon: Icon, label } = item as {
            href: string;
            icon: React.ComponentType<{ className?: string }>;
            label: string;
          };
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`${navLinkClass} ${
                isActive
                  ? "text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-slate-700"
                  : "text-gray-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-[#60a5fa] hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
