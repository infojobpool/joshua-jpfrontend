"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  MessageSquare,
  Plus,
  List,
  Briefcase,
  Store,
} from "lucide-react"
import {
  differenceInCalendarDays,
  differenceInYears,
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
} from "date-fns"
import { toast, Toaster } from "sonner"
import axiosInstance from "@/lib/axiosInstance"
import useStore from "@/lib/Zustand"
import { cn } from "@/lib/utils"

// Define proper TypeScript interfaces
interface User {
  id: string;
  name: string;
  avatar: string;
}

interface Message {
  id: string;
  text: string;
  timestamp: string;
  sender: string;
}

interface LastMessage extends Message {
  isRead: boolean;
}

interface Conversation {
  id: string;
  user: User;
  task: {
    id: string;
    title: string;
  };
  lastMessage: LastMessage;
  unread: number;
}

interface MessagesMap {
  [key: string]: Message[];
}

interface ChatSummary {
  chatid: string;
  otherUserId: string;
  otherUser: string;
  lastMessage: string;
  lastMessageTime: string;
  taskTitle?: string;
  /** Listing headline from my-chats when backend sends listing_title */
  listingTitle?: string;
  /** From GET /my-chats/ when supported */
  chatKind?: "job" | "listing";
  jobId?: string;
  /** Server unread count (my-chats); legacy path uses 0 */
  unreadCount?: number;
}

/** Pull listing name from auto message copy when API did not send job_title. */
function inferListingTitleFromPreview(preview: string): string | null {
  const m = preview.match(/interested in\s+["'「]([^"'」]+)["'」]/i);
  if (m?.[1]?.trim()) return m[1].trim();
  if (/interested|about|for/i.test(preview)) {
    const m2 = preview.match(/"([^"]{2,120})"/);
    if (m2?.[1]?.trim()) return m2[1].trim();
  }
  return null;
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  const w = parts[0] ?? "";
  if (w.length >= 2) return w.slice(0, 2).toUpperCase();
  return (w[0] || "?").toUpperCase();
}

const AVATAR_GRADIENTS = [
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-indigo-600",
  "from-fuchsia-500 to-purple-600",
] as const;

function pickAvatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_GRADIENTS[Math.abs(h) % AVATAR_GRADIENTS.length];
}

function formatChatListTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  const days = differenceInCalendarDays(now, d);
  if (days >= 0 && days < 6) return formatDistanceToNow(d, { addSuffix: true });
  if (differenceInYears(now, d) === 0) return format(d, "MMM d");
  return format(d, "MMM d, yyyy");
}

type MyChatsInboxResult =
  | { ok: true; chats: ChatSummary[]; chatIds: string[] }
  | { ok: false };

async function fetchInboxFromMyChats(uid: string): Promise<MyChatsInboxResult> {
  try {
    const res = await axiosInstance.get("/my-chats/", {
      params: { user_id: uid, limit: 50, offset: 0 },
    });
    const root = res.data as Record<string, unknown> | undefined;
    if (root == null) return { ok: false };
    if (root.status_code != null && Number(root.status_code) !== 200) return { ok: false };
    const payload = (root.data ?? root) as Record<string, unknown>;
    const rawChats = payload?.chats;
    if (!Array.isArray(rawChats)) return { ok: false };

    const chats: ChatSummary[] = rawChats
      .map((c: Record<string, unknown>) => {
      const chatKind = (String(c.chat_kind ?? c.chatKind ?? "job").toLowerCase() === "listing"
        ? "listing"
        : "job") as "job" | "listing";
      const jobTitleRaw = String(c.job_title ?? c.jobTitle ?? "").trim();
      const listingTitleRaw = String(c.listing_title ?? c.listingTitle ?? "").trim();
      const otherName = String(c.other_user_name ?? c.otherUserName ?? "User").trim() || "User";
      const preview = String(c.last_message_preview ?? c.lastMessagePreview ?? "").trim();
      const at = String(c.last_message_at ?? c.lastMessageAt ?? "");
      const jid = c.job_id ?? c.jobId;
      const hasJob = jid != null && String(jid).trim() !== "";
      const unreadRaw = c.unread_count ?? c.unreadCount ?? 0;
      const unreadCount =
        typeof unreadRaw === "number" && Number.isFinite(unreadRaw)
          ? Math.max(0, Math.floor(unreadRaw))
          : Math.max(0, parseInt(String(unreadRaw), 10) || 0);

      const inferredListing =
        chatKind === "listing" && !listingTitleRaw && !jobTitleRaw
          ? inferListingTitleFromPreview(preview)
          : null;

      const taskLine =
        chatKind === "listing"
          ? listingTitleRaw || jobTitleRaw || inferredListing || "Listing inquiry"
          : jobTitleRaw || "Task";

      return {
        chatid: String(c.chat_id ?? c.chatId ?? ""),
        otherUserId: String(c.other_user_id ?? c.otherUserId ?? ""),
        otherUser: otherName,
        lastMessage: preview || "No messages yet",
        lastMessageTime: at,
        taskTitle: taskLine,
        listingTitle: listingTitleRaw || undefined,
        chatKind,
        jobId: hasJob ? String(jid) : undefined,
        unreadCount,
      };
    })
      .filter((row) => Boolean(row.chatid));

    return {
      ok: true,
      chats,
      chatIds: chats.map((x) => x.chatid),
    };
  } catch {
    return { ok: false };
  }
}

export default function MessagesPage() {
  const router = useRouter()
  const { userId, logout } = useStore()
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [chats, setChats] = useState<ChatSummary[]>([])
  const fetchChatsRef = useRef<(() => Promise<void>) | null>(null)

  // Instant hydration from cache for faster perceived load
  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = localStorage.getItem("chatSummaries")
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSummary[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChats(parsed)
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!userId) {
      router.push('/signin');
      return;
    }

    const fetchChats = async () => {
      try {
        setLoading(true)
        const uid = userId?.toString() || ""

        if (uid) {
          const inbox = await fetchInboxFromMyChats(uid)
          if (inbox.ok) {
            const sorted = [...inbox.chats].sort((a, b) => {
              const ta = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0
              const tb = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0
              return tb - ta
            })
            setChats(sorted)
            try {
              localStorage.setItem("chatSummaries", JSON.stringify(sorted))
              localStorage.setItem("userChats", JSON.stringify(inbox.chatIds))
            } catch {}
            return
          }
        }

        const taskChatOtherUser: Record<string, string> = {}
        const taskChatTaskTitle: Record<string, string> = {}

        // 1. Get chat IDs from localStorage
        const storedChats = localStorage.getItem("userChats");
        let chatIds: string[] = storedChats ? JSON.parse(storedChats) : [];

        // 2. Also derive chat IDs from in-progress, completed, and assigned tasks (taskmaster + tasker)
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1";
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

        if (token && uid) {
          try {
            const tasksWithChats: { posterId: string; taskerId: string; jobId: string; otherUserName: string; taskTitle: string }[] = [];
            // Run all 3 task fetches in parallel for faster load
            const [jobsRes, assignedRes, completedRes] = await Promise.all([
              fetch(`${API_BASE}/get-user-jobs/${uid}/`, { headers: { Authorization: `Bearer ${token}` }, credentials: "omit" }),
              fetch(`${API_BASE}/get-user-assigned-bids/${uid}/`, { headers: { Authorization: `Bearer ${token}` }, credentials: "omit" }),
              fetch(`${API_BASE}/fetch-completed-tasks/${uid}/`, { headers: { Authorization: `Bearer ${token}` }, credentials: "omit" }),
            ]);
            // My posted tasks (in progress + completed) - I'm taskmaster, chat with tasker
            if (jobsRes.ok) {
              const jobsData = await jobsRes.json();
              const jobs = jobsData?.data?.jobs || [];
              for (const j of jobs) {
                const posterId = String(j.user_ref_id || j.posted_by_id || j.user_id || "");
                const taskerId = String(j.assigned_tasker_id || j.assigned_user_id || j.accepted_bidder_id || "");
                const hasAssignedTasker = posterId && taskerId && (j.status === "in_progress" || j.status === "completed" || j.bid_accepted || j.offer_accepted || j.assigned_tasker_id || j.payment_status);
                if (hasAssignedTasker) {
                  const taskTitle = String(j.job_title || j.title || j.task_title || "Task").trim() || "Task";
                  tasksWithChats.push({ posterId, taskerId, jobId: String(j.job_id), otherUserName: String(j.assigned_tasker_name || j.tasker_name || j.posted_by || "Tasker"), taskTitle });
                }
              }
            }
            // Assigned to me - I'm tasker, chat with taskmaster (in-progress only)
            if (assignedRes.ok) {
              const assignedData = await assignedRes.json();
              const assignedJobs = assignedData?.data?.jobs || assignedData?.data?.assigned_jobs || assignedData?.jobs || [];
              for (const j of Array.isArray(assignedJobs) ? assignedJobs : []) {
                const posterId = String(j.user_ref_id || j.posted_by_id || j.poster_id || j.user_id || "");
                const taskerId = String(j.assigned_tasker_id || j.assigned_user_id || uid);
                if (posterId && taskerId) {
                  const taskTitle = String(j.job_title || j.title || j.task_title || "Task").trim() || "Task";
                  tasksWithChats.push({ posterId, taskerId, jobId: String(j.job_id || j.id), otherUserName: String(j.posted_by || j.poster_name || "Task Poster"), taskTitle });
                }
              }
            }
            // Completed tasks (poster or tasker)
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
                  const taskTitle = String(j.job_title || j.title || j.task_title || "Task").trim() || "Task";
                  tasksWithChats.push({ posterId, taskerId, jobId, otherUserName, taskTitle });
                }
              }
            }
            // Get or create chat_id for each task - run in parallel for faster load
            const chatResults = await Promise.allSettled(
              tasksWithChats.map((t) =>
                axiosInstance.get("/create-or-get-chat/", {
                  params: { sender: t.posterId, receiver: t.taskerId, job_id: t.jobId },
                })
              )
            );
            for (let i = 0; i < chatResults.length; i++) {
              const result = chatResults[i];
              const task = tasksWithChats[i];
              if (result.status === "fulfilled" && result.value?.data?.status_code === 200 && result.value?.data?.data?.chat_id) {
                const cid = result.value.data.data.chat_id;
                if (cid && !chatIds.includes(cid)) {
                  chatIds.push(cid);
                  taskChatOtherUser[cid] = task.otherUserName;
                  taskChatTaskTitle[cid] = task.taskTitle;
                }
              }
            }
            if (chatIds.length > 0) {
              try { localStorage.setItem("userChats", JSON.stringify(chatIds)); } catch {}
            }
          } catch (_) {
            // Non-blocking
          }
        }

        // Fetch details for each chat - run in parallel for faster load (batches of 8 to avoid overload)
        const chatSummaries: ChatSummary[] = [];
        const validChatIds: string[] = [];
        const BATCH_SIZE = 8;
        for (let i = 0; i < chatIds.length; i += BATCH_SIZE) {
          const batch = chatIds.slice(i, i + BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map((cid) =>
              axiosInstance.get(`/get-messages/${cid}`, {
                params: uid ? { user_id: uid } : undefined,
              })
            )
          );
          for (let j = 0; j < batch.length; j++) {
            const chatId = batch[j];
            const result = results[j];
            try {
              if (result.status === "fulfilled" && result.value?.data?.status_code === 200 && result.value?.data?.data) {
                const messages = result.value.data.data.messages || [];
                if (messages.length > 0) {
                  const lastMessage = messages[messages.length - 1];
                  const otherUserId = lastMessage.sender_id === userId ? lastMessage.receiver_id : lastMessage.sender_id;
                  const otherUserName = lastMessage.sender_id === userId ? lastMessage.receiver_name : lastMessage.sender_name;
                  chatSummaries.push({
                    chatid: chatId,
                    otherUserId,
                    otherUser: otherUserName,
                    lastMessage: lastMessage.description,
                    lastMessageTime: lastMessage.tstamp,
                    taskTitle: taskChatTaskTitle[chatId] || undefined,
                    unreadCount: 0,
                  });
                  validChatIds.push(chatId);
                } else if (taskChatOtherUser[chatId]) {
                  chatSummaries.push({
                    chatid: chatId,
                    otherUserId: "",
                    otherUser: taskChatOtherUser[chatId],
                    lastMessage: "No messages yet",
                    lastMessageTime: "",
                    taskTitle: taskChatTaskTitle[chatId] || undefined,
                    unreadCount: 0,
                  });
                  validChatIds.push(chatId);
                }
              }
            } catch {
              validChatIds.push(chatId);
            }
          }
          // Handle rejected (404 etc.) - empty chats return 404
          for (let j = 0; j < batch.length; j++) {
            const chatId = batch[j];
            const result = results[j];
            if (result.status === "rejected" && taskChatOtherUser[chatId]) {
              const status = (result.reason as any)?.response?.status;
              if (status === 404) {
                chatSummaries.push({
                  chatid: chatId,
                  otherUserId: "",
                  otherUser: taskChatOtherUser[chatId],
                  lastMessage: "No messages yet",
                  lastMessageTime: "",
                  taskTitle: taskChatTaskTitle[chatId] || undefined,
                  unreadCount: 0,
                });
                validChatIds.push(chatId);
              }
            }
          }
        }

        // Persist chat ids only when we have valid data (avoid clearing on fetch failure)
        if (validChatIds.length > 0) {
          try {
            localStorage.setItem("userChats", JSON.stringify(validChatIds));
          } catch {}
        }

        // Sort chats by last message time (newest first)
        chatSummaries.sort((a, b) => {
          if (!a.lastMessageTime || !b.lastMessageTime) return 0;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

        // Only overwrite when we have fresh data - avoid wiping hydrated/cached chats when fetch returns empty (e.g. API delay, empty userChats on nav)
        if (chatSummaries.length > 0) {
          setChats(chatSummaries);
          try {
            localStorage.setItem("chatSummaries", JSON.stringify(chatSummaries));
          } catch {}
        }
      } catch (error: any) {
        console.error('Error fetching chats:', error);
        toast.error(error.response?.data?.message || 'Failed to load chats');
        // Don't overwrite chats with empty on fetch failure - keep cached data
      } finally {
        setLoading(false);
      }
    };

    // Store fetchChats in ref so it can be accessed by event handlers
    fetchChatsRef.current = fetchChats;
    
    // Check if we're returning from a chat and need to refresh
    try {
      const shouldRefresh = sessionStorage.getItem('messagesReturnFromChat');
      if (shouldRefresh === '1') {
        sessionStorage.removeItem('messagesReturnFromChat');
        // Small delay to ensure page is ready
        setTimeout(() => fetchChats(), 100);
      } else {
        fetchChats();
      }
    } catch {
    fetchChats();
    }
    
    // Refresh when page becomes visible so new messages show without a full reload
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible" || !fetchChatsRef.current) return
      try {
        if (sessionStorage.getItem("messagesReturnFromChat") === "1") {
          sessionStorage.removeItem("messagesReturnFromChat")
        }
      } catch {}
      fetchChatsRef.current()
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Refetch when page gains focus (e.g. clicking Messages from bottom nav, returning to tab)
    const handleFocus = () => {
      if (document.visibilityState === 'visible' && fetchChatsRef.current) {
        fetchChatsRef.current();
      }
    };
    window.addEventListener('focus', handleFocus);

    // Restore scroll position if available
    try {
      const y = sessionStorage.getItem('messagesScrollY');
      if (y) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(y, 10));
        }, 0);
      }
    } catch {}
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId, router]);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('bids');
    localStorage.removeItem('userChats');
    logout();
    router.push('/');
  };

  // Only full-screen loader when no cached chats; otherwise show layout with skeletons
  if (loading && chats.length === 0) {
    return (
      <div className="flex min-h-screen flex-col">
        <Toaster position="top-right" />
        <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Your Messages</h1>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-slate-700" />
                      <div className="h-3 w-48 rounded bg-gray-100 dark:bg-slate-800" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Please log in to view messages</p>
          <Link href="/signin" className="text-blue-600 hover:underline">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50/50 dark:bg-slate-950">
      <Toaster position="top-right" />
      <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-gray-100 md:text-3xl">
                Messages
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Task chats and listing messages in one place
              </p>
            </div>
            {chats.length > 0 && (
              <div className="relative w-full sm:max-w-xs shrink-0">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  placeholder="Search name or task…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 rounded-xl border-slate-200 bg-white pl-10 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                />
              </div>
            )}
          </div>
          
          {chats.length === 0 ? (
            <Card className="text-center py-14 px-6 rounded-2xl border-gray-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/50">
              <CardContent className="space-y-6">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <MessageSquare className="h-10 w-10 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No chats yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Here&apos;s how you can start a conversation:</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/post-task">
                    <Button variant="default" className="w-full sm:w-auto gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md">
                      <Plus className="h-4 w-4" />
                      Post a Task
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <Button variant="outline" className="w-full sm:w-auto gap-2 rounded-xl border-2">
                      <List className="h-4 w-4" />
                      Browse Tasks
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Message taskers who bid on your task, or contact taskers about their listings.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {loading && (
                <p className="animate-pulse text-xs text-slate-500 dark:text-slate-400">Updating…</p>
              )}
              {chats
                .filter((chat) => {
                  const q = searchTerm.toLowerCase();
                  if (!q) return true;
                  const listingHead = (chat.listingTitle || "").trim();
                  const topic =
                    chat.chatKind === "listing"
                      ? listingHead ||
                        inferListingTitleFromPreview(chat.lastMessage) ||
                        chat.taskTitle ||
                        ""
                      : chat.taskTitle || "";
                  return (
                    chat.otherUser.toLowerCase().includes(q) ||
                    chat.lastMessage.toLowerCase().includes(q) ||
                    topic.toLowerCase().includes(q)
                  );
                })
                .map((chat) => {
                  const isListing = chat.chatKind === "listing";
                  const unreadCount = chat.unreadCount ?? 0;
                  const hasUnread = unreadCount > 0;

                  const jobTitle =
                    !isListing &&
                    chat.taskTitle &&
                    chat.taskTitle !== "Task" &&
                    chat.taskTitle !== "Listing inquiry"
                      ? chat.taskTitle
                      : null;

                  const apiListingHead = (chat.listingTitle || "").trim();
                  const listingUsesApiTitle = Boolean(apiListingHead);
                  const listingPrimaryTitle = listingUsesApiTitle
                    ? apiListingHead
                    : chat.otherUser;
                  const listingSubtitle =
                    isListing && listingUsesApiTitle
                      ? `With ${chat.otherUser}`
                      : null;
                  const listingInferredTopic =
                    isListing && !listingUsesApiTitle
                      ? inferListingTitleFromPreview(chat.lastMessage) ||
                        (chat.taskTitle && chat.taskTitle !== "Listing inquiry"
                          ? chat.taskTitle
                          : null)
                      : null;

                  const avatarSeed = (chat.otherUserId || chat.otherUser || chat.chatid).trim();
                  const initials = initialsFromName(chat.otherUser);
                  const grad = pickAvatarGradient(avatarSeed);
                  const timeLabel = chat.lastMessageTime
                    ? formatChatListTime(chat.lastMessageTime)
                    : "";

                  return (
                    <div
                      key={chat.chatid}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          ;(e.currentTarget as HTMLDivElement).click();
                        }
                      }}
                      className={cn(
                        "group flex cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200",
                        "border-slate-200/90 hover:border-slate-300 hover:shadow-md active:scale-[0.99]",
                        "dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-600",
                        isListing
                          ? "ring-1 ring-violet-500/10 dark:ring-violet-500/15"
                          : "ring-1 ring-blue-500/10 dark:ring-blue-500/15",
                        hasUnread && "border-slate-300 dark:border-slate-600",
                      )}
                      onClick={() => {
                        try {
                          sessionStorage.setItem("messagesScrollY", String(window.scrollY));
                          sessionStorage.setItem("messagesLastChatId", chat.chatid);
                        } catch {}
                        const q = new URLSearchParams();
                        if (isListing) {
                          const lt =
                            (chat.listingTitle || "").trim() ||
                            listingInferredTopic ||
                            (chat.taskTitle && chat.taskTitle !== "Listing inquiry"
                              ? chat.taskTitle
                              : "");
                          if (lt) q.set("listing_title", lt);
                        } else {
                          const tt =
                            jobTitle ||
                            (chat.taskTitle && chat.taskTitle !== "Task" ? chat.taskTitle : "");
                          if (tt) q.set("task_title", tt);
                          if (chat.jobId) q.set("task_id", chat.jobId);
                        }
                        const qs = q.toString();
                        router.push(`/messages/${chat.chatid}${qs ? `?${qs}` : ""}`);
                      }}
                    >
                      <div
                        className={cn(
                          "w-1 shrink-0 self-stretch",
                          isListing ? "bg-violet-500" : "bg-blue-500",
                        )}
                        aria-hidden
                      />
                      <div className="flex min-w-0 flex-1 items-start gap-3 p-3.5 sm:gap-4 sm:p-4">
                        <div className="relative shrink-0">
                          <Avatar className="h-12 w-12 rounded-xl ring-2 ring-slate-100 dark:ring-slate-800">
                            <AvatarFallback
                              className={cn(
                                "rounded-xl bg-gradient-to-br text-[13px] font-bold text-white",
                                grad,
                              )}
                            >
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          {hasUnread ? (
                            <span
                              className={cn(
                                "absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900",
                                isListing ? "bg-violet-500" : "bg-blue-500",
                              )}
                              aria-hidden
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              {isListing ? (
                                <>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p
                                      className={cn(
                                        "truncate text-[15px] text-slate-900 dark:text-slate-100",
                                        hasUnread ? "font-bold" : "font-semibold",
                                      )}
                                    >
                                      {listingPrimaryTitle}
                                    </p>
                                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800 dark:bg-violet-950/80 dark:text-violet-200">
                                      <Store className="h-3 w-3" aria-hidden />
                                      Listing
                                    </span>
                                    {hasUnread && unreadCount > 1 ? (
                                      <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none text-white dark:bg-violet-500">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                      </span>
                                    ) : null}
                                  </div>
                                  {listingSubtitle ? (
                                    <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">
                                      {listingSubtitle}
                                    </p>
                                  ) : listingInferredTopic ? (
                                    <p className="mt-0.5 truncate text-sm font-medium text-violet-700 dark:text-violet-300">
                                      {listingInferredTopic}
                                    </p>
                                  ) : null}
                                </>
                              ) : (
                                <>
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <p
                                      className={cn(
                                        "truncate text-[15px] text-slate-900 dark:text-slate-100",
                                        hasUnread ? "font-bold" : "font-semibold",
                                      )}
                                    >
                                      {jobTitle || chat.otherUser}
                                    </p>
                                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-800 dark:bg-blue-950/80 dark:text-blue-200">
                                      <Briefcase className="h-3 w-3" aria-hidden />
                                      Task
                                    </span>
                                    {hasUnread && unreadCount > 1 ? (
                                      <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold tabular-nums leading-none text-white dark:bg-blue-500">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                      </span>
                                    ) : null}
                                  </div>
                                  {jobTitle ? (
                                    <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">
                                      With {chat.otherUser}
                                    </p>
                                  ) : null}
                                </>
                              )}
                            </div>
                            {timeLabel ? (
                              <time
                                dateTime={chat.lastMessageTime}
                                className="shrink-0 pt-0.5 text-right text-[11px] font-medium tabular-nums text-slate-500 dark:text-slate-400"
                              >
                                {timeLabel}
                              </time>
                            ) : null}
                          </div>
                          <p
                            className={cn(
                              "mt-1.5 line-clamp-2 text-sm leading-snug text-slate-700 dark:text-slate-300",
                              hasUnread && "font-medium text-slate-900 dark:text-slate-100",
                            )}
                          >
                            {chat.lastMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}