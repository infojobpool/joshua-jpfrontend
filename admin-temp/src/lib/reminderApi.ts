import axiosInstance from "@/lib/axiosInstance";
import { getApiErrorMessage } from "@/lib/apiError";

/** Matches FastAPI: POST /api/v1/admin/remind-incomplete-profile/ */
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

/** Backend allows up to 500 user_ids per request */
export const REMINDER_MAX_IDS_PER_REQUEST = 500;

export type ReminderRecipient = {
  user_id: string;
  email?: string;
  phone?: string;
  name?: string;
};

export type ReminderResult =
  | { ok: true; message?: string }
  | { ok: false; error: string; noEndpoint?: boolean };

function chunkIds<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Formats 200 JSON from remind-incomplete-profile (message + data.summary). */
export function formatReminderSuccessPayload(payload: unknown): string {
  const root = payload as Record<string, unknown>;
  const msg = (root.message as string) || "Reminders processed";
  const data = root.data as Record<string, unknown> | undefined;
  const summary = data?.summary as Record<string, unknown> | undefined;
  if (!summary) return msg;

  const bits: string[] = [msg];
  const req = summary.requested;
  const es = summary.email_sent_ok;
  const ef = summary.email_failed;
  const ws = summary.whatsapp_sent_ok;
  const wf = summary.whatsapp_failed;
  const skip = summary.skipped_empty_ids;

  if (typeof req === "number") bits.push(`requested ${req}`);
  if (typeof es === "number") bits.push(`email OK ${es}`);
  if (typeof ef === "number" && ef > 0) bits.push(`email failed ${ef}`);
  if (typeof ws === "number") bits.push(`WhatsApp OK ${ws}`);
  if (typeof wf === "number" && wf > 0) bits.push(`WhatsApp failed ${wf}`);
  if (typeof skip === "number" && skip > 0) bits.push(`skipped ${skip}`);

  return bits.join(" · ");
}

type BackendPostResult =
  | { kind: "ok"; message: string }
  | { kind: "notfound" }
  | { kind: "error"; error: string };

async function postOneBackendAttempt(userIds: string[]): Promise<BackendPostResult> {
  for (const { path, body } of BACKEND_ATTEMPTS) {
    try {
      const res = await axiosInstance.post(path, body(userIds));
      return { kind: "ok", message: formatReminderSuccessPayload(res.data) };
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        continue;
      }
      return { kind: "error", error: getApiErrorMessage(err) || "Request failed" };
    }
  }
  return { kind: "notfound" };
}

/**
 * (1) FastAPI admin routes — batched in chunks of 500 user_ids.
 * (2) If all paths 404, optional Vercel `/api/reminders/send` when `recipients` is set.
 */
export async function sendIncompleteProfileReminders(
  userIds: string[],
  recipients?: ReminderRecipient[]
): Promise<ReminderResult> {
  if (userIds.length === 0) {
    return { ok: false, error: "No users selected" };
  }

  const batches = chunkIds(userIds, REMINDER_MAX_IDS_PER_REQUEST);
  const messages: string[] = [];

  for (const batch of batches) {
    const r = await postOneBackendAttempt(batch);
    if (r.kind === "ok") {
      messages.push(r.message);
      continue;
    }
    if (r.kind === "error") {
      return { ok: false, error: r.error };
    }
    if (messages.length > 0) {
      return {
        ok: false,
        error:
          "Reminder endpoint returned 404 after a successful batch. Check API deployment.",
      };
    }
    break;
  }

  if (messages.length === batches.length) {
    return {
      ok: true,
      message: messages.length > 1 ? messages.join(" | ") : messages[0],
    };
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

  return {
    ok: false,
    error:
      "Backend returned 404 for reminder routes. Deploy POST /api/v1/admin/remind-incomplete-profile/ or set Vercel REMINDER_* (see admin-temp .env.example).",
    noEndpoint: true,
  };
}
