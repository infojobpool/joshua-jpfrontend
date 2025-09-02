"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, ArrowLeft, MoreVertical } from "lucide-react"
import { toast, Toaster } from "sonner"
import axiosInstance from "@/lib/axiosInstance"
import { useAuthStore } from "@/lib/Zustand"

interface Message {
  id: string;
  description: string;
  tstamp: string;
  sender_id: string;
  receiver_id: string;
  sender_name: string;
  receiver_name: string;
  is_read: boolean;
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
  const { userId, logout } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const [otherUserName, setOtherUserName] = useState("")

  const chatId = params.chatId as string

  useEffect(() => {
    if (!userId) {
      router.push('/signin');
      return;
    }

    if (!chatId) {
      router.push('/messages');
      return;
    }

    fetchMessages();
  }, [chatId, userId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/get-messages/${chatId}`);
      
      if (response.data.status_code === 200 && response.data.data.messages) {
        const fetchedMessages = response.data.data.messages;
        setMessages(fetchedMessages);
        
        // Determine other user info
        if (fetchedMessages.length > 0) {
          const firstMessage = fetchedMessages[0];
          const otherUserId = firstMessage.sender_id === userId 
            ? firstMessage.receiver_id 
            : firstMessage.sender_id;
          const otherUserName = firstMessage.sender_id === userId 
            ? firstMessage.receiver_name 
            : firstMessage.sender_name;
          
          setOtherUserName(otherUserName);
          setChatInfo({
            chatId,
            otherUser: {
              id: otherUserId,
              name: otherUserName,
            }
          });
        }
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast.error(error.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !chatInfo) return;

    try {
      setSending(true);
      const response = await axiosInstance.post('/send-message/', {
        chat_id: chatId,
        sender_id: userId,
        receiver_id: chatInfo.otherUser.id,
        description: message.trim(),
      });

      if (response.data.status_code === 200) {
        const newMessage: Message = {
          id: response.data.data.message_id || Date.now().toString(),
          description: message.trim(),
          tstamp: new Date().toISOString(),
          sender_id: userId,
          receiver_id: chatInfo.otherUser.id,
          sender_name: "You",
          receiver_name: chatInfo.otherUser.name,
          is_read: false,
        };

        setMessages(prev => [...prev, newMessage]);
        setMessage("");
        
        // Mark message as read
        try {
          await axiosInstance.post(`/mark-as-read/${newMessage.id}`);
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
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

  return (
    <div className="flex h-screen flex-col">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b bg-white flex-shrink-0">
        <div className="flex h-16 items-center px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/messages')}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {otherUserName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-gray-900">{otherUserName}</h2>
              <p className="text-xs text-gray-500">Active now</p>
            </div>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => {
            const isOwnMessage = msg.sender_id === userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{msg.description}</p>
                  </div>
                  <p className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.tstamp).toLocaleString('en-US', { 
                      dateStyle: 'short', 
                      timeStyle: 'short' 
                    })}
                  </p>
                </div>
                {!isOwnMessage && (
                  <Avatar className="h-8 w-8 ml-2 order-2">
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                      {msg.sender_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="border-t bg-white p-4 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex gap-3">
          <Input
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
            disabled={sending}
          />
          <Button 
            onClick={sendMessage} 
            disabled={!message.trim() || sending}
            className="px-6"
          >
            {sending ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
