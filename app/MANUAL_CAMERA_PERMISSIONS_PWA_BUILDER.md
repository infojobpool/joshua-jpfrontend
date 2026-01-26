# 📷 Manual Camera Permissions Setup for PWA Builder iOS App

## ✅ Solution: Edit Info.plist After Download

Since PWA Builder doesn't have a permissions UI, you'll need to manually add camera permissions to the generated iOS app.

---

## 📋 Step-by-Step Instructions

### Step 1: Generate iOS App in PWA Builder

1. Go to https://www.pwabuilder.com
2. Enter your URL: `https://www.jobpool.in`
3. Click **"Build My PWA"**
4. Select **"iOS"**
5. Fill in app details:
   - **Bundle ID**: `com.jobpool.app`
   - **App Name**: `JobPool`
   - **Version**: `1.0.0`
6. Click **"Generate"**
7. **Download the iOS package** (usually a `.zip` or `.tar.gz` file)

---

### Step 2: Extract the iOS Package

1. **Find the downloaded file** (in Downloads folder)
2. **Extract it** (double-click on Mac, or use unzip)
3. **You should see a folder** with iOS project files

---

### Step 3: Find Info.plist File

The `Info.plist` file is typically located at one of these paths:

```
📁 Extracted Folder
  └── 📁 App (or App.xcodeproj or similar)
      └── 📁 App (or App.app)
          └── 📄 Info.plist
```

**OR**

```
📁 Extracted Folder
  └── 📁 ios
      └── 📁 App
          └── 📄 Info.plist
```

**Look for**: A file named `Info.plist` in the iOS project structure.

---

### Step 4: Edit Info.plist

1. **Open `Info.plist`** in a text editor (TextEdit, VS Code, or Xcode)
2. **Find the closing `</dict>` tag** (near the end of the file)
3. **Add these lines BEFORE the closing `</dict>` tag**:

```xml
	<key>NSCameraUsageDescription</key>
	<string>JobPool uses the camera to take photos that you choose to upload. For example, when posting a task, you can take a photo of the work needed (like a broken appliance or room that needs cleaning) to show taskers what needs to be done. You can also take a photo for your profile picture. These photos are only used within the JobPool app and are never shared outside the platform.</string>
	<key>NSPhotoLibraryUsageDescription</key>
	<string>JobPool needs access to your photo library to select images for your profile picture, task images, and completion proof. For example, you can choose existing photos from your gallery when uploading task images or your profile picture.</string>
	<key>NSPhotoLibraryAddUsageDescription</key>
	<string>JobPool needs permission to save photos to your library when you download task images or completion photos.</string>
```

4. **Save the file**

---

### Step 5: Open in Xcode and Build

1. **Open Xcode** (if you have it installed)
2. **Open the project**: File → Open → Select the `.xcodeproj` or `.xcworkspace` file
3. **Verify the permissions**:
   - In Xcode, select the project in the left sidebar
   - Select the **App** target
   - Go to **Info** tab
   - You should see the three camera permission entries
4. **Build the app**:
   - Product → Archive (for App Store)
   - Or Product → Build (for testing)

---

## 🔄 Alternative: Use Xcode to Edit

If you have Xcode installed, you can edit `Info.plist` directly in Xcode:

1. **Open the project in Xcode**
2. **Find `Info.plist`** in the project navigator (left sidebar)
3. **Click on it** to open in the editor
4. **Right-click** in the editor → **"Add Row"**
5. **Add these three entries**:

| Key | Type | Value |
|-----|------|-------|
| `Privacy - Camera Usage Description` | String | `JobPool uses the camera to take photos that you choose to upload. For example, when posting a task, you can take a photo of the work needed (like a broken appliance or room that needs cleaning) to show taskers what needs to be done. You can also take a photo for your profile picture. These photos are only used within the JobPool app and are never shared outside the platform.` |
| `Privacy - Photo Library Usage Description` | String | `JobPool needs access to your photo library to select images for your profile picture, task images, and completion proof. For example, you can choose existing photos from your gallery when uploading task images or your profile picture.` |
| `Privacy - Photo Library Additions Usage Description` | String | `JobPool needs permission to save photos to your library when you download task images or completion photos.` |

**Note**: Xcode shows friendly names like "Privacy - Camera Usage Description", but they map to `NSCameraUsageDescription` in the actual file.

---

## 📝 Example Info.plist (Before and After)

### Before:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDisplayName</key>
	<string>JobPool</string>
	<key>CFBundleIdentifier</key>
	<string>com.jobpool.app</string>
	<!-- ... other keys ... -->
</dict>
</plist>
```

### After (with camera permissions):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>CFBundleDisplayName</key>
	<string>JobPool</string>
	<key>CFBundleIdentifier</key>
	<string>com.jobpool.app</string>
	<!-- ... other keys ... -->
	<key>NSCameraUsageDescription</key>
	<string>JobPool uses the camera to take photos that you choose to upload. For example, when posting a task, you can take a photo of the work needed (like a broken appliance or room that needs cleaning) to show taskers what needs to be done. You can also take a photo for your profile picture. These photos are only used within the JobPool app and are never shared outside the platform.</string>
	<key>NSPhotoLibraryUsageDescription</key>
	<string>JobPool needs access to your photo library to select images for your profile picture, task images, and completion proof. For example, you can choose existing photos from your gallery when uploading task images or your profile picture.</string>
	<key>NSPhotoLibraryAddUsageDescription</key>
	<string>JobPool needs permission to save photos to your library when you download task images or completion photos.</string>
</dict>
</plist>
```

---

## ⚠️ Important Notes

1. **Indentation**: Make sure the XML is properly indented (use tabs or spaces consistently)

2. **File Format**: `Info.plist` must be valid XML - don't break the structure

3. **Location**: The permissions must be inside the `<dict>` tag, before the closing `</dict>`

4. **Testing**: After adding permissions, test the app to ensure camera access works

5. **App Store**: These permissions are **required** for App Store submission if your app uses the camera

---

## 🆘 Troubleshooting

### Can't find Info.plist?
- Look for files ending in `.plist`
- Check the Xcode project structure
- It might be in a nested folder

### Xcode won't open the project?
- Make sure you have Xcode installed (Mac only)
- Try opening the `.xcworkspace` file instead of `.xcodeproj`
- Check if the project structure is correct

### Permissions not working?
- Verify the XML syntax is correct
- Make sure you saved the file
- Rebuild the app in Xcode
- Check that the keys are spelled correctly (case-sensitive)

---

## ✅ Quick Checklist

- [ ] Generated iOS app in PWA Builder
- [ ] Downloaded the iOS package
- [ ] Extracted the package
- [ ] Found `Info.plist` file
- [ ] Added three camera permission entries
- [ ] Saved the file
- [ ] Opened in Xcode (optional, for building)
- [ ] Verified permissions appear in Xcode Info tab

---

## 🎯 Next Steps

After adding the permissions:

1. **Test the app** to ensure camera access works
2. **Build for App Store** in Xcode
3. **Submit to App Store Connect**

The camera permissions will now be included in your iOS app! 📷✅

