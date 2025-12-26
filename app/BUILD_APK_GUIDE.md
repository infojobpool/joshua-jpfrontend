# Building JobPool Android APK

This guide will help you build a new APK with all the latest mobile UI improvements.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Android Studio** (latest version)
3. **Java JDK** (11 or higher)
4. **Android SDK** (installed via Android Studio)

## Quick Build Steps

### Option 1: Automated Script (Recommended)

```bash
cd app
chmod +x build-apk.sh
./build-apk.sh
```

### Option 2: Manual Steps

1. **Build Next.js for Mobile:**
   ```bash
   cd app
   npm run build:mobile
   ```

2. **Sync Capacitor:**
   ```bash
   npm run cap:sync
   ```

3. **Open Android Studio:**
   ```bash
   npm run cap:android
   ```

4. **In Android Studio:**
   - Wait for Gradle sync to complete
   - Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Wait for build to complete
   - APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

## Recent Mobile UI Changes Included

✅ **Mobile Messaging UI:**
- Fixed message input box visibility (no longer hidden behind nav)
- Improved chat header with cleaner design
- Better back button navigation

✅ **Bottom Navigation:**
- Auto-hide on scroll down
- Auto-show on scroll up
- Smooth animations

✅ **App Icons:**
- Replaced default icons with JobPool logo
- Updated for both iOS and Android

✅ **Login Improvements:**
- Fixed infinite loading
- Better timeout handling
- Improved error messages

## Troubleshooting

### Build Fails with "Gradle Sync Failed"
- Open Android Studio
- Go to **File** → **Invalidate Caches / Restart**
- Try building again

### "SDK not found" Error
- Open Android Studio
- Go to **Tools** → **SDK Manager**
- Install Android SDK Platform 33 or higher

### APK Not Signed
- For testing: Use the debug APK from `android/app/build/outputs/apk/debug/`
- For production: You need to configure signing in `android/app/build.gradle`

## APK Location

After successful build:
- **Debug APK:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK:** `android/app/build/outputs/apk/release/app-release.apk`

## Next Steps

1. Test the APK on a device
2. If everything works, you can distribute it
3. For Play Store: Build an AAB (Android App Bundle) instead of APK

