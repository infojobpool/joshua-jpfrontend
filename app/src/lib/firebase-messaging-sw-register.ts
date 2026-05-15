/**
 * Registers the root-scoped Firebase messaging service worker so FCM getToken()
 * uses the correct PushManager. next-pwa registers /sw.js (Workbox); without an
 * explicit registration, getToken often binds to the wrong worker and push fails on Android/TWA.
 */

const FCM_SW_SCRIPT = "/firebase-messaging-sw.js";

export async function getFirebaseMessagingServiceWorkerRegistration(): Promise<
  ServiceWorkerRegistration | undefined
> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return undefined;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const existing = registrations.find((r) => {
      const url = r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? "";
      return url.includes("firebase-messaging-sw");
    });
    if (existing) return existing;

    return await navigator.serviceWorker.register(FCM_SW_SCRIPT, {
      scope: "/",
      updateViaCache: "none",
    });
  } catch (e) {
    console.warn("[Push] firebase-messaging-sw.js registration failed:", e);
    return undefined;
  }
}
