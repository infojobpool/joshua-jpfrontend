# App Download & Analytics Tracking Guide

This guide explains how JobPool tracks user behavior, app downloads, and key funnel events.

## What GA4 Tracks

- **Page views** – Automatic via gtag config
- **Custom events** – Listed in `src/lib/analytics.ts`

### Custom Events

| Event              | When Fired                    | Params                                   |
|--------------------|------------------------------|------------------------------------------|
| `view_task`        | User views a task detail page | `task_id`, `task_title`                  |
| `view_signup`      | User visits signup page       | `page_path`                              |
| `view_dashboard`   | User views dashboard (signed in) | `page_path`                           |
| `app_download_click` | User clicks Play Store or App Store link | `store`, `link_placement`         |
| `pwa_installed`   | User adds PWA to home screen  | `platform`                               |

---

## Tracking App Downloads

### What You Can Track

1. **Website Clicks → Store**  
   When users click the Play Store or App Store buttons in the footer, we fire `app_download_click` with `store: "play_store"` or `store: "app_store"`.

2. **PWA Installs**  
   When users add the site to the home screen, we fire `pwa_installed`.

3. **Actual Downloads (Play Store / App Store)**  
   These come from the stores, not from your website. Use:
   - **Google Play Console** → Statistics → Installations
   - **App Store Connect** → App Analytics → Downloads

### How to View App Download Clicks in GA4

1. Open [Google Analytics](https://analytics.google.com) → Your JobPool property.
2. **Reports** → **Engagement** → **Events**.
3. Search for `app_download_click`.
4. Use the `store` parameter to filter by `play_store` or `app_store`.

### Create an App Download Report

1. **Explore** → **Free form** (or blank report).
2. Add **Event name** as a dimension: `app_download_click`.
3. Add **Event count** as a metric.
4. Add a breakdown by the `store` parameter to compare Play Store vs App Store clicks.

---

## Custom Event Reference

Use these helpers from any client component:

```ts
import { analytics } from "@/lib/analytics";

// App download clicks (already on Footer links)
analytics.appDownloadClick("play_store");
analytics.appDownloadClick("app_store");

// Page view funnels
analytics.viewSignup();
analytics.viewDashboard();
analytics.viewTask(taskId, taskTitle);

// PWA install (auto-tracked via PwaInstallTracker)
analytics.pwaInstalled();
```

---

## Realtime Verification

1. Go to **GA4** → **Reports** → **Realtime**.
2. On your site, click the app store links or open key pages.
3. Confirm `app_download_click`, `view_task`, etc. appear in Realtime.

---

## Optional: Microsoft Clarity

To add session replay and heatmaps:

1. Create a project at [clarity.microsoft.com](https://clarity.microsoft.com).
2. Copy the Project ID.
3. Add `NEXT_PUBLIC_CLARITY_PROJECT_ID=your_id` to `.env.local` and Vercel.
4. Add a `MicrosoftClarity` component that loads the Clarity script when this env var is set, and include it in `layout.tsx`.
