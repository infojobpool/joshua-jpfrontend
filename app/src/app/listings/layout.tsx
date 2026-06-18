import type { Metadata } from "next";
import { buildPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Service listings",
  description:
    "Explore published services and products from JobPool providers. Compare pricing, photos, and locations — then request a booking in chat.",
  path: "/listings/",
});

export default function ListingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
