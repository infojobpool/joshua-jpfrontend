"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Send } from "lucide-react"
import { toast, Toaster } from "sonner"
import axiosInstance from "@/lib/axiosInstance"
import useStore from "@/lib/Zustand"

export default function NewMessagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { userId, logout } = useStore()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  
  const senderId = searchParams.get('sender')
  const receiverId = searchParams.get('receiver')
  const receiverName = searchParams.get('receiverName') || 'User'

  useEffect(() => {
    if (!userId) {
      router.push('/signin');
      return;
    }

    if (!senderId || !receiverId) {
      router.push('/messages');
      return;
    }
  }, [userId, senderId, receiverId, router]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    try {
      setLoading(true);
      
      // First try to get/create chat ID
      let chatId;
      try {
        const chatResponse = await axiosInstance.post('/get-chat-id/', {
          sender: senderId,
          receiver: receiverId,
          job_id: searchParams.get('job_id') || null,
        });
        
        if (chatResponse.data.status_code === 200 && chatResponse.data.data.chat_id) {
          chatId = chatResponse.data.data.chat_id;
        } else {
          throw new Error('Failed to get chat ID');
        }
      } catch (error) {
        console.error('Error getting chat ID:', error);
        toast.error('Failed to create chat');
        return;
      }

      // Send the message - try different possible endpoints
      let response;
      try {
        // First try the original endpoint
        response = await axiosInstance.post('/send-message/', {
          chat_id: chatId,
          sender_id: senderId,
          receiver_id: receiverId,
          description: message.trim(),
        });
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('🔄 /send-message/ not found, trying /create-message/...');
          try {
            response = await axiosInstance.post('/create-message/', {
              chat_id: chatId,
              sender_id: senderId,
              receiver_id: receiverId,
              description: message.trim(),
            });
          } catch (secondError: any) {
            if (secondError.response?.status === 404) {
              console.log('🔄 /create-message/ not found, trying /add-message/...');
              try {
                response = await axiosInstance.post('/add-message/', {
                  chat_id: chatId,
                  sender_id: senderId,
                  receiver_id: receiverId,
                  description: message.trim(),
                });
              } catch (thirdError: any) {
                console.log('🔄 /add-message/ not found, trying /message/...');
                response = await axiosInstance.post('/message/', {
                  chat_id: chatId,
                  sender_id: senderId,
                  receiver_id: receiverId,
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
        toast.success('Message sent successfully!');
        
        // Store chat ID in localStorage
        const storedChats = localStorage.getItem("userChats");
        const chatIds: string[] = storedChats ? JSON.parse(storedChats) : [];
        if (!chatIds.includes(chatId)) {
          chatIds.push(chatId);
          localStorage.setItem("userChats", JSON.stringify(chatIds));
        }
        
        // Redirect to the chat
        router.push(`/messages/${chatId}`);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
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

  if (!userId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Please log in to send messages</p>
          <Link href="/signin" className="text-blue-600 hover:underline">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!senderId || !receiverId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Invalid message parameters</p>
          <Link href="/messages" className="text-blue-600 hover:underline">
            Back to Messages
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
                {receiverName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-gray-900">New Message to {receiverName}</h2>
              <p className="text-xs text-gray-500">Start a conversation</p>
            </div>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Message Form */}
      <div className="flex-1 p-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">To:</label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {receiverName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900">{receiverName}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Message:</label>
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="min-h-[120px] resize-none"
                  disabled={loading}
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={sendMessage} 
                  disabled={!message.trim() || loading}
                  className="px-6"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
