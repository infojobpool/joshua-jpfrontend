# 🔔 Push Notifications Setup for PWA Builder iOS App

## ✅ Current Status

Good news! Your iOS app from PWA Builder **already has push notification support**:

1. ✅ **Background Modes**: `remote-notification` is enabled in `Info.plist` (line 75)
2. ✅ **PushNotifications.swift**: Push notification code is included
3. ✅ **Service Worker**: PWA Builder includes service worker support

---

## 📋 What's Already Configured

### In Info.plist:
```xml
<key>UIBackgroundModes</key>
<array>
    <string>processing</string>
    <string>remote-notification</string>  ✅ This enables push notifications
</array>
```

### Files Present:
- ✅ `PushNotifications.swift` - Push notification handler
- ✅ `AppDelegate.swift` - App lifecycle management
- ✅ Service worker support (via PWA Builder)

---

## 🔧 Additional Setup Required

To fully enable push notifications, you need to:

### 1. Configure Apple Push Notification Service (APNs)

**In Xcode:**
1. Open the project in Xcode
2. Select the **JobPool** target
3. Go to **Signing & Capabilities** tab
4. Click **"+ Capability"**
5. Add **"Push Notifications"**
6. Add **"Background Modes"** (if not already there)
   - Check **"Remote notifications"**

### 2. Get APNs Certificate/Key

**Option A: APNs Key (Recommended)**
1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/authkeys/list)
2. Create a new **Key** with **Apple Push Notifications service (APNs)** enabled
3. Download the `.p8` key file
4. Note the **Key ID** and **Team ID**

**Option B: APNs Certificate**
1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/certificates/list)
2. Create a new **Apple Push Notification service SSL** certificate
3. Download and install it

### 3. Update Backend to Send Push Notifications

Your backend needs to:
1. **Store device tokens** when users register for notifications
2. **Send push notifications** via APNs when events occur (new message, task update, etc.)

**Backend API Endpoints Needed:**
- `POST /api/v1/register-push-token/` - Register device token
- `POST /api/v1/send-notification/` - Send notification (admin/internal)

### 4. Register for Notifications in Your Web App

Add this to your Next.js app to request notification permission:

**Create `/app/src/lib/pushNotifications.ts`:**

```typescript
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function registerServiceWorkerForPush(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // Get from your backend
    });

    // Send subscription to your backend
    await fetch('/api/v1/register-push-token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        user_id: localStorage.getItem('userId')
      })
    });

    return registration;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}
```

### 5. Update Service Worker for Push Notifications

Your service worker (`public/sw.js`) needs to handle push events:

```javascript
// Add to your service worker
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'JobPool';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192-real.png',
    badge: '/icons/icon-192x192-real.png',
    data: data.url || '/',
    tag: data.tag || 'default'
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
```

---

## 📱 iOS-Specific Setup

### In Xcode:

1. **Enable Push Notifications Capability:**
   - Project → Target → Signing & Capabilities
   - Add "Push Notifications"
   - Add "Background Modes" → Check "Remote notifications"

2. **Configure APNs:**
   - Project → Target → Signing & Capabilities
   - Under "Push Notifications", configure your APNs certificate/key

3. **Test Push Notifications:**
   - Build and run on a physical device (push notifications don't work in simulator)
   - Test with a push notification service like [Pusher](https://pusher.com) or [OneSignal](https://onesignal.com)

---

## 🔄 Service Worker in iOS App

**Good news:** PWA Builder iOS apps **automatically include service worker support** because they use WKWebView, which supports service workers.

Your service worker from `https://www.jobpool.in/sw.js` will work in the iOS app automatically.

**To verify:**
1. Open the app on iOS
2. The service worker should register automatically
3. Push notifications will work through the service worker

---

## ✅ Checklist

- [x] `UIBackgroundModes` with `remote-notification` in Info.plist
- [x] `PushNotifications.swift` file present
- [ ] Add "Push Notifications" capability in Xcode
- [ ] Add "Background Modes" capability in Xcode
- [ ] Configure APNs certificate/key
- [ ] Update backend to handle push tokens
- [ ] Add push notification registration in web app
- [ ] Update service worker for push events
- [ ] Test on physical iOS device

---

## 🎯 Next Steps

1. **Open the project in Xcode**
2. **Add Push Notifications capability**
3. **Configure APNs** (get certificate/key from Apple Developer)
4. **Update your backend** to send push notifications
5. **Add push registration code** to your Next.js app
6. **Test on a physical device**

---

## 📚 Resources

- [Apple Push Notifications Documentation](https://developer.apple.com/documentation/usernotifications)
- [PWA Push Notifications Guide](https://web.dev/push-notifications-overview/)
- [Service Worker Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

## 🆘 Troubleshooting

**Push notifications not working?**
- Make sure you're testing on a **physical device** (not simulator)
- Verify APNs certificate/key is configured correctly
- Check that device token is being registered with your backend
- Ensure service worker is registered and active

**Service worker not registering?**
- Check that `https://www.jobpool.in/sw.js` is accessible
- Verify service worker is enabled in production (not development)
- Check browser console for service worker errors

