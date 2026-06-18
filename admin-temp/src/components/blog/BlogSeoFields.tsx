"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import type { BlogSeoFormState } from "@/lib/adminBlogSeo";

type Props = {
  value: BlogSeoFormState;
  onChange: (next: BlogSeoFormState) => void;
  disabled?: boolean;
  onUploadOgImage?: (file: File) => Promise<string>;
  uploading?: boolean;
};

export function BlogSeoFields({ value, onChange, disabled, onUploadOgImage, uploading }: Props) {
  const ogFileRef = useRef<HTMLInputElement>(null);
  const titleLen = value.meta_title.length;
  const descLen = value.meta_description.length;

  const patch = (partial: Partial<BlogSeoFormState>) => onChange({ ...value, ...partial });

  return (
    <div className="space-y-4 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 p-4">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">SEO</h2>
        <p className="text-xs text-muted-foreground">
          Overrides for search and social previews. Leave blank to use title, excerpt, and hero image.
        </p>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="seo-meta-title">Meta title</Label>
          <span className={`text-xs tabular-nums ${titleLen > 60 ? "text-amber-600" : "text-muted-foreground"}`}>
            {titleLen}/60
          </span>
        </div>
        <Input
          id="seo-meta-title"
          value={value.meta_title}
          onChange={(e) => patch({ meta_title: e.target.value })}
          disabled={disabled}
          placeholder="Defaults to post title"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="seo-meta-desc">Meta description</Label>
          <span className={`text-xs tabular-nums ${descLen > 160 ? "text-amber-600" : "text-muted-foreground"}`}>
            {descLen}/160
          </span>
        </div>
        <Textarea
          id="seo-meta-desc"
          rows={3}
          value={value.meta_description}
          onChange={(e) => patch({ meta_description: e.target.value })}
          disabled={disabled}
          placeholder="Defaults to excerpt"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="seo-og-image">OG image URL</Label>
        <p className="text-xs text-muted-foreground">Used for social previews. Defaults to hero image, then site default.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            id="seo-og-image"
            value={value.og_image_url}
            onChange={(e) => patch({ og_image_url: e.target.value })}
            disabled={disabled}
            placeholder="https://…"
          />
          {onUploadOgImage ? (
            <>
              <input
                ref={ogFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled || uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void onUploadOgImage(file).then((url) => patch({ og_image_url: url }));
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => ogFileRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading…" : "Upload"}
              </Button>
            </>
          ) : null}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="seo-canonical">Canonical path</Label>
        <Input
          id="seo-canonical"
          value={value.canonical_path}
          onChange={(e) => patch({ canonical_path: e.target.value })}
          disabled={disabled}
          placeholder="/blog/my-post"
        />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox
          id="seo-noindex"
          checked={value.noindex}
          onCheckedChange={(v) => patch({ noindex: v === true })}
          disabled={disabled}
        />
        <Label htmlFor="seo-noindex" className="text-sm font-normal">
          Hide from search engines (noindex)
        </Label>
      </div>
    </div>
  );
}
