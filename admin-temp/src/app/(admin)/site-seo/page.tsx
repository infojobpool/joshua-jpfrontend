"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
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
import { formatAxiosApiError } from "@/lib/apiError";
import { parseMediaUploadResponse } from "@/lib/parseMediaUploadResponse";
import {
  emptySiteSeo,
  parseAdminSiteSeoResponse,
  siteSeoToPayload,
  type AdminSiteSeo,
} from "@/lib/adminSiteSeo";

export default function SiteSeoPage() {
  const canWrite = useCanAdminWrite();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<AdminSiteSeo>(() => emptySiteSeo());
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("admin/site-seo/");
      const parsed = parseAdminSiteSeoResponse(res.data);
      setForm(parsed ?? emptySiteSeo());
    } catch (e: unknown) {
      toast.error(formatAxiosApiError(e) || "Failed to load site SEO.");
      setForm(emptySiteSeo());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (partial: Partial<AdminSiteSeo>) => setForm((prev) => ({ ...prev, ...partial }));

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
    setSaving(true);
    try {
      const res = await axiosInstance.put("admin/site-seo/", siteSeoToPayload(form));
      if (res.data?.status_code != null && res.data.status_code !== 200) {
        throw new Error(res.data?.message || "Save failed");
      }
      toast.success("Site SEO saved.");
      const parsed = parseAdminSiteSeoResponse(res.data);
      if (parsed) setForm(parsed);
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
        <h1 className="text-2xl font-bold tracking-tight">Site SEO</h1>
        <p className="text-sm text-muted-foreground">
          Global defaults for the homepage and social previews. GET/PUT /admin/site-seo/
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-4 rounded-xl border bg-card p-4 md:p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="site-meta-title">Meta title</Label>
              <span className={`text-xs tabular-nums ${titleLen > 60 ? "text-amber-600" : "text-muted-foreground"}`}>
                {titleLen}/60
              </span>
            </div>
            <Input
              id="site-meta-title"
              value={form.meta_title}
              onChange={(e) => patch({ meta_title: e.target.value })}
              disabled={!canWrite}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="site-meta-desc">Meta description</Label>
              <span className={`text-xs tabular-nums ${descLen > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
                {descLen}/160
              </span>
            </div>
            <Textarea
              id="site-meta-desc"
              rows={4}
              value={form.meta_description}
              onChange={(e) => patch({ meta_description: e.target.value })}
              disabled={!canWrite}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="site-og">Default OG image URL</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                id="site-og"
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
            <Label htmlFor="site-canonical">Canonical path</Label>
            <Input
              id="site-canonical"
              value={form.canonical_path}
              onChange={(e) => patch({ canonical_path: e.target.value })}
              disabled={!canWrite}
              placeholder="/"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="site-noindex"
              checked={form.noindex}
              onCheckedChange={(v) => patch({ noindex: v === true })}
              disabled={!canWrite}
            />
            <Label htmlFor="site-noindex" className="text-sm font-normal">
              Hide homepage from search engines (noindex)
            </Label>
          </div>
          {canWrite ? (
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving…" : "Save site SEO"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
