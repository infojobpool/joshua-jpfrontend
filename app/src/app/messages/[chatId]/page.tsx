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

export default function ChatPage() {
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

    // Debug localStorage data
    console.log('🔍 DEBUGGING USER DATA:');
    console.log('🔍 Store userId:', userId);
    console.log('🔍 Store user object:', user);
    console.log('🔍 localStorage user:', localStorage.getItem('user'));
    console.log('🔍 localStorage token:', localStorage.getItem('token'));
    
    // Fix user.id if it's undefined
    if (userId && (!user?.id || user.id === undefined)) {
      console.log('🔧 Fixing user.id - setting it to userId');
      const updatedUser = { ...user, id: userId, name: user?.name || "User" };
      useStore.setState({ user: updatedUser });
      console.log('🔧 Updated user object:', updatedUser);
    }
    
    // Skip the problematic get-chat-id call for now
    console.log('🔍 Chat ID:', chatId);
    fetchMessages();
    // Persist immediately so the list can show this convo even before messages load
    if (chatId) persistChatId(chatId)
  }, [chatId, userId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh messages every 10 seconds for real-time updates
  useEffect(() => {
    if (!userId || !chatId) return;
    
    const interval = setInterval(() => {
      fetchMessages();
           }, 20000); // Refresh every 20 seconds

    return () => clearInterval(interval);
  }, [userId, chatId]);

  const fetchUserInfo = async (userId: string) => {
    try {
      if (!userId || userId === "undefined" || userId === "unknown") {
        console.log('⚠️ Invalid userId for profile fetch:', userId);
        return null;
      }
      
      console.log('🔄 Fetching user info for:', userId);
      const response = await axiosInstance.get(`/profile?user_id=${userId}`);
      console.log('👤 User profile response:', response.data);
      
      if (response.data && response.data.name) {
        console.log('✅ Got user name from profile:', response.data.name);
        return response.data.name;
      }
    } catch (error) {
      console.log('⚠️ Could not fetch user profile for:', userId, error);
    }
    return null;
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching messages for chatId:', chatId);
      console.log('🔍 Current userId:', userId);
      
      const response = await axiosInstance.get(`/get-messages/${chatId}`);
      console.log('🔍 API Response:', response.data);
      console.log('🔍 Response structure:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        statusCode: response.data?.status_code,
        hasMessages: !!response.data?.data?.messages,
        messageCount: response.data?.data?.messages?.length || 0
      });
      
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
      
      console.log('🔍 Extracted messages:', fetchedMessages);
      setMessages(fetchedMessages);
      
      // Determine other user info
      if (fetchedMessages.length > 0) {
        const firstMessage = fetchedMessages[0];
        console.log('🔍 First message:', firstMessage);
        
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
              console.log('🔍 Found other user from sender:', { otherUserId, otherUserName });
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
          console.log('⚠️ Could not find other user from messages, using chatId parsing');
          // Fallback: try to parse from chatId
          const chatIdParts = chatId.split('_');
          const possibleOtherUserId = chatIdParts.find(part => 
            part !== userId && part !== "undefined" && part !== "unknown"
          );
          
          if (possibleOtherUserId && possibleOtherUserId !== userId) {
            otherUserId = possibleOtherUserId;
            otherUserName = `User ${possibleOtherUserId}`;
            console.log('🔍 Using chatId parsing:', { otherUserId, otherUserName });
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
          console.log('⚠️ otherUserId is same as currentUserId, this is wrong!');
          console.log('🔍 Current user:', currentUserId);
          console.log('🔍 Other user:', otherUserId);
          console.log('🔍 First message:', firstMessage);
          
          // Try to find the actual other user from the message
          if (firstMessage.receiver_id !== currentUserId) {
            otherUserId = firstMessage.receiver_id;
          } else if (firstMessage.sender_id !== currentUserId) {
            otherUserId = firstMessage.sender_id;
          }
          
          console.log('🔍 Corrected otherUserId:', otherUserId);
        }
        
        console.log('🔍 Other user info from message:', { otherUserId, otherUserName });
        
        // If we don't have a proper name, try to fetch it from the profile API
        if (!otherUserName || otherUserName === "Unknown User" || otherUserName === "unknown") {
          console.log('🔄 Trying to fetch user info from profile API...');
          const fetchedName = await fetchUserInfo(otherUserId);
          if (fetchedName) {
            otherUserName = fetchedName;
            console.log('✅ Got user name from profile API:', fetchedName);
          }
        }
        
        // Final fallback - create a name from user ID
        if (!otherUserName || otherUserName === "Unknown User" || otherUserName === "unknown") {
          if (otherUserId && otherUserId !== "unknown") {
            otherUserName = otherUserId.length > 3 
              ? otherUserId.charAt(0).toUpperCase() + otherUserId.slice(1)
              : "User " + otherUserId;
            console.log('🔄 Generated name from user ID:', otherUserName);
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
          // Try to find the other user ID from chat ID parts
          const possibleOtherUserId = chatIdParts.find(part => part !== userId && part !== "undefined" && part !== "unknown");
          console.log('🔍 Possible other user ID:', possibleOtherUserId);
          
          if (possibleOtherUserId && possibleOtherUserId !== userId) {
            console.log('🔄 Trying to get user info from chat ID parts:', possibleOtherUserId);
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
              console.log('✅ Got user name from chat ID analysis:', fetchedName);
              // Persist chat id for list page
              persistChatId(chatId)
              return;
            }
          }
        }
        
        // Try alternative chat ID formats - maybe it's just a single user ID
        if (chatId && chatId !== userId && chatId !== "undefined" && chatId !== "unknown") {
          console.log('🔄 Trying chat ID as direct user ID:', chatId);
          
          // CRITICAL: Ensure we're not setting the current user as the other user
          if (chatId === userId) {
            console.log('⚠️ Chat ID is same as current user ID, skipping');
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
        
        // Fallback to unknown user
        console.log('⚠️ Could not determine other user, setting as unknown');
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
      console.error('❌ Error fetching messages:', error);
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
      setLoading(false);
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
      console.log('🔍 Request payload:', {
        chat_id: chatId,
        sender_id: currentUserId,
        receiver_id: chatInfo.otherUser.id,
        description: message.trim(),
      });
      
      // CRITICAL: Check if receiver_id is correct
      if (chatInfo.otherUser.id === currentUserId) {
        console.error('❌ CRITICAL ERROR: receiver_id is same as sender_id!');
        console.error('❌ This will cause messages to be sent to yourself!');
        toast.error('Cannot send message: Invalid recipient configuration');
        return;
      }
      console.log('🔍 User object from store:', user);
      console.log('🔍 Store userId:', userId);
      console.log('🔍 User.id:', user?.id);
      
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
          console.log('🔄 /send-message/ not found, trying /create-message/...');
          try {
            response = await axiosInstance.post('/create-message/', {
              chat_id: chatId,
              sender_id: currentUserId,
              receiver_id: chatInfo.otherUser.id,
              description: message.trim(),
            });
          } catch (secondError: any) {
            if (secondError.response?.status === 404) {
              console.log('🔄 /create-message/ not found, trying /add-message/...');
              try {
                response = await axiosInstance.post('/add-message/', {
                  chat_id: chatId,
                  sender_id: currentUserId,
                  receiver_id: chatInfo.otherUser.id,
                  description: message.trim(),
                });
              } catch (thirdError: any) {
                console.log('🔄 /add-message/ not found, trying /message/...');
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
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      }
          } catch (error: any) {
        console.error('❌ Error sending message:', error);
        console.error('❌ Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method
        });
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
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
            <div className="absolute inset-0 m-auto h-5 w-5 rounded-full bg-blue-600/10 animate-ping" />
          </div>
          <span className="text-sm text-muted-foreground animate-pulse">Loading chat...</span>
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
    <div className="flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden fixed inset-0 z-50">
      <Toaster position="top-right" />
      
      {/* Chat Header - Clean Mobile Design */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-gray-200/30 flex-shrink-0 shadow-sm">
        <div className="flex h-14 items-center px-4 gap-3">
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
              if (window.history.length > 1) {
                router.back()
              } else {
                // Fallback: go to messages list
                router.push('/messages')
              }
            }}
            className="p-2.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation flex-shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm">
                {otherUserName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-base truncate">
                {otherUserName || chatInfo?.otherUser?.name || "Unknown User"}
              </h2>
              {taskTitle ? (
                <div className="text-xs text-gray-600 flex items-center gap-1.5 truncate">
                  <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium text-xs">Task</span>
                  <Link href={taskId ? `/tasks/${taskId}` : '#'} className="hover:text-blue-700 truncate">
                    {taskTitle}
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  Active now
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area - Mobile Optimized */}
      <ScrollArea className="flex-1 bg-gradient-to-b from-slate-50 via-blue-50/20 to-white min-h-0">
        <div className="px-4 py-4 space-y-4 h-full max-w-4xl mx-auto" style={{ paddingBottom: '140px' }}>
          
          {messages.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-600 text-lg font-medium">Start your conversation</p>
              <p className="text-gray-400 text-sm">Send a message to begin chatting</p>
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
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} items-end gap-2 mb-4`}
              >
                {!isOwnMessage && (
                  <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {senderName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div className={`max-w-[75%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      isOwnMessage
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{msg.description}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 mt-1.5 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <p className="text-xs text-gray-500">
                      {new Date(msg.tstamp).toLocaleTimeString('en-US', { 
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Clean Message Input - Mobile Optimized */}
      <div 
        className="bg-white/95 backdrop-blur-xl border-t border-gray-200/30 p-3 flex-shrink-0 shadow-2xl fixed left-0 right-0"
        style={{
          bottom: 'calc(env(safe-area-inset-bottom) + 60px)', // Above bottom nav
          zIndex: 51, // Above bottom nav
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Type your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  setTimeout(() => {
                    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
                  }, 100)
                }}
                ref={inputRef}
                className="w-full px-4 py-3 border-2 border-gray-200/50 focus:border-blue-500 rounded-full bg-gray-50/60 focus:bg-white text-base font-medium shadow-sm transition-all duration-200"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
                disabled={sending}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!message.trim() || sending}
              className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full disabled:opacity-50 shadow-lg transition-all duration-200 active:scale-95 touch-manipulation flex-shrink-0"
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
