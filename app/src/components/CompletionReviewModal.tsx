"use client";

import { useState, useEffect, useRef } from "react";
import { Star } from "lucide-react";
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
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) el.showModal();
    else el.close();
  }, [open]);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(rating, comment);
      setRating(5);
      setComment("");
      onOpenChange(false);
    } catch {
      // Parent handles toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(5);
      setComment("");
    }
    onOpenChange(false);
  };

  return (
    <dialog
      ref={ref}
      onClose={handleClose}
      onCancel={handleClose}
      className="fixed inset-0 z-50 m-auto max-h-[90vh] w-full max-w-md rounded-lg border bg-white p-6 shadow-lg [&::backdrop]:bg-black/50 dark:bg-slate-900 dark:border-slate-700"
    >
      <h2 className="text-lg font-semibold">
        {isTaskmasterReviewingTasker ? "Confirm task completed" : "Mark task as complete"}
      </h2>
      <p className="mt-2 text-sm text-gray-500">
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
              className="focus:outline-none p-0.5"
              onClick={() => setRating(n)}
            >
              <Star
                className={`h-8 w-8 ${
                  n <= rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
          <span className="ml-1 text-sm text-gray-500">{rating}/5</span>
        </div>
        <Textarea
          rows={4}
          placeholder="Write a short review..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : isTaskmasterReviewingTasker ? "Confirm & submit review" : "Submit review"}
        </Button>
      </div>
    </dialog>
  );
}
