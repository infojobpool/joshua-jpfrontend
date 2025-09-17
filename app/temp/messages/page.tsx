"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MobileMessages } from "@/components/mobile/MobileMessages"
import { useIsMobile } from "@/components/mobile/MobileWrapper"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Paperclip, MoreVertical, Search, MessageSquare } from "lucide-react"
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
}

export default function MessagesPage() {
  const router = useRouter()
  const { userId, user, logout } = useStore()
  const { isMobile } = useIsMobile()
  const [loading, setLoading] = useState(true)
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [chats, setChats] = useState<ChatSummary[]>([])

  useEffect(() => {
    if (!userId) {
      router.push('/signin');
      return;
    }

    const fetchChats = async () => {
      try {
        setLoading(true);
        
        // Get chat IDs from localStorage
        let storedChats = localStorage.getItem("userChats");
        // Fallback: seed from notification items if empty
        if (!storedChats) {
          try {
            // read notifications from Zustand store without subscribing
            const notif = (useStore as any).getState?.()?.items || [];
            const chatIdsFromNotif: string[] = [];
            notif.forEach((n: any) => {
              if (n.type === "message" && typeof n.link === "string") {
                const match = n.link.match(/\/messages\/(.+)$/);
                if (match && match[1]) chatIdsFromNotif.push(match[1]);
              }
            });
            if (chatIdsFromNotif.length > 0) {
              localStorage.setItem("userChats", JSON.stringify(chatIdsFromNotif));
              storedChats = JSON.stringify(chatIdsFromNotif);
            }
          } catch {}
        }
        if (!storedChats) {
          setChats([]);
          setLoading(false);
          return;
        }

        const chatIds: string[] = JSON.parse(storedChats);
        const chatSummaries: ChatSummary[] = [];

        // Fetch details for each chat
        for (const chatId of chatIds) {
          try {
            console.log(`🔍 Fetching chat details for ${chatId}`);
            const response = await axiosInstance.get(`/get-messages/${chatId}`);
            console.log(`🔍 Chat ${chatId} response:`, response.data);
            
            if (response.data.status_code === 200 && response.data.data.messages) {
              const messages = response.data.data.messages;
              console.log(`🔍 Chat ${chatId} messages:`, messages);
              
              if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                console.log(`🔍 Chat ${chatId} last message:`, lastMessage);
                
                // Use the userId from store since user.id is undefined
                const currentUserId = userId;
                console.log('🔍 Messages list - Current user ID:', currentUserId);
                console.log('🔍 Messages list - Store userId:', userId);
                console.log('🔍 Messages list - User.id:', user?.id);
                
                const otherUserId = lastMessage.sender_id === currentUserId 
                  ? lastMessage.receiver_id 
                  : lastMessage.sender_id;
                const otherUserName = lastMessage.sender_id === currentUserId 
                  ? lastMessage.receiver_name 
                  : lastMessage.sender_name;

                console.log(`🔍 Chat ${chatId} other user:`, { otherUserId, otherUserName });

                chatSummaries.push({
                  chatid: chatId,
                  otherUserId,
                  otherUser: otherUserName || "Unknown User",
                  lastMessage: lastMessage.description || "No message",
                  lastMessageTime: lastMessage.tstamp,
                });
                
                console.log(`✅ Added chat summary for ${chatId}:`, {
                  otherUser: otherUserName || "Unknown User",
                  otherUserId,
                  lastMessage: lastMessage.description
                });
              } else {
                console.log(`⚠️ Chat ${chatId} has no messages`);
              }
            } else {
              console.log(`⚠️ Chat ${chatId} API error:`, response.data);
            }
          } catch (error) {
            console.error(`❌ Error fetching chat ${chatId}:`, error);
          }
        }

        // Sort chats by last message time (newest first)
        chatSummaries.sort((a, b) => {
          if (!a.lastMessageTime || !b.lastMessageTime) return 0;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

        console.log('📊 Final chat summaries:', chatSummaries);
        setChats(chatSummaries);
        
        // If no chats found, show a helpful message
        if (chatSummaries.length === 0) {
          console.log('ℹ️ No chats found, user might need to start conversations');
        }
      } catch (error: any) {
        console.error('❌ Error fetching chats:', error);
        toast.error(error.response?.data?.message || 'Failed to load chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [userId, router]);

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
          <span className="text-sm text-muted-foreground animate-pulse">Loading messages...</span>
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

  // Show mobile messages on mobile devices
  if (isMobile) {
    return <MobileMessages />;
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden fixed inset-0 z-50">
      <Toaster position="top-right" />
      
      {/* Ultra Premium Messages Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-gray-200/30 flex-shrink-0 shadow-lg">
        <div className="flex h-20 items-center px-8">
          <div className="flex items-center gap-5 flex-1">
            <div className="relative flex-shrink-0">
              <Avatar className="h-14 w-14 ring-4 ring-white/50 shadow-xl">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white font-bold text-xl">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-lg">
                <div className="w-full h-full bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gray-900 text-2xl tracking-tight">
                Your Messages
              </h1>
              <p className="text-sm text-emerald-600 flex items-center gap-2 font-semibold">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                {chats.length} conversation{chats.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Welcome back, <span className="font-semibold text-gray-700">{user?.name || "User"}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/browse')}
              className="p-3 hover:bg-blue-50 rounded-full transition-all duration-200 group"
            >
              <svg className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/dashboard')}
              className="p-3 hover:bg-blue-50 rounded-full transition-all duration-200 group"
            >
              <svg className="h-5 w-5 text-gray-600 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="p-3 hover:bg-red-50 rounded-full transition-all duration-200 group"
            >
              <svg className="h-5 w-5 text-gray-600 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-8 py-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 w-80 h-12 rounded-2xl border-2 border-gray-200/50 focus:border-blue-500 bg-white/80 backdrop-blur-sm shadow-lg text-base font-medium"
                  />
                </div>
              </div>
            </div>
          
            {chats.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <MessageSquare className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No messages yet</h3>
                <p className="text-gray-600 mb-8 text-lg">Start a conversation by messaging someone about a task</p>
                <Link href="/browse">
                  <Button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 text-lg font-semibold">
                    Browse Tasks
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {chats
                  .filter(chat => 
                    chat.otherUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((chat) => (
                  <div key={chat.chatid} className="group">
                    <Link href={`/messages/${chat.chatid}`}>
                      <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-6 hover:shadow-2xl transition-all duration-200 cursor-pointer hover:bg-white/90 hover:border-blue-200/50 transform hover:scale-[1.02]">
                        <div className="flex items-center gap-5">
                          <Avatar className="h-14 w-14 ring-4 ring-white/50 shadow-lg group-hover:ring-blue-200/50 transition-all duration-200">
                            <AvatarFallback className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white font-bold text-lg">
                              {chat.otherUser.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-bold text-gray-900 truncate text-xl group-hover:text-blue-700 transition-colors">{chat.otherUser}</p>
                              {chat.lastMessageTime && (
                                <p className="text-xs text-gray-500 whitespace-nowrap ml-3 bg-gray-100/80 px-3 py-1.5 rounded-full font-medium">
                                  {new Date(chat.lastMessageTime).toLocaleString('en-US', { 
                                    dateStyle: 'short', 
                                    timeStyle: 'short' 
                                  })}
                                </p>
                              )}
                            </div>
                            <p className="text-base text-gray-600 truncate font-medium">{chat.lastMessage}</p>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 bg-blue-500 rounded-full group-hover:bg-blue-600 transition-colors"></div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}