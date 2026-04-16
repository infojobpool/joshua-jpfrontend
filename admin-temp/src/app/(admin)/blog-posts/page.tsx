"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";
import { useCanAdminWrite } from "@/lib/adminAuth";
import { AdminReadOnlyBanner } from "@/components/AdminReadOnlyBanner";
import { parseAdminBlogListResponse, type AdminBlogPostRow } from "@/lib/adminBlog";
import { formatAxiosApiError } from "@/lib/apiError";

export default function AdminBlogPostsPage() {
  const [rows, setRows] = useState<AdminBlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const canWrite = useCanAdminWrite();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("admin/blog-posts/");
      setRows(parseAdminBlogListResponse(res.data));
    } catch (e: unknown) {
      const msg = formatAxiosApiError(e);
      if (msg.includes("403") || msg.toLowerCase().includes("forbidden")) {
        toast.error("Not allowed to view blog posts (403).");
      } else {
        toast.error(msg || "Failed to load blog posts.");
      }
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmDelete = async () => {
    if (!deleteId || !canWrite) return;
    try {
      await axiosInstance.delete(`admin/blog-posts/${deleteId}/`);
      toast.success("Post deleted.");
      setDeleteId(null);
      await load();
    } catch (e: unknown) {
      toast.error(formatAxiosApiError(e) || "Delete failed.");
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Toaster />
      <AdminReadOnlyBanner />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog posts</h1>
          <p className="text-sm text-muted-foreground">Manage articles shown on the public blog.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {canWrite ? (
            <Button asChild size="sm">
              <Link href="/blog-posts/new">
                <Plus className="mr-2 h-4 w-4" />
                New post
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead className="w-[100px]">Published</TableHead>
              <TableHead className="w-[90px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No posts yet. Create one with &quot;New post&quot;.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r.post_id}>
                  <TableCell className="max-w-[280px] font-medium">
                    <div className="truncate">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground md:hidden">{r.slug || "—"}</div>
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate text-sm text-muted-foreground md:table-cell">
                    {r.slug || "—"}
                  </TableCell>
                  <TableCell className="text-sm">{r.is_published ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    {canWrite ? (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                          <Link href={`/blog-posts/${encodeURIComponent(r.post_id)}/edit`} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          aria-label="Delete"
                          onClick={() => setDeleteId(r.post_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={Boolean(deleteId)} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
