import { NextResponse } from "next/server";
import { addWritingTestSubmission } from "@/lib/writing-test-store";
import {
  buildSubmission,
  forwardToBackendApi,
  forwardToWebhook,
} from "@/lib/writing-test/submitWritingTest";
import type { WritingTestSubmitPayload } from "@/lib/writing-test/types";

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

    const id = `wt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const row = buildSubmission(
      {
        student_name,
        student_id: body.student_id,
        student_email: body.student_email,
        topic,
        content,
        started_at,
        submitted_at,
        submitted_reason,
      },
      id
    );

    addWritingTestSubmission(row);

    const [backendOk, webhookOk] = await Promise.all([
      forwardToBackendApi(row).catch(() => false),
      forwardToWebhook(row).catch(() => false),
    ]);

    return NextResponse.json({
      success: true,
      id: row.id,
      word_count: row.word_count,
      persisted: {
        memory: true,
        backend: backendOk,
        webhook: webhookOk,
      },
    });
  } catch (e) {
    console.error("writing-test submit error", e);
    return NextResponse.json({ success: false, message: "Failed to submit" }, { status: 500 });
  }
}
