import type { Metadata } from "next";
import { getSiteUrl, sitePath, toAbsoluteMediaUrl, truncateMetaDescription } from "./site";

export const privatePageMetadata: Metadata = {
  robots: { index: false, follow: false },
};

export type BuildPublicMetadataInput = {
  title: string;
  description?: string | null;
  path: string;
  ogImage?: string | null;
  noindex?: boolean;
  ogType?: "website" | "article";
};

/** Phase 2: resolved SEO from API (blog posts, site defaults). */
export function buildPublicMetadata({
  title,
  description,
  path,
  ogImage,
  noindex = false,
  ogType = "website",
}: BuildPublicMetadataInput): Metadata {
  const canonical = sitePath(path);
  const desc = description?.trim()
    ? truncateMetaDescription(description)
    : truncateMetaDescription(
        "JobPool — post tasks and hire skilled help for home services, repairs, and more across India.",
      );
  const fullTitle = title.includes("JobPool") ? title : `${title} | JobPool`;
  const ogImageAbs = toAbsoluteMediaUrl(ogImage ?? undefined);

  return {
    title: fullTitle,
    description: desc,
    metadataBase: new URL(getSiteUrl()),
    alternates: { canonical },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: ogType,
      url: canonical,
      siteName: "JobPool",
      title: fullTitle,
      description: desc,
      ...(ogImageAbs
        ? {
            images: [
              {
                url: ogImageAbs,
                alt: title,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImageAbs ? "summary_large_image" : "summary",
      title: fullTitle,
      description: desc,
      ...(ogImageAbs ? { images: [ogImageAbs] } : {}),
    },
  };
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
  return buildPublicMetadata({ title, description, path, ogType });
}
