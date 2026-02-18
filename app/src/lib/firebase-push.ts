/**
 * Web push: get FCM token and register with backend.
 * Call registerPushToken(jwt) right after login.
 * Requires: NEXT_PUBLIC_FIREBASE_VAPID_KEY and Firebase web config in env.
 */

import { getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export async function registerPushToken(jwt: string): Promise<void> {
  if (typeof window === "undefined") return;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("Push: VAPID key missing");
    return;
  }

  if (!jwt) {
    console.warn("Push: No JWT");
    return;
  }

  try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn("Push: Firebase config missing (apiKey, projectId)");
      return;
    }

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Push: Notifications denied");
      return;
    }

    const token = await getToken(messaging, { vapidKey });
    if (!token) {
      console.warn("Push: No token");
      return;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1";
    const res = await fetch(`${baseUrl}/register-push/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ fcm_token: token, platform: "web" }),
    });

    if (!res.ok) throw new Error(await res.text());
    console.log("Push: Token registered");
  } catch (e) {
    console.warn("Push: Failed", e);
  }
}
