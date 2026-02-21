# 📱 iOS Push Notifications – Step-by-Step Guide

---

## Prerequisites

- Mac with Xcode installed
- Apple Developer account ($99/year)
- Your JobPool iOS project (from PWA Builder or existing)
- Firebase project with JobPool app

---

## Part 1: Apple Developer Portal (APNs Key)

### 1.1 Create APNs Key

1. Go to [Apple Developer](https://developer.apple.com/account) → sign in
2. **Certificates, Identifiers & Profiles** → **Keys**
3. Click **+** to create a new key
4. Name it: `JobPool APNs Key`
5. Check **Apple Push Notifications service (APNs)**
6. Click **Continue** → **Register**
7. **Download** the `.p8` file (you can only download it once – keep it safe)
8. Note:
   - **Key ID** (e.g. `ABC123XYZ`)
   - **Team ID** (top right of Developer portal)
   - **Bundle ID** of your app (e.g. `in.jobpool.app` or `com.microsoft.pwabuilder-ios`)

---

## Part 2: Firebase Console

### 2.1 Add iOS App (if not done)

1. Go to [Firebase Console](https://console.firebase.google.com) → your **JobPool** project
2. Project overview → **Add app** (or gear icon → Project settings)
3. Click **iOS** (Apple icon)
4. Enter your app’s **Bundle ID** (must match Xcode exactly)
5. App nickname: `JobPool iOS`
6. **Register app** → **Download GoogleService-Info.plist**
7. **Continue** through the rest (you’ll add the plist in Xcode)

### 2.2 Configure APNs in Firebase

1. Firebase Console → **Project Settings** (gear)
2. **Cloud Messaging** tab
3. Under **Apple app configuration**:
   - Select your iOS app (or add it)
   - **Upload** your APNs Authentication Key (`.p8` file)
   - Enter **Key ID**
   - Enter **Team ID**
4. Save

---

## Part 3: Xcode Project Setup

### 3.1 Add GoogleService-Info.plist

1. Open your iOS project in **Xcode**
2. In the Project Navigator (left sidebar), locate `GoogleService-Info.plist`
3. **Delete** the existing one (if it has PWA Builder placeholder values)
4. Drag the **new** `GoogleService-Info.plist` from your Downloads into the Xcode project
5. When prompted: check **Copy items if needed**, ensure your app target is selected
6. Click **Finish**

### 3.2 Add Push Notifications Capability

1. Select your **project** (blue icon) in the navigator
2. Select the **target** (e.g. JobPool, or your app name)
3. Open the **Signing & Capabilities** tab
4. Click **+ Capability**
5. Search for **Push Notifications** → double-click to add
6. Click **+ Capability** again
7. Search for **Background Modes** → double-click to add
8. Under Background Modes, check **Remote notifications**

### 3.3 Fix AppDelegate (if needed)

Your `AppDelegate.swift` must:

1. Call `application.registerForRemoteNotifications()` after setting the notification delegate
2. Implement `application(_:didRegisterForRemoteNotificationsWithDeviceToken:)` and pass the token to Firebase

Check that you have something like:

```swift
// In application(_:didFinishLaunchingWithOptions:), after setting UNUserNotificationCenter delegate:
application.registerForRemoteNotifications()

// This method must exist:
func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    Messaging.messaging().apnsToken = deviceToken
}
```

If these are missing or inside markdown/code blocks, fix them. See `PWA_BUILDER_IOS_CREDENTIALS_CHECK.md` for details.

### 3.4 Increment Version

1. Select your target → **General** tab
2. **Version**: e.g. `1.0.3` (user-visible)
3. **Build**: e.g. `3` (must increase for each App Store upload)

---

## Part 4: Build & Test on Device

### 4.1 Connect iPhone

1. Connect your iPhone via USB
2. Trust the computer if prompted
3. In Xcode, select your **iPhone** as the run destination (not a simulator)

### 4.2 Run the App

1. Click **Run** (▶) or press `Cmd + R`
2. If prompted “Untrusted Developer” on the iPhone:  
   Settings → General → VPN & Device Management → trust your developer certificate
3. Open the app, **sign in**, and **allow notifications** when prompted

### 4.3 Test Push

1. From another device or account, trigger a notification (e.g. send a message, place a bid)
2. Put the app in background or lock the iPhone
3. You should receive a push notification
4. Tap it – the app should open to the correct screen

> ⚠️ Push does **not** work in the iOS Simulator. Use a real device.

---

## Part 5: Submit to App Store

### 5.1 Archive the Build

1. In Xcode, select **Any iOS Device (arm64)** as the destination
2. Menu: **Product** → **Archive**
3. Wait for the archive to finish
4. **Organizer** window opens

### 5.2 Upload to App Store Connect

1. Select your archive → **Distribute App**
2. **App Store Connect** → **Next**
3. **Upload** → **Next**
4. Leave options as default → **Next**
5. **Automatically manage signing** (or your profile) → **Next**
6. **Upload**
7. Wait for processing (usually 5–15 minutes)

### 5.3 Submit for Review

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. **My Apps** → select **JobPool**
3. Click **+** next to **iOS App** (or the version number) to add a new version
4. Enter version: `1.0.3` (must match Xcode)
5. Under **Build**, click **+** and select the build you just uploaded
6. **What’s New in This Version**: e.g. “Improved push notifications for bids, messages, and task updates”
7. Fill in any other required fields
8. **Add for Review** → **Submit to App Review**

---

## Quick Checklist

- [ ] APNs key created in Apple Developer
- [ ] APNs key uploaded in Firebase (Cloud Messaging)
- [ ] iOS app added in Firebase with correct Bundle ID
- [ ] GoogleService-Info.plist downloaded and added to Xcode
- [ ] Push Notifications capability added
- [ ] Background Modes → Remote notifications enabled
- [ ] AppDelegate registers for remote notifications and passes token to FCM
- [ ] Version and Build numbers incremented
- [ ] Tested on a real iPhone
- [ ] Archived and uploaded to App Store Connect
- [ ] Submitted for review

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No push received | Test on a physical device, not simulator |
| "Invalid APNs token" | Ensure APNs key is uploaded in Firebase and Bundle ID matches |
| Token not registering | Check GoogleService-Info.plist and that `didRegisterForRemoteNotificationsWithDeviceToken` passes token to FCM |
| Build fails | Ensure Push Notifications and Background Modes capabilities are added |
| App rejected | Provide clear “What’s New” text; ensure notification permission request has a clear explanation |
