# Writing test → Google Sheets

Each student submit on `/writing-test` POSTs JSON to your **Google Apps Script** web app. Rows append to a spreadsheet — no JobPool backend required.

## 1. Create the sheet

1. Open [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**.
2. Rename the first tab **`Submissions`** (or use any name and edit the script below).
3. Optional: row 1 headers (the script adds them automatically if the sheet is empty).

## 2. Add Apps Script

1. **Extensions → Apps Script**.
2. Delete any sample code and paste:

```javascript
/**
 * JobPool writing-test webhook → append row to this spreadsheet.
 * Deploy as Web app: Execute as Me, Who has access: Anyone.
 */
var WEBHOOK_SECRET = ""; // optional: same as Vercel WRITING_TEST_WEBHOOK_SECRET

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut({ ok: false, error: "empty body" });
    }

    if (WEBHOOK_SECRET) {
      var qKey = e.parameter && e.parameter.key;
      if (qKey !== WEBHOOK_SECRET) {
        return jsonOut({ ok: false, error: "unauthorized" });
      }
    }

    var body = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Submissions") || ss.getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "submitted_at",
        "student_name",
        "student_id",
        "student_email",
        "topic",
        "word_count",
        "char_count",
        "duration_seconds",
        "submitted_reason",
        "started_at",
        "id",
        "content",
      ]);
      sheet.getRange(1, 1, 1, 12).setFontWeight("bold");
    }

    sheet.appendRow([
      body.submitted_at || "",
      body.student_name || "",
      body.student_id || "",
      body.student_email || "",
      body.topic || "",
      body.word_count || 0,
      body.char_count || 0,
      body.duration_seconds || 0,
      body.submitted_reason || "",
      body.started_at || "",
      body.id || "",
      body.content || "",
    ]);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
```

3. If you use a secret, set `WEBHOOK_SECRET` in the script to a long random string (same as Vercel below).
4. **Save** the project.

## 3. Deploy web app

1. **Deploy → New deployment**.
2. Type: **Web app**.
3. **Execute as:** Me  
4. **Who has access:** Anyone (anonymous callers can POST — protect with `WEBHOOK_SECRET` + `?key=`).
5. **Deploy** → copy the **Web app URL** (ends with `/exec`).

## 4. Vercel (user app — `app` project)

| Variable | Value |
|----------|--------|
| `WRITING_TEST_WEBHOOK_URL` | Your `/exec` URL (optionally append `?key=YOUR_SECRET`) |
| `WRITING_TEST_WEBHOOK_SECRET` | Same secret as in Apps Script `WEBHOOK_SECRET` (optional but recommended) |

Redeploy the user site after saving env.

If you set `WRITING_TEST_WEBHOOK_SECRET` only in Vercel (not in the URL), the app adds `?key=` automatically.

## 5. Test

1. Open `https://www.jobpool.in/writing-test` (or local).
2. Submit a short test.
3. Refresh the Google Sheet — a new row should appear.

If nothing appears:

- Apps Script **Executions** (left sidebar) → check errors.
- Confirm deployment is **Anyone** and URL is `/exec` not `/dev`.
- Confirm Vercel env is on the **user** project (root `app`).

## 6. Share the test with students

```
https://www.jobpool.in/writing-test?topic=Write about a book that changed your thinking
```

## Payload fields (reference)

| Field | Meaning |
|-------|---------|
| `student_name` | Required |
| `student_id` | Optional roll number |
| `student_email` | Optional |
| `topic` | Prompt |
| `content` | Full essay |
| `word_count` / `char_count` | Stats |
| `duration_seconds` | Time from start to submit |
| `submitted_reason` | `manual` \| `timer` |
| `started_at` / `submitted_at` | ISO timestamps |
| `id` | e.g. `wt-1739…` |

Admin UI (`/writing-tests` in admin app) is optional when you use Sheets as the source of truth.
