# 5-minute student writing test

## Student page

- URL: **`/writing-test`**
- Optional topic in query: **`/writing-test?topic=Describe%20your%20city`**
- Or Vercel env on **user app**: `NEXT_PUBLIC_WRITING_TEST_DEFAULT_TOPIC`

Flow: name → **10-minute** timer → random topic from pool of 10 → textarea → submit (manual or auto at 0:00).

- Default link **`/writing-test`** — each student gets a **random** prompt at start.
- Same prompt for everyone: **`/writing-test?topic=Your prompt`**
- Custom prompts (build-time): env `NEXT_PUBLIC_WRITING_TEST_TOPICS` — separate with `||`

## Where submissions go

1. **Google Sheets (recommended)** — see **`WRITING_TEST_GOOGLE_SHEETS.md`** for Apps Script + Vercel env.
2. **In-memory (dev only)** — same Node process; not reliable on Vercel serverless.
3. **Other webhooks** — user app env `WRITING_TEST_WEBHOOK_URL` (Zapier, Slack, etc.).
4. **JobPool API (production)** — user app env:
   - `WRITING_TEST_API_BASE_URL` — e.g. `https://api.jobpool.in/api/v1`
   - Backend: `POST /writing-test/submissions/` (public, rate-limited)
   - Backend: `GET /admin/writing-test/submissions/` (admin JWT)

## Admin review

- **Admin app** → **Writing tests** (`/writing-tests`)
- Tries `GET /admin/writing-test/submissions/` first.
- Fallback: `GET https://www.jobpool.in/api/writing-test?key=...` with shared secret.

Admin Vercel env:

- `WRITING_TEST_ADMIN_KEY` — same value as on **user app**
- `NEXT_PUBLIC_USER_SITE_URL` — e.g. `https://www.jobpool.in`

User app Vercel env:

- `WRITING_TEST_ADMIN_KEY` — long random string for export API
- `WRITING_TEST_WEBHOOK_URL` — Google Apps Script `/exec` URL (see Google Sheets guide)
- `WRITING_TEST_WEBHOOK_SECRET` — optional shared secret (`?key=` added automatically)
- `WRITING_TEST_API_BASE_URL` — optional when backend is live

## Backend sketch (Python/FastAPI)

```python
# POST /writing-test/submissions/  — no auth, rate limit by IP
# GET  /admin/writing-test/submissions/  — admin JWT
# Table: writing_test_submissions (id, student_name, student_id, student_email, topic, content, word_count, ...)
```
