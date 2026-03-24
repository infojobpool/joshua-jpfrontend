import axiosInstance from "@/lib/axiosInstance";
import { getApiErrorMessage } from "@/lib/apiError";

/** Body shapes backends may accept — try first match that returns non-404 */
const ATTEMPTS: { path: string; body: (userIds: string[]) => Record<string, unknown> }[] = [
  {
    path: "/admin/remind-incomplete-profile/",
    body: (user_ids) => ({ user_ids, email: true, whatsapp: true }),
  },
  {
    path: "/admin/send-verification-reminders/",
    body: (user_ids) => ({ user_ids, channels: ["email", "whatsapp"] }),
  },
  {
    path: "/admin/profile-reminders/",
    body: (user_ids) => ({ user_ids, send_email: true, send_whatsapp: true }),
  },
];

export type ReminderRecipient = {
  user_id: string;
  email?: string;
  phone?: string;
  name?: string;
};

export type ReminderResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; noEndpoint?: boolean };

/**
 * 1) If `recipients` is passed, calls Next.js `/api/reminders/send` (server uses your
 *    REMINDER_* env vars or REMINDER_BATCH_WEBHOOK_URL — secrets stay on Vercel).
 * 2) If that returns 501 (not configured), falls back to FastAPI routes in ATTEMPTS.
 */
export async function sendIncompleteProfileReminders(
  userIds: string[],
  recipients?: ReminderRecipient[]
): Promise<ReminderResult> {
  if (userIds.length === 0) {
    return { ok: false, error: "No users selected" };
  }

  if (recipients && recipients.length > 0 && typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const r = await fetch("/api/reminders/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ recipients }),
        });
        const data = (await r.json().catch(() => ({}))) as {
          message?: string;
          error?: string;
        };
        if (r.ok) {
          return { ok: true, message: data.message || "Reminders sent" };
        }
        if (r.status === 501) {
          // Env not set on Vercel — try backend
        } else {
          return {
            ok: false,
            error: data.error || data.message || `Reminder API error (${r.status})`,
          };
        }
      } catch {
        /* fall through to backend */
      }
    }
  }

  let last404 = true;
  for (const { path, body } of ATTEMPTS) {
    try {
      const res = await axiosInstance.post(path, body(userIds));
      const msg =
        (res.data?.message as string) ||
        (res.data?.data?.message as string) ||
        "Reminders queued";
      return { ok: true, message: msg };
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        continue;
      }
      last404 = false;
      return { ok: false, error: getApiErrorMessage(err) || "Request failed" };
    }
  }
  if (last404) {
    return {
      ok: false,
      error:
        "Configure Vercel env (REMINDER_BATCH_WEBHOOK_URL or email/WhatsApp URLs) — see .env.example — or add POST /admin/remind-incomplete-profile/ on the API.",
      noEndpoint: true,
    };
  }
  return { ok: false, error: "Failed to send reminders" };
}
