# PWA Builder iOS App – Firebase & Credentials Check

Checked: **JobPool IOS VER 2** (in your Downloads folder).

---

## What’s already correct

1. **AppDelegate.swift**
   - Imports Firebase (`FirebaseCore`, `FirebaseMessaging`) and `UserNotifications`.
   - Calls `FirebaseApp.configure()`.
   - Sets `Messaging.messaging().delegate = self`.
   - Implements `MessagingDelegate` and posts FCM token via `NotificationCenter` and `handleFCMToken()`.
   - Handles remote notifications and forwards payload to WebView (`sendPushToWebView`, `sendPushClickToWebView`).

2. **PushNotifications.swift**
   - Handles permission request, FCM token, and push events to WebView.
   - Uses `push-notification`, `push-notification-click`, `push-token`, `push-permission-request`, `push-permission-state` for the web layer.

3. **Info.plist**
   - Camera and photo library usage descriptions are set.
   - `UIBackgroundModes` includes `remote-notification`.
   - `WKAppBoundDomains` includes `www.jobpool.in`.

4. **GoogleService-Info.plist**
   - File exists.
   - **Issue:** Most values are still PWA Builder placeholders (see below).

---

## Issues found and fixes

### 1. GoogleService-Info.plist – use your real Firebase file

Current file still has template/placeholder values, for example:

- `CLIENT_ID`: `000000000000-...`
- `BUNDLE_ID`: `com.microsoft.pwabuilder-ios`
- `PROJECT_ID`: `pwabuilder-ios-template`
- `GCM_SENDER_ID`: `000000000000`
- `API_KEY`: `000000000000...`

Only `GOOGLE_APP_ID` looks real (`1:619930292029:ios:f6737372189b8ee9123f54`).

**What to do:**

1. Open [Firebase Console](https://console.firebase.google.com) → your **JobPool** project.
2. Project Settings (gear) → **Your apps** → select your **iOS** app (or add one with your app’s bundle ID).
3. Download **GoogleService-Info.plist**.
4. In Xcode, **replace** the existing `GoogleService-Info.plist` in the JobPool target with this file (or drag it in and ensure it’s in “Copy items if needed” and added to the JobPool target).

Until the plist matches your Firebase project and bundle ID, FCM may not work correctly.

---

### 2. AppDelegate.swift – register for remote notifications (fixed in repo copy)

Two things were wrapped in markdown and not valid Swift:

- `application.registerForRemoteNotifications()` was inside \`\`\`swift ... \`\`\`, so it never ran.
- `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)` was also in a markdown block, so the APNs token was never given to FCM.

**Fix applied** (see below): those blocks were converted to real Swift so that:

- The app calls `application.registerForRemoteNotifications()` on launch (after setting the notification center delegate).
- The app implements `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)` and sets `Messaging.messaging().apnsToken = deviceToken`.

You need to apply the same changes in your **Downloads** project: remove the \`\`\`swift / \`\`\` lines and use the corrected Swift from the fixed file.

---

### 3. Settings.swift – valid Swift (fixed in repo copy)

The real configuration (`gcmMessageIDKey`, `rootUrl`, `allowedOrigins`, etc.) was inside a markdown code block (\`\`\`swift ... \`\`\`), so the compiler treated it as invalid and `gcmMessageIDKey` was not available to AppDelegate.

**Fix applied:** The markdown fences were removed so that all settings are normal Swift. You need to do the same in your **Downloads** project so that `gcmMessageIDKey` and the rest compile and link correctly.

---

## Summary

| Item                         | Status | Action |
|------------------------------|--------|--------|
| Firebase in AppDelegate      | OK     | None   |
| Push handling to WebView     | OK     | None   |
| Info.plist (permissions, background) | OK | None   |
| GoogleService-Info.plist     | Needs update | Replace with plist from Firebase Console for your JobPool iOS app. |
| AppDelegate: register + token | Was broken | Use the fixed AppDelegate (real Swift, no markdown). |
| Settings.swift (gcmMessageIDKey etc.) | Was broken | Use the fixed Settings (real Swift, no markdown). |

After replacing the plist and applying the AppDelegate and Settings fixes in **JobPool IOS VER 2**, rebuild in Xcode and test on a real device. Push will only work once the correct **GoogleService-Info.plist** is in place and the two Swift files are fixed as above.
