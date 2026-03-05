"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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

  const handleOpenChange = (next: boolean) => {
    if (!next && !isSubmitting) {
      setRating(5);
      setComment("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isTaskmasterReviewingTasker ? "Confirm task completed" : "Mark task as complete"}
          </DialogTitle>
          <DialogDescription>
            {isTaskmasterReviewingTasker
              ? `As the task owner, you're confirming the work was done. Rate ${revieweeName} and add a short review.`
              : `Rate the task owner and add a short review to mark this task complete.`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
            <span className="text-sm text-muted-foreground ml-1">{rating}/5</span>
          </div>
          <Textarea
            rows={4}
            placeholder="Write a short review..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : isTaskmasterReviewingTasker ? "Confirm & submit review" : "Submit review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
