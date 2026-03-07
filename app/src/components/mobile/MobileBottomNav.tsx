"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, User, MessageCircle, Plus } from "lucide-react";
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
  }, [messagesOpen, pathname]);

  const isMessagesActive = pathname === "/messages" || pathname.startsWith("/messages/");

  const messagesNav = (
    <Popover open={messagesOpen} onOpenChange={setMessagesOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-200 ease-out active:scale-90 touch-manipulation w-full min-w-0 ${
            isMessagesActive
              ? "text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-slate-700"
              : "text-gray-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-[#60a5fa] hover:bg-gray-50 dark:hover:bg-slate-800"
          }`}
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          <span className="text-[10px] font-medium truncate">Messages</span>
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

  const postTaskButton = (
    <Link
      href="/post-task"
      className="flex-shrink-0 -mt-6 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 active:scale-95 transition-all duration-200 ease-out touch-manipulation border-4 border-white dark:border-slate-900"
      aria-label="Post a task"
    >
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </Link>
  );

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/dashboard", icon: Search, label: "Browse" },
    { type: "post" as const },
    { type: "messages" as const, label: "Messages" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  const navLinkClass =
    "flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all duration-200 ease-out active:scale-90 touch-manipulation min-w-0 flex-1";

  return (
    <div
      className="fixed left-0 right-0 bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200/80 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)] z-50 md:hidden mobile-nav-appear"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-between px-3 py-2 max-w-lg mx-auto gap-1">
        {navItems.map((item) => {
          if (item.type === "post") {
            return (
            <div key="post" className="flex-shrink-0 flex justify-center">
              {postTaskButton}
            </div>
          );
          }
          if (item.type === "messages") {
            return (
              <div key="messages" className="flex-1 flex justify-center min-w-0">
                {messagesNav}
              </div>
            );
          }
          const { href, icon: Icon, label } = item as {
            href: string;
            icon: React.ComponentType<{ className?: string }>;
            label: string;
          };
          const isActive =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`${navLinkClass} ${
                isActive
                  ? "text-[#2563eb] dark:text-[#60a5fa] bg-[#eff6ff] dark:bg-slate-700"
                  : "text-gray-600 dark:text-slate-400 hover:text-[#2563eb] dark:hover:text-[#60a5fa] hover:bg-gray-50 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
