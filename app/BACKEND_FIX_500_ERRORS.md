# Backend Fix: 500 Errors (Missing Database Column)

## Root Cause

The backend returns **500 Internal Server Error** on multiple endpoints because the database is missing a column:

```
psycopg2.errors.UndefinedColumn: column user_login_1.signup_bonus_claimed does not exist
```

The SQLAlchemy `user_login` model includes `signup_bonus_claimed`, but the PostgreSQL table does not have this column.

---

## Affected Endpoints

- `GET /get-all-jobs/`
- `GET /get-user-jobs/{user_id}/`
- `GET /get-user-assigned-bids/{user_id}/`
- `GET /get-user-requested-bids/{user_id}/`
- `GET /fetch-completed-tasks/{user_id}/`
- `GET /profile?user_id=...`

(Any endpoint that joins on `user_login` and selects its columns.)

---

## Fix (Backend / Database)

### Option A: Add the column via migration

Run this SQL on your PostgreSQL database:

```sql
ALTER TABLE user_login
ADD COLUMN signup_bonus_claimed BOOLEAN DEFAULT FALSE;
```

Or if using Alembic/FastAPI-Migrate:

```bash
# Generate migration
alembic revision -m "add_signup_bonus_claimed_to_user_login"

# Edit the migration file to add:
# op.add_column('user_login', sa.Column('signup_bonus_claimed', sa.Boolean(), server_default='false', nullable=True))

# Run migration
alembic upgrade head
```

### Option B: Remove from model (if feature not used)

If you don't need `signup_bonus_claimed`, remove it from the `UserLogin` / `user_login` model in your backend so the ORM stops selecting it.

---

## 401 Unauthorized (Notifications)

`get-notifications/`, `get-user-notifications/`, `notifications/` return **401** when:

- JWT token is expired → user should log in again
- Token is missing or invalid
- Endpoint expects different auth format

**Check:** Ensure the frontend sends `Authorization: Bearer <JWT>` and the token is valid. If tokens expire quickly, consider refresh tokens or longer expiry.

---

## Quick Test After Fix

1. Add the column: `ALTER TABLE user_login ADD COLUMN signup_bonus_claimed BOOLEAN DEFAULT FALSE;`
2. Restart the backend (Render will auto-restart on deploy)
3. Reload the frontend – 500 errors on dashboard/tasks should stop
