"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";
import { useCanAdminWrite } from "@/lib/adminAuth";
import { AdminReadOnlyBanner } from "@/components/AdminReadOnlyBanner";
import { formatAxiosApiError } from "@/lib/apiError";
import { parseMediaUploadResponse } from "@/lib/parseMediaUploadResponse";
import {
  mergePageSeoRows,
  pageSeoToPayload,
  parseAdminPageSeoDetailResponse,
  parseAdminPageSeoListResponse,
} from "@/lib/adminPageSeo";
import {
  emptyPageSeoForm,
  normalizeSeoPath,
  PUBLIC_STATIC_SEO_PAGES,
  type AdminPageSeoForm,
} from "@/lib/publicStaticPages";
import { fetchCategorySeoPageStubs } from "@/lib/adminCategorySeoPages";

export default function PageSeoAdminPage() {
  const canWrite = useCanAdminWrite();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pages, setPages] = useState<AdminPageSeoForm[]>([]);
  const [selectedPath, setSelectedPath] = useState("/browse");
  const [form, setForm] = useState<AdminPageSeoForm>(() => emptyPageSeoForm("/browse"));
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("admin/page-seo/");
      const fromApi = parseAdminPageSeoListResponse(res.data);
      const categoryStubs = await fetchCategorySeoPageStubs();
      const merged = mergePageSeoRows([...PUBLIC_STATIC_SEO_PAGES, ...categoryStubs], fromApi);
      setPages(merged);
      setForm((prev) => {
        const current = merged.find((p) => normalizeSeoPath(p.path) === normalizeSeoPath(prev.path));
        return current ?? merged.find((p) => p.path === "/browse") ?? emptyPageSeoForm("/browse");
      });
    } catch (e: unknown) {
      toast.error(formatAxiosApiError(e) || "Failed to load page SEO.");
      const categoryStubs = await fetchCategorySeoPageStubs();
      const merged = mergePageSeoRows([...PUBLIC_STATIC_SEO_PAGES, ...categoryStubs], []);
      setPages(merged);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectPage = async (path: string) => {
    const normalized = normalizeSeoPath(path);
    setSelectedPath(normalized);
    const cached = pages.find((p) => normalizeSeoPath(p.path) === normalized);
    if (cached) {
      setForm(cached);
      return;
    }
    setForm(emptyPageSeoForm(normalized));
    try {
      const res = await axiosInstance.get("admin/page-seo/", {
        params: { path: normalized },
      });
      const row = parseAdminPageSeoDetailResponse(res.data);
      if (row) {
        setForm(row);
        setPages((prev) => {
          const next = prev.filter((p) => normalizeSeoPath(p.path) !== normalized);
          return [...next, row].sort((a, b) => a.label.localeCompare(b.label));
        });
      }
    } catch {
      /* use empty defaults */
    }
  };

  const patch = (partial: Partial<AdminPageSeoForm>) => setForm((prev) => ({ ...prev, ...partial }));

  const uploadOg = async (file: File | null) => {
    if (!file || !canWrite) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await axiosInstance.post("admin/blog-posts/upload-image/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      patch({ og_image_url: parseMediaUploadResponse(res) });
      toast.success("OG image uploaded");
    } catch (e: unknown) {
      toast.error(formatAxiosApiError(e) || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!canWrite) return;
    if (!form.meta_title.trim()) {
      toast.error("Meta title is required.");
      return;
    }
    setSaving(true);
    try {
      const res = await axiosInstance.put("admin/page-seo/", pageSeoToPayload(form));
      if (res.data?.status_code != null && res.data.status_code !== 200) {
        throw new Error(res.data?.message || "Save failed");
      }
      toast.success(`Saved SEO for ${form.label}`);
      const saved = parseAdminPageSeoDetailResponse(res.data) ?? form;
      setForm(saved);
      setPages((prev) => {
        const normalized = normalizeSeoPath(saved.path);
        const next = prev.filter((p) => normalizeSeoPath(p.path) !== normalized);
        return [...next, saved].sort((a, b) => a.label.localeCompare(b.label));
      });
    } catch (e: unknown) {
      toast.error(formatAxiosApiError(e) || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const titleLen = form.meta_title.length;
  const descLen = form.meta_description.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-6">
      <Toaster />
      <AdminReadOnlyBanner />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Page SEO</h1>
        <p className="text-sm text-muted-foreground">
          Edit search and social metadata for each public marketing page. GET/PUT /admin/page-seo/
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4 rounded-xl border bg-card p-4 md:p-6">
          <div className="space-y-2">
            <Label>Page</Label>
            <Select value={normalizeSeoPath(selectedPath)} onValueChange={(v) => void selectPage(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a page" />
              </SelectTrigger>
              <SelectContent>
                {pages.map((p) => (
                  <SelectItem key={p.path} value={normalizeSeoPath(p.path)}>
                    {p.label} ({p.path})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="page-meta-title">Meta title</Label>
              <span className={`text-xs tabular-nums ${titleLen > 60 ? "text-amber-600" : "text-muted-foreground"}`}>
                {titleLen}/60
              </span>
            </div>
            <Input
              id="page-meta-title"
              value={form.meta_title}
              onChange={(e) => patch({ meta_title: e.target.value })}
              disabled={!canWrite}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="page-meta-desc">Meta description</Label>
              <span className={`text-xs tabular-nums ${descLen > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
                {descLen}/160
              </span>
            </div>
            <Textarea
              id="page-meta-desc"
              rows={4}
              value={form.meta_description}
              onChange={(e) => patch({ meta_description: e.target.value })}
              disabled={!canWrite}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="page-meta-keywords">Meta keywords</Label>
            <Textarea
              id="page-meta-keywords"
              rows={2}
              maxLength={500}
              value={form.meta_keywords}
              onChange={(e) => patch({ meta_keywords: e.target.value })}
              disabled={!canWrite}
              placeholder="jobpool, hire taskers, local tasks (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated. Optional — Google mostly ignores keywords; useful for internal consistency.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="page-og">OG image URL</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="page-og"
                value={form.og_image_url}
                onChange={(e) => patch({ og_image_url: e.target.value })}
                disabled={!canWrite}
                placeholder="https://…"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!canWrite || uploading}
                onChange={(e) => void uploadOg(e.target.files?.[0] ?? null)}
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

          <div className="space-y-2">
            <Label htmlFor="page-canonical">Canonical path</Label>
            <Input
              id="page-canonical"
              value={form.canonical_path}
              onChange={(e) => patch({ canonical_path: e.target.value })}
              disabled={!canWrite}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="page-noindex"
              checked={form.noindex}
              onCheckedChange={(v) => patch({ noindex: v === true })}
              disabled={!canWrite}
            />
            <Label htmlFor="page-noindex" className="text-sm font-normal">
              Hide this page from search engines (noindex)
            </Label>
          </div>

          {canWrite ? (
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : `Save ${form.label}`}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
