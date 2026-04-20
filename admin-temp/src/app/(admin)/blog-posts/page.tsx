"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";

type Filter = "all" | "published" | "drafts";

export default function AdminBlogPostsPage() {
  const [rows, setRows] = useState<AdminBlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
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

  const filtered = useMemo(() => {
    if (filter === "published") return rows.filter((r) => r.is_published !== false);
    if (filter === "drafts") return rows.filter((r) => r.is_published === false);
    return rows;
  }, [rows, filter]);

  const draftCount = useMemo(() => rows.filter((r) => r.is_published === false).length, [rows]);

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

  const FilterBtn = ({ id, label }: { id: Filter; label: string }) => (
    <Button
      type="button"
      size="sm"
      variant={filter === id ? "default" : "outline"}
      className={cn(filter === id && "pointer-events-none")}
      onClick={() => setFilter(id)}
    >
      {label}
      {id === "drafts" && draftCount > 0 ? (
        <span className="ml-1.5 rounded-full bg-background/25 px-1.5 text-[10px] font-semibold">{draftCount}</span>
      ) : null}
    </Button>
  );

  return (
    <div className="space-y-6 p-4 md:p-6">
      <Toaster />
      <AdminReadOnlyBanner />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blog posts</h1>
          <p className="text-sm text-muted-foreground">Manage articles on the public blog. Drafts stay hidden until published.</p>
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

      <div className="flex flex-wrap items-center gap-2">
        <FilterBtn id="all" label="All" />
        <FilterBtn id="published" label="Published" />
        <FilterBtn id="drafts" label="Drafts" />
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead className="hidden md:table-cell">Slug</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
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
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  {rows.length === 0
                    ? 'No posts yet. Create one with "New post".'
                    : filter === "drafts"
                      ? "No drafts — all posts are published."
                      : "No posts match this filter."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((r) => (
                <TableRow key={r.post_id}>
                  <TableCell className="max-w-[280px] font-medium">
                    <div className="truncate">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground md:hidden">{r.slug || "—"}</div>
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] truncate text-sm text-muted-foreground md:table-cell">
                    {r.slug || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {r.is_published === false ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
                        Draft
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-900">
                        Live
                      </span>
                    )}
                  </TableCell>
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
