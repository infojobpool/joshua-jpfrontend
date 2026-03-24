import axiosInstance from "@/lib/axiosInstance";
import { getApiErrorMessage } from "@/lib/apiError";

/**
 * FastAPI routes tried in order (admin JWT required). Implement ONE on your backend.
 * See conversation / deploy notes for the contract.
 */
const BACKEND_ATTEMPTS: { path: string; body: (userIds: string[]) => Record<string, unknown> }[] = [
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
 * Order: (1) FastAPI admin routes above — (2) if all 404, optional Vercel `/api/reminders/send`
 * when `recipients` is passed and REMINDER_* env is set on Vercel.
 */
export async function sendIncompleteProfileReminders(
  userIds: string[],
  recipients?: ReminderRecipient[]
): Promise<ReminderResult> {
  if (userIds.length === 0) {
    return { ok: false, error: "No users selected" };
  }

  let backend404 = true;
  for (const { path, body } of BACKEND_ATTEMPTS) {
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
      backend404 = false;
      return { ok: false, error: getApiErrorMessage(err) || "Request failed" };
    }
  }

  if (recipients && recipients.length > 0 && typeof window !== "undefined" && backend404) {
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
        if (r.status !== 501) {
          return {
            ok: false,
            error: data.error || data.message || `Reminder API error (${r.status})`,
          };
        }
      } catch {
        /* no Vercel route */
      }
    }
  }

  if (backend404) {
    return {
      ok: false,
      error:
        "Add POST /api/v1/admin/remind-incomplete-profile/ on your FastAPI backend (admin JWT). It should send email + WhatsApp for the given user_ids.",
      noEndpoint: true,
    };
  }
  return { ok: false, error: "Failed to send reminders" };
}
