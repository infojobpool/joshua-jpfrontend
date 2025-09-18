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
  const { userId, logout } = useStore()
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
        const storedChats = localStorage.getItem("userChats");
        if (!storedChats) {
          setChats([]);
          setLoading(false);
          return;
        }

        const chatIds: string[] = JSON.parse(storedChats);
        const chatSummaries: ChatSummary[] = [];

        // Fetch details for each chat
        const validChatIds: string[] = [];
        for (const chatId of chatIds) {
          try {
            const response = await axiosInstance.get(`/get-messages/${chatId}`);
            if (response.data.status_code === 200 && response.data.data.messages) {
              const messages = response.data.data.messages;
              if (messages.length > 0) {
                const lastMessage = messages[messages.length - 1];
                const otherUserId = lastMessage.sender_id === userId 
                  ? lastMessage.receiver_id 
                  : lastMessage.sender_id;
                const otherUserName = lastMessage.sender_id === userId 
                  ? lastMessage.receiver_name 
                  : lastMessage.sender_name;

                chatSummaries.push({
                  chatid: chatId,
                  otherUserId,
                  otherUser: otherUserName,
                  lastMessage: lastMessage.description,
                  lastMessageTime: lastMessage.tstamp,
                });
                validChatIds.push(chatId);
              }
            }
          } catch (error) {
            // If the chat no longer exists (404), silently drop it from the list
            // and clean it from localStorage to avoid repeated errors
            // For other errors, log a compact warning
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const status = (error as any)?.response?.status;
            if (status !== 404) {
              console.warn(`Messages list: could not fetch chat ${chatId} (status ${status ?? 'unknown'})`);
              // keep it, may be a transient issue
              validChatIds.push(chatId);
            }
          }
        }

        // Persist the cleaned list of valid chat ids
        try {
          localStorage.setItem("userChats", JSON.stringify(validChatIds));
        } catch {}

        // Sort chats by last message time (newest first)
        chatSummaries.sort((a, b) => {
          if (!a.lastMessageTime || !b.lastMessageTime) return 0;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });

        setChats(chatSummaries);
      } catch (error: any) {
        console.error('Error fetching chats:', error);
        toast.error(error.response?.data?.message || 'Failed to load chats');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
    // Restore scroll position if available
    try {
      const y = sessionStorage.getItem('messagesScrollY');
      if (y) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(y, 10));
        }, 0);
      }
    } catch {}
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

  return (
    <div className="flex min-h-screen flex-col">
      <Toaster position="top-right" />
      <main className="flex-1 container py-6 md:py-10 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Your Messages</h1>
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
          </div>
          
          {chats.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-500 mb-4">Start a conversation by messaging someone about a task</p>
                <Link href="/browse">
                  <Button>Browse Tasks</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {chats
                .filter(chat => 
                  chat.otherUser.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  chat.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((chat) => (
                <Card key={chat.chatid} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                  try {
                    sessionStorage.setItem('messagesScrollY', String(window.scrollY));
                    sessionStorage.setItem('messagesLastChatId', chat.chatid);
                  } catch {}
                  router.push(`/messages/${chat.chatid}`);
                }}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                            {chat.otherUser.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900 truncate">{chat.otherUser}</p>
                            {chat.lastMessageTime && (
                              <p className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                {new Date(chat.lastMessageTime).toLocaleString('en-US', {
                                  dateStyle: 'short', 
                                  timeStyle: 'short' 
                                })}
                              </p>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate mt-1">{chat.lastMessage}</p>
                        </div>
                      </div>
                    </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}