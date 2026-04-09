# Wallet API Verification

Verification of backend↔frontend wallet API alignment.

## Base URL

- **User app**: `axiosInstance` uses `NEXT_PUBLIC_API_BASE_URL` (e.g. `https://jobpoolbackend.onrender.com/api/v1`)
- **Admin app**: Same base; admin wallet routes require `Authorization: Bearer <admin_jwt>`

---

## User Wallet Endpoints

### 1. GET `/wallet` – balance + transactions

| | Value |
|---|---|
| **Full path** | `GET /api/v1/wallet` |
| **Query params** | `user_id` (required), `limit` (optional, default 30, max 100) |
| **Auth** | No JWT validation on backend – pass `Authorization: Bearer <user_jwt>` anyway; frontend must use logged-in user's `user_id` |

**Example request:**
```http
GET /api/v1/wallet?user_id=abc123&limit=30
Authorization: Bearer <user_jwt>
```

**Success response (200):**
```json
{
  "status_code": 200,
  "message": "Wallet retrieved",
  "data": {
    "balance": 100.0,
    "currency": "INR",
    "upi_vpa": "user@paytm",
    "transactions": [
      {
        "id": 1,
        "amount": 100.0,
        "type": "credit",
        "reference": "signup_bonus",
        "status": "completed",
        "created_at": "2025-03-23T12:00:00"
      }
    ]
  }
}
```

**Frontend usage:**
```ts
const res = await axiosInstance.get(`wallet?user_id=${userId}&limit=${limit}`);
const payload = res.data?.data ?? res.data;
const { balance, currency, upi_vpa, transactions } = payload;
// upi_vpa is included so "Your UPI ID" card shows on load and after add-upi; null when not set
```

> **Note:** `upi_vpa` is `null` when no UPI is set. UPI is shown after add-upi and persists on page reload when the backend returns it.

### Backend contract: `upi_vpa` on every `GET /wallet`

- **Always include** `upi_vpa` in the `GET /wallet` JSON (string when set, `null` when not). Do not omit the key.
- **Why:** The user app shows “Your UPI ID” from this response on **full page reload** and when returning to **Wallet** later. If `upi_vpa` is missing, the UI must guess (e.g. preserve after add-upi); with the field present, reloads match what the user saw right after adding UPI.
- **Redeploy backend** after any change that affects this payload so production stays in sync.

---

## Frontend UX (Wallet Page)

1. **Initial load**: Use `upi_vpa` from `GET /wallet` response. If present, show a "Your UPI ID" card with the value.
2. **After add-upi success**: Show success toast, then update local state with the new `upi_vpa` (from add-upi response `data.upi_vpa` or the value sent) so the "Your UPI ID" card appears immediately.
3. **Flow**: Add UPI → success toast → set `upi_vpa` from add-upi response → show "Your UPI ID" card. Reload page → fetch wallet → show "Your UPI ID" if `upi_vpa` is present.

---

### 2. POST `/wallet/add-upi` – add/update UPI

| | Value |
|---|---|
| **Full path** | `POST /api/v1/wallet/add-upi` |
| **Query params** | `user_id` (required), `upi_vpa` (required, e.g. `user@paytm`) |
| **Auth** | No JWT validation on backend – frontend must use logged-in user's `user_id` |

**Example request:**
```http
POST /api/v1/wallet/add-upi?user_id=abc123&upi_vpa=user@paytm
Authorization: Bearer <user_jwt>
Content-Type: application/json
```

**Success response (200):**
```json
{
  "status_code": 200,
  "message": "UPI added successfully",
  "data": {
    "upi_vpa": "user@paytm"
  }
}
```

**Frontend usage:**
```ts
await axiosInstance.post(`wallet/add-upi?user_id=${userId}&upi_vpa=${encodeURIComponent(vpa)}`);
```

---

### 3. POST `/wallet/withdraw` – request withdrawal

| | Value |
|---|---|
| **Full path** | `POST /api/v1/wallet/withdraw` |
| **Query params** | `user_id` (required), `amount` (required, positive number) |
| **Auth** | No JWT validation on backend – frontend must use logged-in user's `user_id` |

**Example request:**
```http
POST /api/v1/wallet/withdraw?user_id=abc123&amount=50.5
Authorization: Bearer <user_jwt>
```

**Success response (200):**
```json
{
  "status_code": 200,
  "message": "Withdrawal request submitted. Pending admin approval.",
  "data": {
    "amount": 50.5,
    "upi_vpa": "user@paytm",
    "transaction_id": 42,
    "new_balance": 49.5
  }
}
```

**Frontend usage:**
```ts
await axiosInstance.post(`wallet/withdraw?user_id=${userId}&amount=${amount}`);
```

---

## Admin Wallet Endpoints

### 4. GET `/admin/wallet/withdrawals` – list pending withdrawals

| | Value |
|---|---|
| **Full path** | `GET /api/v1/admin/wallet/withdrawals` |
| **Auth** | Required – `Authorization: Bearer <admin_jwt>` |

**Example request:**
```http
GET /api/v1/admin/wallet/withdrawals
Authorization: Bearer <admin_jwt>
```

**Success response (200):**
```json
{
  "status_code": 200,
  "message": "Pending withdrawals",
  "data": {
    "withdrawals": [
      {
        "transaction_id": 42,
        "user_id": "abc123",
        "user_name": "John Doe",
        "user_email": "john@example.com",
        "amount": 50.5,
        "upi_vpa": "user@paytm",
        "created_at": "2025-03-23T12:00:00"
      }
    ]
  }
}
```

**Frontend usage (admin):**
```ts
const res = await axiosInstance.get('admin/wallet/withdrawals');
const withdrawals = (res.data?.data ?? res.data)?.withdrawals ?? [];
```

---

### 5. PATCH `/admin/wallet-transaction/{transaction_id}` – approve/reject

| | Value |
|---|---|
| **Full path** | `PATCH /api/v1/admin/wallet-transaction/{transaction_id}` |
| **Body** | `{ "status": "completed" | "failed" }` |
| **Auth** | Required – `Authorization: Bearer <admin_jwt>` |

**Example request:**
```http
PATCH /api/v1/admin/wallet-transaction/42
Authorization: Bearer <admin_jwt>
Content-Type: application/json

{"status": "completed"}
```

**Success response (200):**
```json
{
  "status_code": 200,
  "message": "Withdrawal marked as completed",
  "data": {
    "transaction_id": 42,
    "status": "completed"
  }
}
```

**Frontend usage (admin):**
```ts
await axiosInstance.patch(`admin/wallet-transaction/${transactionId}`, { status: 'completed' });
```

---

### 6. POST `/admin/remind-incomplete-profile/` – email + WhatsApp reminders (admin)

| | Value |
|---|---|
| **Full path** | `POST /api/v1/admin/remind-incomplete-profile/` |
| **Body** | `{ "user_ids": ["id1", "id2"], "email": true, "whatsapp": true }` — at least one of `email` / `whatsapp` must be `true`; max **500** `user_ids` per request |
| **Auth** | Admin JWT (`get_current_admin_id`, same as other admin wallet routes) |

**Success response (200):**
```json
{
  "status_code": 200,
  "message": "Reminders processed",
  "data": {
    "summary": {
      "requested": 2,
      "email_sent_ok": 1,
      "email_failed": 0,
      "whatsapp_sent_ok": 1,
      "whatsapp_failed": 0,
      "skipped_empty_ids": 0,
      "admin_id": "..."
    },
    "results": [
      { "user_id": "...", "found": true, "email_sent": true, "whatsapp_sent": false }
    ]
  }
}
```

**Admin frontend (`admin-temp`):** Verification reminders page calls this route first; the UI toast uses `message` plus `data.summary` when present. Large selections are split into batches of 500 client-side. No Vercel `REMINDER_*` env vars are required when this endpoint is deployed.

**GET `/api/v1/all-user-details/` — serialization (reminders + optional fields)**

- Response uses **`response_model_exclude_none=True`**: any optional field that is `None` is **omitted** from JSON (not sent as `null`).
- **Reminder block:** If the user has **never** been successfully reminded (`count == 0` and no last timestamp), reminder-related fields are set to `None` and **dropped** from the payload. The admin UI shows **—** (treat missing like “no stats”).
- After **at least one** successful remind, **`profile_reminder_send_count` ≥ 1** and **`last_profile_reminder_at`** are included. A numeric **0** together with a last-sent date would only reflect an odd DB state.
- **Canonical names (JSON is snake_case only):** `profile_reminder_send_count`, `last_profile_reminder_at`. When the backend includes data, **alias** keys (`profile_reminder_count`, `incomplete_profile_reminder_count`, `verification_reminder_count`, `last_incomplete_profile_reminder_at`, `last_reminder_sent_at`, `profile_reminder_last_at`, etc.) duplicate the same integer / ISO string.
- **POST** `admin/remind-incomplete-profile/` (or equivalent) should increment/persist counts and last-sent after successful sends so the next `GET all-user-details/` reflects history.

**Admin frontend (`admin-temp`):** `getProfileReminderDisplay()` prefers **profile-named** count fields, then looser aliases **only** if `count > 0` or a **last-sent** field is present (avoids misleading “0 times” when only generic counters default to zero). After each successful send batch, the Verification reminders page re-fetches `all-user-details/`.

**Other optional user fields** on the same route (`phone_number`, `tasks_completed`, `earnings`, etc.) are also omitted when `None`. Admin code should treat **missing keys** the same as **`null`** / empty.

**Signup bonus snapshot (same rules as wallet credit):** Each user may include:

| Field | Meaning |
|--------|--------|
| `signup_bonus_claimed` | Bonus already credited |
| `signup_bonus_eligible` | Would qualify right now (not claimed and all requirements met) |
| `signup_bonus_missing` | List of strings still blocking (e.g. phone on profile, address, UPI); empty when eligible or already claimed |
| `signup_bonus_amount` | Amount in INR from env (e.g. 100) |

Logic aligns with `check_and_credit_signup_bonus` / signup bonus eligibility: **profile** phone (not registration phone alone), full KYC including bank, name, address, UPI, etc. Omitted keys follow `exclude_none` like other optional fields. **Admin Customers** shows this as **Signup bonus** (credited / ready / missing chips).

---

## Response Handling

- All responses use: `{ status_code, message, data? }`.
- Data is in `response.data.data` when present.
- Frontend pattern: `const payload = response.data?.data ?? response.data`.
- Check `response.data.status_code` (or `response.status`) for 200 success.

---

## Mismatches & Notes

| Item | Status |
|------|--------|
| **User wallet auth** | Backend does not validate JWT for `/wallet`, `/wallet/add-upi`, `/wallet/withdraw`. Anyone could call with another `user_id`. **Recommendation**: Add `get_current_user_id` and enforce `current_user_id == user_id` or derive `user_id` from JWT. |
| **Admin withdrawals vs task orders** | Admin `/admin/wallet/withdrawals` is for **wallet UPI withdrawals**, not task order payouts. Task orders use `get-all-task-orders`. These are separate flows. |
| **Payouts page** | `admin/.../payouts/page.tsx` uses task orders. A separate page (or tab) is needed for wallet withdrawals using `admin/wallet/withdrawals` and `admin/wallet-transaction/{id}`. |
| **Transaction `id` vs `transaction_id`** | User wallet transactions return `id`; admin uses `transaction_id`. Frontend handles both: `w.transaction_id ?? w.id`. |
| **User wallet frontend** | Implemented at `/wallet` – balance, "Your UPI ID" card, add UPI, withdraw, transactions list. Header has Wallet link. |
| **GET /wallet upi_vpa** | Backend now includes `upi_vpa` in response so UPI shows on load and reload. |

---

## Quick Reference: Curl Examples

```bash
# User: get wallet
curl -H "Authorization: Bearer USER_JWT" "https://your-api/api/v1/wallet?user_id=USER_ID&limit=30"

# User: add UPI
curl -X POST -H "Authorization: Bearer USER_JWT" "https://your-api/api/v1/wallet/add-upi?user_id=USER_ID&upi_vpa=user@paytm"

# User: withdraw
curl -X POST -H "Authorization: Bearer USER_JWT" "https://your-api/api/v1/wallet/withdraw?user_id=USER_ID&amount=50"

# Admin: list pending withdrawals
curl -H "Authorization: Bearer ADMIN_JWT" "https://your-api/api/v1/admin/wallet/withdrawals"

# Admin: mark completed
curl -X PATCH -H "Authorization: Bearer ADMIN_JWT" -H "Content-Type: application/json" \
  -d '{"status":"completed"}' "https://your-api/api/v1/admin/wallet-transaction/42"
```
