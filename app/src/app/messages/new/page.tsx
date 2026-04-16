"use client"

import { useState, useEffect, useRef } from "react"
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
  const contextSeeded = useRef(false)

  const receiverId = searchParams.get('receiver')
  const receiverName = searchParams.get('receiverName') || 'User'
  const contextHint = searchParams.get('context') || ''
  /** Listing-scoped thread when set; omit for generic profile DM */
  const offeringId =
    (searchParams.get('offering_id') || searchParams.get('offeringId') || '').trim() || undefined

  useEffect(() => {
    if (!userId) return;

    if (!receiverId) {
      router.push('/messages');
      return;
    }
  }, [userId, receiverId, router]);

  useEffect(() => {
    if (contextHint && !contextSeeded.current) {
      contextSeeded.current = true
      setMessage(contextHint)
    }
  }, [contextHint])

  const sendMessage = async () => {
    if (!message.trim() || !userId || !receiverId) return;

    try {
      setLoading(true);
      
      // Get or create chat ID – use create-or-get-chat when job_id present (assigned jobs)
      let chatId;
      const jobId = searchParams.get('job_id');
      const senderId = userId;
      if (senderId === receiverId) {
        toast.error('Cannot message yourself');
        setLoading(false);
        return;
      }
      try {
        if (jobId) {
          const chatResponse = await axiosInstance.get('/create-or-get-chat/', {
            params: { sender: senderId, receiver: receiverId, job_id: jobId },
          });
          if (chatResponse.data?.status_code === 200 && chatResponse.data?.data?.chat_id) {
            chatId = chatResponse.data.data.chat_id;
          } else {
            throw new Error('Failed to get chat ID');
          }
        } else {
          let directId: string | undefined;
          const directParams: Record<string, string> = {
            sender: senderId,
            receiver: receiverId,
          };
          if (offeringId) directParams.offering_id = offeringId;
          try {
            const r1 = await axiosInstance.get('/create-or-get-direct-chat/', {
              params: directParams,
            });
            if (r1.data?.status_code === 200 && r1.data?.data?.chat_id) {
              directId = r1.data.data.chat_id;
            }
          } catch {
            /* try fallback endpoint */
          }
          if (!directId) {
            const r2 = await axiosInstance.get('/get-direct-chat-id/', {
              params: directParams,
            });
            if (r2.data?.status_code === 200 && r2.data?.data?.chat_id) {
              directId = r2.data.data.chat_id;
            }
          }
          if (!directId) {
            throw new Error('Failed to get direct chat ID');
          }
          chatId = directId;
        }
      } catch (error) {
        console.error('Error getting chat ID:', error);
        toast.error('Failed to create chat');
        return;
      }

      // Send the message
      const response = await axiosInstance.post('/send-message/', {
        chat_id: chatId,
        sender_id: senderId,
        receiver_id: receiverId,
        description: message.trim(),
      });

      if (response.data.status_code === 200) {
        toast.success('Message sent successfully!');
        
        // Store chat ID in localStorage
        const storedChats = localStorage.getItem("userChats");
        const chatIds: string[] = storedChats ? JSON.parse(storedChats) : [];
        if (!chatIds.includes(chatId)) {
          chatIds.push(chatId);
          localStorage.setItem("userChats", JSON.stringify(chatIds));
        }
        
        // Redirect to the chat (pass display name so header shows name before /profile resolves)
        const q = new URLSearchParams();
        if (receiverName && receiverName.trim() && receiverName.trim() !== "User") {
          q.set("receiverName", receiverName.trim());
        }
        router.push(`/messages/${chatId}${q.toString() ? `?${q.toString()}` : ""}`);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const data = error.response?.data as { reason?: string; message?: string } | undefined;
      toast.error(data?.reason || data?.message || 'Failed to send message');
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
    const next = `/messages/new?${searchParams.toString()}`
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-lg mb-4">Please log in to send messages</p>
          <Link
            href={`/signin?next=${encodeURIComponent(next)}`}
            className="text-blue-600 font-medium hover:underline"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (!receiverId) {
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
        </div>
      </header>

      {/* Message Form */}
      <main className="flex-1 p-4">
        <Card className="h-full">
          <CardContent className="h-full flex flex-col">
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Start a conversation with {receiverName}
                </h3>
                <p className="text-gray-500 mb-6">
                  Send your first message to begin the conversation
                </p>
                
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="min-h-[120px] resize-none"
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      onClick={sendMessage} 
                      disabled={!message.trim() || loading}
                      className="px-6"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="h-4 w-4" />
                          Send Message
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
