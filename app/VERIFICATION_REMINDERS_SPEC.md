# Verification Reminders – Implementation Guide

Send **email** and **WhatsApp** reminders to users who sign up but don't verify their email.

---

## Overview

| Who              | What                                          |
|------------------|-----------------------------------------------|
| **Backend**      | Scheduled job, email sending, WhatsApp API    |
| **Frontend**     | No changes needed (resend button already exists) |

---

## 1. Backend – Scheduled Job (Cron)

Run a job periodically (e.g. daily at 9 AM) that:

1. Finds users where `email_verified = false` and signup date matches reminder windows
2. Sends email reminder (with verification link)
3. Sends WhatsApp reminder (if `phone_number` exists)
4. Records that the reminder was sent (to avoid duplicates)

### Example Reminder Schedule

| When   | Action                                  |
|--------|-----------------------------------------|
| 24h after signup  | 1st reminder (email + WhatsApp) |
| 72h after signup  | 2nd reminder (email + WhatsApp) |
| 7 days after signup | 3rd (final) reminder (email + WhatsApp) |

### Pseudocode (Django/Celery example)

```python
# tasks.py or management command
def send_verification_reminders():
    from datetime import timedelta
    from django.utils import timezone

    now = timezone.now()
    
    for hours in [24, 72, 168]:  # 24h, 72h, 7 days
        window_start = now - timedelta(hours=hours)
        window_end = window_start + timedelta(hours=6)  # 6h window
        
        users = User.objects.filter(
            email_verified=False,
            created_at__gte=window_start,
            created_at__lt=window_end
        )
        
        for user in users:
            # Skip if we already sent this reminder
            if reminder_already_sent(user, hours):
                continue
            
            # 1. Send email (same as resend-verification-email)
            token = user.get_verification_token()
            send_verification_email(user.email, token)
            
            # 2. Send WhatsApp (if phone exists)
            if user.phone_number:
                send_whatsapp_reminder(user.phone_number, user.user_fullname)
            
            # 3. Record reminder sent
            record_reminder_sent(user.id, hours)
```

---

## 2. Email Sending

Reuse your existing verification email logic (used by `/resend-verification-email/`).

- Same SMTP config as support emails
- Same verification link format: `https://www.jobpool.in/emailconfirmation?token=...`
- Subject: `Complete your JobPool signup – verify your email`
- Body: Short message + button/link to verify

---

## 3. WhatsApp Sending

### Option A: WhatsApp Business API (official)

| Provider   | Notes                    |
|-----------|---------------------------|
| **Twilio** | WhatsApp API, simple     |
| **MessageBird** | Similar to Twilio  |
| **Gupshup** | Popular in India        |
| **Meta Cloud API** | Direct from Meta      |

- Requires business verification and approved templates
- First-contact messages must use approved templates
- Example template: `Hi {{1}}, please verify your JobPool email to get started: {{2}}`

### Option B: WhatsApp Bridge (if you have one)

If you already have a “wa bridge” or similar:

- Expose an internal endpoint: `POST /internal/send-whatsapp` with `phone`, `message`
- Call it from the cron job when sending reminders
- Ensure it uses approved templates if required by WhatsApp

### Message Format

```
Hi [Name], you signed up for JobPool but haven't verified your email yet. 
Click here to verify: [link]
```

---

## 4. Database – Track Reminders

Add a table or column so you don't spam users:

```sql
-- Option 1: Separate table
CREATE TABLE verification_reminders (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    reminder_type VARCHAR,  -- '24h', '72h', '7d'
    channel VARCHAR         -- 'email', 'whatsapp'
);

-- Option 2: Add columns to user_login
ALTER TABLE user_login ADD COLUMN reminder_24h_sent_at TIMESTAMP;
ALTER TABLE user_login ADD COLUMN reminder_72h_sent_at TIMESTAMP;
ALTER TABLE user_login ADD COLUMN reminder_7d_sent_at TIMESTAMP;
```

---

## 5. Cron Setup

### Render (if backend is on Render)

- Use **Cron Jobs** (paid) or
- External cron (e.g. cron-job.org) hitting: `GET /internal/cron/send-verification-reminders` (protected by secret header)

### Django

```bash
# Add to crontab or use django-crontab
0 9 * * * python manage.py send_verification_reminders
```

### Node/FastAPI

- Use `node-cron`, `apscheduler`, or external cron
- Call the reminder function at the scheduled time

---

## 6. Security

- Protect cron endpoint: require `X-Cron-Secret` header or similar
- Rate limit WhatsApp/email to avoid abuse
- Only send to unverified users; stop after they verify

---

## 7. Frontend – No Changes Required

The frontend already has:

- **Resend verification** on sign-in page (user-initiated)
- **Email confirmation** page for the verification link

Automated reminders use the same verification link. No frontend updates needed.

---

## 8. Checklist

| Step | Task |
|------|------|
| 1 | Add `verification_reminders` table or columns |
| 2 | Create `send_verification_reminders()` function |
| 3 | Reuse existing email-sending logic |
| 4 | Integrate WhatsApp (Twilio/Gupshup/your bridge) |
| 5 | Set up cron to run daily |
| 6 | Test with a test user (signup, wait/simulate, check email + WhatsApp) |

---

## 9. WhatsApp Template Example (for approval)

**Name:** `verification_reminder`  
**Category:** Utility  
**Language:** English  
**Body:**
```
Hi {{1}}, you're almost ready to use JobPool! Please verify your email by clicking this link: {{2}}
```

---

## 10. Quick Start (Backend Dev)

1. Confirm `/resend-verification-email/` works
2. Copy that logic into a `send_verification_reminders` task
3. Query unverified users in the 24h/72h/7d windows
4. Add WhatsApp call if you have an API/bridge
5. Schedule the task to run daily
