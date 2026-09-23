import type { WritingTestSubmission, WritingTestSubmitPayload } from "./types";

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

export function buildSubmission(
  payload: WritingTestSubmitPayload,
  id: string
): WritingTestSubmission {
  const content = String(payload.content ?? "");
  const started = new Date(payload.started_at).getTime();
  const submitted = new Date(payload.submitted_at).getTime();
  const duration_seconds = Number.isFinite(started) && Number.isFinite(submitted)
    ? Math.max(0, Math.round((submitted - started) / 1000))
    : 0;

  return {
    id,
    student_name: payload.student_name.trim(),
    student_id: payload.student_id?.trim() || undefined,
    student_email: payload.student_email?.trim() || undefined,
    topic: payload.topic.trim(),
    content,
    word_count: countWords(content),
    char_count: content.length,
    duration_seconds,
    started_at: payload.started_at,
    submitted_at: payload.submitted_at,
    submitted_reason: payload.submitted_reason,
    resume_filename: payload.resume_filename?.trim() || null,
    resume_url: null,
  };
}

export type WebhookForwardResult = {
  ok: boolean;
  resume_url?: string | null;
};

export async function forwardToBackendApi(
  row: WritingTestSubmission,
  extras?: Pick<WritingTestSubmitPayload, "resume_base64" | "resume_mime" | "resume_filename">
): Promise<boolean> {
  const base = process.env.WRITING_TEST_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return false;

  const res = await fetch(`${base}/writing-test/submissions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...row, ...extras }),
  });
  return res.ok;
}

export async function forwardToWebhook(
  row: WritingTestSubmission,
  extras?: Pick<WritingTestSubmitPayload, "resume_base64" | "resume_mime" | "resume_filename">
): Promise<WebhookForwardResult> {
  let url = process.env.WRITING_TEST_WEBHOOK_URL?.trim();
  if (!url) return { ok: false };

  const secret = process.env.WRITING_TEST_WEBHOOK_SECRET?.trim();
  if (secret && !/[?&]key=/.test(url)) {
    url += `${url.includes("?") ? "&" : "?"}key=${encodeURIComponent(secret)}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "X-Writing-Test-Secret": secret } : {}),
    },
    body: JSON.stringify({
      event: "writing_test_submitted",
      ...row,
      ...extras,
    }),
  });

  let resume_url: string | null = null;
  if (res.ok) {
    try {
      const parsed = (await res.json()) as { resume_url?: string };
      if (parsed?.resume_url && typeof parsed.resume_url === "string") {
        resume_url = parsed.resume_url;
      }
    } catch {
      /* non-JSON response is ok */
    }
  }

  return { ok: res.ok, resume_url };
}
