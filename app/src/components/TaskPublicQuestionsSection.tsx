"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Flag, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  extractApiErrorMessage,
  fetchTaskPublicQuestions,
  patchTaskPublicAnswer,
  patchTaskPublicQuestion,
  postTaskPublicQuestion,
  putTaskPublicAnswer,
  reportTaskPublicQuestion,
  type TaskPublicQAItem,
} from "@/lib/taskPublicQaApi";

const NO_DIGITS_MSG = "Numbers are not allowed in the message.";

function applyNoDigitsInput(
  input: string,
  setError: (msg: string) => void,
  setValue: (v: string) => void,
) {
  if (/\d/.test(input)) {
    setError(NO_DIGITS_MSG);
  } else {
    setError("");
    setValue(input);
  }
}

function rejectIfDigits(text: string, setError: (msg: string) => void): boolean {
  if (/\d/.test(text)) {
    setError(NO_DIGITS_MSG);
    return true;
  }
  return false;
}

function formatWhen(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  taskId: string;
  posterId: string;
  currentUserId?: string | null;
  isTaskPoster: boolean;
  /** Bump to refetch from parent (e.g. after task refresh) */
  refreshKey?: number;
  onMetaChange?: (meta: { total: number; qaOpen: boolean }) => void;
};

export function TaskPublicQuestionsSection({
  taskId,
  posterId,
  currentUserId,
  isTaskPoster,
  refreshKey = 0,
  onMetaChange,
}: Props) {
  const [items, setItems] = useState<TaskPublicQAItem[]>([]);
  const [total, setTotal] = useState(0);
  const [qaOpen, setQaOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  /** List GET returned 401 — API may require login to read Q&A */
  const [listNeedsSignIn, setListNeedsSignIn] = useState(false);
  const [askBody, setAskBody] = useState("");
  const [askError, setAskError] = useState("");
  const [askSubmitting, setAskSubmitting] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportQaId, setReportQaId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const pageSize = 20;
  const hasMore = items.length < total;

  const refresh = useCallback(async () => {
    setLoading(true);
    setListNeedsSignIn(false);
    try {
      const meta = await fetchTaskPublicQuestions(taskId, pageSize, 0);
      setItems(meta.items);
      setTotal(meta.total);
      setQaOpen(meta.qaOpenForNewPosts);
      onMetaChange?.({ total: meta.total, qaOpen: meta.qaOpenForNewPosts });
    } catch (e: unknown) {
      const st = (e as { response?: { status?: number } })?.response?.status;
      if (st === 401) {
        setListNeedsSignIn(true);
        setItems([]);
        setTotal(0);
        onMetaChange?.({ total: 0, qaOpen: false });
        return;
      }
      if (st === 403) {
        console.warn("public-questions 403 — use app user JWT, not admin");
      }
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [taskId, onMetaChange]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const cur = items.length;
      const meta = await fetchTaskPublicQuestions(taskId, pageSize, cur);
      setItems((prev) => [...prev, ...meta.items]);
      setTotal(meta.total);
      setQaOpen(meta.qaOpenForNewPosts);
      onMetaChange?.({ total: meta.total, qaOpen: meta.qaOpenForNewPosts });
    } catch {
      toast.error("Could not load more questions.");
    } finally {
      setLoadingMore(false);
    }
  }, [taskId, items.length, onMetaChange]);

  useEffect(() => {
    void refresh();
  }, [taskId, refreshKey, refresh]);

  const handleAsk = async () => {
    const t = askBody.trim();
    if (t.length < 1) return;
    if (rejectIfDigits(askBody, setAskError)) return;
    setAskSubmitting(true);
    try {
      await postTaskPublicQuestion(taskId, t);
      setAskBody("");
      setAskError("");
      toast.success("Question posted");
      await refresh();
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setAskSubmitting(false);
    }
  };

  const openReport = (qaId: string) => {
    setReportQaId(qaId);
    setReportReason("");
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!reportQaId) return;
    setReportSubmitting(true);
    try {
      await reportTaskPublicQuestion(
        taskId,
        reportQaId,
        reportReason.trim() || undefined,
      );
      toast.success("Report submitted. Thank you.");
      setReportOpen(false);
      setReportQaId(null);
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setReportSubmitting(false);
    }
  };

  const showComposer =
    !isTaskPoster &&
    !!currentUserId &&
    qaOpen;

  return (
    <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white/95 overflow-hidden">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50/90 to-blue-50/20 pb-4">
        <CardTitle className="task-title text-lg text-slate-900">
          Questions ({total})
        </CardTitle>
        <CardDescription className="text-slate-600 text-sm mt-1">
          Ask the task owner anything before you bid. Replies are visible to everyone on this task.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="flex gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2.5 text-sm text-slate-700">
          <Eye className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" aria-hidden />
          <p>
            <span className="font-medium text-slate-800">Public thread.</span>{" "}
            Don&apos;t share phone numbers, UPI, or off-platform payment. The server may block digit patterns that look like contact or payment info.
          </p>
        </div>

        {listNeedsSignIn && (
          <p className="text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <Link href={`/signin?returnUrl=${encodeURIComponent(`/tasks/${taskId}/`)}`} className="font-medium text-blue-600 hover:underline">
              Sign in
            </Link>{" "}
            to view public questions and take part in this thread.
          </p>
        )}

        {!currentUserId && !listNeedsSignIn && (
          <p className="text-sm text-slate-600">
            <Link href={`/signin?returnUrl=${encodeURIComponent(`/tasks/${taskId}/`)}`} className="font-medium text-blue-600 hover:underline">
              Sign in
            </Link>{" "}
            to ask a question or report content.
          </p>
        )}

        {isTaskPoster && (
          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
            You can <span className="font-medium">answer</span> questions below. To change the task itself, edit the task description.
          </p>
        )}

        {showComposer && (
          <div className="space-y-2">
            <Label htmlFor="task-qa-ask" className="text-sm font-medium text-slate-800">
              Ask a question
            </Label>
            <Textarea
              id="task-qa-ask"
              rows={3}
              placeholder="e.g. What time works best for access to the property?"
              value={askBody}
              onChange={(e) =>
                applyNoDigitsInput(e.target.value, setAskError, setAskBody)
              }
              maxLength={2000}
              className="rounded-xl border-slate-200"
              disabled={!qaOpen}
            />
            {askError ? (
              <p className="text-sm text-red-500">{askError}</p>
            ) : null}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-slate-500">{askBody.length}/2000</span>
              <Button
                type="button"
                size="sm"
                className="rounded-full bg-blue-600 hover:bg-blue-700"
                disabled={
                  askSubmitting ||
                  askBody.trim().length < 1 ||
                  askBody.length > 2000 ||
                  !!askError
                }
                onClick={() => void handleAsk()}
              >
                {askSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </div>
        )}

        {!qaOpen && !isTaskPoster && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            This task is no longer open for new public questions (e.g. assigned or closed). You can still read past Q&amp;A.
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">
            No questions yet.
            {showComposer ? " Be the first to ask." : ""}
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((q) => (
              <QuestionThreadRow
                key={q.id}
                q={q}
                taskId={taskId}
                posterId={posterId}
                currentUserId={currentUserId}
                isTaskPoster={isTaskPoster}
                qaOpen={qaOpen}
                onUpdated={() => void refresh()}
                onReport={() => openReport(q.id)}
              />
            ))}
          </ul>
        )}

        {hasMore && !loading && (
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Load more (${items.length} of ${total})`
            )}
          </Button>
        )}
      </CardContent>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report question</DialogTitle>
            <DialogDescription>
              Tell us briefly what&apos;s wrong. You can&apos;t report your own question.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Optional reason…"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={3}
            className="rounded-lg"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={reportSubmitting}
              onClick={() => void submitReport()}
            >
              {reportSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit report"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function QuestionThreadRow({
  q,
  taskId,
  posterId,
  currentUserId,
  isTaskPoster,
  qaOpen,
  onUpdated,
  onReport,
}: {
  q: TaskPublicQAItem;
  taskId: string;
  posterId: string;
  currentUserId?: string | null;
  isTaskPoster: boolean;
  qaOpen: boolean;
  onUpdated: () => void;
  onReport: () => void;
}) {
  const [editingQ, setEditingQ] = useState(false);
  const [editingA, setEditingA] = useState(false);
  const [draftQ, setDraftQ] = useState(q.questionBody);
  const [draftA, setDraftA] = useState(q.answerBody || "");
  const [saving, setSaving] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [answerDraft, setAnswerDraft] = useState("");
  const [editQError, setEditQError] = useState("");
  const [editAError, setEditAError] = useState("");
  const [answerError, setAnswerError] = useState("");

  const isAuthor =
    currentUserId && String(q.askerId) === String(currentUserId);
  const canEditQuestion = isAuthor && !q.answerBody;
  const canAnswer =
    isTaskPoster && !q.answerBody && qaOpen && String(posterId) === String(currentUserId);
  const canEditAnswer =
    isTaskPoster && !!q.answerBody && String(posterId) === String(currentUserId);
  const showReport = !!currentUserId && !isAuthor;

  useEffect(() => {
    setDraftQ(q.questionBody);
    setDraftA(q.answerBody || "");
  }, [q.questionBody, q.answerBody]);

  const saveQuestion = async () => {
    const t = draftQ.trim();
    if (t.length < 1 || t.length > 2000) return;
    if (rejectIfDigits(draftQ, setEditQError)) return;
    setSaving(true);
    try {
      await patchTaskPublicQuestion(taskId, q.id, t);
      toast.success("Question updated");
      setEditingQ(false);
      setEditQError("");
      onUpdated();
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const saveAnswerEdit = async () => {
    const t = draftA.trim();
    if (t.length < 1 || t.length > 2000) return;
    if (rejectIfDigits(draftA, setEditAError)) return;
    setSaving(true);
    try {
      await patchTaskPublicAnswer(taskId, q.id, t);
      toast.success("Answer updated");
      setEditingA(false);
      setEditAError("");
      onUpdated();
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const submitAnswer = async () => {
    const t = answerDraft.trim();
    if (t.length < 1 || t.length > 2000) return;
    if (rejectIfDigits(answerDraft, setAnswerError)) return;
    setSaving(true);
    try {
      await putTaskPublicAnswer(taskId, q.id, t);
      toast.success("Answer posted");
      setAnswering(false);
      setAnswerDraft("");
      setAnswerError("");
      onUpdated();
    } catch (e) {
      toast.error(extractApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {q.askerId ? (
              <Link
                href={`/profilepage/${q.askerId}`}
                className="font-semibold text-slate-900 hover:text-blue-700 truncate"
              >
                {q.askerName}
              </Link>
            ) : (
              <span className="font-semibold text-slate-900">{q.askerName}</span>
            )}
            <span className="text-xs text-slate-500">{formatWhen(q.createdAt)}</span>
            {q.questionEditedAt && (
              <span className="text-[10px] uppercase tracking-wide text-slate-400">Edited</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canEditQuestion && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => setEditingQ((v) => !v)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {showReport && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-slate-500"
              onClick={onReport}
            >
              <Flag className="h-3.5 w-3.5" />
              <span className="sr-only">Report</span>
            </Button>
          )}
        </div>
      </div>

      {editingQ ? (
        <div className="space-y-2">
          <Textarea
            value={draftQ}
            onChange={(e) =>
              applyNoDigitsInput(e.target.value, setEditQError, setDraftQ)
            }
            rows={3}
            maxLength={2000}
            className="rounded-lg bg-white"
          />
          {editQError ? (
            <p className="text-sm text-red-500">{editQError}</p>
          ) : null}
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={saving || !!editQError}
              onClick={() => void saveQuestion()}
            >
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingQ(false);
                setDraftQ(q.questionBody);
                setEditQError("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-800 whitespace-pre-wrap">{q.questionBody}</p>
      )}

      {q.answerBody && (
        <div className="mt-2 pl-3 border-l-2 border-emerald-400/80 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/90">
              Task owner
            </p>
            <div className="flex items-center gap-2">
              {q.answeredAt && (
                <span className="text-xs text-slate-500">{formatWhen(q.answeredAt)}</span>
              )}
              {q.answerEditedAt && (
                <span className="text-[10px] uppercase text-slate-400">Edited</span>
              )}
              {canEditAnswer && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2"
                  onClick={() => setEditingA((v) => !v)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          {editingA ? (
            <div className="space-y-2">
              <Textarea
                value={draftA}
                onChange={(e) =>
                  applyNoDigitsInput(e.target.value, setEditAError, setDraftA)
                }
                rows={3}
                maxLength={2000}
                className="rounded-lg bg-white"
              />
              {editAError ? (
                <p className="text-sm text-red-500">{editAError}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={saving || !!editAError}
                  onClick={() => void saveAnswerEdit()}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingA(false);
                    setDraftA(q.answerBody || "");
                    setEditAError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-800 whitespace-pre-wrap">{q.answerBody}</p>
          )}
        </div>
      )}

      {canAnswer && !q.answerBody && (
        <div className="pt-2 border-t border-slate-200/80">
          {!answering ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full border-emerald-200 text-emerald-800 hover:bg-emerald-50"
              onClick={() => setAnswering(true)}
            >
              Answer publicly
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                placeholder="Your reply (visible to everyone on this task)"
                value={answerDraft}
                onChange={(e) =>
                  applyNoDigitsInput(e.target.value, setAnswerError, setAnswerDraft)
                }
                rows={3}
                maxLength={2000}
                className="rounded-lg bg-white"
              />
              {answerError ? (
                <p className="text-sm text-red-500">{answerError}</p>
              ) : null}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={
                    saving || answerDraft.trim().length < 1 || !!answerError
                  }
                  onClick={() => void submitAnswer()}
                >
                  Post answer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setAnswering(false);
                    setAnswerDraft("");
                    setAnswerError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
