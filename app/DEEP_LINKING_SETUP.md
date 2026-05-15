# Deep Linking Setup for JobPool

This guide explains how to make shared task links (e.g. `https://www.jobpool.in/tasks/task_15`) open directly in the JobPool app when the user has it installed, and how to handle the flow when they install and sign in first.

---

## What's Been Set Up

1. **`.well-known/apple-app-site-association`** (AASA) – for iOS Universal Links  
2. **`.well-known/assetlinks.json`** – for Android App Links  

These files tell iOS and Android that `jobpool.in/tasks/*` URLs should open in the JobPool app when it's installed.

---

## How It Works

### When the app IS installed
- User taps a shared link (e.g. in WhatsApp): `https://www.jobpool.in/tasks/task_15`
- iOS/Android checks AASA/assetlinks and sees JobPool handles these URLs
- The app opens and loads that URL → user sees the task page directly

### When the app is NOT installed (deferred deep linking)
1. User taps link → web browser opens and shows the task page
2. User can sign in on the web and view the task
3. User can install the app from the Play Store / App Store
4. For full “install → sign in → land on that task” flow, you need either:
   - A service like **Branch.io** or **Adjust** (link wrapping + native SDK), or  
   - Custom backend logic (store pending task ID by install campaign, etc.)

---

## iOS Setup (Universal Links)

### 1. Get your Apple Team ID
- Go to [Apple Developer](https://developer.apple.com/account) → Membership
- Copy your **Team ID** (e.g. `ABC12DEF34`)

### 2. Update AASA
Edit `app/public/.well-known/apple-app-site-association` and replace `YOUR_APPLE_TEAM_ID` with your Team ID:

```json
"appID": "ABC12DEF34.com.jobpool.app"
```

### 3. Add Associated Domains in Xcode
1. Open `app/ios/App/App.xcworkspace` in Xcode  
2. Select the **App** target → **Signing & Capabilities**  
3. Click **+ Capability** → add **Associated Domains**  
4. Add: `applinks:www.jobpool.in`

### 4. Verify
- Deploy the web app so AASA is live at `https://www.jobpool.in/.well-known/apple-app-site-association`
- Test using Apple's validator: https://search.developer.apple.com/appsearch-validation-tool/

---

## Android Setup (App Links)

### 1. Get your SHA-256 fingerprint

For **Trusted Web Activity / Play installs**, Chrome verifies against the certificate Google uses to **sign the APK users download** — that is usually **Play App Signing**, not your upload key.

- Play Console → Your app → **Release → Setup → App signing**
- Copy **SHA-256 certificate fingerprint** under **App signing key certificate** (colon-separated hex).

If you still ship an older listing with a different application ID, copy that app’s **App signing** fingerprint too.

### 2. Update assetlinks.json

Edit `app/public/.well-known/assetlinks.json`. It lists **three** application IDs so you can match **iOS AASA** plus common **Capacitor / PWABuilder** package names:

- **`com.jobpool.www`** — live (aligned with App Store primary)  
- **`in.jobpool.www`** — legacy Android / iOS-style id if you still ship it  
- **`com.jobpool.app`** — template in this repo; **remove this block** if that ID is not on Play

Replace placeholders with **colon-separated** SHA-256 values from Play (**App signing key**):

- `YOUR_PLAY_APP_SIGNING_SHA256` → fingerprint for the **`com.jobpool.www`** Play app  
- `YOUR_PLAY_APP_SIGNING_SHA256_LEGACY` → fingerprint for **`in.jobpool.www`** if you still distribute it (often same value if one team key; use each app’s Play Console value if they differ)
- `YOUR_PLAY_APP_SIGNING_SHA256_COM_JOBPOOL_APP` → fingerprint for **`com.jobpool.app`** if that listing exists; otherwise delete that JSON object

Example shape:

```json
"sha256_cert_fingerprints": [
  "AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99"
]
```

If your **PWABuilder** package name is something else (e.g. `com.jobpool.app`), **add another object** in the JSON array with that `package_name` and **its** App signing fingerprint — Android matches **exactly** `applicationId`.

Serve the same file on **`https://jobpool.in`** and **`https://www.jobpool.in`** if users open either host (recommended).

### 3. Verify

- Deploy and check: https://www.jobpool.in/.well-known/assetlinks.json  
- Use: https://developers.google.com/digital-asset-links/tools/generator  

---

## Next.js/Vercel

Content-Type for AASA is set in `next.config.js` so it’s served as `application/json`.

---

## Deferred Deep Linking (Optional)

For “install → sign in → open that specific task”:

1. **Branch.io** – wrap links, integrate SDK, configure fallbacks
2. **Firebase Dynamic Links** – deprecated; not recommended for new setups
3. **Custom flow** – store pending task ID on the backend (e.g. via install referrer / campaign) and restore it on first app open

---

## Troubleshooting

- **iOS**: Universal Links fail if the app was opened recently; close it fully and tap the link again.
- **Android**: Check that the app is the default handler for your domain.
- **Cache**: Both platforms cache AASA/assetlinks; changes can take up to 24 hours to propagate.
