"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Star } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface CompletionReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revieweeName?: string;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  isTaskmasterReviewingTasker?: boolean;
}

export function CompletionReviewModal({
  open,
  onOpenChange,
  revieweeName = "them",
  onSubmit,
  isTaskmasterReviewingTasker = true,
}: CompletionReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setShowSuccess(false);
      setRating(5);
      setComment("");
      setIsSubmitting(false);
    }
  }, [open]);

  const handleClose = () => {
    if (isSubmitting) return;
    setShowSuccess(false);
    setRating(5);
    setComment("");
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(rating, comment);
      setShowSuccess(true);
    } catch {
      /* Parent handles toast */
    } finally {
      setIsSubmitting(false);
    }
  };

  const successTitle = "Thank you for your review";
  const successBody = isTaskmasterReviewingTasker
    ? "Your confirmation and rating have been saved. Payment will be released to the tasker once the task is fully completed on both sides."
    : "Your completion and rating have been saved. The task owner will confirm when they're satisfied with the work.";

  return (
    <dialog
      ref={ref}
      onClose={handleClose}
      onCancel={(e) => {
        if (isSubmitting) e.preventDefault();
        else handleClose();
      }}
      className="fixed inset-0 z-50 m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-0 shadow-xl [&::backdrop]:bg-black/50 dark:border-slate-700 dark:bg-slate-900"
    >
      {showSuccess ? (
        <div className="px-6 py-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" aria-hidden />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{successTitle}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{successBody}</p>
          <Button className="mt-8 w-full rounded-lg font-semibold" onClick={handleClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {isTaskmasterReviewingTasker ? "Confirm task completed" : "Mark task as complete"}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {isTaskmasterReviewingTasker
              ? `As the task owner, you're confirming the work was done. Rate ${revieweeName} and add a short review.`
              : `Rate the task owner and add a short review to mark this task complete.`}
          </p>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className="rounded p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  onClick={() => setRating(n)}
                  disabled={isSubmitting}
                  aria-label={`Rate ${n} out of 5`}
                >
                  <Star
                    className={`h-8 w-8 ${
                      n <= rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-1 text-sm text-slate-500">{rating}/5</span>
            </div>
            <Textarea
              rows={4}
              placeholder="Write a short review..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting} className="font-semibold">
              {isSubmitting
                ? "Submitting..."
                : isTaskmasterReviewingTasker
                  ? "Confirm & submit review"
                  : "Submit review"}
            </Button>
          </div>
        </div>
      )}
    </dialog>
  );
}
