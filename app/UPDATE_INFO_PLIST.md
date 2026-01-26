# 📝 Update Your Info.plist with Camera Permissions

## Current Status

Your `Info.plist` already has `NSCameraUsageDescription`, but it's too generic:
- Current: `"Capture Video by user request"` ❌
- Apple requires: Detailed explanation with examples ✅

You're also missing:
- `NSPhotoLibraryUsageDescription` ❌
- `NSPhotoLibraryAddUsageDescription` ❌

---

## ✅ Updated Info.plist

Replace the camera permission and add the photo library permissions. Here's what to change:

### Find This Section (around line 9-11):

```xml
<key>NSCameraUsageDescription</key>
<string>Capture Video by user request</string>
```

### Replace It With:

```xml
<key>NSCameraUsageDescription</key>
<string>JobPool uses the camera to take photos that you choose to upload. For example, when posting a task, you can take a photo of the work needed (like a broken appliance or room that needs cleaning) to show taskers what needs to be done. You can also take a photo for your profile picture. These photos are only used within the JobPool app and are never shared outside the platform.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>JobPool needs access to your photo library to select images for your profile picture, task images, and completion proof. For example, you can choose existing photos from your gallery when uploading task images or your profile picture.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>JobPool needs permission to save photos to your library when you download task images or completion photos.</string>
```

---

## 📋 Complete Updated Section

After the `NSLocationWhenInUseUsageDescription` entry, your permissions section should look like this:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>Capture Audio by user request</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Track current location by user request</string>
<key>NSCameraUsageDescription</key>
<string>JobPool uses the camera to take photos that you choose to upload. For example, when posting a task, you can take a photo of the work needed (like a broken appliance or room that needs cleaning) to show taskers what needs to be done. You can also take a photo for your profile picture. These photos are only used within the JobPool app and are never shared outside the platform.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>JobPool needs access to your photo library to select images for your profile picture, task images, and completion proof. For example, you can choose existing photos from your gallery when uploading task images or your profile picture.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>JobPool needs permission to save photos to your library when you download task images or completion photos.</string>
```

---

## 🎯 Step-by-Step

1. **Open your `Info.plist` file** in a text editor
2. **Find this line** (around line 9):
   ```xml
   <string>Capture Video by user request</string>
   ```
3. **Replace the entire camera section** with the updated version above
4. **Add the two photo library permissions** (they should go right after the camera permission)
5. **Save the file**
6. **Open in Xcode** and verify the permissions appear correctly
7. **Build/Archive** your app

---

## ✅ Verification

After updating, your `Info.plist` should have:
- ✅ `NSCameraUsageDescription` - with detailed explanation
- ✅ `NSPhotoLibraryUsageDescription` - for selecting photos
- ✅ `NSPhotoLibraryAddUsageDescription` - for saving photos

All three are required for App Store submission if your app uses camera/photo features.

---

## 📝 Note

The other permissions in your file (microphone, location) are fine to keep as-is, unless you want to update them with more detailed descriptions too.

