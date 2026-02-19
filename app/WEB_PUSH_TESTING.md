# Web Push – Frontend Status & Testing

## 1. Frontend Status ✅ Ready

The website already has web push configured:

| Item | Status |
|------|--------|
| Firebase installed | ✅ `npm install firebase` |
| VAPID key | Uses `NEXT_PUBLIC_FIREBASE_VAPID_KEY` |
| `firebase-push.ts` | Gets FCM token, POSTs to `register-push` with `platform: "web"` |
| Called after login | ✅ `signin/page.tsx` and `MobileAuth.tsx` |
| Service worker | ✅ `firebase-messaging-sw.js` generated at build |
| Foreground handler | ✅ `InAppNotificationProvider` shows notifications when tab is open |

### Required env vars (Vercel + local)

```
NEXT_PUBLIC_FIREBASE_VAPID_KEY=<your-vapid-key>
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

## 2. Test Web Push (Postman)

1. Open **https://www.jobpool.in** in Chrome.
2. Log in and allow notifications when asked.
3. Wait **10–15 seconds** for token registration.
4. **Check registration:**
   - `GET https://api.jobpool.in/api/v1/push-status/`
   - Header: `Authorization: Bearer <your-JWT>`
   - Expect: `tokens_count ≥ 1`
5. **Send test notification:**
   - `POST https://api.jobpool.in/api/v1/test-push/`
   - Header: `Authorization: Bearer <your-JWT>`
   - Body: `{ "title": "Test", "body": "Hello" }`
   - Expect: notification appears in browser/OS

---

## 3. Verify Real Event Notifications

| Flow | Expected notification |
|------|------------------------|
| Tasker places bid | Taskmaster gets "New bid on your task" |
| Taskmaster accepts bid | Tasker gets "Your bid was accepted!" |
| User A sends message | User B gets "New message" |
| Tasker marks complete | Taskmaster gets "Tasker marked job complete" |
| Taskmaster confirms | Tasker gets "Task owner confirmed completion" |
| Both confirmed | Both get "Task completed" |

---

## 4. Getting the JWT for Postman

- From browser: DevTools → Application → Local Storage → `token`
- Or: sign in, then run in Console: `localStorage.getItem('token')`
