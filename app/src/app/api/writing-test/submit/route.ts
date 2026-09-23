import { NextResponse } from "next/server";
import { addWritingTestSubmission } from "@/lib/writing-test-store";
import {
  buildSubmission,
  forwardToBackendApi,
  forwardToWebhook,
} from "@/lib/writing-test/submitWritingTest";
import type { WritingTestSubmitPayload } from "@/lib/writing-test/types";
import { MAX_RESUME_BYTES } from "@/lib/writing-test/resumeUpload";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<WritingTestSubmitPayload>;

    const student_name = String(body.student_name ?? "").trim();
    const topic = String(body.topic ?? "").trim();
    const content = String(body.content ?? "");
    const started_at = String(body.started_at ?? "");
    const submitted_at = String(body.submitted_at ?? new Date().toISOString());
    const submitted_reason =
      body.submitted_reason === "timer" || body.submitted_reason === "auto"
        ? body.submitted_reason
        : "manual";

    const resume_base64 = body.resume_base64?.trim();
    const resume_filename = body.resume_filename?.trim();
    const resume_mime = body.resume_mime?.trim();

    if (!student_name) {
      return NextResponse.json({ success: false, message: "Student name is required" }, { status: 400 });
    }
    if (!topic) {
      return NextResponse.json({ success: false, message: "Topic is required" }, { status: 400 });
    }
    if (!content.trim()) {
      return NextResponse.json({ success: false, message: "Write something before submitting" }, { status: 400 });
    }
    if (!started_at) {
      return NextResponse.json({ success: false, message: "Missing session start time" }, { status: 400 });
    }

    if (resume_base64 && !resume_filename) {
      return NextResponse.json({ success: false, message: "Resume filename missing" }, { status: 400 });
    }

    if (resume_base64) {
      const approxBytes = Math.floor((resume_base64.length * 3) / 4);
      if (approxBytes > MAX_RESUME_BYTES) {
        return NextResponse.json({ success: false, message: "Resume must be 2 MB or smaller" }, { status: 400 });
      }
    }

    const id = `wt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const resumeExtras =
      resume_base64 && resume_filename
        ? {
            resume_base64,
            resume_filename,
            resume_mime: resume_mime || "application/octet-stream",
          }
        : undefined;

    let row = buildSubmission(
      {
        student_name,
        student_id: body.student_id,
        student_email: body.student_email,
        topic,
        content,
        started_at,
        submitted_at,
        submitted_reason,
        resume_filename: resume_filename || undefined,
      },
      id
    );

    const [backendOk, webhookResult] = await Promise.all([
      forwardToBackendApi(row, resumeExtras).catch(() => false),
      forwardToWebhook(row, resumeExtras).catch(() => ({ ok: false } as const)),
    ]);

    if (webhookResult.resume_url) {
      row = { ...row, resume_url: webhookResult.resume_url };
    }

    addWritingTestSubmission(row);

    return NextResponse.json({
      success: true,
      id: row.id,
      word_count: row.word_count,
      resume_url: row.resume_url ?? null,
      persisted: {
        memory: true,
        backend: backendOk,
        webhook: webhookResult.ok,
        resume_saved: Boolean(row.resume_url),
      },
    });
  } catch (e) {
    console.error("writing-test submit error", e);
    return NextResponse.json({ success: false, message: "Failed to submit" }, { status: 500 });
  }
}
