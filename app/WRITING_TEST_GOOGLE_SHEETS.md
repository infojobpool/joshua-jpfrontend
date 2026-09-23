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

    var resumeUrl = "";
    var resumeFileName = body.resume_filename || "";

    if (body.resume_base64 && body.resume_filename) {
      try {
        var bytes = Utilities.base64Decode(body.resume_base64);
        var blob = Utilities.newBlob(
          bytes,
          body.resume_mime || "application/octet-stream",
          body.resume_filename
        );
        var folderName = "JobPool Writing Test Resumes";
        var folders = DriveApp.getFoldersByName(folderName);
        var folder = folders.hasNext()
          ? folders.next()
          : DriveApp.getRootFolder().createFolder(folderName);
        var safeId = String(body.id || new Date().getTime());
        var file = folder.createFile(blob);
        file.setName(safeId + "-" + body.resume_filename);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        resumeUrl = file.getUrl();
      } catch (driveErr) {
        resumeUrl = "upload_failed: " + String(driveErr);
      }
    }

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
        "resume_filename",
        "resume_url",
        "content",
      ]);
      sheet.getRange(1, 1, 1, 14).setFontWeight("bold");
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
      resumeFileName,
      resumeUrl,
      body.content || "",
    ]);

    return jsonOut({ ok: true, resume_url: resumeUrl || null });
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

## Resume uploads

- Optional **PDF / DOC / DOCX** (max 2 MB) on the form before the test starts.
- With the script above, each file is stored in Google Drive folder **`JobPool Writing Test Resumes`** (same Google account as the sheet).
- The sheet gets **`resume_filename`** and **`resume_url`** columns (click link to open the file).

**If you already deployed an older script:** paste the updated `doPost` from section 2, **Save**, then **Deploy → Manage deployments → Edit → New version → Deploy**.

**If the sheet already has rows:** insert two columns before `content` named `resume_filename` and `resume_url` so new rows line up with the headers.

## 6. Share the test with students

```
https://www.jobpool.in/writing-test
```

(Random topic from 10 built-in prompts. For one shared prompt: `?topic=...`.)

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
