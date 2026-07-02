"use client"

import { useState, useEffect, useLayoutEffect, useRef, useMemo, Fragment } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ArrowLeft } from "lucide-react"
import { toast, Toaster } from "sonner"
import axiosInstance from "@/lib/axiosInstance"
import useStore from "@/lib/Zustand"
import {
  compareMessagesByTime,
  formatChatBubbleTime,
  formatChatDateSeparator,
  getMessageTimeRaw,
  parseMessageToMs,
  sameCalendarDayMs,
} from "@/lib/chatMessageTime"
import {
  sameChatUserId,
  isSendMessageSuccess,
  extractSentMessageId,
  extractSentMessageTimestamp,
} from "@/lib/chatSendResponse"

/** Match auto intro copy like: interested in 'Event & Wedding Photography' */
function inferTopicFromMessageText(text: string): string {
  const m = text.match(/interested in\s+["'「]([^"'」]+)["'」]/i)
  if (m?.[1]?.trim()) return m[1].trim()
  if (/interested|about|for/i.test(text)) {
    const m2 = text.match(/"([^"]{2,120})"/)
    if (m2?.[1]?.trim()) return m2[1].trim()
  }
  return ""
}

const QUICK_REPLY_SUGGESTIONS = [
  "Is this still available?",
  "What's your availability like?",
  "Could you share a bit more detail?",
  "Thanks — I'll get back to you soon.",
]

type LooseSendPayload = Record<string, unknown>

interface Message {
  id: string;
  messagesid?: string;
  description: string;
  tstamp?: string;
  timestamp?: string;
  created_at?: string;
  sender_id?: string;
  receiver_id?: string;
  sender_name?: string;
  receiver_name?: string;
  userrefid?: string;
  username?: string;
  chatid?: string;
  is_read?: boolean;
}

interface ChatInfo {
  chatId: string;
  otherUser: {
    id: string;
    name: string;
    avatar?: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

/** Fingerprint for poll dedupe — avoids setMessages + scroll jitter when nothing changed. */
function messagesListStableKey(list: Message[]): string {
  if (list.length === 0) return "__empty__";
  return list
    .map((m) => {
      const id = String(m.id ?? m.messagesid ?? "");
      const desc = String(m.description ?? "");
      const t = String(getMessageTimeRaw(m) ?? "");
      const read = m.is_read === true ? "1" : "0";
      return `${id}\u001f${desc}\u001f${t}\u001f${read}`;
    })
    .join("\u001e");
}

export default function ChatPageClient() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { userId, user, logout } = useStore()
  const [loading, setLoading] = useState(true)
  const sendInFlightRef = useRef(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [otherUserName, setOtherUserName] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)
  /** Last applied message list fingerprint — background polls skip setState when unchanged. */
  const lastMessagesStableKeyRef = useRef<string>("")
  /** Full-screen chat shell — sized to visualViewport so composer stays above the mobile keyboard. */
  const chatShellRef = useRef<HTMLDivElement | null>(null)
  const visualViewportRafRef = useRef<number>(0)
  /** Hysteresis: keyboard “open” vs closed so we do not thrash setState on small gap changes. */
  const keyboardLikelyOpenRef = useRef(false)
  const [keyboardCompact, setKeyboardCompact] = useState(false)
  /** Resolved once per chat open — background polls must not re-fetch /profile. */
  const chatMetaResolvedRef = useRef(false)
  const fetchMessagesRef = useRef<((showLoading?: boolean) => Promise<void>) | null>(null)
  /** After initial fetch (with loading spinner), do not snap to bottom — user reads from the top. */
  const suppressNextScrollAfterLoad = useRef(false)



  const chatId = params.chatId as string

  // Ensure this chat appears in the Messages list page
  const persistChatId = (id: string) => {
    try {
      const raw = localStorage.getItem("userChats")
      const arr: string[] = raw ? JSON.parse(raw) : []
      if (!arr.includes(id)) {
        arr.push(id)
        localStorage.setItem("userChats", JSON.stringify(arr))
      }
    } catch {}
  }

  useEffect(() => {
    if (!userId) {
      router.push('/signin');
      return;
    }

    if (!chatId) {
      router.push('/messages');
      return;
    }

    lastMessagesStableKeyRef.current = "";
    chatMetaResolvedRef.current = false;

    // Fix user.id if it's undefined
    if (userId && (!user?.id || user.id === undefined)) {
      const updatedUser = { ...user, id: userId, name: user?.name || "User" };
      useStore.setState({ user: updatedUser });
    }
    fetchMessages();
    // Persist immediately so the list can show this convo even before messages load
    if (chatId) persistChatId(chatId)
  }, [chatId, userId, router]);

  useEffect(() => {
    if (loading) return
    if (suppressNextScrollAfterLoad.current) {
      suppressNextScrollAfterLoad.current = false
      return
    }
    if (messages.length === 0) return
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" })
  }, [messages, loading]);

  // Refetch when user returns to tab or window (immediate catch-up)
  useEffect(() => {
    if (!userId || !chatId) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void fetchMessagesRef.current?.(false);
    };
    const onFocus = () => {
      if (document.visibilityState === "visible") void fetchMessagesRef.current?.(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("focus", onFocus);
    };
  }, [userId, chatId]);

  /** Poll while chat is open so received messages appear without manual refresh. */
  useEffect(() => {
    if (!userId || !chatId || loading) return;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void fetchMessagesRef.current?.(false);
    };
    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, [userId, chatId, loading]);

  /** Pin chat UI to Visual Viewport (iOS / WebView) so the composer stays above the keyboard. */
  const chatShellReady = !loading && !!userId;
  useLayoutEffect(() => {
    if (!chatShellReady) return;
    const shell = chatShellRef.current;
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!shell || !vv) return;

    const apply = () => {
      const el = chatShellRef.current;
      if (!el) return;
      const h = vv.height;
      const top = vv.offsetTop;
      const left = vv.offsetLeft;
      const w = vv.width;
      el.style.position = "fixed";
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.maxHeight = `${h}px`;
      el.style.right = "auto";
      el.style.bottom = "auto";

      const gap = Math.max(0, window.innerHeight - h - top);
      let open = keyboardLikelyOpenRef.current;
      if (!open && gap > 88) open = true;
      if (open && gap < 28) open = false;
      if (open !== keyboardLikelyOpenRef.current) {
        keyboardLikelyOpenRef.current = open;
        setKeyboardCompact(open);
      }
    };

    const schedule = () => {
      cancelAnimationFrame(visualViewportRafRef.current);
      visualViewportRafRef.current = requestAnimationFrame(apply);
    };

    schedule();
    vv.addEventListener("resize", schedule);
    vv.addEventListener("scroll", schedule);
    return () => {
      cancelAnimationFrame(visualViewportRafRef.current);
      vv.removeEventListener("resize", schedule);
      vv.removeEventListener("scroll", schedule);
      const el = chatShellRef.current;
      if (el) {
        el.style.position = "";
        el.style.top = "";
        el.style.left = "";
        el.style.width = "";
        el.style.height = "";
        el.style.maxHeight = "";
        el.style.right = "";
        el.style.bottom = "";
      }
      keyboardLikelyOpenRef.current = false;
      setKeyboardCompact(false);
    };
  }, [chatShellReady, chatId]);

  const fetchUserInfo = async (uid: string): Promise<string | null> => {
    try {
      if (!uid || uid === "undefined" || uid === "unknown") return null;
      const response = await axiosInstance.get(`/profile?user_id=${uid}`);
      const root = response.data as Record<string, unknown> | undefined;
      if (root?.status_code != null && Number(root.status_code) !== 200) return null;
      const payload = (root?.data ?? root) as Record<string, unknown> | undefined;
      if (!payload || typeof payload !== "object") return null;
      const name =
        (typeof payload.name === "string" && payload.name.trim()) ||
        (typeof payload.user_fullname === "string" && payload.user_fullname.trim()) ||
        (typeof payload.full_name === "string" && payload.full_name.trim()) ||
        "";
      return name || null;
    } catch {
      return null;
    }
  };

  /** Replace "User xyz", Unknown, or missing names with /profile display name when possible */
  const resolveDisplayName = async (oid: string, tentative: string): Promise<string> => {
    const t = (tentative || "").trim();
    const looksPlaceholder =
      !t ||
      t === "Unknown User" ||
      t === "unknown" ||
      t === oid ||
      /^User\s+/i.test(t);
    if (!looksPlaceholder) return t;
    const fromApi = await fetchUserInfo(oid);
    if (fromApi) return fromApi;
    return t || "Unknown User";
  };

  const fetchMessages = async (showLoading = true) => {
    const getMessagesOnce = () =>
      axiosInstance.get(`/get-messages/${encodeURIComponent(chatId)}`, {
        params: userId ? { user_id: String(userId) } : undefined,
      });

    try {
      if (showLoading) setLoading(true);
      let response;
      try {
        response = await getMessagesOnce();
      } catch (firstErr) {
        if (!showLoading) throw firstErr;
        await new Promise((r) => setTimeout(r, 250));
        response = await getMessagesOnce();
      }

      let fetchedMessages: Message[] = [];
      if (Array.isArray(response.data)) {
        fetchedMessages = response.data as Message[];
      }

      const body = response.data as Record<string, unknown> | undefined;
      const sc = body?.status_code;
      const okGet =
        Number(sc) === 200 ||
        sc === "200" ||
        sc === 200 ||
        (response.status === 200 &&
          body != null &&
          !Array.isArray(body) &&
          (typeof body.reason !== "string" || !String(body.reason).trim()));

      // Handle different API response formats
      if (fetchedMessages.length === 0 && okGet && body?.data != null && typeof body.data === "object") {
        const data = body.data as Record<string, unknown>;
        if (Array.isArray(data.messages)) fetchedMessages = data.messages as Message[];
      }
      if (fetchedMessages.length === 0 && body && !Array.isArray(body) && body.messages && Array.isArray(body.messages)) {
        fetchedMessages = body.messages as Message[];
      }
      if (fetchedMessages.length === 0 && body?.data != null && typeof body.data === "object") {
        const data = body.data as Record<string, unknown>;
        if (Array.isArray(data)) fetchedMessages = data as unknown as Message[];
      }

      const sorted = [...fetchedMessages].sort(compareMessagesByTime);
      const nextStableKey = messagesListStableKey(sorted);
      if (!showLoading && nextStableKey === lastMessagesStableKeyRef.current) {
        return;
      }
      lastMessagesStableKeyRef.current = nextStableKey;
      setMessages(sorted);

      const shouldResolveMeta = showLoading || !chatMetaResolvedRef.current;
      if (!shouldResolveMeta) {
        return;
      }

      // Determine other user info (once per chat — not on every 2s poll)
      if (fetchedMessages.length > 0) {
        const firstMessage = fetchedMessages[0];
        
        const currentUserId = userId;
        
        // Handle different API response formats
        let otherUserId;
        let otherUserName;
        
        // Smart auto-detection: Find the OTHER user from messages
        // Look through all messages to find the other user
        let foundOtherUser = false;
        
        for (const msg of fetchedMessages) {
          if (msg.userrefid && msg.username && msg.userrefid !== currentUserId) {
            otherUserId = msg.userrefid;
            otherUserName = msg.username;
            foundOtherUser = true;
            console.log('🔍 Found other user from new API format:', { otherUserId, otherUserName });
            break;
          } else if (msg.sender_id && msg.receiver_id) {
            if (msg.sender_id !== currentUserId) {
              otherUserId = msg.sender_id;
              otherUserName = msg.sender_name || "Unknown User";
              foundOtherUser = true;
              break;
            } else if (msg.receiver_id !== currentUserId) {
              otherUserId = msg.receiver_id;
              otherUserName = msg.receiver_name || "Unknown User";
              foundOtherUser = true;
              console.log('🔍 Found other user from receiver:', { otherUserId, otherUserName });
              break;
            }
          }
        }
        
        if (!foundOtherUser) {
          // Fallback: try to parse from chatId
          const chatIdParts = chatId.split('_');
          const possibleOtherUserId = chatIdParts.find(part => 
            part !== userId && part !== "undefined" && part !== "unknown"
          );
          
          if (possibleOtherUserId && possibleOtherUserId !== userId) {
            otherUserId = possibleOtherUserId;
            otherUserName = `User ${possibleOtherUserId}`;
          } else {
            otherUserId = "unknown";
            otherUserName = "Unknown User";
          }
        }
        
        // Validate otherUserId before proceeding
        if (!otherUserId || otherUserId === "undefined" || otherUserId === "unknown") {
          console.log('⚠️ Invalid otherUserId from message:', otherUserId);
          setOtherUserName("Unknown User");
          setChatInfo({
            chatId,
            otherUser: {
              id: "unknown",
              name: "Unknown User",
            }
          });
          return;
        }
        
        // CRITICAL FIX: Ensure otherUserId is NOT the current user
        if (otherUserId === currentUserId) {
          // Try to find the actual other user from the message
          if (firstMessage.receiver_id !== currentUserId) {
            otherUserId = firstMessage.receiver_id;
          } else if (firstMessage.sender_id !== currentUserId) {
            otherUserId = firstMessage.sender_id;
          }
        }
        
        otherUserName = await resolveDisplayName(otherUserId, otherUserName);

        // Query hint from /messages/new?receiverName=… (listing / task flows)
        const nameHint = searchParams?.get("receiverName")?.trim();
        if (
          nameHint &&
          nameHint !== "User" &&
          (/^User\s+/i.test(otherUserName) ||
            otherUserName === "Unknown User" ||
            !otherUserName.trim())
        ) {
          otherUserName = nameHint;
        }

        if (!otherUserName?.trim() || otherUserName === "Unknown User") {
          otherUserName =
            otherUserId && otherUserId !== "unknown" ? `User ${otherUserId}` : "Unknown User";
        }
        
        setOtherUserName(otherUserName);
        setChatInfo({
          chatId,
          otherUser: {
            id: otherUserId,
            name: otherUserName,
          }
        });
        // Persist chat id for list page
        persistChatId(chatId)
        chatMetaResolvedRef.current = true;
        
        console.log('✅ Final other user info:', {
          id: otherUserId,
          name: otherUserName
        });
      } else {
        console.log('⚠️ No messages found, trying to get user info from chat ID...');
        console.log('🔍 Chat ID format:', chatId);
        console.log('🔍 Current userId:', userId);
        
        // For new chats, try to extract user ID from chat ID and fetch profile
        // Chat ID format might be something like "user1_user2" or similar
        const chatIdParts = chatId.split('_');
        console.log('🔍 Chat ID parts:', chatIdParts);
        
        if (chatIdParts.length >= 2) {
          const possibleOtherUserId = chatIdParts.find(part => part !== userId && part !== "undefined" && part !== "unknown");
          if (possibleOtherUserId && possibleOtherUserId !== userId) {
            const fetchedName = await fetchUserInfo(possibleOtherUserId);
            if (fetchedName) {
              setOtherUserName(fetchedName);
              setChatInfo({
                chatId,
                otherUser: {
                  id: possibleOtherUserId,
                  name: fetchedName,
                }
              });
              // Persist chat id for list page
              persistChatId(chatId)
              chatMetaResolvedRef.current = true;
              return;
            }
          }
        }
        
        if (chatId && chatId !== userId && chatId !== "undefined" && chatId !== "unknown") {
          if (chatId === userId) {
            return;
          }
          
          const fetchedName = await fetchUserInfo(chatId);
          if (fetchedName) {
            setOtherUserName(fetchedName);
            setChatInfo({
              chatId,
              otherUser: {
                id: chatId,
                name: fetchedName,
              }
            });
            console.log('✅ Got user name from direct chat ID:', fetchedName);
            // Persist chat id for list page
            persistChatId(chatId)
            chatMetaResolvedRef.current = true;
            return;
          }
        }
        
        setOtherUserName("Unknown User");
        setChatInfo({
          chatId,
          otherUser: {
            id: "unknown",
            name: "Unknown User",
          }
        });
      }
    } catch (error: any) {
      const status = error.response?.status;
      const reason =
        (error.response?.data as { reason?: string } | undefined)?.reason ||
        error.response?.data?.message ||
        (typeof error.message === "string" ? error.message : undefined);
      if (showLoading) {
        const hint = status ? ` (HTTP ${status})` : "";
        toast.error((reason || "Failed to load messages") + hint);
        setOtherUserName("Unknown User");
        setChatInfo({
          chatId,
          otherUser: {
            id: "unknown",
            name: "Unknown User",
          },
        });
      } else {
        // Background poll: do not toast (would fire every few seconds) or wipe chat state
        console.warn("[chat] get-messages poll failed:", reason || error?.message || error);
      }
    } finally {
      if (showLoading) {
        setLoading(false)
        suppressNextScrollAfterLoad.current = true
      }
    }
  };

  fetchMessagesRef.current = fetchMessages;

  const sendMessage = async () => {
    if (!message.trim() || !chatInfo || sendInFlightRef.current) return;

    if (!chatInfo.otherUser.id || chatInfo.otherUser.id === "unknown" || chatInfo.otherUser.id === "undefined") {
      toast.error("Cannot send message: Other user information not available");
      return;
    }

    const currentUserId = userId;
    if (chatInfo.otherUser.id === currentUserId) {
      toast.error("Cannot send message: Invalid recipient configuration");
      return;
    }

    const text = message.trim();
    const tempId = `pending-${Date.now()}`;
    const sid = String(currentUserId ?? "");
    const rid = String(chatInfo.otherUser.id ?? "");
    const displayName = (user?.name || "You").trim() || "You";
    const optimistic: Message = {
      id: tempId,
      messagesid: tempId,
      description: text,
      tstamp: new Date().toISOString(),
      sender_id: sid,
      receiver_id: rid,
      sender_name: displayName,
      receiver_name: chatInfo.otherUser.name || "Unknown User",
      userrefid: sid,
      username: displayName,
      is_read: false,
    };

    setMessages((prev) => {
      const next = [...prev, optimistic].sort(compareMessagesByTime);
      lastMessagesStableKeyRef.current = messagesListStableKey(next);
      return next;
    });
    setMessage("");
    sendInFlightRef.current = true;

    try {
      const response = await axiosInstance.post(
        "/send-message/",
        {
          chat_id: chatId,
          sender_id: currentUserId,
          receiver_id: chatInfo.otherUser.id,
          description: text,
        },
        { timeout: 20_000 },
      );

      const body = response.data as LooseSendPayload;
      if (isSendMessageSuccess(response)) {
        const mid = extractSentMessageId(body);
        const serverTs = extractSentMessageTimestamp(body) ?? optimistic.tstamp;

        setMessages((prev) => {
          const next = prev
            .map((m) =>
              m.id === tempId
                ? {
                    ...m,
                    id: mid,
                    messagesid: mid,
                    tstamp: serverTs,
                    timestamp: serverTs,
                    created_at: serverTs,
                  }
                : m,
            )
            .sort(compareMessagesByTime);
          lastMessagesStableKeyRef.current = messagesListStableKey(next);
          return next;
        });

        void axiosInstance
          .put(`/mark-as-read/${encodeURIComponent(mid)}`, undefined, {
            params: userId ? { user_id: userId } : undefined,
            timeout: 8_000,
          })
          .catch(() => {});
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const reason =
          (typeof body?.reason === "string" && body.reason) ||
          (typeof body?.message === "string" && body.message) ||
          "Failed to send message";
        toast.error(reason);
      }
    } catch (error: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      const data = (error as { response?: { data?: { reason?: string; message?: string } } })?.response?.data;
      toast.error(data?.reason || data?.message || "Failed to send message");
    } finally {
      sendInFlightRef.current = false;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('bids');
    localStorage.removeItem('userChats');
    logout();
    router.push('/');
  };

  const listingTitleParam = (searchParams?.get("listing_title") || "").trim()
  const taskTitleParam = (searchParams?.get("task_title") || chatInfo?.task?.title || "").trim()
  const taskIdParam = (searchParams?.get("task_id") || chatInfo?.task?.id || "").trim()

  const inferredTopic = useMemo(() => {
    const first = messages[0]?.description
    return first ? inferTopicFromMessageText(String(first)) : ""
  }, [messages])

  const conversationTopic = listingTitleParam || taskTitleParam || inferredTopic
  const topicBadge: "listing" | "task" | "topic" | null = listingTitleParam
    ? "listing"
    : taskTitleParam
      ? "task"
      : inferredTopic
        ? "topic"
        : null

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-slate-200 border-t-blue-500 animate-spin" style={{ animationDuration: "0.85s" }} />
          <span className="text-sm text-slate-500 font-medium">Loading chat...</span>
        </div>
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
    <div
      ref={chatShellRef}
      className="fixed left-0 top-0 z-40 flex min-h-0 w-full min-w-0 flex-col overflow-hidden overscroll-none bg-[#f4f7fb] touch-manipulation md:z-50"
      style={{ height: "100dvh", maxHeight: "100dvh", width: "100%" }}
    >
      <Toaster position="top-right" />
      
      {/* Chat Header — topic first (listing / task), then participant */}
      <header className="flex-shrink-0 border-b border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-2 px-4 py-2.5 md:py-3">
          <div className="flex items-start gap-2">
            <button
            onClick={() => {
              // Check if we came from a task page
              const backTaskId = taskIdParam || ""
              if (backTaskId) {
                router.push(`/tasks/${backTaskId}`)
                return
              }
              
              // Check if we have a return path in sessionStorage
              try {
                const returnPath = sessionStorage.getItem('chatReturnPath')
                if (returnPath) {
                  sessionStorage.removeItem('chatReturnPath')
                  router.push(returnPath)
                  return
                }
              } catch {}
              
              // Default: go back in history (smart back navigation)
              try { sessionStorage.setItem('messagesReturnFromChat', '1') } catch {}
              if (window.history.length > 1) {
                router.back()
              } else {
                // Fallback: go to messages list
                router.push('/messages')
              }
            }}
            className="mt-0.5 shrink-0 rounded-xl p-2.5 -ml-1 hover:bg-slate-100 active:bg-slate-200 touch-manipulation"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>

            <div className="min-w-0 flex-1 space-y-1.5">
              {conversationTopic ? (
                <div className="min-w-0">
                  <div className="mb-0.5 flex flex-wrap items-center gap-1.5">
                    {topicBadge === "listing" ? (
                      <span className="shrink-0 rounded-md bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-800">
                        Listing
                      </span>
                    ) : topicBadge === "task" ? (
                      <span className="shrink-0 rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-800">
                        Task
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                        Topic
                      </span>
                    )}
                    {taskIdParam && topicBadge !== "listing" ? (
                      <Link
                        href={`/tasks/${taskIdParam}`}
                        className="line-clamp-2 text-left text-[13px] font-semibold leading-snug text-slate-800 hover:text-indigo-600 md:text-sm"
                      >
                        {conversationTopic}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-slate-800 md:text-sm">
                        {conversationTopic}
                      </p>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-base font-semibold text-white shadow-md ring-2 ring-white md:h-11 md:w-11 md:text-lg">
                    {otherUserName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[15px] font-semibold text-slate-900 md:text-base">
                    {otherUserName || chatInfo?.otherUser?.name || "Unknown User"}
                  </h2>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">Direct message</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <ScrollArea className="min-h-0 flex-1 bg-gradient-to-b from-slate-100/90 to-[#eef2f7] overscroll-y-contain">
        <div
          className={`mx-auto max-w-3xl space-y-2.5 px-3 py-3 sm:space-y-3 sm:px-4 sm:py-4 ${
            keyboardCompact ? "pb-3 sm:pb-4" : "pb-8 sm:pb-10"
          }`}
        >
          
          {messages.length === 0 && (
            <div className="text-center py-16 space-y-5">
              <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center bg-gradient-to-br from-indigo-100 to-violet-100 shadow-inner">
                <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <p className="text-slate-700 text-lg font-semibold">Start your conversation</p>
                <p className="text-slate-500 text-sm mt-1">Send a message to begin chatting</p>
              </div>
            </div>
          )}
          
          {messages.length > 0 && (
            messages.map((msg, index) => {
            const currentUserId = userId;
            const ms = parseMessageToMs(getMessageTimeRaw(msg));
            const prevMs =
              index > 0 ? parseMessageToMs(getMessageTimeRaw(messages[index - 1])) : null;
            const showDateSeparator =
              ms != null && (prevMs == null || !sameCalendarDayMs(ms, prevMs));
            
            // Handle different message formats
            let isOwnMessage = false;
            let senderName = "Unknown User";
            
            if (msg.userrefid != null && String(msg.userrefid).trim() !== "" && msg.username) {
              isOwnMessage = sameChatUserId(msg.userrefid, currentUserId)
              senderName = msg.username
            } else if (msg.sender_id != null && String(msg.sender_id).trim() !== "") {
              isOwnMessage = sameChatUserId(msg.sender_id, currentUserId)
              senderName = msg.sender_name || "Unknown User"
            }
            
            return (
              <Fragment key={msg.id || msg.messagesid || `msg-${index}`}>
                {showDateSeparator && ms != null ? (
                  <div className="flex justify-center py-2 sm:py-2.5">
                    <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200/80">
                      {formatChatDateSeparator(ms)}
                    </span>
                  </div>
                ) : null}
              <div
                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} items-end gap-1.5 sm:gap-2`}
              >
                {!isOwnMessage && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-medium text-white shadow-sm sm:h-8 sm:w-8 sm:text-sm">
                    {senderName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div className={`max-w-[85%] sm:max-w-[72%] ${isOwnMessage ? "order-1" : "order-2"}`}>
                  <div
                    className={`rounded-2xl px-3.5 py-2 sm:px-4 sm:py-2.5 ${
                      isOwnMessage
                        ? "bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md"
                        : "border border-slate-200/90 bg-white text-slate-800 shadow-sm"
                    }`}
                  >
                    <p className="text-[15px] leading-snug">{msg.description}</p>
                  </div>
                  <p className={`mt-0.5 text-[10px] text-slate-400 sm:text-[11px] ${isOwnMessage ? "mr-0.5 text-right" : "ml-0.5"}`}>
                    {ms != null ? formatChatBubbleTime(ms) : "—"}
                  </p>
                </div>
              </div>
              </Fragment>
            );
          })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Composer: safe-area + compact mode when keyboard visible (visualViewport). */}
      <div
        className={`flex-shrink-0 border-t border-slate-200/80 bg-white/95 shadow-[0_-4px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm ${
          keyboardCompact
            ? "pb-[max(0.375rem,calc(6px+env(safe-area-inset-bottom,0px)))]"
            : "pb-[max(1.25rem,calc(12px+env(safe-area-inset-bottom,0px)))]"
        }`}
      >
        <div className={`mx-auto max-w-3xl px-3 sm:px-4 ${keyboardCompact ? "pt-1.5" : "pt-2"}`}>
          {!keyboardCompact && (
            <>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">Suggestions</p>
              <div className="-mx-1 mb-2 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {QUICK_REPLY_SUGGESTIONS.map((line) => (
                  <button
                    key={line}
                    type="button"
                    onClick={() => {
                      setMessage(line);
                      inputRef.current?.focus({ preventScroll: true });
                    }}
                    className="shrink-0 rounded-full border border-slate-200/90 bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/80 active:scale-[0.98]"
                  >
                    {line}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className={`flex items-end gap-2 ${keyboardCompact ? "pb-1" : "pb-2"}`}>
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              ref={inputRef}
              inputMode="text"
              autoComplete="off"
              autoCorrect="on"
              className="min-h-[48px] flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
              style={{ fontSize: "16px" }}
              enterKeyHint="send"
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md transition hover:from-indigo-600 hover:to-violet-700 active:scale-95 disabled:opacity-50 touch-manipulation"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
