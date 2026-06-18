import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Blog",
  description:
    "Articles, tips, and updates from JobPool — India's marketplace to post tasks and hire skilled help for home services and more.",
  path: "/blog/",
});

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
