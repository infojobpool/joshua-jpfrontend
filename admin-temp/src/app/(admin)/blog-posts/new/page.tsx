"use client";

import { useEffect, useRef, useState } from "react";
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
import { BlogMarkdownBodyField } from "@/components/blog/BlogMarkdownBodyField";
import { slugifyTitle } from "@/lib/slugifyTitle";

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
  const [autoSlug, setAutoSlug] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoSlug) setSlug(slugifyTitle(title));
  }, [title, autoSlug]);

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

  const uploadInlineImage = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await axiosInstance.post("admin/blog-posts/upload-image/", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return parseMediaUploadResponse(res);
  };

  const save = async (publish: boolean) => {
    if (!canWrite) return;
    if (typeof window !== "undefined" && !localStorage.getItem("token")) {
      toast.error("Admin session missing. Sign in on the admin home page (admin login), then try again.");
      router.push("/");
      return;
    }
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
        is_published: publish,
        sort_order: sortOrder,
      };
      const effectiveSlug = (autoSlug ? slugifyTitle(title) : slug.trim()) || slugifyTitle(title);
      payload.slug = effectiveSlug;
      const res = await axiosInstance.post("admin/blog-posts/", payload);
      if (res.data?.status_code != null && res.data.status_code !== 200) {
        throw new Error(res.data?.message || "Create failed");
      }
      toast.success(publish ? "Post published." : "Draft saved.");
      router.push("/blog-posts");
    } catch (e: unknown) {
      toast.error(formatAxiosApiError(e) || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="autoslug"
              checked={autoSlug}
              onCheckedChange={(v) => setAutoSlug(v === true)}
              disabled={!canWrite}
            />
            <Label htmlFor="autoslug" className="text-sm font-normal">
              Auto-generate slug from title
            </Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setAutoSlug(false);
              setSlug(e.target.value);
            }}
            placeholder={slugifyTitle(title || "post")}
            disabled={!canWrite || autoSlug}
            readOnly={autoSlug}
            className={autoSlug ? "bg-muted/60" : ""}
          />
          <p className="text-xs text-muted-foreground">
            {autoSlug ? "Slug updates when the title changes. Uncheck to edit manually." : "Manual slug — turn auto back on to sync from title."}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea id="excerpt" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} disabled={!canWrite} />
        </div>
        <BlogMarkdownBodyField
          id="body"
          label="Body (Markdown)"
          value={bodyMarkdown}
          onChange={setBodyMarkdown}
          disabled={!canWrite}
          uploadInlineImage={canWrite ? uploadInlineImage : undefined}
        />
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
        <p className="text-xs text-muted-foreground">
          Drafts do not appear on the public blog until you publish. Use the list filters to find drafts.
        </p>
        {canWrite ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void save(false)} disabled={saving}>
              {saving ? "Saving…" : "Save as draft"}
            </Button>
            <Button type="button" onClick={() => void save(true)} disabled={saving}>
              {saving ? "Saving…" : "Publish"}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
