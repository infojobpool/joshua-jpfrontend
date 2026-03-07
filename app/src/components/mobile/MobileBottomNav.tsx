"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatSummary {
  chatid: string;
  otherUser: string;
  lastMessage: string;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("chatSummaries");
      if (raw) {
        const parsed = JSON.parse(raw) as ChatSummary[];
        setChatSummaries(Array.isArray(parsed) ? parsed : []);
      } else {
        setChatSummaries([]);
      }
    } catch {
      setChatSummaries([]);
    }
  }, [messagesOpen, pathname]); // Re-read when popover opens or when navigating (e.g. returning from chat)

  /* Rely on md:hidden for desktop; no useIsMobile check to avoid hydration flash on mobile */

  const isMessagesActive = pathname === "/messages" || pathname.startsWith("/messages/");

  const messagesNav = (
    <Popover open={messagesOpen} onOpenChange={setMessagesOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-all duration-200 active:scale-95 touch-manipulation w-full ${
            isMessagesActive
              ? "text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-slate-700"
              : "text-gray-700 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-[#60a5fa] hover:bg-gray-50 dark:hover:bg-slate-800"
          }`}
        >
          <MessageCircle className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Messages</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-[min(calc(100vw-2rem),320px)] p-0 rounded-xl border shadow-lg"
      >
        <div className="p-2 border-b bg-muted/30">
          <p className="text-sm font-semibold text-center">Recent Chats</p>
        </div>
        <ScrollArea className="max-h-[min(50vh,280px)]">
          {chatSummaries.length > 0 ? (
            <div className="p-1">
              {chatSummaries.map((chat) => (
                <Link
                  key={chat.chatid}
                  href={`/messages/${chat.chatid}`}
                  onClick={() => setMessagesOpen(false)}
                  className="flex flex-col gap-0.5 px-3 py-2.5 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors"
                >
                  <span className="text-sm font-medium truncate">{chat.otherUser || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {chat.lastMessage || "No messages yet"}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No chats yet. Start a conversation from a task.
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t bg-muted/30">
          <Link
            href="/messages"
            onClick={() => setMessagesOpen(false)}
            className="block text-center text-sm font-medium text-[#2563eb] dark:text-[#60a5fa] py-2"
          >
            View all messages
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/dashboard", icon: Search, label: "Browse" },
    { type: "messages" as const, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div 
      className="fixed left-0 right-0 bottom-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] dark:shadow-[0_-2px_10px_rgba(0,0,0,0.3)] z-50 md:hidden mobile-nav-appear"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex justify-around items-center py-2.5">
        {navItems.map((item) => {
          if (item.type === "messages") {
            return (
              <div key="messages" className="flex-1 flex justify-center">
                {messagesNav}
              </div>
            );
          }
          const { href, icon: Icon, label } = item as { href: string; icon: React.ComponentType<{ className?: string }>; label: string };
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center py-1.5 px-3 rounded-lg transition-all duration-200 active:scale-95 touch-manipulation ${
                isActive
                  ? "text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-slate-700"
                  : "text-gray-700 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-[#60a5fa] hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}







