# 📱 Updating Live Mobile Apps for Push Notifications

Your push notifications work on the web. To get them working in your **live** Android and iOS apps (already on Play Store & App Store), follow this guide.

---

## Overview

| Step | Android | iOS |
|------|---------|-----|
| 1. Web app live | ✅ Same (www.jobpool.in) | ✅ Same |
| 2. Rebuild app | PWA Builder or existing project | PWA Builder or Xcode |
| 3. Firebase config | google-services.json | GoogleService-Info.plist |
| 4. Version bump | versionCode + versionName | CFBundleVersion + CFBundleShortVersionString |
| 5. Store submission | Play Console | App Store Connect |

---

## Step 1: Confirm Web App Is Up to Date

The mobile apps load **www.jobpool.in**. Push logic lives in the web app, so it must be deployed.

- [ ] Push latest code: `git push origin clean-main`
- [ ] Check Vercel: production deploy completed for `clean-main`
- [ ] Open https://www.jobpool.in in a browser, allow notifications, confirm you receive a test push

---

## Step 2: Rebuild Mobile Apps

### Option A: PWA Builder (simplest)

1. Go to **https://www.pwabuilder.com**
2. Enter `https://www.jobpool.in` → **Start**
3. **Build My PWA** → **Android** → download (APK/AAB)
4. **Build My PWA** → **iOS** → download (Xcode project or package)

### Option B: Existing Projects

If you already have Android Studio / Xcode projects:

- **Android**: Open project, sync Gradle, ensure `google-services.json` is from your Firebase project
- **iOS**: Open in Xcode, ensure `GoogleService-Info.plist` is correct (see `PWA_BUILDER_IOS_CREDENTIALS_CHECK.md`)

---

## Step 3: Firebase Setup for Both Platforms

### Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com) → your **JobPool** project
2. **Project Settings** (gear) → **Your apps**

### Android

- [ ] Android app exists with **package name** matching your app (e.g. `in.jobpool.app` or from PWA Builder)
- [ ] Download **google-services.json** and place it in `android/app/` (if using Android Studio project)
- [ ] PWA Builder Android builds usually include a default config; if push fails, add your own Firebase Android app and rebuild with your `google-services.json`

### iOS

- [ ] iOS app exists with **bundle ID** matching your app (e.g. `in.jobpool.app` or from PWA Builder)
- [ ] Download **GoogleService-Info.plist** from Firebase
- [ ] Replace the one in your Xcode project (see `PWA_BUILDER_IOS_CREDENTIALS_CHECK.md` for details)
- [ ] In Xcode: **Signing & Capabilities** → add **Push Notifications**
- [ ] In Xcode: **Signing & Capabilities** → add **Background Modes** → enable **Remote notifications**
- [ ] Apple Developer: create **APNs key** (`.p8`) and configure in Firebase (Project Settings → Cloud Messaging → Apple app config)

---

## Step 4: Increment Version Numbers

Stores require a higher version for each release.

### Android (build.gradle or app/build.gradle)

```gradle
versionCode 3        // was 2 → increment
versionName "1.0.3"  // was "1.0.2" → increment
```

### iOS (Info.plist or Xcode)

- **CFBundleShortVersionString**: e.g. `1.0.3` (user-visible)
- **CFBundleVersion**: e.g. `3` (build number)

---

## Step 5: Submit to Stores

### Google Play Store

1. [Play Console](https://play.google.com/console) → your app
2. **Production** (or **Internal testing** first) → **Create new release**
3. Upload the new **AAB** (preferred) or APK
4. Release notes: e.g. "Improved push notifications for bids, messages, and task updates"
5. **Review release** → **Start rollout**

### Apple App Store

1. [App Store Connect](https://appstoreconnect.apple.com) → your app
2. **+** to add new version (e.g. 1.0.3)
3. In Xcode: **Product** → **Archive** → **Distribute App** → **App Store Connect**
4. Upload the build
5. In App Store Connect: select the new build, add “What’s New” (e.g. “Improved push notifications”), submit for review

---

## Step 6: Test Before Full Rollout

### Play Store

- Use **Internal testing** or **Closed testing** track first
- Add your own email, install, test push on a real device

### App Store

- Use **TestFlight**: upload build → add testers → install via TestFlight app
- Test push on a **physical device** (push does not work in the simulator)

---

## Checklist Before Submission

- [ ] www.jobpool.in has latest push code deployed
- [ ] Firebase: Android and iOS apps added with correct package/bundle ID
- [ ] Firebase: `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) in app
- [ ] iOS: Push Notifications + Remote notifications capabilities enabled
- [ ] iOS: APNs key configured in Firebase
- [ ] Version numbers incremented
- [ ] Tested on at least one real Android device and one real iOS device

---

## Timeline

| Store | Typical review time |
|-------|---------------------|
| Google Play | 1–3 days |
| Apple App Store | 1–7 days |

---

## Troubleshooting

**No push on Android**

- Confirm `google-services.json` matches your Firebase Android app
- Check notification permission (Android 13+ must request POST_NOTIFICATIONS)
- Ensure backend receives token with `platform: "android"` from `register-push/`

**No push on iOS**

- Test on a physical device (simulator does not support push)
- Verify `GoogleService-Info.plist` and bundle ID
- Confirm APNs key in Firebase and Push Notifications capability in Xcode
- Ensure backend receives token with `platform: "ios"` from `register-push/`
