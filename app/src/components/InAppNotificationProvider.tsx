"use client";

import { useEffect } from "react";
import useStore from "@/lib/Zustand";
import axiosInstance from "@/lib/axiosInstance";

/**
 * Listens for push notifications and adds them to the in-app notifications list.
 * Registers FCM token with backend when received from PWA Builder native app (push-token event).
 */
export function InAppNotificationProvider() {
  const addNotifications = useStore((s) => s.addNotifications);
  const userId = useStore((s) => s.userId);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handlePushPayload = (payload: Record<string, unknown> | string) => {
      const data = typeof payload === "string" ? tryParse(payload) : payload;
      if (!data || typeof data !== "object") return;

      const title =
        (data.title as string) ||
        (data.notification as Record<string, unknown>)?.title as string ||
        "Notification";
      const body =
        (data.body as string) ||
        (data.description as string) ||
        (data.notification as Record<string, unknown>)?.body as string ||
        "";
      const type = ((data.type as string) || "system") as "message" | "bid" | "system";
      const link = (data.url as string) || (data.link as string) || "";
      const id =
        (data.gcm_message_id as string) ||
        (data.message_id as string) ||
        `push-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

      addNotifications([
        {
          id,
          type,
          title,
          description: body || undefined,
          createdAt: new Date().toISOString(),
          read: false,
          link: link || undefined,
          direction: type === "bid" ? "received" : undefined,
        },
      ]);
    };

    // PWA Builder Android/iOS: native app injects push via CustomEvent
    const onPushEvent = (e: Event) => {
      const ev = e as CustomEvent<string | Record<string, unknown>>;
      const detail = ev.detail;
      if (typeof detail === "string") handlePushPayload(detail);
      else if (detail && typeof detail === "object") handlePushPayload(detail);
    };

    window.addEventListener("push-notification", onPushEvent);
    window.addEventListener("push-notification-click", onPushEvent);

    // Service worker postMessage (when Web Push is used and SW forwards to client)
    const sw = navigator.serviceWorker;
    if (sw) {
      const onMessage = (e: MessageEvent) => {
        if (e.data?.type === "push" && e.data?.payload) {
          handlePushPayload(e.data.payload);
        }
      };
      sw.addEventListener("message", onMessage);
      return () => {
        window.removeEventListener("push-notification", onPushEvent);
        window.removeEventListener("push-notification-click", onPushEvent);
        sw.removeEventListener("message", onMessage);
      };
    }

    return () => {
      window.removeEventListener("push-notification", onPushEvent);
      window.removeEventListener("push-notification-click", onPushEvent);
    };
  }, [addNotifications]);

  // Request notification permission when user is logged in (needed for real push)
  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;
    if (!("Notification" in window) || Notification.permission !== "default") return;

    const request = () => {
      Notification.requestPermission().catch(() => {});
    };
    const t = setTimeout(request, 3000);
    return () => clearTimeout(t);
  }, [userId]);

  /**
   * When the user is logged in and the app has an FCM token (from PWA Builder push-token event
   * or from Firebase JS getToken()), call the register-push endpoint.
   *
   * URL: POST https://api.jobpool.in/api/v1/register-push/
   *      (or whatever NEXT_PUBLIC_API_BASE_URL / API base URL is — axiosInstance uses it)
   * Headers: Authorization: Bearer <JWT> (axiosInstance adds this from localStorage)
   * Body: { "fcm_token": "<FCM_TOKEN>", "platform": "android" | "ios" | "web" }
   *
   * Location: InAppNotificationProvider — right after we have the token and user is logged in.
   */
  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;

    const getPlatform = (): "android" | "ios" | "web" => {
      const ua = navigator.userAgent.toLowerCase();
      if (/android/.test(ua)) return "android";
      if (/iphone|ipad|ipod/.test(ua)) return "ios";
      return "web";
    };

    const registerToken = async (token: string) => {
      if (!token || token === "ERROR GET TOKEN") return;
      try {
        await axiosInstance.post("register-push/", {
          fcm_token: token,
          platform: getPlatform(),
        });
      } catch (err) {
        console.warn("Failed to register push token:", err);
      }
    };

    // PWA Builder / native: token is dispatched via push-token event. Right after we have
    // the token and user is logged in, we call register-push.
    const onPushToken = (e: Event) => {
      const ev = e as CustomEvent<string>;
      const token = typeof ev.detail === "string" ? ev.detail : null;
      if (token) registerToken(token);
    };

    window.addEventListener("push-token", onPushToken);
    return () => window.removeEventListener("push-token", onPushToken);
    // If you add Firebase JS: after getToken() resolves, call registerToken(token) here too.
  }, [userId]);

  return null;
}

function tryParse(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return null;
  }
}
