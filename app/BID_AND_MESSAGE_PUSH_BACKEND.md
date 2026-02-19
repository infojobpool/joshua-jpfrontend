# Push Notifications for Bids & Messages – Backend Implementation Guide

## Overview

Send push notifications when:
1. **Taskmaster** gets a **new bid** on their task
2. **Tasker** gets a **reply** from taskmaster (bid accepted, or new message in chat)

---

## Prerequisites

- `POST /api/v1/register-push/` already stores FCM tokens per user
- Table/model: `user_push_tokens` (or similar) with `user_id`, `fcm_token`, `platform`, `updated_at`
- Firebase Admin SDK configured (see REAL_PUSH_BACKEND_GUIDE.md)

---

## 1. Helper: Send Push to User

Create a helper that fetches a user's FCM token(s) and sends the push:

```python
# Example: Django/Python
import firebase_admin
from firebase_admin import messaging

def send_push_to_user(user_id, title, body, type="system", url=""):
    """Send push notification to the user's device(s)."""
    tokens = get_fcm_tokens_for_user(user_id)  # Your DB query
    if not tokens:
        return
    # IMPORTANT: To avoid 4x same notification (e.g. user has web + app + multiple tabs):
    # - Deduplicate by fcm_token (below)
    # - Or limit: send only to most recent token, or 1 per platform (web/android/ios)
    seen = set()
    full_url = f"https://www.jobpool.in{url}" if url and not url.startswith("http") else (url or "https://www.jobpool.in")
    for token in tokens:
        # Skip duplicate tokens (same user can have multiple from tabs/sessions)
        t = token.get("fcm_token") or token
        if t in seen:
            continue
        seen.add(t)
        try:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data={
                    "title": title,
                    "body": body,
                    "type": type,
                    "url": url or "/",
                },
                token=t if isinstance(t, str) else token["fcm_token"],
                android=messaging.AndroidConfig(priority="high"),
                webpush=messaging.WebpushConfig(
                    fcm_options=messaging.WebpushFCMOptions(link=full_url),
                ),
            )
            messaging.send(message)
        except Exception as e:
            # Token may be invalid - consider removing from DB
            pass
```

---

## 2. Trigger: New Bid (Taskmaster Gets Notified)

**When:** A tasker places a bid on a task.

**Backend hook:** In the endpoint that creates a bid (e.g. `POST /api/v1/bid-a-job/`):

- Request body typically has: `job_id`, `bidder_id`, `bid_amount`, `bid_description`, etc.
- You need: **task poster's user_id** (the person who posted the task)

```python
# After successfully creating the bid:
def on_bid_created(job_id, bidder_id, bid_amount, bidder_name, task_title):
    poster_user_id = get_job(job_id).user_ref_id  # task poster

    send_push_to_user(
        user_id=poster_user_id,
        title=f"New bid on \"{task_title}\"",           # e.g. "New bid on Fix Kitchen Sink"
        body=f"{bidder_name} placed a bid of ₹{bid_amount}",  # e.g. "Joshua placed a bid of ₹500"
        type="bid",
        url=f"/tasks/{job_id}",                        # REQUIRED: redirect to task on tap
    )
```

**Example notification:** `"New bid on Fix Kitchen Sink"` / `"Joshua placed a bid of ₹500"` → tap opens `/tasks/xyz`

**API structure (from frontend):** `POST /bid-a-job/` with payload containing `job_id`, bidder info, etc.

---

## 3. Trigger: Bid Accepted (Tasker Gets Notified)

**When:** Taskmaster accepts a tasker's offer.

**Backend hook:** In the endpoint that accepts a bid (e.g. `POST /api/v1/accept-bid/{task_id}/{tasker_id}/`):

- The **tasker** (whose bid was accepted) is the one to notify
- `tasker_id` = the user who gets the notification

```python
# After successfully accepting the bid:
def on_bid_accepted(task_id, tasker_id, task_title, poster_name):
    send_push_to_user(
        user_id=tasker_id,
        title=f"Your bid was accepted for \"{task_title}\"",  # e.g. "Your bid was accepted for Fix Kitchen Sink"
        body=f"{poster_name} accepted your offer",            # e.g. "Joshua accepted your offer"
        type="bid",
        url=f"/tasks/{task_id}",                              # REQUIRED: redirect to task on tap
    )
```

**Example notification:** `"Your bid was accepted for Fix Kitchen Sink"` / `"Joshua accepted your offer"` → tap opens `/tasks/xyz`

**API structure (from frontend):** `POST /accept-bid/{task.id}/{offer.tasker.id}/`

---

## 4. Trigger: New Message (Recipient Gets Notified)

**When:** Someone sends a chat message.

**Backend hook:** In the endpoint that sends a message (e.g. `POST /api/v1/send-message/` or similar):

- Request has: `receiver_id`, `message`, `chat_id`, `sender_id`, etc.
- Notify the **receiver** (the other person in the chat)
- **Include sender name** so the user knows who messaged them
- **Include message preview** (truncated) as the body
- **Include url** so tapping opens the chat

```python
# After successfully saving the message:
def on_message_sent(sender_id, receiver_id, message_content, chat_id, sender_name):
    # sender_name = get_user_name(sender_id)  # e.g. "Joshua Bayagalla"
    body = message_content[:80] + "..." if len(message_content) > 80 else message_content

    send_push_to_user(
        user_id=receiver_id,
        title=f"New message from {sender_name}",   # e.g. "New message from Joshua Bayagalla"
        body=body,                                  # e.g. "Hello, when can you start?"
        type="message",
        url=f"/messages/{chat_id}",                 # REQUIRED: redirect to chat on tap
    )
```

**Example notification:** `"New message from Joshua Bayagalla"` / `"Hello, when can you start?"` → tap opens `/messages/chatId`

**API structure (from frontend):** Chat uses `chat_id`, `receiver_id`, `message` in the payload.

---

## 5. Trigger: Tasker Marks Complete (Taskmaster Gets Notified)

**When:** Tasker marks the job as complete.

**Backend hook:** In `PUT /api/v1/mark-complete/{job_id}/`:

```python
def on_tasker_marked_complete(job_id, taskmaster_user_id, task_title, tasker_name):
    send_push_to_user(
        user_id=taskmaster_user_id,
        title="Tasker marked job complete",
        body=f"{tasker_name} marked \"{task_title}\" as complete. Confirm to finish.",
        type="system",
        url=f"/tasks/{job_id}",
    )
```

---

## 6. Trigger: Taskmaster Marks Complete (Tasker Gets Notified)

**When:** Taskmaster confirms the tasker's completion.

**Backend hook:** In `PUT /api/v1/mark-complete-by-taskmaster/{job_id}/`:

```python
def on_taskmaster_marked_complete(job_id, tasker_user_id, task_title):
    send_push_to_user(
        user_id=tasker_user_id,
        title="Task owner confirmed completion",
        body=f"Task owner confirmed \"{task_title}\" is complete.",
        type="system",
        url=f"/tasks/{job_id}",
    )
```

---

## 7. Trigger: Both Confirmed (Both Get Notified)

**When:** `job_completion_status` becomes 1 (both sides confirmed).

**Backend hook:** After both mark-complete endpoints set the job to fully completed:

```python
def on_task_fully_completed(job_id, taskmaster_user_id, tasker_user_id, task_title):
    for user_id in [taskmaster_user_id, tasker_user_id]:
        send_push_to_user(
            user_id=user_id,
            title="Task completed",
            body=f"\"{task_title}\" has been completed by both parties.",
            type="system",
            url=f"/tasks/{job_id}",
        )
```

---

## 8. Summary Table (Notification Format)

| Event                  | Who to notify     | Title (include context)                     | Body (include who + what)                     | URL (tap = redirect) |
|------------------------|-------------------|---------------------------------------------|-----------------------------------------------|----------------------|
| New bid                | Task poster       | "New bid on \"{task_title}\""               | "{bidder_name} placed a bid of ₹{amount}"     | `/tasks/{id}`        |
| Bid accepted           | Tasker            | "Your bid was accepted for \"{task_title}\""| "{poster_name} accepted your offer"           | `/tasks/{id}`        |
| New message            | Message receiver  | "New message from {sender_name}"            | Message preview (truncated)                   | `/messages/{id}`     |
| Tasker marks complete  | Taskmaster        | "Tasker marked job complete"                | "{tasker} marked \"{task}\" complete."        | `/tasks/{id}`        |
| Taskmaster confirms    | Tasker            | "Task owner confirmed completion"           | "Task owner confirmed \"{task}\" is complete."| `/tasks/{id}`        |
| Both confirmed         | Both              | "Task completed"                            | "\"{task}\" completed by both parties."       | `/tasks/{id}`        |

**Rules:** Always include **who** (name) and **what** (task/message) in title or body. Always include **url** so tap opens the correct screen.

**webpush.fcm_options.link:** Enables redirect when user taps the notification (web + PWA). Use full URL: `https://www.jobpool.in/messages/xyz`.

---

## 8a. Backend Implementation: Web Push Redirect

The backend (`utils/fcm.py`) implements web push redirect via `WebpushConfig`:

- `webpush=messaging.WebpushConfig(fcm_options=messaging.WebpushFCMOptions(link=full_url))`
- `full_url` = `FRONTEND_BASE_URL` + path (e.g. `https://www.jobpool.in` + `/messages/chatId`)
- `webpush` is only set when a non-empty `url` is provided

**Env configuration (Render):**

Set `FRONTEND_BASE_URL` in your backend env. Defaults to `https://www.jobpool.in` if not set:

```
FRONTEND_BASE_URL=https://www.jobpool.in
```

If the frontend uses a different domain, set your actual domain (e.g. `https://app.jobpool.in`). This allows web/PWA notifications to open the correct page when tapped.

---

## 9. Where to Add the Hooks

**Mark complete – both sides:** When tasker or taskmaster hits "Mark as complete", the **other party** must get a push notification so they can confirm. Add hooks to both endpoints below.

Find these endpoints in your backend and add the `send_push_to_user` call **after** the DB write succeeds:

| Event              | Endpoint                                          |
|--------------------|---------------------------------------------------|
| New bid            | `POST /api/v1/bid-a-job/`                         |
| Accept bid         | `POST /api/v1/accept-bid/{task_id}/{tasker_id}/`  |
| Send msg           | `POST /api/v1/send-message/` or `/post-message/`  |
| Tasker complete    | `PUT /api/v1/mark-complete/{job_id}/`             |
| Taskmaster confirm | `PUT /api/v1/mark-complete-by-taskmaster/{job_id}/` |

---

## 10. Test Endpoints (Backend Should Provide)

| Endpoint                    | Method | Purpose                                      |
|----------------------------|--------|----------------------------------------------|
| `GET /api/v1/push-status/` | GET    | Returns `tokens_count` for logged-in user    |
| `POST /api/v1/test-push/`  | POST   | Body: `{ "title": "...", "body": "..." }`    |

---

## 11. Frontend (Already Done)

The frontend already:
- Registers FCM token via `POST /register-push/`
- Listens for `push-notification` and `push-notification-click` events
- Displays notifications in the in-app list and handles `type`: `bid`, `message`, `system`
- Opens `url` when user taps the notification

No frontend changes needed.

---

## 12. Web Push Testing (Postman)

1. **Register token:** Log in on the website → allow notifications → wait 10–15 seconds.
2. **Check registration:** `GET https://api.jobpool.in/api/v1/push-status/` with `Authorization: Bearer <JWT>` → expect `tokens_count ≥ 1`.
3. **Test push:** `POST https://api.jobpool.in/api/v1/test-push/` with same JWT and body `{ "title": "Test", "body": "Hello" }` → expect notification on device.

---

## 13. Real Event Testing

1. **New bid:** Tasker places bid → taskmaster gets "New bid on your task".
2. **Bid accepted:** Taskmaster accepts bid → tasker gets "Your bid was accepted!".
3. **New message:** User A sends message → User B gets "New message".
4. **Tasker marks complete:** Tasker marks job complete → taskmaster gets "Tasker marked job complete".
5. **Taskmaster confirms:** Taskmaster confirms → tasker gets "Task owner confirmed completion".
6. **Both confirmed:** Both get "Task completed".

Both users must be signed in and have allowed notifications (tokens registered).
