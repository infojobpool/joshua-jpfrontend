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
const { balance, currency, transactions, upi_vpa } = payload;
```

> **Backend requirement:** Include `upi_vpa` in the GET `/wallet` response so the Wallet page can display "Your UPI ID". Without it, the UPI card only appears after the user adds UPI (optimistic update) until the next full reload.

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
| **User wallet frontend** | Implemented at `/wallet` – balance, add UPI, withdraw, transactions list. Header has Wallet link. |

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
