# Real push notifications – backend guide

To show **real** push notifications (from your server to the app), the backend needs to:

1. **Store FCM tokens** when the app registers.
2. **Send FCM messages** when something happens (e.g. new bid, new message).

---

## 1. Register push token (backend endpoint)

The frontend sends the FCM token when the PWA Builder app dispatches the `push-token` event (after the user grants notification permission). It uses the existing API client (axios) with the same base URL and auth, so the JWT is sent automatically.

### Endpoint

- **Method:** `POST`
- **URL:** `<YOUR_API_BASE_URL>/api/v1/register-push/`
- **Headers:** `Authorization: Bearer <JWT>` (same token used for other API calls)
- **Body (JSON):**
  ```json
  {
    "fcm_token": "<FCM_DEVICE_TOKEN>",
    "platform": "web"
  }
  ```
  `platform` is one of: **`"web"`**, **`"ios"`**, or **`"android"`** (frontend sets this from user agent).

### Why “No FCM token registered” / frontend not calling register-push?

- **On web (desktop browser):** The FCM token is only available when:
  1. The page is running inside the **PWA Builder app** (Android/iOS), which gets the token and dispatches `push-token`, or  
  2. You use **Firebase JS** in the browser and call `getToken()` after the user allows notifications.  
  So if you only open the site in Chrome on desktop, the frontend never gets a token and never calls `register-push`. **To test:** use the PWA Builder Android/iOS app (sign in, allow notifications) so the app gets a token and sends it; or add Firebase JS and call `registerToken(token)` with `platform: "web"` when `getToken()` resolves.

- **Backend:** Accept `platform` as **`"web"`**, **`"ios"`**, or **`"android"`** and store it with the token.

### Backend behavior

1. Validate JWT and get `user_id`.
2. Store the FCM token for this user (e.g. in a `user_push_tokens` or `devices` table).
   - Fields: `user_id`, `fcm_token`, `platform` (optional), `updated_at`.
   - For the same user, you can **replace** the previous token or keep multiple (e.g. one per device).
3. Return success (e.g. `200` or `201`).

### Example (Node/Express)

```js
// POST /api/v1/register-push
app.post('/api/v1/register-push', authenticateJWT, async (req, res) => {
  const { fcm_token, platform } = req.body;
  const userId = req.user.id; // from JWT

  if (!fcm_token) {
    return res.status(400).json({ status_code: 400, message: 'fcm_token required' });
  }

  await db.pushTokens.upsert({ userId, fcm_token, platform });
  return res.json({ status_code: 200, message: 'Token registered' });
});
```

---

## 2. Send FCM from the backend

When you want to send a real push (e.g. new bid, new message), use **Firebase Admin SDK** (or FCM HTTP v1 API) to send a message to the user’s FCM token(s).

### Firebase Admin SDK (Node)

1. **Install:** `npm install firebase-admin`
2. **Initialize** with your service account key (from Firebase Console → Project Settings → Service accounts):

```js
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-your-serviceAccountKey.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
```

3. **Send a message** to a token:

```js
async function sendPushNotification(fcmToken, { title, body, type, url }) {
  const message = {
    token: fcmToken,
    notification: {
      title: title || 'JobPool',
      body: body || 'You have a new notification',
    },
    data: {
      // These are passed to the app and shown in-app
      title: title || 'JobPool',
      body: body || '',
      type: type || 'system',   // 'bid' | 'message' | 'system'
      url: url || '',           // e.g. '/tasks/123' or full URL
    },
    android: {
      priority: 'high',
    },
    apns: {
      payload: { aps: { sound: 'default' } },
      fcmOptions: {},
    },
  };

  await admin.messaging().send(message);
}
```

### When to call it

- **New bid on a task:** get the task poster’s FCM token(s), then:
  - `sendPushNotification(token, { title: 'New bid', body: 'Someone placed a bid on your task.', type: 'bid', url: '/tasks/' + taskId })`
- **New message in chat:** get the recipient’s FCM token(s), then:
  - `sendPushNotification(token, { title: 'New message', body: messagePreview, type: 'message', url: '/messages/' + chatId })`
- **Task status update:** same idea – get the relevant user’s token(s) and send with `title`, `body`, `type`, `url`.

### Payload shape (so in-app list matches)

The PWA Builder app forwards FCM **data** to the web view. The frontend expects (in `data` or notification):

- `title` – notification title
- `body` or `description` – text
- `type` – `bid` | `message` | `system`
- `url` or `link` – where to open (e.g. `/tasks/123`, `/messages/abc`)

Use the same names in `message.data` so the in-app notifications list and “View” link work.

---

## 3. Flow summary

| Step | Who | What |
|------|-----|------|
| 1 | User | Opens app (PWA Builder Android/iOS), grants notification permission |
| 2 | Native app | Gets FCM token, dispatches `push-token` event to WebView |
| 3 | Frontend | Listens for `push-token`, sends `POST /api/v1/register-push` with token + JWT |
| 4 | Backend | Saves token for user |
| 5 | Backend | When e.g. new bid → loads user’s FCM token(s) → sends FCM with title, body, data (type, url) |
| 6 | Device | Receives push; native app shows it and/or injects into WebView |
| 7 | Frontend | Listens for `push-notification` event, adds to in-app list (already implemented) |

---

## 4. Testing real push

1. **Backend:** Implement `POST /api/v1/register-push` and store the token.
2. **Backend:** Implement a test endpoint or script that calls `sendPushNotification(token, { title: 'Test', body: 'Real push from backend', type: 'system', url: '/notifications' })` for a stored token.
3. **App:** Open the PWA Builder app, sign in, allow notifications (so native app gets FCM token and dispatches `push-token`).
4. **Backend:** Trigger the test send to that token.
5. **Device:** You should see the system notification and/or the in-app notification in the Notifications screen.

If your backend is in Python (Django/Flask), use `firebase-admin` (Python) or the FCM HTTP v1 API the same way: same endpoint contract and same FCM payload shape.
