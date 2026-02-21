# 📱 Android – Build New Version Step by Step

---

## Part 1: Prepare the Project

### Step 1.1: Ensure Web App Is Built

1. Open terminal in your project
2. Go to the app folder:
   ```bash
   cd /Users/joshuabayagalla/jobpoolfrontendsept/app
   ```
3. Build the web app:
   ```bash
   npm run build
   ```

### Step 1.2: Sync Capacitor (copy web build to Android)

```bash
npx cap sync android
```

---

## Part 2: Firebase Configuration

### Step 2.1: Get google-services.json

1. Go to [Firebase Console](https://console.firebase.google.com) → your **JobPool** project
2. **Project Settings** (gear) → **Your apps**
3. Find your **Android** app (package: `com.jobpool.app`)
   - If it doesn’t exist: **Add app** → **Android** → package name `com.jobpool.app`
4. Download **google-services.json**

### Step 2.2: Add google-services.json to Project

1. Copy `google-services.json` into:
   ```
   app/android/app/google-services.json
   ```
2. Replace the existing file if one is there

---

## Part 3: Bump Version Number

### Step 3.1: Edit build.gradle

1. Open: `app/android/app/build.gradle`
2. Find:
   ```gradle
   versionCode 1
   versionName "1.0"
   ```
3. Change to (example for a new release):
   ```gradle
   versionCode 2
   versionName "1.0.1"
   ```
   - **versionCode**: increase by 1 for each Play Store upload (e.g. 1 → 2 → 3)
   - **versionName**: user-facing version (e.g. 1.0 → 1.0.1 → 1.0.2)

---

## Part 4: Build the AAB (for Play Store)

### Step 4.1: Open in Android Studio

1. Open **Android Studio**
2. **File** → **Open**
3. Select: `app/android` (the whole `android` folder)
4. Wait for Gradle sync

### Step 4.2: Build the Release AAB

1. Menu: **Build** → **Generate Signed Bundle / APK**
2. Select **Android App Bundle** → **Next**
3. **Create new** (or choose existing keystore):
   - **Key store path**: choose a location (e.g. `jobpool-release.keystore`)
   - **Password**: set and remember
   - **Alias**: e.g. `jobpool`
   - **Key password**: set
   - Fill Certificate info (name, org, etc.)
4. Click **Next**
5. Select **release** build variant
6. Click **Create**

The AAB will be at:
```
app/android/app/build/outputs/bundle/release/app-release.aab
```

---

## Part 5: Alternative – Build from Command Line

If you already have a keystore:

```bash
cd app/android
./gradlew bundleRelease
```

The AAB is in: `app/build/outputs/bundle/release/app-release.aab`

---

## Part 6: Upload to Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your **JobPool** app
3. **Production** (or **Internal testing**) → **Create new release**
4. **Upload** → select `app-release.aab`
5. Add **Release notes**: e.g. "Improved push notifications for bids, messages, and task updates"
6. **Save** → **Review release** → **Start rollout to Production**

---

## Quick Checklist

| Step | Action |
|------|--------|
| 1 | `npm run build` in app folder |
| 2 | `npx cap sync android` |
| 3 | Add `google-services.json` to `app/android/app/` |
| 4 | Bump `versionCode` and `versionName` in `app/build.gradle` |
| 5 | Build signed AAB in Android Studio |
| 6 | Upload AAB to Play Console |

---

## First-Time Keystore (Signing)

If this is your first release:

1. When you choose **Create new** keystore, save the keystore file and passwords in a safe place.
2. You will need the same keystore for all future updates.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `google-services.json not found` | Add the file to `app/android/app/` |
| Build fails | Run `npx cap sync android` and ensure `npm run build` completed |
| Wrong package name | Check `applicationId` in `app/build.gradle` matches Firebase |
| Push not working | Confirm `google-services.json` is from the correct Firebase project and package name |
