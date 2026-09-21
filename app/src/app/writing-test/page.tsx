"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock, Loader2, PenLine, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const TEST_DURATION_SEC = 5 * 60;
const DEFAULT_TOPIC =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_WRITING_TEST_DEFAULT_TOPIC?.trim()) ||
  "Write about a challenge you solved recently and what you learned.";

type Phase = "setup" | "writing" | "submitting" | "done";

function formatTimer(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function countWords(text: string): number {
  const t = text.trim();
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

export default function WritingTestPage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [content, setContent] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(TEST_DURATION_SEC);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("topic");
    if (t?.trim()) setTopic(t.trim());
  }, []);

  const wordCount = useMemo(() => countWords(content), [content]);

  const submit = useCallback(
    async (reason: "manual" | "timer" | "auto") => {
      if (submittedRef.current) return;
      if (!content.trim()) {
        toast.error("Please write something before submitting.");
        return;
      }
      if (!startedAt) return;

      submittedRef.current = true;
      setPhase("submitting");

      try {
        const res = await fetch("/api/writing-test/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_name: studentName,
            student_id: studentId || undefined,
            student_email: studentEmail || undefined,
            topic,
            content,
            started_at: startedAt,
            submitted_at: new Date().toISOString(),
            submitted_reason: reason,
          }),
        });
        const data = (await res.json()) as { success?: boolean; id?: string; message?: string };
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Submit failed");
        }
        setSubmissionId(data.id ?? null);
        setPhase("done");
        toast.success("Your response was submitted.");
      } catch (err) {
        submittedRef.current = false;
        setPhase("writing");
        toast.error(err instanceof Error ? err.message : "Could not submit. Try again.");
      }
    },
    [content, startedAt, studentEmail, studentId, studentName, topic]
  );

  useEffect(() => {
    if (phase !== "writing") return;

    const tick = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(tick);
          void submit("timer");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(tick);
  }, [phase, submit]);

  useEffect(() => {
    if (phase !== "writing") return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submittedRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [phase]);

  const startTest = () => {
    if (!studentName.trim()) {
      toast.error("Enter your name to start.");
      return;
    }
    if (!topic.trim()) {
      toast.error("Topic is required.");
      return;
    }
    submittedRef.current = false;
    setContent("");
    setSecondsLeft(TEST_DURATION_SEC);
    setStartedAt(new Date().toISOString());
    setPhase("writing");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/30 to-white px-4 py-8 md:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Timed writing</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 md:text-3xl">5-minute writing test</h1>
          <p className="mt-2 text-sm text-slate-600">
            Write freely about the topic. Your response is saved when you submit or when time runs out.
          </p>
        </div>

        {phase === "setup" ? (
          <Card className="rounded-2xl border-slate-200/80 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PenLine className="h-5 w-5 text-blue-600" />
                Before you start
              </CardTitle>
              <CardDescription>Timer is {TEST_DURATION_SEC / 60} minutes once you begin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-name">Full name *</Label>
                <Input
                  id="student-name"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="student-id">Student / roll ID (optional)</Label>
                  <Input
                    id="student-id"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 2024-001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student-email">Email (optional)</Label>
                  <Input
                    id="student-email"
                    type="email"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    placeholder="you@school.edu"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Textarea
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                  className="resize-y min-h-[4.5rem]"
                />
              </div>
              <Button type="button" className="w-full rounded-xl" size="lg" onClick={startTest}>
                Start {TEST_DURATION_SEC / 60}-minute test
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {phase === "writing" || phase === "submitting" ? (
          <Card className="rounded-2xl border-slate-200/80 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">Topic</CardTitle>
                  <CardDescription className="mt-1 text-slate-800">{topic}</CardDescription>
                </div>
                <div
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 font-mono text-lg font-bold tabular-nums ${
                    secondsLeft <= 60 ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-900"
                  }`}
                >
                  <Clock className="h-5 w-5 shrink-0" aria-hidden />
                  {formatTimer(secondsLeft)}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {studentName}
                {studentId ? ` · ${studentId}` : ""} · {wordCount} words
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={phase === "submitting"}
                placeholder="Start writing here…"
                className="min-h-[220px] resize-y text-base leading-relaxed"
                autoFocus
              />
              <Button
                type="button"
                className="w-full rounded-xl"
                disabled={phase === "submitting"}
                onClick={() => void submit("manual")}
              >
                {phase === "submitting" ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit early
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {phase === "done" ? (
          <Card className="rounded-2xl border-emerald-200/80 bg-emerald-50/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-emerald-900">Submitted</CardTitle>
              <CardDescription className="text-emerald-900/80">
                Thank you, {studentName}. Your writing has been recorded
                {submissionId ? ` (ref ${submissionId})` : ""}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-emerald-900/90">
                Words: {wordCount} · You can close this page.
              </p>
              <Button asChild variant="outline" className="mt-4 rounded-xl">
                <Link href="/">Back to JobPool home</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <p className="mt-8 text-center text-xs text-slate-500">
          For instructors: set topic via{" "}
          <code className="rounded bg-slate-100 px-1">?topic=</code> or env{" "}
          <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_WRITING_TEST_DEFAULT_TOPIC</code>.
        </p>
      </div>
    </div>
  );
}
