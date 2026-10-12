# Referral program — product rules & API contract

Frontend constants: `src/lib/referral/constants.ts` (`WELCOME_BONUS_INR=25`, milestone `3 → ₹25`).

## Rules (backend must enforce)

1. **Welcome bonus:** ₹25 credited once when a **new user** completes the **full payout verification checklist** (same as wallet eligibility — PAN, Aadhaar, name, mobile, UPI, etc.). Applies to referred and organic signups. No separate referee referral amount.

2. **Referrer milestone:** ₹25 credited to the **referrer** each time their **verified referee count** reaches a multiple of **3** (3rd, 6th, 9th, … distinct referees who completed full verification after signing up with that referrer’s code at registration).

3. **Unlimited invites;** signup alone never pays referrer.

4. **Referred users** get their own referral code and the same milestone rules when they invite others.

5. **Attribution:** first valid `referral_code` at registration only; no self-referral / duplicate accounts.

## Referee row status (suggested)

| Status | Meaning |
|--------|---------|
| `pending` | Signed up; verification incomplete |
| `qualified` | Full verification complete; counts toward referrer’s 3 |
| `credited` | Counted and included in a paid milestone batch (optional finer state) |

Frontend maps `qualified` + `credited` as “verified” for progress.

## `GET /referral/summary/?user_id=`

Response `data` (or root) should include:

```json
{
  "referral_code": "JPABC123",
  "referral_link": "https://www.jobpool.in/signup?ref=JPABC123",
  "stats": {
    "pending_count": 2,
    "verified_referee_count": 5,
    "milestones_completed": 1,
    "milestone_progress_toward_next": 2,
    "total_earned_inr": 25
  },
  "rewards": {
    "welcome_bonus_inr": 25,
    "referrer_milestone_inr": 25,
    "milestone_verified_required": 3
  }
}
```

If omitted, the app falls back to constants and can infer progress from `GET /referrals/` list statuses.

## `GET /referrals/?user_id=`

List of referees with at least: `id`, `referee_name`, `status`, `created_at`.

## Welcome bonus amount

Backend should set **`welcome_bonus_inr = 25`** (env or settings) and credit wallet on payout checklist complete. Frontend copy uses `WELCOME_BONUS_INR` until API overrides referee display amounts.

## Admin

`GET /admin/referrals/` — include `verified_referee_count` / milestone fields per referrer when available for support.

## Wallet transactions

Suggested reference types: `welcome_bonus`, `referral_milestone` (with metadata: milestone_index, referee_ids).
