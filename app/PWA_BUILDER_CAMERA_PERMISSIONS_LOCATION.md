# 📷 Where to Find Camera Permissions in PWA Builder

## 🔍 Exact Location in PWA Builder

When generating your iOS app in PWA Builder, the camera permission settings are typically found in one of these places:

---

## 📍 Location 1: iOS Build Configuration Screen

### Step-by-Step:

1. **Go to PWA Builder**: https://www.pwabuilder.com
2. **Enter your URL**: `https://www.jobpool.in`
3. **Click "Build My PWA"**
4. **Select "iOS"**
5. **Look for one of these sections**:
   - **"iOS Settings"** or **"iOS Configuration"**
   - **"Permissions"** or **"App Permissions"**
   - **"Info.plist Settings"** or **"iOS Info.plist"**
   - **"Advanced Settings"** or **"Additional Settings"**
   - **"App Capabilities"** (scroll down)

6. **In that section, look for fields like**:
   - `NSCameraUsageDescription`
   - `Camera Permission`
   - `Camera Usage Description`
   - `Photo Library Permission`
   - `NSPhotoLibraryUsageDescription`

---

## 📍 Location 2: Manifest Editor (Before Building)

Some versions of PWA Builder allow you to edit permissions in the manifest:

1. **In PWA Builder**, before clicking "Build My PWA"
2. **Look for "Manifest" tab** or **"Edit Manifest"** button
3. **Look for "Permissions" section**
4. **Add camera permissions there**

---

## 📍 Location 3: After Download (Manual Edit)

If PWA Builder doesn't have a UI for this:

1. **Generate the iOS app** in PWA Builder
2. **Download the iOS package**
3. **Extract the package**
4. **Find `Info.plist` file** in the extracted folder
5. **Manually edit `Info.plist`** to add:
   ```xml
   <key>NSCameraUsageDescription</key>
   <string>JobPool uses the camera to take photos that you choose to upload. For example, when posting a task, you can take a photo of the work needed (like a broken appliance or room that needs cleaning) to show taskers what needs to be done. You can also take a photo for your profile picture. These photos are only used within the JobPool app and are never shared outside the platform.</string>
   
   <key>NSPhotoLibraryUsageDescription</key>
   <string>JobPool needs access to your photo library to select images for your profile picture, task images, and completion proof. For example, you can choose existing photos from your gallery when uploading task images or your profile picture.</string>
   
   <key>NSPhotoLibraryAddUsageDescription</key>
   <string>JobPool needs permission to save photos to your library when you download task images or completion photos.</string>
   ```
6. **Rebuild the app** in Xcode

---

## 🎯 What to Look For

When you're in PWA Builder's iOS generation screen, look for:

### Visual Indicators:
- ✅ Text input fields labeled with "Camera" or "Photo"
- ✅ Expandable sections with "Permissions" or "iOS Settings"
- ✅ Tabs or sections that say "Advanced", "Settings", or "Configuration"
- ✅ A form with multiple permission fields

### If You Can't Find It:

**Option A: Check PWA Builder Documentation**
- Visit: https://docs.pwabuilder.com
- Search for "iOS permissions" or "camera"

**Option B: Use Manifest File**
- Add permissions to your `manifest.json` (see below)

**Option C: Manual Edit After Download**
- Use Location 3 method above

---

## 📝 Alternative: Add to Your Manifest.json

You can also add camera permissions to your website's `manifest.json`, and PWA Builder might detect them:

### Edit `/app/public/manifest.json`:

```json
{
  "name": "JobPool - Task Marketplace",
  "short_name": "JobPool",
  "description": "Connect with skilled taskers for home services, repairs, and more",
  "start_url": "/",
  "display": "standalone",
  "display_override": ["standalone", "fullscreen"],
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "scope": "/",
  "permissions": [
    {
      "name": "camera",
      "description": "JobPool uses the camera to take photos that you choose to upload. For example, when posting a task, you can take a photo of the work needed (like a broken appliance or room that needs cleaning) to show taskers what needs to be done. You can also take a photo for your profile picture. These photos are only used within the JobPool app and are never shared outside the platform."
    },
    {
      "name": "photo-library",
      "description": "JobPool needs access to your photo library to select images for your profile picture, task images, and completion proof. For example, you can choose existing photos from your gallery when uploading task images or your profile picture."
    }
  ],
  "icons": [
    {
      "src": "/icons/icon-192x192-real.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512-real.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["business", "productivity"],
  "prefer_related_applications": false
}
```

**Note:** This might not work for iOS, but it's worth trying. iOS typically requires `Info.plist` entries.

---

## 🆘 Still Can't Find It?

If PWA Builder doesn't have a UI for camera permissions:

1. **Generate the iOS app anyway**
2. **Download it**
3. **Manually edit the `Info.plist`** (Location 3 method)
4. **Or use Capacitor** instead (which uses your existing `Info.plist`)

---

## ✅ Quick Checklist

When generating iOS app in PWA Builder:

- [ ] Clicked "Build My PWA"
- [ ] Selected "iOS"
- [ ] Looked for "Permissions" or "iOS Settings" section
- [ ] Found camera permission fields
- [ ] Added the three permission descriptions
- [ ] Generated the app

If any step fails, use the manual edit method (Location 3).

