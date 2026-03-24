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

export type ReminderResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; noEndpoint?: boolean };

/**
 * Ask the API to send email + WhatsApp reminders for incomplete verification/profile.
 * Implement ONE of these routes on FastAPI (see verification-reminders page copy).
 */
export async function sendIncompleteProfileReminders(
  userIds: string[]
): Promise<ReminderResult> {
  if (userIds.length === 0) {
    return { ok: false, error: "No users selected" };
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
        "No reminder endpoint found (404). Add POST /admin/remind-incomplete-profile/ on the API.",
      noEndpoint: true,
    };
  }
  return { ok: false, error: "Failed to send reminders" };
}
