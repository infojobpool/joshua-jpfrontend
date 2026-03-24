import { NextResponse } from "next/server";

export const runtime = "nodejs";

function normalizeApiBase(): string {
  const raw =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "https://api.jobpool.in/api/v1";
  return raw.replace(/\/+$/, "");
}

/** Confirms the bearer token is an admin session (same as other admin routes). */
async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const base = normalizeApiBase();
    const r = await fetch(`${base}/admin/wallet/withdrawals`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return r.ok;
  } catch {
    return false;
  }
}

export type ReminderRecipient = {
  user_id: string;
  email?: string;
  phone?: string;
  name?: string;
};

/**
 * POST /api/reminders/send
 * Authorization: Bearer <admin_jwt>
 * Body: { recipients: ReminderRecipient[] }
 *
 * Configure one of:
 * - REMINDER_BATCH_WEBHOOK_URL — single POST with JSON { recipients } (your API calls email + WhatsApp)
 * - REMINDER_EMAIL_API_URL + REMINDER_WHATSAPP_API_URL — per-recipient HTTP calls (see env example)
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing Authorization" }, { status: 401 });
  }
  const token = auth.slice(7).trim();
  if (!(await verifyAdminToken(token))) {
    return NextResponse.json({ error: "Invalid or expired admin session" }, { status: 401 });
  }

  let body: { recipients?: ReminderRecipient[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const recipients = Array.isArray(body.recipients) ? body.recipients : [];
  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients" }, { status: 400 });
  }

  const batchUrl = process.env.REMINDER_BATCH_WEBHOOK_URL?.trim();
  if (batchUrl) {
    const key = process.env.REMINDER_BATCH_WEBHOOK_KEY?.trim();
    const r = await fetch(batchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      body: JSON.stringify({ recipients }),
    });
    const text = await r.text();
    if (!r.ok) {
      return NextResponse.json(
        { error: `Batch webhook failed: ${r.status}`, detail: text.slice(0, 500) },
        { status: 502 }
      );
    }
    return NextResponse.json({
      ok: true,
      message: "Reminders dispatched via REMINDER_BATCH_WEBHOOK_URL",
    });
  }

  const emailUrl = process.env.REMINDER_EMAIL_API_URL?.trim();
  const waUrl = process.env.REMINDER_WHATSAPP_API_URL?.trim();
  const emailKey = process.env.REMINDER_EMAIL_API_KEY?.trim();
  const waKey = process.env.REMINDER_WHATSAPP_API_KEY?.trim();

  if (!emailUrl && !waUrl) {
    return NextResponse.json(
      {
        error: "not_configured",
        message:
          "Set REMINDER_BATCH_WEBHOOK_URL (recommended) or REMINDER_EMAIL_API_URL + REMINDER_WHATSAPP_API_URL in Vercel.",
      },
      { status: 501 }
    );
  }

  const subject =
    process.env.REMINDER_EMAIL_SUBJECT?.trim() || "Complete your JobPool verification";
  const template =
    process.env.REMINDER_MESSAGE_TEMPLATE?.trim() ||
    "Hi {{name}}, please complete your PAN and Aadhaar verification and profile in the JobPool app.";

  const stats = { email: 0, whatsapp: 0, skipped: 0 };
  const errors: string[] = [];

  for (const rec of recipients) {
    const name = (rec.name || "there").trim();
    const msg = template
      .replace(/\{\{name\}\}/g, name)
      .replace(/\{\{email\}\}/g, (rec.email || "").trim());

    if (emailUrl && rec.email?.trim()) {
      try {
        const r = await fetch(emailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(emailKey ? { Authorization: `Bearer ${emailKey}` } : {}),
          },
          body: JSON.stringify({
            to: rec.email.trim(),
            subject,
            body: msg,
            text: msg,
            user_id: rec.user_id,
          }),
        });
        if (r.ok) stats.email++;
        else errors.push(`email ${rec.user_id}: HTTP ${r.status}`);
      } catch (e) {
        errors.push(`email ${rec.user_id}: ${String(e)}`);
      }
    } else if (emailUrl) {
      stats.skipped++;
    }

    if (waUrl && rec.phone?.trim()) {
      const digits = rec.phone.replace(/\D/g, "");
      if (digits.length >= 10) {
        try {
          const r = await fetch(waUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(waKey ? { Authorization: `Bearer ${waKey}` } : {}),
            },
            body: JSON.stringify({
              to: digits,
              phone: digits,
              message: msg,
              user_id: rec.user_id,
            }),
          });
          if (r.ok) stats.whatsapp++;
          else errors.push(`whatsapp ${rec.user_id}: HTTP ${r.status}`);
        } catch (e) {
          errors.push(`whatsapp ${rec.user_id}: ${String(e)}`);
        }
      } else {
        errors.push(`whatsapp ${rec.user_id}: invalid phone`);
      }
    } else if (waUrl) {
      stats.skipped++;
    }
  }

  const message = `Email: ${stats.email}, WhatsApp: ${stats.whatsapp}${stats.skipped ? `, skipped (missing contact): ${stats.skipped}` : ""}`;
  return NextResponse.json({
    ok: true,
    message,
    stats,
    errors: errors.length ? errors : undefined,
  });
}
