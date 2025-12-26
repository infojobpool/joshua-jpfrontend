# Quick APK Build Guide

## Fastest Way to Build APK

### 1. Run the build script:
```bash
cd app
./build-apk.sh
```

### 2. In Android Studio (will open automatically):
- Wait for Gradle sync
- **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- Wait for build to finish

### 3. Find your APK:
- **Release:** `android/app/build/outputs/apk/release/app-release.apk`
- **Debug (for testing):** `android/app/build/outputs/apk/debug/app-debug.apk`

## What's New in This Build?

✨ **Mobile Messaging UI** - Fixed input box visibility  
✨ **Auto-hide Navigation** - Bottom nav hides/shows on scroll  
✨ **JobPool Logo** - Replaced default app icons  
✨ **Better Login** - Fixed infinite loading issues  

## Troubleshooting

**"Gradle Sync Failed"** → File → Invalidate Caches / Restart in Android Studio

**"SDK not found"** → Tools → SDK Manager → Install Android SDK Platform 33+

**Script won't run** → `chmod +x build-apk.sh` then try again

