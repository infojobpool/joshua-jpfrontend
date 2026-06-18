import type { Metadata } from "next";
import { getSiteUrl, sitePath, truncateMetaDescription } from "./site";

export const privatePageMetadata: Metadata = {
  robots: { index: false, follow: false },
};

type PublicPageMetaInput = {
  title: string;
  description: string;
  path: string;
  ogType?: "website" | "article";
};

/** Shared Open Graph + Twitter defaults for marketing pages. */
export function buildPublicPageMetadata({
  title,
  description,
  path,
  ogType = "website",
}: PublicPageMetaInput): Metadata {
  const canonical = sitePath(path);
  const desc = truncateMetaDescription(description);
  const fullTitle = title.includes("JobPool") ? title : `${title} | JobPool`;

  return {
    title: fullTitle,
    description: desc,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical },
    openGraph: {
      type: ogType,
      url: canonical,
      siteName: "JobPool",
      title: fullTitle,
      description: desc,
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description: desc,
    },
  };
}
