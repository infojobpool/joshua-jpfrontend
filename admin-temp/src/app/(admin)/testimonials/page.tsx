"use client";

import { useCallback, useEffect, useState, type SetStateAction } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
import axiosInstance from "@/lib/axiosInstance";
import { useCanAdminWrite } from "@/lib/adminAuth";
import { formatAxiosApiError } from "@/lib/apiError";

export type AdminTestimonialRow = {
  testimonial_id: string;
  name: string;
  role_subtitle: string;
  body: string;
  rating: number;
  category: string | null;
  avatar_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
};

type FormState = {
  name: string;
  role_subtitle: string;
  body: string;
  rating: number;
  category: string;
  avatar_url: string;
  is_published: boolean;
  sort_order: number;
};

const emptyForm = (): FormState => ({
  name: "",
  role_subtitle: "",
  body: "",
  rating: 5,
  category: "",
  avatar_url: "",
  is_published: true,
  sort_order: 10,
});

function rowToForm(row: AdminTestimonialRow): FormState {
  return {
    name: row.name,
    role_subtitle: row.role_subtitle ?? "",
    body: row.body ?? "",
    rating: Math.min(5, Math.max(1, Number(row.rating) || 5)),
    category: row.category ?? "",
    avatar_url: row.avatar_url ?? "",
    is_published: Boolean(row.is_published),
    sort_order: Number(row.sort_order) || 0,
  };
}

function parseList(apiBody: { status_code?: number; data?: unknown; message?: string }): AdminTestimonialRow[] {
  const sc = apiBody?.status_code;
  if (sc !== undefined && sc !== 200) return [];
  const raw = apiBody?.data;
  if (!Array.isArray(raw)) return [];
  return raw.filter(Boolean) as AdminTestimonialRow[];
}

function buildPayload(f: FormState) {
  return {
    name: f.name.trim(),
    role_subtitle: f.role_subtitle.trim() || "",
    body: f.body.trim(),
    rating: f.rating,
    category: f.category.trim() ? f.category.trim() : null,
    avatar_url: f.avatar_url.trim() ? f.avatar_url.trim() : null,
    is_published: f.is_published,
    sort_order: Number(f.sort_order) || 0,
  };
}

export default function TestimonialsPage() {
  const [rows, setRows] = useState<AdminTestimonialRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newForm, setNewForm] = useState<FormState>(emptyForm);
  const [editRow, setEditRow] = useState<AdminTestimonialRow | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);
  const canWrite = useCanAdminWrite();

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "—";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const fetchRows = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("admin-testimonials/");
      const body = response.data as { status_code?: number; data?: unknown; message?: string };
      const list = parseList(body);
      setRows(list);
      if (body?.status_code !== undefined && body.status_code !== 200) {
        toast.error(body?.message || "Failed to fetch testimonials");
      }
    } catch (e) {
      toast.error(formatAxiosApiError(e));
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const filtered = rows.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.body.toLowerCase().includes(q) ||
      (r.role_subtitle || "").toLowerCase().includes(q) ||
      (r.category || "").toLowerCase().includes(q)
    );
  });

  const handleCreate = async () => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    const p = buildPayload(newForm);
    if (!p.name || !p.body) {
      toast.error("Name and body are required");
      return;
    }
    try {
      setIsLoading(true);
      const response = await axiosInstance.post("create-testimonial/", p);
      if (response.data?.status_code === 201) {
        toast.success("Testimonial created");
        setNewForm(emptyForm());
        setIsAddOpen(false);
        fetchRows();
      } else {
        toast.error(response.data?.message || "Failed to create");
      }
    } catch (e) {
      toast.error(formatAxiosApiError(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!canWrite || !editRow) {
      toast.error("Read-only access");
      return;
    }
    const p = buildPayload(editForm);
    if (!p.name || !p.body) {
      toast.error("Name and body are required");
      return;
    }
    try {
      setIsLoading(true);
      const response = await axiosInstance.put(`update-testimonial/${editRow.testimonial_id}/`, p);
      if (response.data?.status_code === 200) {
        toast.success("Testimonial updated");
        setEditRow(null);
        setIsEditOpen(false);
        fetchRows();
      } else {
        toast.error(response.data?.message || "Failed to update");
      }
    } catch (e) {
      toast.error(formatAxiosApiError(e));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canWrite || !deleteId) return;
    try {
      setIsLoading(true);
      const response = await axiosInstance.delete(`delete-testimonial/${deleteId}/`);
      if (response.data?.status_code === 200) {
        toast.success("Testimonial deleted");
        setDeleteId(null);
        fetchRows();
      } else {
        toast.error(response.data?.message || "Failed to delete");
      }
    } catch (e) {
      toast.error(formatAxiosApiError(e));
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (row: AdminTestimonialRow) => {
    setEditRow(row);
    setEditForm(rowToForm(row));
    setIsEditOpen(true);
  };

  const formFields = (f: FormState, setF: (u: SetStateAction<FormState>) => void, idPrefix: string) => (
    <div className="grid max-h-[70vh] gap-4 overflow-y-auto py-2 pr-1">
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={f.name}
          onChange={(e) => setF((s) => ({ ...s, name: e.target.value }))}
          disabled={isLoading}
          placeholder="Priya S."
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-role`}>Role / subtitle</Label>
        <Input
          id={`${idPrefix}-role`}
          value={f.role_subtitle}
          onChange={(e) => setF((s) => ({ ...s, role_subtitle: e.target.value }))}
          disabled={isLoading}
          placeholder="Task poster, Bangalore"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-body`}>Body</Label>
        <Textarea
          id={`${idPrefix}-body`}
          value={f.body}
          onChange={(e) => setF((s) => ({ ...s, body: e.target.value }))}
          disabled={isLoading}
          rows={4}
          placeholder="Found a great tasker in one day."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-rating`}>Rating (1–5)</Label>
          <Input
            id={`${idPrefix}-rating`}
            type="number"
            min={1}
            max={5}
            value={f.rating}
            onChange={(e) =>
              setF((s) => ({ ...s, rating: Math.min(5, Math.max(1, Number(e.target.value) || 5)) }))
            }
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={`${idPrefix}-sort`}>Sort order</Label>
          <Input
            id={`${idPrefix}-sort`}
            type="number"
            value={f.sort_order}
            onChange={(e) => setF((s) => ({ ...s, sort_order: Number(e.target.value) || 0 }))}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-category`}>Category (optional)</Label>
        <Input
          id={`${idPrefix}-category`}
          value={f.category}
          onChange={(e) => setF((s) => ({ ...s, category: e.target.value }))}
          disabled={isLoading}
          placeholder="Home Services"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-avatar`}>Avatar URL (optional)</Label>
        <Input
          id={`${idPrefix}-avatar`}
          value={f.avatar_url}
          onChange={(e) => setF((s) => ({ ...s, avatar_url: e.target.value }))}
          disabled={isLoading}
          placeholder="https://..."
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${idPrefix}-pub`}
          checked={f.is_published}
          onCheckedChange={(c) => setF((s) => ({ ...s, is_published: c === true }))}
          disabled={isLoading}
        />
        <Label htmlFor={`${idPrefix}-pub`} className="text-sm font-normal cursor-pointer">
          Published (visible on public site)
        </Label>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Testimonials</h1>
        <Dialog
          open={isAddOpen}
          onOpenChange={(open) => {
            if (open && !canWrite) return;
            setIsAddOpen(open);
            if (open) setNewForm(emptyForm());
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={isLoading || !canWrite} title={!canWrite ? "Read-only role" : undefined}>
              <Plus className="mr-2 h-4 w-4" />
              Add testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add testimonial</DialogTitle>
              <DialogDescription>Create a testimonial for the marketing site. Unpublished items stay admin-only.</DialogDescription>
            </DialogHeader>
            {formFields(newForm, setNewForm, "add")}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={isLoading}>
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
          placeholder="Search by name, body, role, category…"
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="max-w-[200px]">Body</TableHead>
              <TableHead>★</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  No testimonials
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.testimonial_id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="max-w-[140px] truncate text-muted-foreground text-sm">
                    {row.role_subtitle || "—"}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm">{row.body}</TableCell>
                  <TableCell>{row.rating}</TableCell>
                  <TableCell>{row.is_published ? "Yes" : "No"}</TableCell>
                  <TableCell>{row.sort_order}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">{formatDate(row.created_at)}</TableCell>
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
                        onClick={() => setDeleteId(row.testimonial_id)}
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
            <DialogTitle>Edit testimonial</DialogTitle>
            <DialogDescription>Update fields. Only published testimonials appear on the homepage.</DialogDescription>
          </DialogHeader>
          {editRow ? formFields(editForm, setEditForm, "edit") : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isLoading || !editRow}>
              {isLoading ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete testimonial?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
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
