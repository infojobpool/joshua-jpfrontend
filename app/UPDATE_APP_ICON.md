# Update JobPool App Icon (Android & PWA)

Use this guide to replace the JobPool app icon with a new design on Android and the web PWA.

## Quick steps

### 1. Prepare your icon

- **Format:** PNG (square)
- **Size:** 512×512 or 1024×1024
- **Background:** Transparent recommended (use [remove.bg](https://remove.bg) or similar if needed)

### 2. Place the icon

Put your icon in `app/public/images/` and name it `jobpool-logo.png`,  
**or** keep it anywhere and pass the path when running the script.

### 3. Run the update script

From the `app/` directory:

```bash
cd app

# Option A: Use default path (public/images/jobpool-logo.png)
./update-icons-transparent.sh

# Option B: Use your own file
./update-icons-transparent.sh /path/to/your-new-icon.png
```

### 4. Rebuild the Android app

```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

For a release build:

```bash
./gradlew assembleRelease
```

## What gets updated

- **PWA / Web:** `public/icons/` (192×192, 512×512) and `manifest.json`
- **Android:** `android/app/src/main/res/mipmap-*/` (ic_launcher, ic_launcher_round, ic_launcher_foreground)
- **iOS:** `ios/App/App/Assets.xcassets/AppIcon.appiconset/` (if `ios/` exists)

## Tips

- Use a transparent background so the icon looks good on different backgrounds.
- Test on a real device after rebuilding.
- Uninstall and reinstall the app if the new icon does not show up.
