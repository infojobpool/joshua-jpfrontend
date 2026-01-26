# 📷 Camera Permissions for PWA Builder iOS App

## ⚠️ Important Note

When using **PWA Builder**, the camera purpose strings in your local `Info.plist` file **will NOT apply**. PWA Builder generates apps from your live website and doesn't use your Capacitor iOS project files.

## ✅ Solution: Configure in PWA Builder

When generating your iOS app in PWA Builder, you need to configure the camera permissions in their interface.

### Step-by-Step:

1. **Go to PWA Builder**: https://www.pwabuilder.com
2. **Enter your URL**: `https://www.jobpool.in`
3. **Click "Build My PWA"**
4. **Select "iOS"**
5. **Look for "Permissions" or "iOS Configuration" section**
6. **Add Camera Permission Description**:

   Use this text:
   ```
   JobPool uses the camera to take photos that you choose to upload. For example, when posting a task, you can take a photo of the work needed (like a broken appliance or room that needs cleaning) to show taskers what needs to be done. You can also take a photo for your profile picture. These photos are only used within the JobPool app and are never shared outside the platform.
   ```

7. **Add Photo Library Permission Description**:
   ```
   JobPool needs access to your photo library to select images for your profile picture, task images, and completion proof. For example, you can choose existing photos from your gallery when uploading task images or your profile picture.
   ```

8. **Add Photo Library Add Permission Description**:
   ```
   JobPool needs permission to save photos to your library when you download task images or completion photos.
   ```

## 🔄 Alternative: Use Capacitor (If PWA Builder Doesn't Support This)

If PWA Builder doesn't have a way to configure camera permissions, you'll need to:

1. **Fix the static export build error** (the `generateStaticParams` issue)
2. **Use Capacitor** to build the iOS app
3. **Your `Info.plist` will then work** as expected

---

## 📝 Current Info.plist Configuration

Your current `Info.plist` has these settings (for reference):

```xml
<key>NSCameraUsageDescription</key>
<string>JobPool uses the camera to take photos that you choose to upload. For example, when posting a task, you can take a photo of the work needed (like a broken appliance or room that needs cleaning) to show taskers what needs to be done. You can also take a photo for your profile picture. These photos are only used within the JobPool app and are never shared outside the platform.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>JobPool needs access to your photo library to select images for your profile picture, task images, and completion proof. For example, you can choose existing photos from your gallery when uploading task images or your profile picture.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>JobPool needs permission to save photos to your library when you download task images or completion photos.</string>
```

Copy these descriptions when configuring PWA Builder.

