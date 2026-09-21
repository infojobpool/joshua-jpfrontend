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
  };
}

export async function forwardToBackendApi(row: WritingTestSubmission): Promise<boolean> {
  const base = process.env.WRITING_TEST_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) return false;

  const res = await fetch(`${base}/writing-test/submissions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
  return res.ok;
}

export async function forwardToWebhook(row: WritingTestSubmission): Promise<boolean> {
  let url = process.env.WRITING_TEST_WEBHOOK_URL?.trim();
  if (!url) return false;

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
    }),
  });
  return res.ok;
}
