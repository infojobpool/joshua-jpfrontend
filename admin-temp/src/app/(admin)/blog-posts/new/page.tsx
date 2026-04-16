"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";
import { useCanAdminWrite } from "@/lib/adminAuth";
import { AdminReadOnlyBanner } from "@/components/AdminReadOnlyBanner";
import { parseMediaUploadResponse } from "@/lib/parseMediaUploadResponse";
import { formatAxiosApiError } from "@/lib/apiError";

export default function AdminNewBlogPostPage() {
  const router = useRouter();
  const canWrite = useCanAdminWrite();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState(10);
  const [isPublished, setIsPublished] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadHero = async (file: File | null) => {
    if (!file || !canWrite) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axiosInstance.post("admin/blog-posts/upload-image/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = parseMediaUploadResponse(res);
      setHeroImageUrl(url);
      toast.success("Image uploaded — URL applied to hero.");
    } catch (e: unknown) {
      toast.error(formatAxiosApiError(e) || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!canWrite) return;
    if (!title.trim()) {
      toast.error("Title is required.");
      return;
    }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        body_markdown: bodyMarkdown,
        hero_image_url: heroImageUrl.trim() || null,
        is_published: isPublished,
        sort_order: sortOrder,
      };
      if (slug.trim()) payload.slug = slug.trim();
      const res = await axiosInstance.post("admin/blog-posts/", payload);
      if (res.data?.status_code != null && res.data.status_code !== 200) {
        throw new Error(res.data?.message || "Create failed");
      }
      toast.success("Post created.");
      router.push("/blog-posts");
    } catch (e: unknown) {
      toast.error(formatAxiosApiError(e) || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <Toaster />
      <AdminReadOnlyBanner />
      <Button variant="ghost" size="sm" asChild className="w-fit gap-2">
        <Link href="/blog-posts">
          <ArrowLeft className="h-4 w-4" />
          Back to list
        </Link>
      </Button>
      <div>
        <h1 className="text-2xl font-bold">New blog post</h1>
        <p className="text-sm text-muted-foreground">Creates a row via POST /admin/blog-posts/</p>
      </div>

      <div className="space-y-4 rounded-lg border bg-card p-4 md:p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canWrite} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (optional)</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-from-title if omitted"
            disabled={!canWrite}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea id="excerpt" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} disabled={!canWrite} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Body (Markdown)</Label>
          <Textarea
            id="body"
            rows={14}
            value={bodyMarkdown}
            onChange={(e) => setBodyMarkdown(e.target.value)}
            disabled={!canWrite}
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="hero">Hero image URL</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="hero"
              value={heroImageUrl}
              onChange={(e) => setHeroImageUrl(e.target.value)}
              disabled={!canWrite}
              placeholder="https://…"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!canWrite || uploading}
              onChange={(e) => void uploadHero(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canWrite || uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Checkbox id="pub" checked={isPublished} onCheckedChange={(v) => setIsPublished(v === true)} disabled={!canWrite} />
            <Label htmlFor="pub">Published</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="sort">Sort order</Label>
            <Input
              id="sort"
              type="number"
              className="w-24"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
              disabled={!canWrite}
            />
          </div>
        </div>
        {canWrite ? (
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? "Saving…" : "Create post"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
