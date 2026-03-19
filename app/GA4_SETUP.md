# Google Analytics 4 (GA4) Setup Guide for JobPool

## Overview

GA4 is integrated and will track:
- **Page views** automatically (all pages)
- **Custom events** (optional) via `trackEvent()` from `@/lib/analytics`

GA4 works on **web, PWA, and mobile apps** (Capacitor) since they all load the same Next.js app.

---

## Step 1: Create a GA4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Sign in with your Google account
3. Click **Admin** (gear icon, bottom left)
4. In **Property** column → **Create Property**
5. Name it **JobPool** (or JobPool Production)
6. Select time zone and currency (INR for India)
7. Finish setup
8. Under **Data Streams** → **Add stream** → **Web**
9. Enter:
   - **Website URL:** `https://www.jobpool.in`
   - **Stream name:** JobPool Web
10. Copy the **Measurement ID** — it looks like `G-XXXXXXXXXX`

---

## Step 2: Add the Environment Variable

### Local development
Add to `.env.local` in the `app` folder:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Measurement ID.

### Vercel (Production)
1. Open your Vercel project → **Settings** → **Environment Variables**
2. Add:
   - **Name:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`
   - **Value:** `G-XXXXXXXXXX`
   - **Environment:** Production (and Preview if you want)
3. Redeploy for the change to take effect

---

## Step 3: Verify It Works

1. Deploy and visit your site
2. Go to [GA4](https://analytics.google.com) → **Reports** → **Realtime**
3. Open `https://www.jobpool.in` in another tab
4. You should see yourself as an active user within ~30 seconds

---

## Optional: Track Custom Events

Use the `trackEvent` helper from `@/lib/analytics` to log key actions:

```tsx
import { trackEvent } from "@/lib/analytics";

// When user views a task
trackEvent("task_viewed", { task_id: task.id, task_title: task.title });

// When user places a bid
trackEvent("bid_placed", { task_id: task.id, amount: bidAmount });

// When user posts a task
trackEvent("task_posted", { task_id: task.id });

// When user shares a task
trackEvent("task_shared", { task_id: task.id, method: "whatsapp" });

// Sign up
trackEvent("sign_up", { method: "email" });
```

These events will appear in GA4 under **Reports** → **Engagement** → **Events** (after 24–48 hours for standard reports).

---

## What's Already Implemented

- **GoogleAnalytics** component in `src/components/GoogleAnalytics.tsx` — loads gtag.js when the env var is set
- **analytics.ts** in `src/lib/analytics.ts` — `trackEvent()` helper for custom events
- Layout includes GoogleAnalytics — no further code changes needed for basic tracking

---

## Privacy & Consent

If you have users in the EU/EEA, consider:
- Showing a cookie/consent banner before loading GA4
- Only initializing GA after the user accepts analytics
- Your existing `cookie-consent.tsx` can be extended to gate GA4 loading

---

## Mobile Apps (Capacitor / PWA)

GA4 runs inside the WebView, so it works for:
- **iOS app (Capacitor)** — same web app, same GA4
- **Android (PWA Builder TWA)** — same web app, same GA4

No native SDK or extra setup required.
