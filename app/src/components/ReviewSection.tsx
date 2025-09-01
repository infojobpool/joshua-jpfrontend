import { FormEvent } from "react";
import { Star } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Textarea } from "./ui/textarea";

interface ReviewSectionProps {
  isTaskPoster: boolean;
  taskStatus: boolean;
  handleSubmitReview: (e: FormEvent) => void;
  reviewRating: number;
  setReviewRating: (rating: number) => void;
  reviewComment: string;
  setReviewComment: (comment: string) => void;
  isSubmitting: boolean;
  taskerId: string | null;
  completionStatus: number;
}

export function ReviewSection({
  isTaskPoster,
  taskStatus,
  handleSubmitReview,
  reviewRating,
  setReviewRating,
  reviewComment,
  setReviewComment,
  isSubmitting,
  taskerId,
  completionStatus,
}: ReviewSectionProps) {
  if (!taskStatus || !isTaskPoster || !taskerId || completionStatus !== 1)
    return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
        <CardDescription>Share your experience with the tasker</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="rating">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      reviewRating >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="comment">Comment</label>
            <Textarea
              id="comment"
              placeholder="Share your experience..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              rows={4}
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
