"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { useCanAdminWrite } from "@/lib/adminAuth";
import { formatAxiosApiError } from "@/lib/apiError";
import { createReview, deleteReview, fetchReviews, updateReview } from "@/lib/reviewsApi";
import type { Review } from "@/types/review";

type AddForm = {
  user_id: string;
  reviewer_id: string;
  job_ref_id: string;
  rating: number;
  comment: string;
};

type EditForm = {
  rating: number;
  comment: string;
};

const emptyAddForm = (): AddForm => ({
  user_id: "",
  reviewer_id: "",
  job_ref_id: "",
  rating: 5,
  comment: "",
});

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function clampRating(n: number): number {
  return Math.min(5, Math.max(0, Number.isFinite(n) ? n : 0));
}

function writeErrorMessage(err: unknown): string {
  const status = (err as { response?: { status?: number } })?.response?.status;
  if (status === 401 || status === 403) return "Insufficient permissions";
  if (err instanceof Error && err.message) return err.message;
  return formatAxiosApiError(err);
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Review | null>(null);
  const [addForm, setAddForm] = useState<AddForm>(emptyAddForm);
  const [editRow, setEditRow] = useState<Review | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ rating: 5, comment: "" });
  const canWrite = useCanAdminWrite();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const { reviews: list, total: count } = await fetchReviews(debouncedSearch || undefined);
      setReviews(list);
      setTotal(count);
    } catch (e) {
      toast.error(writeErrorMessage(e));
      setReviews([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const handleCreate = async () => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    const user_id = addForm.user_id.trim();
    const reviewer_id = addForm.reviewer_id.trim();
    const job_ref_id = addForm.job_ref_id.trim();
    if (!user_id || !reviewer_id || !job_ref_id) {
      toast.error("Reviewee ID, reviewer ID, and job ID are required");
      return;
    }
    try {
      setIsLoading(true);
      await createReview({
        user_id,
        reviewer_id,
        job_ref_id,
        rating: clampRating(addForm.rating),
        comment: addForm.comment.trim() || undefined,
      });
      toast.success("Review created");
      setAddForm(emptyAddForm());
      setIsAddOpen(false);
      await loadReviews();
    } catch (e) {
      toast.error(writeErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!canWrite || !editRow) {
      toast.error("Read-only access");
      return;
    }
    const rating = clampRating(editForm.rating);
    const comment = editForm.comment.trim();
    if (comment === "" && editRow.comment === "" && rating === (editRow.rating ?? 0)) {
      toast.error("Change rating or comment before saving");
      return;
    }
    try {
      setIsLoading(true);
      await updateReview({
        reviewee_user_id: editRow.reviewee_user_id,
        reviewer_id: editRow.reviewer_id,
        job_ref_id: editRow.job_ref_id,
        rating,
        comment,
      });
      toast.success("Review updated");
      setEditRow(null);
      setIsEditOpen(false);
      await loadReviews();
    } catch (e) {
      toast.error(writeErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canWrite || !deleteRow) return;
    try {
      setIsLoading(true);
      await deleteReview({
        reviewee_user_id: deleteRow.reviewee_user_id,
        reviewer_id: deleteRow.reviewer_id,
        job_ref_id: deleteRow.job_ref_id,
      });
      toast.success("Review deleted");
      setDeleteRow(null);
      await loadReviews();
    } catch (e) {
      toast.error(writeErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (row: Review) => {
    setEditRow(row);
    setEditForm({
      rating: clampRating(row.rating ?? 0),
      comment: row.comment ?? "",
    });
    setIsEditOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            User feedback on profiles (matches app Recent Feedback). {total > 0 ? `${total} total` : null}
          </p>
        </div>
        <Dialog
          open={isAddOpen}
          onOpenChange={(open) => {
            if (open && !canWrite) return;
            setIsAddOpen(open);
            if (open) setAddForm(emptyAddForm());
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={isLoading || !canWrite} title={!canWrite ? "Read-only role" : undefined}>
              <Plus className="mr-2 h-4 w-4" />
              Add review
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add review</DialogTitle>
              <DialogDescription>
                One review per reviewer and job on a profile. IDs from Customers (reviewee) and Tasks (job).
              </DialogDescription>
            </DialogHeader>
            <div className="grid max-h-[70vh] gap-4 overflow-y-auto py-2 pr-1">
              <div className="grid gap-2">
                <Label htmlFor="add-reviewee">Reviewee user ID</Label>
                <Input
                  id="add-reviewee"
                  value={addForm.user_id}
                  onChange={(e) => setAddForm((s) => ({ ...s, user_id: e.target.value }))}
                  placeholder="Profile owner / poster user_id"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-reviewer">Reviewer user ID</Label>
                <Input
                  id="add-reviewer"
                  value={addForm.reviewer_id}
                  onChange={(e) => setAddForm((s) => ({ ...s, reviewer_id: e.target.value }))}
                  placeholder="Reviewer user_id"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-job">Job ID</Label>
                <Input
                  id="add-job"
                  value={addForm.job_ref_id}
                  onChange={(e) => setAddForm((s) => ({ ...s, job_ref_id: e.target.value }))}
                  placeholder="job_ref_id from Tasks"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-rating">Rating (0–5)</Label>
                <Input
                  id="add-rating"
                  type="number"
                  min={0}
                  max={5}
                  step={1}
                  value={addForm.rating}
                  onChange={(e) => setAddForm((s) => ({ ...s, rating: clampRating(Number(e.target.value)) }))}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="add-comment">Comment (optional)</Label>
                <Textarea
                  id="add-comment"
                  value={addForm.comment}
                  onChange={(e) => setAddForm((s) => ({ ...s, comment: e.target.value }))}
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={() => void handleCreate()} disabled={isLoading}>
                {isLoading ? "Saving…" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search name, email, job, comment, job id…"
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isLoading && reviews.length === 0}
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reviewee</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="min-w-[160px]">Comment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No reviews found
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((row) => (
                <TableRow key={row.review_id}>
                  <TableCell className="min-w-[140px]">
                    <div className="font-medium">{row.reviewee_name || "—"}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">{row.reviewee_email}</div>
                    <div className="text-xs text-muted-foreground font-mono">{row.reviewee_user_id}</div>
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    <div className="font-medium">{row.reviewer_name || "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{row.reviewer_id}</div>
                    {row.role ? (
                      <div className="text-xs text-muted-foreground capitalize">{row.role}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="min-w-[120px]">
                    <div className="font-medium truncate max-w-[180px]">{row.job_title || "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{row.job_ref_id}</div>
                  </TableCell>
                  <TableCell>{row.rating != null ? row.rating : "—"}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm" title={row.comment}>
                    {row.comment || "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(row.timestamp)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoading || !canWrite}
                        title={!canWrite ? "Read-only" : "Edit"}
                        onClick={() => openEdit(row)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={isLoading || !canWrite}
                        title={!canWrite ? "Read-only" : "Delete"}
                        onClick={() => setDeleteRow(row)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={isEditOpen}
        onOpenChange={(o) => {
          if (!o) {
            setIsEditOpen(false);
            setEditRow(null);
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit review</DialogTitle>
            <DialogDescription>Update rating and comment only. IDs cannot be changed.</DialogDescription>
          </DialogHeader>
          {editRow ? (
            <div className="grid gap-4 py-2">
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs space-y-1">
                <p>
                  <span className="text-muted-foreground">Reviewee:</span> {editRow.reviewee_name} (
                  {editRow.reviewee_user_id})
                </p>
                <p>
                  <span className="text-muted-foreground">Reviewer:</span> {editRow.reviewer_name ?? "—"} (
                  {editRow.reviewer_id})
                </p>
                <p>
                  <span className="text-muted-foreground">Job:</span> {editRow.job_title ?? "—"} ({editRow.job_ref_id})
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-rating">Rating (0–5)</Label>
                <Input
                  id="edit-rating"
                  type="number"
                  min={0}
                  max={5}
                  step={1}
                  value={editForm.rating}
                  onChange={(e) => setEditForm((s) => ({ ...s, rating: clampRating(Number(e.target.value)) }))}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-comment">Comment</Label>
                <Textarea
                  id="edit-comment"
                  value={editForm.comment}
                  onChange={(e) => setEditForm((s) => ({ ...s, comment: e.target.value }))}
                  rows={4}
                  disabled={isLoading}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={() => void handleUpdate()} disabled={isLoading || !editRow}>
              {isLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteRow !== null} onOpenChange={(o) => !o && setDeleteRow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete review?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove feedback from {deleteRow?.reviewee_name ?? "this profile"} for job{" "}
              {deleteRow?.job_ref_id}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={isLoading}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
