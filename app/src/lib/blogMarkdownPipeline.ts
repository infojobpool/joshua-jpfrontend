import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema, type Schema } from "hast-util-sanitize";

/** Each class token is validated separately by hast-util-sanitize. */
const JP_BLOG_SPAN_CLASSNAME: [string, ...string[]] = [
  "className",
  "jp-blog-color",
  "jp-bc-slate-900",
  "jp-bc-blue-600",
  "jp-bc-red-600",
  "jp-bc-emerald-600",
  "jp-bc-amber-600",
  "jp-bc-violet-600",
  "jp-bc-rose-600",
  "jp-bc-sky-600",
];

const JP_BLOG_P_CLASSNAME: [string, ...string[]] = ["className", "jp-blog-h7", "jp-blog-h8"];

export const blogMarkdownSanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: Array.from(
    new Set([...(defaultSchema.tagNames ?? []), "u", "mark", "sub", "sup", "del"]),
  ),
  attributes: {
    ...defaultSchema.attributes,
    span: [JP_BLOG_SPAN_CLASSNAME],
    p: JP_BLOG_P_CLASSNAME,
    u: [],
    mark: [],
    sub: [],
    sup: [],
    del: [],
  },
};

export const blogMarkdownRehypePlugins = [rehypeRaw, [rehypeSanitize, blogMarkdownSanitizeSchema]];
