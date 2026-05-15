"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import useStore from "@/lib/Zustand";
import axiosInstance from "@/lib/axiosInstance";
import { getFirebaseMessagingServiceWorkerRegistration } from "@/lib/firebase-messaging-sw-register";
import { getPushPlatform } from "@/lib/pushPlatform";

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

    // Service worker postMessage (when Web Push is used and SW forwards to client - e.g. foreground on dashboard)
    const sw = navigator.serviceWorker;
    const showToastForPayload = (payload: Record<string, unknown>) => {
      const notif = (payload.notification as { title?: string; body?: string }) || {};
      const data = (payload.data as Record<string, unknown>) || payload;
      const title = notif.title ?? (data.title as string) ?? "Notification";
      const body = notif.body ?? (data.body as string) ?? "";
      const url = (data.url as string) || (data.link as string) || "/";
      const fullUrl = url.startsWith("http") ? url : window.location.origin + (url.startsWith("/") ? url : "/" + url);
      toast(title, {
        description: body,
        action: { label: "View", onClick: () => { window.location.href = fullUrl; } },
        duration: 5000,
      });
    };
    const onSwMessage = (e: MessageEvent) => {
      if (e.data?.type === "push" && e.data?.payload) {
        const p = e.data.payload as { notification?: { title?: string; body?: string }; data?: Record<string, unknown> };
        const notif = p.notification || {};
        const data = p.data || {};
        const merged = { ...data, title: (data.title as string) || notif.title, body: (data.body as string) || notif.body, notification: notif };
        handlePushPayload(merged);
        showToastForPayload(p);
      }
    };
    if (sw) sw.addEventListener("message", onSwMessage);

    // Foreground: when tab is open, FCM delivers to the page (not the SW). Listen and show.
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    let foregroundCancelled = false;
    if (vapidKey) {
      (async () => {
        try {
          const { getApp, getApps, initializeApp } = await import("firebase/app");
          const { getMessaging, onMessage } = await import("firebase/messaging");
          const config = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          };
          if (!config.apiKey || !config.projectId) return;
          const app = getApps().length ? getApp() : initializeApp(config);
          const messaging = getMessaging(app);
          onMessage(messaging, (payload) => {
            if (foregroundCancelled) return;
            const notif = payload.notification as { title?: string; body?: string } | undefined;
            const data = {
              title: notif?.title ?? payload.data?.title ?? "Notification",
              body: notif?.body ?? payload.data?.body ?? "",
              ...payload.data,
            };
            handlePushPayload(data);
            const url = (payload.data?.url as string) || (payload.data?.link as string) || "/";
            const fullUrl = url.startsWith("http") ? url : window.location.origin + (url.startsWith("/") ? url : "/" + url);
            // Show toast when app is in foreground (user always sees it)
            toast(notif?.title ?? "Notification", {
              description: notif?.body ?? "",
              action: {
                label: "View",
                onClick: () => { window.location.href = fullUrl; },
              },
              duration: 5000,
            });
            // Also show system notification when permitted
            if ("Notification" in window && Notification.permission === "granted" && notif?.title) {
              const n = new Notification(notif.title, { body: notif.body ?? "" });
              n.onclick = () => {
                n.close();
                window.focus();
                window.location.href = fullUrl;
              };
            }
          });
        } catch {
          // Firebase not configured or onMessage not supported
        }
      })();
    }

    return () => {
      foregroundCancelled = true;
      window.removeEventListener("push-notification", onPushEvent);
      window.removeEventListener("push-notification-click", onPushEvent);
      if (sw) sw.removeEventListener("message", onSwMessage);
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
   * When the user is logged in and the app has an FCM token, call the register-push endpoint.
   *
   * URL: POST https://api.jobpool.in/api/v1/register-push/
   * Header: Authorization: Bearer <JWT> (axiosInstance adds from localStorage)
   * Body: { "fcm_token": "<FCM_TOKEN>", "platform": "web" | "ios" | "android" }
   *
   * Platform is set by user agent: "android", "ios", or "web".
   */
  useEffect(() => {
    if (typeof window === "undefined" || !userId) return;

    const registerToken = async (fcmToken: string, retryCount = 0) => {
      if (!fcmToken || fcmToken === "ERROR GET TOKEN") return;

      // Ensure we have a JWT before sending (fixes 401 when push-token fires before auth is ready)
      const jwt = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!jwt && retryCount < 5) {
        // Retry after 2s - auth may still be hydrating (common in PWA Builder app on first load)
        setTimeout(() => registerToken(fcmToken, retryCount + 1), 2000);
        return;
      }
      if (!jwt) {
        console.warn("Push: No JWT - sign in to register for push");
        return;
      }

      try {
        await axiosInstance.post(
          "register-push/",
          {
            fcm_token: fcmToken,
            platform: getPushPlatform(),
          },
          {
            // Explicit auth header to avoid interceptor timing issues
            headers: { Authorization: `Bearer ${jwt}` },
          }
        );
      } catch (err: unknown) {
        const status = err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : 0;
        // Retry on 401 - token might have just been saved (race with login)
        if (status === 401 && retryCount < 3) {
          setTimeout(() => registerToken(fcmToken, retryCount + 1), 2000);
        } else {
          console.warn("Failed to register push token:", err);
        }
      }
    };

    // PWA Builder / native: token is dispatched via push-token event. Right after we have
    // the token and user is logged in, we call register-push.
    const onPushToken = (e: Event) => {
      const ev = e as CustomEvent<string>;
      const token = typeof ev.detail === "string" ? ev.detail : null;
      if (token) {
        (window as unknown as { __FCM_TOKEN?: string }).__FCM_TOKEN = token;
        window.dispatchEvent(new CustomEvent("fcm-token-available", { detail: token }));
        registerToken(token);
      }
    };

    window.addEventListener("push-token", onPushToken);

    // Firebase Web: get FCM token and register with backend (when VAPID key + config are set).
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (vapidKey) {
      let cancelled = false;
      (async () => {
        try {
          const { getApp, getApps, initializeApp } = await import("firebase/app");
          const { getMessaging, getToken } = await import("firebase/messaging");
          const config = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
          };
          if (!config.apiKey || !config.projectId) return;
          if (!("Notification" in window)) return;
          if (Notification.permission === "default") {
            await Notification.requestPermission().catch(() => {});
          }
          if (Notification.permission !== "granted") return;
          const app = getApps().length ? getApp() : initializeApp(config);
          const messaging = getMessaging(app);
          const swReg = await getFirebaseMessagingServiceWorkerRegistration();
          const token = await getToken(messaging, {
            vapidKey,
            ...(swReg ? { serviceWorkerRegistration: swReg } : {}),
          });
          if (!cancelled && token) {
            (window as unknown as { __FCM_TOKEN?: string }).__FCM_TOKEN = token;
            window.dispatchEvent(new CustomEvent("fcm-token-available", { detail: token }));
            registerToken(token);
          }
        } catch (err) {
          console.warn("[Push] FCM getToken / register failed:", err);
        }
      })();
      return () => {
        cancelled = true;
        window.removeEventListener("push-token", onPushToken);
      };
    }

    return () => window.removeEventListener("push-token", onPushToken);
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
