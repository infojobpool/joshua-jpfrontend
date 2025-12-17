"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, MoreVertical, Send, Paperclip, Smile, ArrowLeft } from "lucide-react";
import { useIsMobile } from "./MobileWrapper";
import { MobileCard, MobileCardHeader, MobileCardContent } from "./MobileCard";

export function MobileMessages() {
  const { isMobile } = useIsMobile();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chats = [
    {
      id: "1",
      name: "Sarah Johnson",
      lastMessage: "Thanks for the great work on the plumbing!",
      time: "2m ago",
      unread: 2,
      avatar: "SJ",
      online: true
    },
    {
      id: "2",
      name: "Mike Chen",
      lastMessage: "When can you start the painting job?",
      time: "1h ago",
      unread: 0,
      avatar: "MC",
      online: false
    },
    {
      id: "3",
      name: "Emily Davis",
      lastMessage: "The furniture assembly looks perfect!",
      time: "3h ago",
      unread: 1,
      avatar: "ED",
      online: true
    }
  ];

  const messages = [
    { id: "1", text: "Hi! I'm interested in your plumbing services", sender: "other", time: "10:30 AM" },
    { id: "2", text: "Great! What kind of plumbing work do you need?", sender: "me", time: "10:32 AM" },
    { id: "3", text: "I have a leaky kitchen sink that needs fixing", sender: "other", time: "10:33 AM" },
    { id: "4", text: "I can help with that! When would be a good time?", sender: "me", time: "10:35 AM" },
    { id: "5", text: "Thanks for the great work on the plumbing!", sender: "other", time: "2:15 PM" },
  ];

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat, messages]);

  // Focus input when chat is selected
  useEffect(() => {
    if (selectedChat && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedChat]);

  const handleSendMessage = () => {
    if (message.trim()) {
      console.log("Sending message:", message);
      setMessage("");
      // Auto-scroll after sending
      setTimeout(scrollToBottom, 100);
    }
  };

  // Important: keep all hooks above. Only then conditionally render.
  if (!isMobile) {
    return null; // Don't render on desktop
  }

  if (selectedChat) {
    const chat = chats.find(c => c.id === selectedChat);
    return (
      <div className="bg-gray-50 flex flex-col fixed inset-0 overscroll-contain">
        {/* Chat Header */}
        <div className="bg-white shadow-md border-b border-gray-200 flex-shrink-0 z-10">
          <div className="px-4 py-3 safe-area-top">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedChat(null)}
                className="p-2.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              <div className="relative">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold shadow-sm">
                  {chat?.avatar}
                </div>
                {chat?.online && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-gray-900 truncate">{chat?.name}</h2>
                <p className={`text-sm font-medium ${chat?.online ? "text-green-600" : "text-gray-500"}`}>
                  {chat?.online ? "Active now" : "Last seen recently"}
                </p>
              </div>
              <button 
                className="p-2.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
                aria-label="More options"
              >
                <MoreVertical className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 140px)" }} // Space for input + nav
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                  msg.sender === "me"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                    : "bg-white text-gray-900 border border-gray-100"
                }`}
              >
                <p className="text-base leading-relaxed">{msg.text}</p>
                <p className={`text-xs mt-1.5 ${
                  msg.sender === "me" ? "text-blue-100" : "text-gray-500"
                }`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input - Fixed above bottom nav */}
        <div
          className="bg-white border-t border-gray-200 p-3 fixed left-0 right-0 shadow-lg"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom) + 60px)', // 60px = bottom nav height
            paddingBottom: '8px',
            zIndex: 51 // Above bottom nav (z-50)
          }}
        >
          <div className="flex items-center gap-2 max-w-screen-xl mx-auto">
            <button 
              type="button"
              className="p-3 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0 touch-manipulation"
              aria-label="Attach file"
            >
              <Paperclip className="h-5 w-5 text-gray-600" />
            </button>
            <div className="flex-1 relative min-w-0">
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                inputMode="text"
                enterKeyHint="send"
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-base placeholder:text-gray-400"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
              />
            </div>
            <button 
              type="button"
              className="p-3 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0 touch-manipulation"
              aria-label="Add emoji"
            >
              <Smile className="h-5 w-5 text-gray-600" />
            </button>
            <button
              type="button"
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 flex-shrink-0 transition-all shadow-lg active:scale-95 touch-manipulation"
              aria-label="Send message"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Messages</h1>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <MoreVertical className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search conversations..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="px-4 py-4 space-y-2 pb-20">
        {chats.map((chat) => (
          <MobileCard
            key={chat.id}
            onClick={() => setSelectedChat(chat.id)}
            className="hover:shadow-md transition-shadow"
          >
            <MobileCardContent>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {chat.avatar}
                  </div>
                  {chat.online && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 truncate">{chat.name}</h3>
                    <span className="text-xs text-gray-500">{chat.time}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                    {chat.unread > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </MobileCardContent>
          </MobileCard>
        ))}
      </div>
    </div>
  );
}
