# Why Android Push Shows "Chrome" and How to Get JobPool Branding

---

## Why You See "Chrome • www.jobpool..."

When the push notification comes from the **web** (service worker / Web Push), Android and Chrome add the source label: **"Chrome • [domain]"**. This is intentional so users know the notification came from a website.

- **Web Push / TWA apps** → Always show Chrome + domain
- **Native app push** → Shows app name + app icon

---

## What We’ve Done

1. **JobPool icon in the notification**
   - Switched to PNG icon: `/icons/icon-192x192-real.png`
   - Use full URL so it loads reliably in the service worker
   - The main notification icon should now show the JobPool logo

2. **Badge icon**
   - Added badge for status bar / notification shade

3. **Notification tag**
   - Added `tag: 'jobpool'` so notifications are grouped

---

## Option A: Web Push (Current Setup)

- **Shows:** Chrome • www.jobpool… + JobPool icon in the notification
- **Behavior:** Instant delivery, works in TWA and browser
- **Limit:** System subtitle stays as "Chrome • www.jobpool…"

---

## Option B: Native Push (JobPool Name + Logo)

To show **"JobPool"** as the app name with no Chrome text:

1. **Use Capacitor with native push**
   - Add `@capacitor/push-notifications`
   - Handle FCM in the native Android layer
   - Notifications will use the app name and icon from the manifest

2. **Rebuild and ship as a native app**
   - Your current Play Store app (`in.jobpool.www.twa`) is a Trusted Web Activity and will still show Chrome
   - A Capacitor build with package `com.jobpool.app` would show native-style notifications

---

## Option C: Install as PWA

- In Chrome: menu → **Add to Home screen** / **Install app**
- The installed PWA may show better branding in some Android versions
- Behavior can vary by device and Chrome version

---

## Summary

| Setup                | Notification header | Icon   |
|----------------------|--------------------|--------|
| Web Push / TWA       | Chrome • www.jobpool… | JobPool logo |
| Native (Capacitor)   | JobPool            | JobPool logo |
| Installed PWA        | Varies             | JobPool logo |

The icon change ensures the JobPool logo appears clearly in the notification. The "Chrome" label cannot be removed for web-based push; for full JobPool branding, you need native push (e.g. Capacitor).
