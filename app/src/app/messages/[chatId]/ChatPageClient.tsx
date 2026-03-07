"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ArrowLeft } from "lucide-react"
import { toast, Toaster } from "sonner"
import axiosInstance from "@/lib/axiosInstance"
import useStore from "@/lib/Zustand"


interface Message {
  id: string;
  messagesid?: string;
  description: string;
  tstamp: string;
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

export default function ChatPageClient() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { userId, user, logout } = useStore()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [otherUserName, setOtherUserName] = useState("")
  const inputRef = useRef<HTMLInputElement | null>(null)



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
    scrollToBottom();
  }, [messages]);

  // Refetch when user returns to tab (no auto-refresh interval)
  useEffect(() => {
    if (!userId || !chatId) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchMessages(false);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [userId, chatId]);

  const fetchUserInfo = async (userId: string) => {
    try {
      if (!userId || userId === "undefined" || userId === "unknown") return null;
      const response = await axiosInstance.get(`/profile?user_id=${userId}`);
      if (response.data && response.data.name) return response.data.name;
    } catch {
      // Ignore profile fetch errors
    }
    return null;
  };

  const fetchMessages = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await axiosInstance.get(`/get-messages/${chatId}`);
      
      // Handle different API response formats
      let fetchedMessages = [];
      if (response.data.status_code === 200 && response.data.data?.messages) {
        fetchedMessages = response.data.data.messages;
      } else if (response.data.messages) {
        fetchedMessages = response.data.messages;
      } else if (Array.isArray(response.data)) {
        fetchedMessages = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        fetchedMessages = response.data.data;
      }
      
      setMessages(fetchedMessages);
      
      // Determine other user info
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
        
        // If we don't have a proper name, try to fetch it from the profile API
        if (!otherUserName || otherUserName === "Unknown User" || otherUserName === "unknown") {
          const fetchedName = await fetchUserInfo(otherUserId);
          if (fetchedName) {
            otherUserName = fetchedName;
          }
        }
        
        // Final fallback - create a name from user ID
        if (!otherUserName || otherUserName === "Unknown User" || otherUserName === "unknown") {
          if (otherUserId && otherUserId !== "unknown") {
            otherUserName = otherUserId.length > 3 
              ? otherUserId.charAt(0).toUpperCase() + otherUserId.slice(1)
              : "User " + otherUserId;
          } else {
            otherUserName = "Unknown User";
          }
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
      toast.error(error.response?.data?.message || 'Failed to load messages');
      setOtherUserName("Unknown User");
      setChatInfo({
        chatId,
        otherUser: {
          id: "unknown",
          name: "Unknown User",
        }
      });
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !chatInfo) return;

    // Check if we have a valid receiver ID
    if (!chatInfo.otherUser.id || chatInfo.otherUser.id === "unknown" || chatInfo.otherUser.id === "undefined") {
      toast.error("Cannot send message: Other user information not available");
      return;
    }

    try {
      setSending(true);
      // Use the userId from store since user.id is undefined
      const currentUserId = userId;
      
      console.log('🔍 ChatInfo object:', chatInfo);
      console.log('🔍 Sending message with data:', {
        chat_id: chatId,
        sender_id: currentUserId,
        receiver_id: chatInfo.otherUser.id,
        description: message.trim(),
      });
      
      // Log the full URL being called
      console.log('🔍 Full API URL:', `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/send-message/`);
      if (chatInfo.otherUser.id === currentUserId) {
        toast.error('Cannot send message: Invalid recipient configuration');
        return;
      }
      
      // Try different possible endpoints for sending messages
      let response;
      try {
        // First try the original endpoint
        response = await axiosInstance.post('/send-message/', {
          chat_id: chatId,
          sender_id: currentUserId,
          receiver_id: chatInfo.otherUser.id,
          description: message.trim(),
        });
      } catch (error: any) {
        if (error.response?.status === 404) {
          try {
            response = await axiosInstance.post('/create-message/', {
              chat_id: chatId,
              sender_id: currentUserId,
              receiver_id: chatInfo.otherUser.id,
              description: message.trim(),
            });
          } catch (secondError: any) {
            if (secondError.response?.status === 404) {
              try {
                response = await axiosInstance.post('/add-message/', {
                  chat_id: chatId,
                  sender_id: currentUserId,
                  receiver_id: chatInfo.otherUser.id,
                  description: message.trim(),
                });
              } catch (thirdError: any) {
                response = await axiosInstance.post('/message/', {
                  chat_id: chatId,
                  sender_id: currentUserId,
                  receiver_id: chatInfo.otherUser.id,
                  description: message.trim(),
                });
              }
            } else {
              throw secondError;
            }
          }
        } else {
          throw error;
        }
      }

      if (response.data.status_code === 200) {
        const newMessage: Message = {
          id: response.data.data.message_id || Date.now().toString(),
          description: message.trim(),
          tstamp: new Date().toISOString(),
          sender_id: userId || "",
          receiver_id: chatInfo?.otherUser?.id || "",
          sender_name: "You",
          receiver_name: chatInfo?.otherUser?.name || "Unknown User",
          is_read: false,
        };

        setMessages(prev => [...prev, newMessage]);
        setMessage("");
        
        // Mark message as read
        try {
          await axiosInstance.put(`/mark-as-read/${newMessage.id}`);
        } catch {
          // Ignore
        }
      }
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to send message');
      } finally {
        setSending(false);
      }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  // optional context from URL
  const taskTitle = searchParams?.get('task_title') || chatInfo?.task?.title || ''
  const taskId = searchParams?.get('task_id') || chatInfo?.task?.id || ''

  return (
    <div className="flex flex-col bg-[#f8fafc] overflow-hidden h-[calc(100dvh-env(safe-area-inset-bottom)-72px)] md:h-screen md:fixed md:inset-0 md:z-50">
      <Toaster position="top-right" />
      
      {/* Chat Header */}
      <header className="bg-white border-b border-slate-200/80 flex-shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="flex h-14 md:h-16 items-center px-4 gap-3">
          <button
            onClick={() => {
              // Check if we came from a task page
              const backTaskId = searchParams?.get('task_id') || chatInfo?.task?.id || ''
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
            className="p-2.5 -ml-1 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors touch-manipulation flex-shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md bg-gradient-to-br from-indigo-500 to-violet-600 ring-2 ring-white">
                {otherUserName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-slate-900 text-base truncate">
                {otherUserName || chatInfo?.otherUser?.name || "Unknown User"}
              </h2>
              {taskTitle ? (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 truncate mt-0.5">
                  <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium">Task</span>
                  <Link href={taskId ? `/tasks/${taskId}` : '#'} className="text-slate-600 hover:text-indigo-600 truncate">
                    {taskTitle}
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium mt-0.5">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  Active now
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 min-h-0 bg-[#f1f5f9]/50">
        <div className="px-4 py-4 space-y-3 h-full max-w-3xl mx-auto" style={{ paddingBottom: '140px' }}>
          
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
            
            // Handle different message formats
            let isOwnMessage = false;
            let senderName = "Unknown User";
            
            if (msg.userrefid && msg.username) {
              // New API format
              isOwnMessage = msg.userrefid === currentUserId;
              senderName = msg.username;
            } else if (msg.sender_id) {
              // Old API format
              isOwnMessage = msg.sender_id === currentUserId;
              senderName = msg.sender_name || "Unknown User";
            }
            
            return (
              <div
                key={msg.id || msg.messagesid || `msg-${index}`}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end gap-2`}
              >
                {!isOwnMessage && (
                  <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 shadow">
                    {senderName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div className={`max-w-[80%] sm:max-w-[70%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md'
                        : 'bg-white text-slate-800 border border-slate-200/80 shadow-sm'
                    }`}
                  >
                    <p className="text-[15px] leading-snug">{msg.description}</p>
                  </div>
                  <p className={`text-[11px] text-slate-400 mt-1 ${isOwnMessage ? 'text-right mr-1' : 'ml-1'}`}>
                    {new Date(msg.tstamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
              </div>
            );
          })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="bg-white border-t border-slate-200/80 p-3 flex-shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              onFocus={() => {
                setTimeout(() => {
                  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }, 100);
              }}
              ref={inputRef}
              className="flex-1 px-4 py-3 border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl bg-slate-50 focus:bg-white text-base transition-all outline-none"
              style={{ fontSize: '16px' }}
              disabled={sending}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || sending}
              className="p-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white rounded-xl disabled:opacity-50 shadow-md hover:shadow-lg transition-all active:scale-95 touch-manipulation flex-shrink-0"
              aria-label="Send message"
            >
              {sending ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
