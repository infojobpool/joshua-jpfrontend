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
                    "url": url,
                },
                token=t if isinstance(t, str) else token["fcm_token"],
                android=messaging.AndroidConfig(priority="high"),
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
    # Get task poster (taskmaster) user_id from the job
    job = get_job(job_id)
    poster_user_id = job.user_ref_id  # or job.poster_id, job.created_by, etc.

    send_push_to_user(
        user_id=poster_user_id,
        title="New bid on your task",
        body=f"{bidder_name} placed a bid of ₹{bid_amount} on \"{task_title}\".",
        type="bid",
        url=f"/tasks/{job_id}",
    )
```

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
        title="Your bid was accepted!",
        body=f"{poster_name} accepted your offer for \"{task_title}\".",
        type="bid",
        url=f"/tasks/{task_id}",
    )
```

**API structure (from frontend):** `POST /accept-bid/{task.id}/{offer.tasker.id}/`

---

## 4. Trigger: New Message (Recipient Gets Notified)

**When:** Someone sends a chat message.

**Backend hook:** In the endpoint that sends a message (e.g. `POST /api/v1/send-message/` or similar):

- Request has: `receiver_id`, `message`, `chat_id`, etc.
- Notify the **receiver** (the other person in the chat)

```python
# After successfully saving the message:
def on_message_sent(sender_id, receiver_id, message_preview, chat_id):
    # Truncate long messages for notification
    body = message_preview[:100] + "..." if len(message_preview) > 100 else message_preview

    send_push_to_user(
        user_id=receiver_id,
        title="New message",
        body=body,
        type="message",
        url=f"/messages/{chat_id}",
    )
```

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

## 8. Summary Table

| Event                  | Who to notify     | Title                                | Body example                                       | URL              |
|------------------------|-------------------|--------------------------------------|----------------------------------------------------|------------------|
| New bid                | Task poster       | "New bid on your task"               | "{name} placed a bid of ₹X on \"{task}\""          | `/tasks/{id}`    |
| Bid accepted           | Tasker            | "Your bid was accepted!"             | "{poster} accepted your offer for \"{task}\""      | `/tasks/{id}`    |
| New message            | Message receiver  | "New message"                        | Message preview (truncated)                        | `/messages/{id}` |
| Tasker marks complete  | Taskmaster        | "Tasker marked job complete"         | "{tasker} marked \"{task}\" complete. Confirm."    | `/tasks/{id}`    |
| Taskmaster confirms    | Tasker            | "Task owner confirmed completion"    | "Task owner confirmed \"{task}\" is complete."     | `/tasks/{id}`    |
| Both confirmed         | Both              | "Task completed"                     | "\"{task}\" has been completed by both parties."   | `/tasks/{id}`    |

---

## 9. Where to Add the Hooks

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
