import type { Metadata } from "next";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { fetchSiteSeo } from "@/lib/seo/siteSeo";

export async function generateMetadata(): Promise<Metadata> {
  const site = await fetchSiteSeo();
  return buildPublicMetadata({
    title: "Blog",
    description:
      site?.meta_description ??
      "Articles, tips, and updates from JobPool — India's marketplace to post tasks and hire skilled help.",
    path: "/blog/",
    ogImage: site?.og_image_url ?? undefined,
    noindex: site?.noindex ?? false,
  });
}

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
