"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Heading4,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Upload,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { blogMarkdownRehypePlugins } from "@/lib/blogMarkdownPipeline";
import type { ComponentPropsWithoutRef } from "react";

const PREVIEW_MD_CLASS =
  "jp-admin-blog-preview max-w-none text-sm text-slate-700 " +
  "[&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 " +
  "[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 " +
  "[&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 " +
  "[&_h4]:mb-1 [&_h4]:mt-3 [&_h4]:text-base [&_h4]:font-semibold " +
  "[&_p]:mb-3 [&_p]:leading-relaxed [&_a]:text-blue-600 [&_a]:underline " +
  "[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-0.5 " +
  "[&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-600 " +
  "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:text-[13px] " +
  "[&_pre]:mb-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-slate-900 [&_pre]:p-3 [&_pre]:text-xs [&_pre]:text-slate-100 " +
  "[&_hr]:my-6 [&_hr]:border-slate-200 [&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-md [&_img]:mx-auto [&_img]:block";

const JP_TEXT: Record<string, string> = {
  "jp-bc-slate-900": "text-slate-900",
  "jp-bc-blue-600": "text-blue-600",
  "jp-bc-red-600": "text-red-600",
  "jp-bc-emerald-600": "text-emerald-600",
  "jp-bc-amber-600": "text-amber-600",
  "jp-bc-violet-600": "text-violet-600",
  "jp-bc-rose-600": "text-rose-600",
  "jp-bc-sky-600": "text-sky-600",
};

const COLOR_SWATCHES: { token: keyof typeof JP_TEXT; label: string; fill: string }[] = [
  { token: "jp-bc-slate-900", label: "Default", fill: "bg-slate-900" },
  { token: "jp-bc-blue-600", label: "Blue", fill: "bg-blue-600" },
  { token: "jp-bc-red-600", label: "Red", fill: "bg-red-600" },
  { token: "jp-bc-emerald-600", label: "Green", fill: "bg-emerald-600" },
  { token: "jp-bc-amber-600", label: "Amber", fill: "bg-amber-500" },
  { token: "jp-bc-violet-600", label: "Violet", fill: "bg-violet-600" },
  { token: "jp-bc-rose-600", label: "Rose", fill: "bg-rose-600" },
  { token: "jp-bc-sky-600", label: "Sky", fill: "bg-sky-600" },
];

function normalizeClassParts(className: unknown): string[] {
  if (className == null) return [];
  if (Array.isArray(className)) {
    return className.flatMap((c) => String(c).split(/\s+/)).filter(Boolean);
  }
  return String(className)
    .split(/\s+/)
    .filter(Boolean);
}

function ColoredSpan({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<"span">): ReactNode {
  const parts = normalizeClassParts(className);
  const token = parts.find((p) => p.startsWith("jp-bc-")) as keyof typeof JP_TEXT | undefined;
  const tw = token && JP_TEXT[token] ? JP_TEXT[token] : "";
  if (tw) {
    return (
      <span className={tw} {...rest}>
        {children}
      </span>
    );
  }
  return (
    <span className={className} {...rest}>
      {children}
    </span>
  );
}

function getLineBounds(text: string, caret: number): { lineStart: number; lineEnd: number } {
  const lineStart = text.lastIndexOf("\n", caret - 1) + 1;
  const nextNl = text.indexOf("\n", caret);
  const lineEnd = nextNl === -1 ? text.length : nextNl;
  return { lineStart, lineEnd };
}

function replaceRange(text: string, start: number, end: number, insert: string): string {
  return text.slice(0, start) + insert + text.slice(end);
}

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  /** When set, toolbar offers upload → inserts `![](url)` at cursor after POST upload-image. */
  uploadInlineImage?: (file: File) => Promise<string>;
};

export function BlogMarkdownBodyField({
  id = "body-md",
  label,
  value,
  onChange,
  disabled,
  uploadInlineImage,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const inlineImgRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [uploadingInline, setUploadingInline] = useState(false);

  const rehypePlugins = useMemo(() => [...blogMarkdownRehypePlugins], []);

  const focusTa = () => {
    requestAnimationFrame(() => taRef.current?.focus());
  };

  const applyChange = useCallback(
    (next: string, selStart?: number, selEnd?: number) => {
      onChange(next);
      requestAnimationFrame(() => {
        const el = taRef.current;
        if (!el) return;
        el.focus();
        if (selStart != null && selEnd != null) {
          el.setSelectionRange(selStart, selEnd);
        }
      });
    },
    [onChange],
  );

  const wrapSelection = (before: string, after: string, placeholder = "") => {
    const el = taRef.current;
    if (!el || disabled) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const sel = value.slice(start, end);
    const mid = sel || placeholder;
    const next = replaceRange(value, start, end, before + mid + after);
    const caret = start + before.length + mid.length;
    applyChange(next, caret, caret);
  };

  const insertLinePrefix = (prefix: string) => {
    const el = taRef.current;
    if (!el || disabled) return;
    const start = el.selectionStart;
    const { lineStart, lineEnd } = getLineBounds(value, start);
    const line = value.slice(lineStart, lineEnd);
    const stripped = line.replace(/^\s*[#>\-\d.\s]*/, "");
    const nextLine = prefix + stripped;
    const next = replaceRange(value, lineStart, lineEnd, nextLine);
    const caret = lineStart + nextLine.length;
    applyChange(next, caret, caret);
  };

  const setHeadingLine = (hashes: string) => {
    const el = taRef.current;
    if (!el || disabled) return;
    const start = el.selectionStart;
    const { lineStart, lineEnd } = getLineBounds(value, start);
    const line = value.slice(lineStart, lineEnd);
    const body = line.replace(/^#+\s*/, "");
    const nextLine = `${hashes} ${body}`.replace(/\s+$/, "");
    const next = replaceRange(value, lineStart, lineEnd, nextLine);
    const caret = lineStart + nextLine.length;
    applyChange(next, caret, caret);
  };

  const insertHr = () => {
    const el = taRef.current;
    if (!el || disabled) return;
    const pos = el.selectionStart;
    const block = "\n\n---\n\n";
    const next = replaceRange(value, pos, pos, block);
    applyChange(next, pos + block.length, pos + block.length);
  };

  const insertLink = () => {
    const el = taRef.current;
    if (!el || disabled) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const raw = value.slice(start, end);
    const url = window.prompt("Paste URL (https://…)", "https://");
    if (url === null) return;
    const u = url.trim() || "#";
    if (raw.length > 0) {
      const snippet = `[${raw}](${u})`;
      const next = replaceRange(value, start, end, snippet);
      applyChange(next, start + snippet.length, start + snippet.length);
      return;
    }
    const labelText = window.prompt("Link text", "Read more");
    if (labelText === null) return;
    const snippet = `[${labelText.trim() || "link"}](${u})`;
    const next = replaceRange(value, start, end, snippet);
    applyChange(next, start + snippet.length, start + snippet.length);
  };

  const insertImage = () => {
    const alt = window.prompt("Image description (alt text)", "Photo");
    if (alt === null) return;
    const url = window.prompt("Image URL", "https://");
    if (url === null) return;
    const el = taRef.current;
    if (!el || disabled) return;
    const pos = el.selectionStart;
    const snippet = `\n\n![${alt || "image"}](${url || "#"})\n\n`;
    const next = replaceRange(value, pos, pos, snippet);
    applyChange(next, pos + snippet.length, pos + snippet.length);
  };

  const applyColorClass = (token: string) => {
    const before = `<span class="jp-blog-color jp-bc-${token}">`;
    const after = "</span>";
    wrapSelection(before, after, "text");
  };

  const insertFence = () => {
    wrapSelection("```\n", "\n```", "code");
  };

  const onInlineImageFile = async (file: File | null) => {
    if (!file || !uploadInlineImage || disabled) return;
    const alt = window.prompt("Image description (alt text)", "Image");
    if (alt === null) {
      if (inlineImgRef.current) inlineImgRef.current.value = "";
      return;
    }
    setUploadingInline(true);
    try {
      const url = await uploadInlineImage(file);
      const el = taRef.current;
      if (!el) return;
      const pos = el.selectionStart;
      const snippet = `\n\n![${alt.trim() || "Image"}](${url})\n\n`;
      const next = replaceRange(value, pos, pos, snippet);
      applyChange(next, pos + snippet.length, pos + snippet.length);
    } catch {
      /* parent toast */
    } finally {
      setUploadingInline(false);
      if (inlineImgRef.current) inlineImgRef.current.value = "";
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  const ToolBtn = ({
    title,
    onClick,
    children,
  }: {
    title: string;
    onClick: () => void;
    children: ReactNode;
  }) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 w-8 shrink-0 p-0"
      title={title}
      disabled={disabled}
      onClick={() => {
        onClick();
        focusTa();
      }}
    >
      {children}
    </Button>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-muted-foreground">{wordCount} words</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Use <strong className="font-medium text-foreground">Image</strong> for upload or URL. Colored text uses a small
        HTML span — it shows the same in Preview and on the live blog.
      </p>

      <input
        ref={inlineImgRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled || !uploadInlineImage || uploadingInline}
        onChange={(e) => void onInlineImageFile(e.target.files?.[0] ?? null)}
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "write" | "preview")} className="w-full">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-9 w-full justify-start sm:w-auto">
            <TabsTrigger value="write" className="px-4">
              Write
            </TabsTrigger>
            <TabsTrigger value="preview" className="px-4">
              Preview
            </TabsTrigger>
          </TabsList>
          <div
            className={cn(
              "flex flex-wrap gap-1 rounded-lg border bg-muted/40 p-1",
              (disabled || tab !== "write") && "pointer-events-none opacity-50",
            )}
            aria-hidden={tab !== "write"}
          >
            <ToolBtn title="Heading 2" onClick={() => setHeadingLine("##")}>
              <Heading2 className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn title="Heading 3" onClick={() => setHeadingLine("###")}>
              <Heading3 className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn title="Heading 4" onClick={() => setHeadingLine("####")}>
              <Heading4 className="h-4 w-4" />
            </ToolBtn>
            <span className="mx-0.5 w-px self-stretch bg-border" />
            <ToolBtn title="Bold" onClick={() => wrapSelection("**", "**", "bold")}>
              <Bold className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn title="Italic" onClick={() => wrapSelection("*", "*", "italic")}>
              <Italic className="h-4 w-4" />
            </ToolBtn>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0"
                  title="Text color"
                  disabled={disabled}
                >
                  <Palette className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44" onCloseAutoFocus={(e) => e.preventDefault()}>
                {COLOR_SWATCHES.map((c) => (
                  <DropdownMenuItem
                    key={c.token}
                    className="gap-2"
                    onSelect={() => {
                      const suffix = c.token.replace("jp-bc-", "");
                      applyColorClass(suffix);
                      focusTa();
                    }}
                  >
                    <span className={cn("h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/10", c.fill)} />
                    {c.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <ToolBtn title="Link (uses selection as label if highlighted)" onClick={insertLink}>
              <Link2 className="h-4 w-4" />
            </ToolBtn>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0"
                  title="Add image to body"
                  disabled={disabled || uploadingInline}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52" onCloseAutoFocus={(e) => e.preventDefault()}>
                {uploadInlineImage ? (
                  <DropdownMenuItem
                    className="gap-2"
                    disabled={uploadingInline}
                    onSelect={() => {
                      window.setTimeout(() => inlineImgRef.current?.click(), 0);
                    }}
                  >
                    <Upload className="h-4 w-4 opacity-70" />
                    Upload from computer…
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className="gap-2"
                  onSelect={() => {
                    window.setTimeout(() => insertImage(), 0);
                    focusTa();
                  }}
                >
                  <ImageIcon className="h-4 w-4 opacity-70" />
                  Paste image URL…
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <span className="mx-0.5 w-px self-stretch bg-border" />
            <ToolBtn title="Bullet list" onClick={() => insertLinePrefix("- ")}>
              <List className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn title="Numbered list" onClick={() => insertLinePrefix("1. ")}>
              <ListOrdered className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn title="Quote" onClick={() => insertLinePrefix("> ")}>
              <Quote className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn title="Code block" onClick={insertFence}>
              <Code className="h-4 w-4" />
            </ToolBtn>
            <ToolBtn title="Horizontal rule" onClick={insertHr}>
              <Minus className="h-4 w-4" />
            </ToolBtn>
          </div>
        </div>

        <TabsContent value="write" className="mt-0 outline-none">
          <Textarea
            ref={taRef}
            id={id}
            dir="ltr"
            spellCheck
            rows={16}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(
              "min-h-[min(420px,55vh)] resize-y text-[15px] leading-relaxed",
              "font-[ui-serif,Georgia,Cambria,'Times_New_Roman',Times,serif]",
              "tracking-normal text-slate-900 placeholder:text-slate-400",
            )}
            placeholder={
              "## Why JobPool\n\nWrite in **Markdown**. Use the toolbar above for headings, lists, links, and colors."
            }
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-0 outline-none">
          <div
            className={cn(
              "min-h-[min(420px,55vh)] overflow-auto rounded-lg border bg-white p-4 sm:p-6",
              PREVIEW_MD_CLASS,
            )}
          >
            {value.trim() ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={rehypePlugins}
                components={{
                  a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                  span: ColoredSpan,
                }}
              >
                {value}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
