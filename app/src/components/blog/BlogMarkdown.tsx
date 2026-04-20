"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { blogMarkdownRehypePlugins } from "@/lib/blogMarkdownPipeline";

type Props = {
  markdown: string;
  className?: string;
};

const mdShell =
  "jp-blog-md max-w-none text-slate-700 dark:text-slate-200 " +
  "[&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-slate-900 dark:[&_h1]:text-white " +
  "[&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-slate-900 dark:[&_h2]:text-white " +
  "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-900 dark:[&_h3]:text-slate-100 " +
  "[&_p]:mb-4 [&_p]:leading-relaxed [&_a]:font-medium [&_a]:text-blue-600 [&_a]:underline-offset-2 hover:[&_a]:underline " +
  "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 " +
  "[&_li]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600 " +
  "[&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-sm dark:[&_code]:bg-slate-800 " +
  "[&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-slate-900 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-slate-100 " +
  "[&_hr]:my-8 [&_hr]:border-slate-200 dark:[&_hr]:border-slate-700 " +
  "[&_img]:my-6 [&_img]:max-h-[min(70vh,520px)] [&_img]:w-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:object-contain [&_img]:mx-auto [&_img]:block " +
  "[&_table]:mb-4 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_td]:border [&_td]:border-slate-200 [&_td]:px-2 [&_td]:py-1.5";

const JP_TEXT: Record<string, string> = {
  "jp-bc-slate-900": "text-slate-900 dark:text-slate-100",
  "jp-bc-blue-600": "text-blue-600 dark:text-blue-400",
  "jp-bc-red-600": "text-red-600 dark:text-red-400",
  "jp-bc-emerald-600": "text-emerald-600 dark:text-emerald-400",
  "jp-bc-amber-600": "text-amber-600 dark:text-amber-400",
  "jp-bc-violet-600": "text-violet-600 dark:text-violet-400",
  "jp-bc-rose-600": "text-rose-600 dark:text-rose-400",
  "jp-bc-sky-600": "text-sky-600 dark:text-sky-400",
};

function ColoredSpan({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<"span">): ReactNode {
  const parts = String(className || "")
    .split(/\s+/)
    .filter(Boolean);
  const token = parts.find((p) => p.startsWith("jp-bc-"));
  const tw = token ? JP_TEXT[token] : "";
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

export function BlogMarkdown({ markdown, className }: Props) {
  return (
    <div className={className ? `${mdShell} ${className}` : mdShell}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={blogMarkdownRehypePlugins}
        components={{
          a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
          span: ColoredSpan,
        }}
      >
        {markdown || ""}
      </ReactMarkdown>
    </div>
  );
}
