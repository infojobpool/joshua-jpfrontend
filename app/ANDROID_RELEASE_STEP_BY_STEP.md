# 📱 Android Release – Full Step-by-Step Guide

---

## Your keystore
- **Path:** `/Users/joshuabayagalla/Downloads/JobPool andriod/signing.keystore`
- You need: keystore password, key alias, key password

---

## Step 1: Get the key alias (if you don’t remember it)

1. Open **Terminal**
2. Run:
   ```bash
   keytool -list -keystore "/Users/joshuabayagalla/Downloads/JobPool andriod/signing.keystore"
   ```
3. Enter the keystore password when asked
4. In the output, note the **alias** under “Alias name” (e.g. `mykey`, `upload`, `release`)

---

## Step 2: Build the web app

1. Open **Terminal**
2. Go to the app folder:
   ```bash
   cd /Users/joshuabayagalla/jobpoolfrontendsept/app
   ```
3. Build:
   ```bash
   npm run build
   ```
4. Wait until it finishes

---

## Step 3: Sync Capacitor (web → Android)

1. In the same terminal, run:
   ```bash
   npx cap sync android
   ```
2. Wait until it completes

---

## Step 4: Bump version number

1. Open this file in your editor:
   ```
   app/android/app/build.gradle
   ```
2. Find:
   ```gradle
   versionCode 1
   versionName "1.0"
   ```
3. Change to (for example):
   ```gradle
   versionCode 2
   versionName "1.0.1"
   ```
   - `versionCode` must be higher than the last release
   - `versionName` is what users see (e.g. 1.0.1, 1.0.2)
4. Save the file

---

## Step 5: Add `google-services.json`

1. Go to [Firebase Console](https://console.firebase.google.com) → **JobPool** project
2. **Project Settings** (gear) → **Your apps** → Android app
3. Download **google-services.json**
4. Copy it to:
   ```
   app/android/app/google-services.json
   ```
5. Replace the old file if it exists

---

## Step 6: Open project in Android Studio

1. Open **Android Studio**
2. **File** → **Open**
3. Go to and select the `android` folder:
   ```
   /Users/joshuabayagalla/jobpoolfrontendsept/app/android
   ```
4. Click **Open**
5. Wait for Gradle sync to finish

---

## Step 7: Build signed AAB with your keystore

1. Menu: **Build** → **Generate Signed Bundle / APK**
2. Select **Android App Bundle** → **Next**
3. On the keystore screen:
   - Select **Use existing keystore**
   - **Key store path:** click the folder icon and choose:
     ```
     /Users/joshuabayagalla/Downloads/JobPool andriod/signing.keystore
     ```
   - **Key store password:** enter your keystore password
   - **Key alias:** select your alias from the dropdown (or type it if you know it)
   - **Key password:** enter your key password
4. Click **Next**
5. Choose **release** build variant
6. Click **Create**
7. Wait for the build to finish

---

## Step 8: Find the AAB file

The signed AAB is here:
```
app/android/app/build/outputs/bundle/release/app-release.aab
```

You can open it from **Android Studio** → **Build** → **Locate** in the notification, or via Finder.

---

## Step 9: Upload to Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your **Job Pool** app
3. Left sidebar: **Production** (under “Test and release”)
4. Click **Create new release**
5. Click **Upload** and select `app-release.aab`
6. Add **Release notes**, e.g.:  
   `Improved push notifications for bids, messages, and task updates`
7. Click **Save** (or **Next**)
8. Click **Review release**
9. Click **Start rollout to Production**

---

## Quick checklist

| Step | Action |
|------|--------|
| 1 | Get key alias with `keytool -list -keystore "..."` |
| 2 | `npm run build` in app folder |
| 3 | `npx cap sync android` |
| 4 | Bump `versionCode` and `versionName` in `app/build.gradle` |
| 5 | Add `google-services.json` to `app/android/app/` |
| 6 | Open `app/android` in Android Studio |
| 7 | Build → Generate Signed Bundle → use existing keystore |
| 8 | Locate `app-release.aab` |
| 9 | Upload to Play Console → Create new release → Start rollout |
