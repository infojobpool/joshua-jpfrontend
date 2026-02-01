# Step-by-step: Check in-app notifications on Web and Android

Follow these steps to verify in-app notifications work on **web** first, then on **Android**.

---

## Part 1: Check on Web (browser)

### Step 1: Start the web app locally

1. Open a terminal.
2. Go to the app folder:
   ```bash
   cd /Users/joshuabayagalla/jobpoolfrontendsept/app
   ```
3. Install dependencies (if you haven’t recently):
   ```bash
   npm install
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Wait until you see something like: `Ready on http://localhost:3000`.

---

### Step 2: Open the app in the browser

1. Open your browser (Chrome, Safari, etc.).
2. Go to: **http://localhost:3000**

---

### Step 3: Sign in

1. Click **Sign in** (or go to **http://localhost:3000/signin**).
2. Sign in with your JobPool account.
3. You should land on the dashboard or home.

---

### Step 4: Open the Notifications page

1. In the menu or profile, go to **Notifications**.
2. Or go directly to: **http://localhost:3000/notifications**
3. You should see the Notifications page (empty list or existing notifications).

---

### Step 5: Test in-app notification on web

1. On the Notifications page, find the **“Test in-app notification”** button (top right or in the empty state).
2. Click **“Test in-app notification”**.
3. **Expected:** A new notification appears in the list:
   - Title: **“Test notification”**
   - Description: **“If you see this, in-app notifications are working.”**
   - Type: system (purple icon).
4. If you see that, **in-app notifications work on web.**

---

### Step 6: Optional – test “Mark all read”

1. With at least one notification showing, click **“Mark all read”**.
2. **Expected:** The “New” badges disappear and the list updates.

---

## Part 2: Check on Android

You can test either with the **PWA Builder Android app** (if you have it installed) or with **Chrome on Android** loading your site.

### Option A: Using the PWA Builder Android app

#### Step 1: Deploy or expose your app for Android

- The Android app loads your **live** URL (e.g. **https://www.jobpool.in**).
- So either:
  - **Deploy** your latest code (with the test button and InAppNotificationProvider) to production, **or**
  - Use a tunnel (e.g. ngrok) so your phone can open `http://localhost:3000` (or your dev URL).  
  Example with ngrok:
  ```bash
  npx ngrok http 3000
  ```
  Then use the `https://...ngrok.io` URL on your phone.

#### Step 2: Open the app on the Android device

1. Open the **JobPool** app (PWA Builder Android).
2. Make sure it loads the same site you just deployed or exposed (e.g. jobpool.in or your ngrok URL).

#### Step 3: Sign in and go to Notifications

1. Sign in with the same account.
2. Go to **Notifications** (from menu or profile).

#### Step 4: Test in-app notification on Android

1. Tap **“Test in-app notification”** on the Notifications page.
2. **Expected:** A new notification appears in the list (same as on web).
3. If it does, **in-app notifications work in the Android app.**

---

### Option B: Using Chrome on Android (same site as production)

1. On your Android phone, open **Chrome**.
2. Go to your site (e.g. **https://www.jobpool.in** — after you’ve deployed the new code).
3. Sign in, then go to **Notifications**.
4. Tap **“Test in-app notification”**.
5. **Expected:** Same as above – the test notification appears in the list.

---

## Quick checklist

| Step | Where | Action | Expected |
|------|--------|--------|----------|
| 1 | Terminal | `cd app` → `npm run dev` | Dev server running (e.g. localhost:3000). |
| 2 | Browser | Open localhost:3000 | App loads. |
| 3 | App | Sign in | Logged in. |
| 4 | App | Go to Notifications | Notifications page opens. |
| 5 | App | Click “Test in-app notification” | New notification appears in list. |
| 6 | Android | Open JobPool app or Chrome → your site | Same site as where you deployed. |
| 7 | Android | Sign in → Notifications → “Test in-app notification” | Same test notification appears. |

---

## If the test notification does not appear

**On web (browser):**

- Make sure you’re on **http://localhost:3000/notifications** (or your dev URL).
- Make sure you’re **signed in** (otherwise you may be redirected to sign-in).
- Hard refresh the page (e.g. Ctrl+Shift+R or Cmd+Shift+R) and try again.
- Check the browser console (F12 → Console) for errors.

**On Android:**

- Confirm the app or Chrome is loading the **same** URL where you deployed the new code (with the test button).
- If you’re using the PWA Builder app, ensure it’s not caching an old version of the site (clear app data/cache or reinstall if needed).

---

## After checking

- Once you’ve confirmed the test notification on **web** and **Android**, you can remove or hide the **“Test in-app notification”** button if you don’t want it in production (e.g. show it only in development or behind a feature flag).
