"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Paperclip, MoreVertical, Search, MessageSquare, Plus, List } from "lucide-react"
import { toast, Toaster } from "sonner"
import axiosInstance from "@/lib/axiosInstance"
import useStore from "@/lib/Zustand"

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
        const taskChatOtherUser: Record<string, string> = {}
        const taskChatTaskTitle: Record<string, string> = {}

        // 1. Get chat IDs from localStorage
        const storedChats = localStorage.getItem("userChats");
        let chatIds: string[] = storedChats ? JSON.parse(storedChats) : [];

        // 2. Also derive chat IDs from in-progress, completed, and assigned tasks (taskmaster + tasker)
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1";
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const uid = userId?.toString() || "";

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
            batch.map((cid) => axiosInstance.get(`/get-messages/${cid}`))
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
    
    // Refresh when page becomes visible (user returns from chat)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && fetchChatsRef.current) {
        try {
          const shouldRefresh = sessionStorage.getItem('messagesReturnFromChat');
          if (shouldRefresh === '1') {
            sessionStorage.removeItem('messagesReturnFromChat');
            fetchChatsRef.current(); // Refresh the chat list
          }
        } catch {}
      }
    };
    
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Your Messages</h1>
            {chats.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
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
            <div className="space-y-3">
              {loading && (
                <p className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">Updating...</p>
              )}
              {chats
                .filter(chat => {
                  const q = searchTerm.toLowerCase();
                  if (!q) return true;
                  return (
                    chat.otherUser.toLowerCase().includes(q) ||
                    chat.lastMessage.toLowerCase().includes(q) ||
                    (chat.taskTitle || "").toLowerCase().includes(q)
                  );
                })
                .map((chat) => {
                  const displayTitle = chat.taskTitle && chat.taskTitle !== "Task"
                    ? chat.taskTitle
                    : chat.otherUser;
                  const displaySubtitle = chat.taskTitle && chat.taskTitle !== "Task"
                    ? (chat.lastMessage === "No messages yet" ? `with ${chat.otherUser}` : chat.lastMessage)
                    : chat.lastMessage;
                  return (
                <div
                  key={chat.chatid}
                  className="group rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm hover:shadow-md active:scale-[0.99] transition-all duration-200 cursor-pointer"
                  onClick={() => {
                    try {
                      sessionStorage.setItem('messagesScrollY', String(window.scrollY));
                      sessionStorage.setItem('messagesLastChatId', chat.chatid);
                    } catch {}
                    router.push(`/messages/${chat.chatid}`);
                  }}
                >
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12 rounded-xl ring-2 ring-gray-100 dark:ring-slate-800 shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold rounded-xl">
                          {chat.otherUser.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{displayTitle}</p>
                          {chat.lastMessageTime && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap shrink-0">
                              {new Date(chat.lastMessageTime).toLocaleString('en-US', {
                                dateStyle: 'short',
                                timeStyle: 'short'
                              })}
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-0.5">{displaySubtitle}</p>
                      </div>
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