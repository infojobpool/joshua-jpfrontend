import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Browse tasks",
  description:
    "Browse open tasks on JobPool. Find local jobs, offer your skills, and get hired for home services, repairs, delivery, and more across India.",
  path: "/browse/",
});

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
