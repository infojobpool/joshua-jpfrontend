"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import {
  parseAdminBlogDetailResponse,
  parseAdminBlogListResponse,
  type AdminBlogPostRow,
} from "@/lib/adminBlog";
import { parseMediaUploadResponse } from "@/lib/parseMediaUploadResponse";
import { formatAxiosApiError } from "@/lib/apiError";
import { BlogMarkdownBodyField } from "@/components/blog/BlogMarkdownBodyField";
import { BlogSeoFields } from "@/components/blog/BlogSeoFields";
import { slugifyTitle } from "@/lib/slugifyTitle";
import {
  blogSeoFlatFields,
  blogSeoToPayload,
  defaultBlogSeo,
  type BlogSeoFormState,
} from "@/lib/adminBlogSeo";

export default function AdminEditBlogPostPage() {
  const params = useParams();
  const postId = decodeURIComponent(String(params.postId ?? ""));
  const router = useRouter();
  const canWrite = useCanAdminWrite();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [bodyMarkdown, setBodyMarkdown] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [sortOrder, setSortOrder] = useState(10);
  const [autoSlug, setAutoSlug] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [seo, setSeo] = useState<BlogSeoFormState>(() => defaultBlogSeo(""));

  const load = useCallback(async () => {
    if (!postId) return;
    setLoading(true);
    try {
      try {
        const res = await axiosInstance.get(`admin/blog-posts/${encodeURIComponent(postId)}/`);
        const row = parseAdminBlogDetailResponse(res.data);
        if (row) {
          applyRow(row);
          return;
        }
      } catch {
        /* fall back to list */
      }
      const res2 = await axiosInstance.get("admin/blog-posts/");
      const rows = parseAdminBlogListResponse(res2.data);
      const row = rows.find((r) => r.post_id === postId);
      if (row) applyRow(row);
      else {
        toast.error("Post not found.");
        router.push("/blog-posts");
      }
    } catch (e: unknown) {
      toast.error(formatAxiosApiError(e) || "Failed to load post.");
      router.push("/blog-posts");
    } finally {
      setLoading(false);
    }
  }, [postId, router]);

  function applyRow(row: AdminBlogPostRow) {
    setTitle(row.title);
    setExcerpt(row.excerpt);
    setBodyMarkdown(row.body_markdown ?? "");
    setHeroImageUrl((row.hero_image_url ?? "").trim());
    setSlug((row.slug ?? "").trim());
    setSortOrder(Number(row.sort_order) || 0);
    setIsPublished(row.is_published !== false);
    setAutoSlug(false);
    setSeo(row.seo ?? defaultBlogSeo((row.slug ?? "").trim() || postId, row.title));
  }

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (autoSlug) setSlug(slugifyTitle(title));
  }, [title, autoSlug]);

  useEffect(() => {
    if (autoSlug) {
      const nextSlug = slugifyTitle(title) || slug.trim() || "post";
      setSeo((prev) => ({
        ...prev,
        meta_title: prev.meta_title || title.trim(),
        canonical_path: `/blog/${nextSlug}`,
      }));
    }
  }, [title, autoSlug, slug]);

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
      toast.success("Hero image uploaded", {
        description:
          "The URL is in the Hero image field (post banner). For pictures inside the article, use Body → Image → Upload.",
      });
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
    if (!canWrite || !postId) return;
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
      payload.seo = blogSeoToPayload({
        ...seo,
        meta_title: seo.meta_title.trim() || title.trim(),
        canonical_path: seo.canonical_path.trim() || `/blog/${effectiveSlug}`,
      });
      Object.assign(payload, blogSeoFlatFields(seo));
      const res = await axiosInstance.put(`admin/blog-posts/${encodeURIComponent(postId)}/`, payload);
      if (res.data?.status_code != null && res.data.status_code !== 200) {
        throw new Error(res.data?.message || "Update failed");
      }
      setIsPublished(publish);
      toast.success(publish ? "Published." : "Draft saved.");
      router.push("/blog-posts");
    } catch (e: unknown) {
      toast.error(formatAxiosApiError(e) || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  if (!postId) {
    return null;
  }

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
        <h1 className="text-2xl font-bold">Edit blog post</h1>
        <p className="text-sm text-muted-foreground">
          PUT /admin/blog-posts/{postId}/ — {!loading ? (isPublished ? "Currently published." : "Currently a draft.") : ""}
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4 rounded-lg border bg-card p-4 md:p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} disabled={!canWrite} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="autoslug"
              checked={autoSlug}
              onCheckedChange={(v) => setAutoSlug(v === true)}
              disabled={!canWrite}
            />
            <Label htmlFor="autoslug" className="text-sm font-normal">
              Sync slug from title when saving
            </Label>
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
              disabled={!canWrite || autoSlug}
              readOnly={autoSlug}
              className={autoSlug ? "bg-muted/60" : ""}
            />
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
            <p className="text-xs text-muted-foreground">
              Post banner (above the article). For images inside the text, use Body → Image → Upload.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="hero"
                value={heroImageUrl}
                onChange={(e) => setHeroImageUrl(e.target.value)}
                disabled={!canWrite}
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
          <BlogSeoFields
            value={seo}
            onChange={setSeo}
            disabled={!canWrite}
            uploading={uploading}
            onUploadOgImage={
              canWrite
                ? async (file) => {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await axiosInstance.post("admin/blog-posts/upload-image/", fd, {
                      headers: { "Content-Type": "multipart/form-data" },
                    });
                    return parseMediaUploadResponse(res);
                  }
                : undefined
            }
          />
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
          {canWrite ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void save(false)} disabled={saving}>
                {saving ? "Saving…" : "Save as draft"}
              </Button>
              <Button type="button" onClick={() => void save(true)} disabled={saving}>
                {saving ? "Saving…" : "Save & publish"}
              </Button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
