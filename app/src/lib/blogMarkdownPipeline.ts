import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import { defaultSchema, type Schema } from "hast-util-sanitize";

/** Allowed class on <span> for editor “font color” (Tailwind text-* applied in React). */
export const JP_BLOG_COLOR_CLASS =
  /^jp-blog-color jp-bc-(slate-900|blue-600|red-600|emerald-600|amber-600|violet-600|rose-600|sky-600)$/;

export const blogMarkdownSanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [["className", JP_BLOG_COLOR_CLASS]],
  },
};

export const blogMarkdownRehypePlugins = [rehypeRaw, [rehypeSanitize, blogMarkdownSanitizeSchema]];
