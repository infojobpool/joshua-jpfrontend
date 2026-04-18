"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  MessageSquare,
  Gavel,
  ArrowLeft,
  CheckCircle,
  Clock,
} from "lucide-react";
import useStore from "@/lib/Zustand";
import { useNotifications, type NotificationItem as ApiNotificationRow } from "@/lib/useNotifications";

function rowCreatedAt(n: ApiNotificationRow & Record<string, unknown>): string {
  const raw = (n as { created_at?: string }).created_at ?? (n as { createdAt?: string }).createdAt;
  const t = raw != null && raw !== "" ? Date.parse(String(raw)) : NaN;
  if (Number.isFinite(t)) return new Date(t).toLocaleString();
  return "—";
}

function rowDescription(n: ApiNotificationRow & Record<string, unknown>): string {
  return String((n as { description?: string }).description ?? (n as { body?: string }).body ?? "").trim();
}

function rowLink(n: ApiNotificationRow & Record<string, unknown>): string | undefined {
  const link = (n as { link?: string }).link;
  if (link && String(link).trim()) return String(link).trim();
  return undefined;
}

export default function NotificationsPage() {
  const router = useRouter();
  const userId = useStore((s) => s.userId);
  const checkAuth = useStore((s) => s.checkAuth);
  const [authReady, setAuthReady] = useState(false);
  const pollEnabled = authReady && !!userId;
  const {
    items: liveItems,
    unreadCount,
    loading: notifLoading,
    markAsRead,
    clearOldKeepLatest,
    clearAll,
  } = useNotifications(pollEnabled);

  const sortedNotifications = useMemo(() => {
    return [...liveItems].sort(
      (a, b) =>
        new Date((b as { created_at?: string }).created_at ?? (b as { createdAt?: string }).createdAt ?? 0).getTime() -
        new Date((a as { created_at?: string }).created_at ?? (a as { createdAt?: string }).createdAt ?? 0).getTime()
    );
  }, [liveItems]);

  useEffect(() => {
    checkAuth();
    const t = setTimeout(() => setAuthReady(true), 150);
    return () => clearTimeout(t);
  }, [checkAuth]);

  useEffect(() => {
    if (!authReady) return;
    if (!userId) {
      router.push("/signin");
    }
  }, [authReady, userId, router]);

  const handleMarkAllRead = async () => {
    await markAsRead(null);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "bid":
        return <Gavel className="h-5 w-5 text-amber-600" />;
      case "message":
        return <MessageSquare className="h-5 w-5 text-blue-600" />;
      case "system":
        return <Bell className="h-5 w-5 text-purple-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "bid":
        return "bg-amber-50 border-amber-200";
      case "message":
        return "bg-blue-50 border-blue-200";
      case "system":
        return "bg-purple-50 border-purple-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  if (notifLoading && sortedNotifications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                {sortedNotifications.length} notification{sortedNotifications.length !== 1 ? "s" : ""}
                {unreadCount > 0 && (
                  <span className="ml-2">
                    • <span className="text-blue-600 font-semibold">{unreadCount} unread</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={() => void handleMarkAllRead()}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
            {sortedNotifications.length > 10 && (
              <Button
                variant="outline"
                title="Keeps the 10 newest on this device only. Older items stay hidden until you close the app — nothing is deleted on the server."
                onClick={() => clearOldKeepLatest()}
                className="flex items-center gap-2 border-gray-300"
              >
                <Clock className="h-4 w-4" />
                Clear old (keep latest 10)
              </Button>
            )}
            {sortedNotifications.length > 0 && (
              <Button
                variant="outline"
                title="Clears this list on this device; new items will appear again after the next sync from the server."
                onClick={() => clearAll()}
                className="border-gray-300"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {sortedNotifications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No notifications yet</h3>
                <p className="text-gray-500 mb-4">
                  You will see notifications for new bids, messages, and updates here.
                </p>
              </CardContent>
            </Card>
          ) : (
            sortedNotifications.map((notification) => {
              const n = notification as ApiNotificationRow & Record<string, unknown>;
              const desc = rowDescription(n);
              const link = rowLink(n);
              return (
                <Card
                  key={String(n.id)}
                  className={`transition-all duration-300 hover:shadow-lg ${
                    n.read ? "bg-white border-gray-200" : "bg-blue-50/50 border-blue-200 shadow-md"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${getNotificationColor(String(n.type ?? "system"))}`}>
                        {getNotificationIcon(String(n.type ?? "system"))}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1">{n.title || "Notification"}</h3>
                            {desc ? (
                              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{desc}</p>
                            ) : null}
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {rowCreatedAt(n)}
                              </div>
                              {!n.read && (
                                <Badge variant="outline" className="text-blue-600 border-blue-300">
                                  New
                                </Badge>
                              )}
                            </div>
                          </div>

                          {link ? (
                            <Link href={link}>
                              <Button variant="outline" size="sm" className="ml-4 flex items-center gap-1">
                                View
                              </Button>
                            </Link>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Notifications are updated in real-time. You will be notified of new bids, messages, and task updates.
          </p>
        </div>
      </div>
    </div>
  );
}
