# In-App Notifications (PWA Builder Android)

In-app notifications are implemented in the **web app** so they work when the site is opened in the PWA Builder Android app (WebView).

---

## What’s implemented

1. **Notification store (Zustand)**  
   The in-app list now shows:
   - **Bid** notifications (received, not withdrawn)
   - **Message** notifications
   - **System** notifications  
   Up to 20 items, sorted by newest.

2. **InAppNotificationProvider**  
   A client component that:
   - Listens for **push events** and adds them to the in-app list.
   - Requests **notification permission** when the user is logged in (for Web Push / system notifications).

3. **Event sources**
   - **Custom events** (PWA Builder native → WebView):
     - `push-notification`: payload is `detail` (JSON string or object) with `title`, `body`/`description`, optional `type`, `url`/`link`, `gcm_message_id`.
     - `push-notification-click`: same payload when the user taps the notification.
   - **Service worker** `message`:
     - If `data.type === 'push'` and `data.payload` is set, the payload is added to the in-app list (for future Web Push).

---

## PWA Builder Android app

The Android app from PWA Builder is a WebView that loads your site (e.g. `https://www.jobpool.in`). For push to show **in-app**:

1. **If the Android package injects push into the WebView** (like the iOS app with `push-notification` / `push-notification-click`):
   - The web app already listens for those events and adds to the in-app list.
   - No extra change needed on the web side.

2. **If the Android app does not inject push** (only shows system notifications):
   - In-app updates can still come from:
     - Your backend API (e.g. when the user opens the app or the Notifications page, you fetch and merge into the store), or
     - Web Push: your backend sends Web Push; the **service worker** receives the push and can `postMessage` to the client; the provider will add it to the in-app list when you send `{ type: 'push', payload: { title, body, ... } }`.

---

## Backend / FCM

- To send push from your server you need FCM (or another push provider) and to store device/subscription tokens per user.
- FCM payload can include `data` (e.g. `title`, `body`, `type`, `url`) so the native app or WebView can show a system notification and/or forward to the web page.
- If you add a **GET** endpoint for “my notifications” (e.g. `GET /api/v1/notifications` or `/me/notifications`), you can call it on app open or when the Notifications page loads and call `setNotifications(response)` so the in-app list stays in sync.

---

## Where users see in-app notifications

- **Notifications page**: `/notifications` shows all items from the store (bids, messages, system, and any added via push events).
- **Dashboard**: The notification bell/dropdown can be wired to the same store so the same list appears there.

No native Android code changes are required in the repo; everything is in the web app so it works in the PWA Builder Android WebView.
