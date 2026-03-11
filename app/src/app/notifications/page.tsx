"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Check, 
  MessageSquare, 
  Gavel, 
  ArrowLeft,
  CheckCircle,
  Clock,
  User
} from "lucide-react";
import useStore from "@/lib/Zustand";
import { shallow } from "zustand/shallow";
import axiosInstance from "@/lib/axiosInstance";

interface ApiListResponse<T> {
  status_code: number;
  message: string;
  data: T;
}

interface MessageItem {
  id: string;
  task_id: string;
  task_title?: string;
  content?: string;
  created_at: string;
}

interface BidRequestItem {
  bid_id: string;
  task_id: string;
  task_title?: string;
  bid_amount?: number;
  created_at: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const userId = useStore((s) => s.userId);
  const checkAuth = useStore((s) => s.checkAuth);
  const unreadCount = useStore((s) => s.unreadCount);
  const items = useStore((s) => s.items);
  const addNotifications = useStore((s) => s.addNotifications);
  const markAllRead = useStore((s) => s.markAllRead);
  const clearOldKeepLatest = useStore((s) => s.clearOldKeepLatest);
  const [loading, setLoading] = useState(true);
  const [allNotifications, setAllNotifications] = useState<any[]>([]);
  const [authReady, setAuthReady] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [registerPushStatus, setRegisterPushStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [lastTokenEventAt, setLastTokenEventAt] = useState<string | null>(null);

  // Sort notifications by creation date (newest first)
  const sortedNotifications = useMemo(() => {
    return [...items].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [items]);

  // Wait for auth to hydrate from localStorage before redirecting (avoids flash → signin → dashboard)
  useEffect(() => {
    checkAuth();
    const t = setTimeout(() => setAuthReady(true), 150);
    return () => clearTimeout(t);
  }, [checkAuth]);

  useEffect(() => {
    if (!authReady) return;

    if (!userId) {
      router.push("/signin");
      return;
    }

    // Set all notifications from store
    setAllNotifications(sortedNotifications);
    setLoading(false);
  }, [authReady, userId, router, sortedNotifications]);

  // Listen for FCM token (from PWA Builder app) so user can copy it for Firebase "Send test message"
  useEffect(() => {
    const stored = (window as unknown as { __FCM_TOKEN?: string }).__FCM_TOKEN;
    if (stored) setFcmToken(stored);
    const onToken = (e: Event) => {
      setFcmToken((e as CustomEvent<string>).detail);
      setLastTokenEventAt(new Date().toISOString());
    };
    window.addEventListener("fcm-token-available", onToken);
    return () => window.removeEventListener("fcm-token-available", onToken);
  }, []);

  // Re-register push token when visiting this page (fixes 401 when token wasn't ready earlier)
  const registerPushWithBackend = useCallback(async () => {
    const token = (window as unknown as { __FCM_TOKEN?: string }).__FCM_TOKEN;
    const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token || !jwt) {
      setRegisterPushStatus("error");
      return;
    }
    setRegisterPushStatus("loading");
    try {
      const ua = navigator.userAgent.toLowerCase();
      const platform = /android/.test(ua) ? "android" : /iphone|ipad|ipod/.test(ua) ? "ios" : "web";
      await axiosInstance.post(
        "register-push/",
        { fcm_token: token, platform },
        {
          // Explicit auth header to avoid interceptor timing issues
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      setRegisterPushStatus("success");
    } catch {
      setRegisterPushStatus("error");
    }
  }, []);

  useEffect(() => {
    if (fcmToken && userId) registerPushWithBackend();
  }, [fcmToken, userId, registerPushWithBackend]);

  const handleMarkAllRead = () => {
    markAllRead();
  };

  const handleCopyFcmToken = () => {
    if (fcmToken) {
      navigator.clipboard.writeText(fcmToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };

  // Test in-app notification (simulates push from PWA Builder / FCM) — for checking web & Android
  const handleTestInAppNotification = () => {
    const payload = {
      title: "Test notification",
      body: "If you see this, in-app notifications are working.",
      type: "system",
      url: "/notifications",
    };
    window.dispatchEvent(
      new CustomEvent("push-notification", { detail: JSON.stringify(payload) })
    );
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

  if (loading) {
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
        {/* Header */}
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
                {allNotifications.length} notification{allNotifications.length !== 1 ? 's' : ''}
                {unreadCount > 0 && (
                  <span className="ml-2">
                    • <span className="text-blue-600 font-semibold">{unreadCount} unread</span>
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4" />
                Mark All Read
              </Button>
            )}
            {allNotifications.length > 10 && (
              <Button
                variant="outline"
                onClick={() => clearOldKeepLatest(10)}
                className="flex items-center gap-2 border-gray-300"
              >
                <Clock className="h-4 w-4" />
                Clear old (keep latest 10)
              </Button>
            )}
          </div>
        </div>

        {/* Debug banner for FCM token status (temporary) */}
        <div className="mb-6 rounded-lg border p-4 bg-white/80">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={fcmToken ? "bg-green-600" : "bg-red-600"}>
              {fcmToken ? "FCM Token: Present" : "FCM Token: Missing"}
            </Badge>
            <span className="text-sm text-gray-600">
              Register push: {registerPushStatus}
            </span>
            {lastTokenEventAt && (
              <span className="text-sm text-gray-500">
                Token event: {new Date(lastTokenEventAt).toLocaleString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyFcmToken}
              disabled={!fcmToken}
            >
              {tokenCopied ? "Copied" : "Copy FCM token"}
            </Button>
          </div>
          {!fcmToken && (
            <p className="mt-2 text-sm text-gray-500">
              Token missing in iOS app means the native wrapper did not register for push.
              Check iOS build (Push Notifications capability, Background Modes, and GoogleService-Info.plist).
            </p>
          )}
        </div>

        {/* Test in-app notification & FCM token (for Firebase "Send test message") */}
        <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
          {fcmToken && (
            <Card className="flex-1 min-w-0 max-w-2xl">
              <CardContent className="p-3">
                <p className="text-xs font-medium text-gray-600 mb-1">
                  FCM token (paste into Firebase → Send test message):
                </p>
                <div className="flex flex-wrap gap-2 items-center">
                  <code className="flex-1 min-w-0 truncate text-xs bg-gray-100 px-2 py-1 rounded">
                    {fcmToken}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyFcmToken}
                    className="shrink-0"
                  >
                    {tokenCopied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={registerPushWithBackend}
                    disabled={registerPushStatus === "loading"}
                    className="shrink-0"
                  >
                    {registerPushStatus === "loading" ? "..." : registerPushStatus === "success" ? "✓ Registered" : "Retry register"}
                  </Button>
                </div>
                {registerPushStatus === "error" && (
                  <p className="text-xs text-red-600 mt-1">Sign in again and retry, or check backend.</p>
                )}
              </CardContent>
            </Card>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestInAppNotification}
            className="text-gray-600 border-gray-300"
          >
            Test in-app notification
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {allNotifications.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No notifications yet</h3>
                <p className="text-gray-500 mb-4">
                  You'll see notifications for new bids, messages, and updates here.
                </p>
                <Button variant="outline" onClick={handleTestInAppNotification}>
                  Test in-app notification
                </Button>
              </CardContent>
            </Card>
          ) : (
            allNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all duration-300 hover:shadow-lg ${
                  notification.read 
                    ? "bg-white border-gray-200" 
                    : "bg-blue-50/50 border-blue-200 shadow-md"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            {notification.title}
                          </h3>
                          {notification.description && (
                            <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                              {notification.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(notification.createdAt).toLocaleString()}
                            </div>
                            {!notification.read && (
                              <Badge variant="outline" className="text-blue-600 border-blue-300">
                                New
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {notification.link && (
                          <Link href={notification.link}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="ml-4 flex items-center gap-1"
                            >
                              View
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Notifications are updated in real-time. You'll be notified of new bids, messages, and task updates.
          </p>
        </div>
      </div>
    </div>
  );
}
