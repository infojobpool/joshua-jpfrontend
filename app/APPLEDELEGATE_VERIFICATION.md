# ✅ AppDelegate.swift Code Verification

## 🔍 Issues Found

### ❌ Issue 1: Push Registration Still Commented Out
**Line 32:** `// application.registerForRemoteNotifications()` is still commented.

**Fix:** Uncomment this line:
```swift
application.registerForRemoteNotifications()
```

### ❌ Issue 2: Invalid Comment Syntax
**Lines 17-18, 25-26:** Comments like `[START set_messaging_delegate]` are not valid Swift comments.

**Fix:** These should be regular comments:
```swift
// [START set_messaging_delegate]
// [END set_messaging_delegate]
```

### ❌ Issue 3: Missing Import
**Missing:** `import UserNotifications` is required for `UNUserNotificationCenter`.

**Fix:** Add at the top:
```swift
import UserNotifications
```

### ❌ Issue 4: Missing Constant
**Line 45, 61, 99, 116:** `gcmMessageIDKey` is used but not defined.

**Fix:** Add this constant:
```swift
let gcmMessageIDKey = "gcm.message_id"
```

---

## ✅ Corrected AppDelegate.swift

```swift
import UIKit
import FirebaseCore
import FirebaseMessaging
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window : UIWindow?
    
    // Firebase Cloud Messaging message ID key
    let gcmMessageIDKey = "gcm.message_id"

    func application(_ application: UIApplication,
                       didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {

        // Configure Firebase
        FirebaseApp.configure()

        // [START set_messaging_delegate]
        Messaging.messaging().delegate = self
        // [END set_messaging_delegate]
        
        // Register for remote notifications. This shows a permission dialog on first run, to
        // show the dialog at a more appropriate time move this registration accordingly.
        // [START register_for_notifications]
   
        UNUserNotificationCenter.current().delegate = self

        // Request notification authorization (optional - can be done from web view)
        // let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
        // UNUserNotificationCenter.current().requestAuthorization(
        //     options: authOptions,
        //     completionHandler: {_, _ in })

        // Register for remote notifications
        application.registerForRemoteNotifications()
        // [END register_for_notifications]
        
        return true
    }

    // [START receive_message]
    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any]) {
        // If you are receiving a notification message while your app is in the background,
        // this callback will not be fired till the user taps on the notification launching the application.
        // With swizzling disabled you must let Messaging know about the message, for Analytics
        // Messaging.messaging().appDidReceiveMessage(userInfo)
        // Print message ID.
        if let messageID = userInfo[gcmMessageIDKey] {
            print("Message ID 1: \(messageID)")
        }

        // Print full message.
        print("push userInfo 1:", userInfo)
        sendPushToWebView(userInfo: userInfo)
    }

    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any],
                     fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        // If you are receiving a notification message while your app is in the background,
        // this callback will not be fired till the user taps on the notification launching the application.
        // With swizzling disabled you must let Messaging know about the message, for Analytics
        // Messaging.messaging().appDidReceiveMessage(userInfo)
        // Print message ID.
        if let messageID = userInfo[gcmMessageIDKey] {
            print("Message ID 2: \(messageID)")
        }

        // Print full message.
        print("push userInfo 2:", userInfo)
        sendPushToWebView(userInfo: userInfo)

        completionHandler(UIBackgroundFetchResult.newData)
    }
    // [END receive_message]
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        print("Unable to register for remote notifications: \(error.localizedDescription)")
    }

    // This function is added here only for debugging purposes, and can be removed if swizzling is enabled.
    // If swizzling is disabled then this function must be implemented so that the APNs token can be paired to
    // the FCM registration token.
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        print("APNs token retrieved: \(deviceToken)")
        
        // With swizzling disabled you must set the APNs token here.
        Messaging.messaging().apnsToken = deviceToken
    }
}

// [START ios_10_message_handling]
extension AppDelegate : UNUserNotificationCenterDelegate {

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                willPresent notification: UNNotification,
                                withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        let userInfo = notification.request.content.userInfo

        // With swizzling disabled you must let Messaging know about the message, for Analytics
        // Messaging.messaging().appDidReceiveMessage(userInfo)
        // Print message ID.
        if let messageID = userInfo[gcmMessageIDKey] {
            print("Message ID: 3 \(messageID)")
        }

        // Print full message.
        print("push userInfo 3:", userInfo)
        sendPushToWebView(userInfo: userInfo)

        // Change this to your preferred presentation option
        completionHandler([[.banner, .list, .sound]])
    }

    func userNotificationCenter(_ center: UNUserNotificationCenter,
                                didReceive response: UNNotificationResponse,
                                withCompletionHandler completionHandler: @escaping () -> Void) {
        let userInfo = response.notification.request.content.userInfo
        // Print message ID.
        if let messageID = userInfo[gcmMessageIDKey] {
            print("Message ID 4: \(messageID)")
        }

        // With swizzling disabled you must let Messaging know about the message, for Analytics
        // Messaging.messaging().appDidReceiveMessage(userInfo)
        // Print full message.
        print("push userInfo 4:", userInfo)
        sendPushClickToWebView(userInfo: userInfo)

        completionHandler()
    }
}
// [END ios_10_message_handling]

extension AppDelegate : MessagingDelegate {
    // [START refresh_token]
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("Firebase registration token: \(String(describing: fcmToken))")
        
        let dataDict:[String: String] = ["token": fcmToken ?? ""]
        NotificationCenter.default.post(name: Notification.Name("FCMToken"), object: nil, userInfo: dataDict)
        handleFCMToken()
        // TODO: If necessary send token to application server.
        // Note: This callback is fired at each app startup and whenever a new token is generated.
    }
    // [END refresh_token]
}
```

---

## 📋 Changes Summary

1. ✅ **Added `import UserNotifications`** - Required for notification handling
2. ✅ **Added `gcmMessageIDKey` constant** - Fixes undefined variable error
3. ✅ **Uncommented `application.registerForRemoteNotifications()`** - Enables push registration
4. ✅ **Uncommented `didRegisterForRemoteNotificationsWithDeviceToken`** - Properly handles APNs token
5. ✅ **Set `Messaging.messaging().apnsToken`** - Links APNs token to FCM
6. ✅ **Fixed comment syntax** - Proper Swift comments

---

## ✅ Verification Checklist

- [x] Firebase configured
- [x] Messaging delegate set
- [x] Notification center delegate set
- [x] Push registration enabled
- [x] APNs token handling implemented
- [x] All required imports present
- [x] Constants defined
- [x] Proper error handling

---

## 🎯 Next Steps

1. **Apply these fixes** to your `AppDelegate.swift`
2. **Add Push Notifications capability** in Xcode
3. **Add Background Modes capability** in Xcode
4. **Test on physical device** (push notifications don't work in simulator)
5. **Configure Firebase** with your `GoogleService-Info.plist`

Your code is almost perfect - just needs these small fixes! 🚀

