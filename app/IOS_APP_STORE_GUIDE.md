# 📱 iOS App Store Submission Guide - JobPool

## 🎯 Complete Step-by-Step Guide to Submit Your iOS App

### Prerequisites
- ✅ Mac computer (required for iOS development)
- ✅ Xcode installed (download from Mac App Store)
- ✅ Apple Developer Account ($99/year) - [Sign up here](https://developer.apple.com/programs/)
- ✅ Your app code is ready

---

## Step 1: Build Your Next.js App for Mobile

```bash
cd /Users/joshuabayagalla/jobpoolfrontendsept/app

# Build Next.js with static export for mobile
npm run build:mobile

# Sync with Capacitor
npm run cap:sync
```

This will:
- Build your Next.js app as a static export (outputs to `out/` directory)
- Copy the web assets to your iOS project
- Update iOS native dependencies

---

## Step 2: Open in Xcode

```bash
npm run cap:ios
```

Or manually:
```bash
open ios/App/App.xcworkspace
```

**Important**: Always open `.xcworkspace`, NOT `.xcodeproj`

---

## Step 3: Configure Your App in Xcode

### 3.1 Set Bundle Identifier
1. In Xcode, select the **App** project in the left sidebar
2. Select the **App** target
3. Go to **Signing & Capabilities** tab
4. Set **Bundle Identifier**: `com.jobpool.app` (or your custom identifier)
5. Make sure **Automatically manage signing** is checked

### 3.2 Configure Signing Certificate
1. In **Signing & Capabilities**, select your **Team** (your Apple Developer account)
2. Xcode will automatically create/select the right certificates
3. If you see errors, click **"Try Again"** or **"Add Account"**

### 3.3 Set App Version
1. Go to **General** tab
2. Set **Version**: `1.0.0` (or your version number)
3. Set **Build**: `1` (increment this for each submission)

### 3.4 Configure App Display Name
1. In **General** tab, set **Display Name**: `JobPool`
2. This is what users will see on their home screen

---

## Step 4: Configure App Icons and Launch Screen

### 4.1 Add App Icons
1. In Xcode, go to **Assets.xcassets** → **AppIcon**
2. Drag and drop your app icons:
   - **1024x1024** (required for App Store)
   - **20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5** (for different devices)

### 4.2 Configure Launch Screen
1. The launch screen is in `ios/App/App/Base.lproj/LaunchScreen.storyboard`
2. You can customize it or leave it as default

---

## Step 5: Test on Simulator/Device

### Test on Simulator:
1. In Xcode, select a simulator (e.g., iPhone 15 Pro)
2. Click the **Play** button (▶️) or press `Cmd + R`
3. Test all features of your app

### Test on Real Device:
1. Connect your iPhone via USB
2. Select your device in Xcode
3. Click **Play** button
4. On your iPhone: Settings → General → VPN & Device Management → Trust your developer certificate

---

## Step 6: Build Archive for App Store

### 6.1 Set Build Configuration
1. In Xcode, go to **Product** → **Scheme** → **Edit Scheme**
2. Select **Run** → **Build Configuration** → **Release**
3. Close the scheme editor

### 6.2 Create Archive
1. In Xcode, select **Any iOS Device** (or **Generic iOS Device**) from device selector
2. Go to **Product** → **Archive**
3. Wait for the build to complete (this may take 5-10 minutes)

### 6.3 Validate Archive
1. When archive completes, **Organizer** window will open
2. Select your archive
3. Click **Validate App**
4. Follow the prompts and fix any issues

---

## Step 7: Submit to App Store Connect

### 7.1 Create App in App Store Connect
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** → **New App**
3. Fill in:
   - **Platform**: iOS
   - **Name**: JobPool
   - **Primary Language**: English
   - **Bundle ID**: `com.jobpool.app` (must match Xcode)
   - **SKU**: `jobpool-001` (unique identifier)
   - **User Access**: Full Access
4. Click **Create**

### 7.2 Upload Build from Xcode
1. In Xcode Organizer, select your archive
2. Click **Distribute App**
3. Select **App Store Connect**
4. Click **Next** → **Upload**
5. Select your distribution certificate
6. Click **Upload**
7. Wait for processing (can take 10-30 minutes)

### 7.3 Add App Information
While the build is processing, fill in app details:

1. **App Information**:
   - **Category**: Productivity or Business
   - **Content Rights**: Yes, I have the rights
   - **Age Rating**: Complete the questionnaire

2. **Pricing and Availability**:
   - Set price (Free or Paid)
   - Select countries

3. **App Privacy**:
   - Complete privacy questionnaire
   - Add Privacy Policy URL: `https://www.jobpool.in/privacy-policy`

### 7.4 Add App Metadata
1. **Screenshots** (required):
   - iPhone 6.7" Display: 1290 x 2796 pixels
   - iPhone 6.5" Display: 1242 x 2688 pixels
   - iPhone 5.5" Display: 1242 x 2208 pixels
   - Take screenshots from your app running on simulator

2. **Description**:
   ```
   JobPool - Your Local Task Marketplace
   
   Connect with skilled taskers for home services, repairs, and more. 
   Post tasks, get bids, and complete jobs seamlessly.
   
   Features:
   - Post tasks easily
   - Browse available taskers
   - Secure payments
   - Real-time messaging
   - Reviews and ratings
   ```

3. **Keywords**: `task, marketplace, home services, repairs, handyman, local services`

4. **Support URL**: `https://www.jobpool.in/support`
5. **Marketing URL** (optional): `https://www.jobpool.in`

### 7.5 Submit for Review
1. Once your build is processed, select it in **Build** section
2. Fill in **What's New in This Version**: `Initial release of JobPool mobile app`
3. Answer **Export Compliance** questions
4. Click **Submit for Review**
5. Wait for Apple's review (typically 1-7 days)

---

## Step 8: Monitor Review Status

1. Check **App Store Connect** regularly
2. Apple will notify you via email
3. If rejected, fix issues and resubmit
4. Once approved, your app goes live automatically (or on your scheduled date)

---

## 🔧 Troubleshooting

### Issue: "No signing certificate found"
**Solution**: 
- Go to Xcode → Preferences → Accounts
- Add your Apple ID
- Select your team and click "Manage Certificates"
- Click "+" to create a new certificate

### Issue: "Bundle identifier already exists"
**Solution**: 
- Change bundle identifier in Xcode to something unique
- Update `capacitor.config.ts` with new appId
- Re-sync: `npm run cap:sync`

### Issue: Build fails with errors
**Solution**:
- Check Xcode console for specific errors
- Make sure all dependencies are installed: `cd ios/App && pod install`
- Clean build: Product → Clean Build Folder (Shift + Cmd + K)

### Issue: App crashes on launch
**Solution**:
- Check Capacitor config matches your setup
- Verify API endpoints are accessible
- Test in simulator first before real device

---

## 📋 Checklist Before Submission

- [ ] App builds successfully in Xcode
- [ ] App runs on simulator without crashes
- [ ] App runs on real device without crashes
- [ ] All features work correctly
- [ ] App icons are set (1024x1024 required)
- [ ] Bundle identifier is set correctly
- [ ] Signing certificate is configured
- [ ] App version and build number are set
- [ ] Screenshots are ready (all required sizes)
- [ ] App description is written
- [ ] Privacy policy URL is added
- [ ] Support URL is added
- [ ] Age rating questionnaire is completed
- [ ] Export compliance questions are answered

---

## 🎉 After Approval

Once your app is approved:
- It will appear in the App Store within 24 hours
- Users can download and install it
- You can track downloads and analytics in App Store Connect
- You can push updates by incrementing build number and re-submitting

---

## 📞 Need Help?

- **Apple Developer Support**: https://developer.apple.com/support/
- **App Store Review Guidelines**: https://developer.apple.com/app-store/review/guidelines/
- **Capacitor Documentation**: https://capacitorjs.com/docs

Good luck with your submission! 🚀📱

