import type { MetadataRoute } from "next";
import { absoluteUrl, sitePath } from "@/lib/seo/site";
import { fetchAllBlogSlugsForSitemap, fetchAllListingIdsForSitemap } from "@/lib/seo/sitemapData";

const STATIC_PATHS = [
  "/",
  "/browse/",
  "/browse-tasks/",
  "/listings/",
  "/blog/",
  "/aboutus/",
  "/how-it-works/",
  "/categories/",
  "/contact/",
  "/faq/",
  "/careers/",
  "/safety/",
  "/privacy-policy/",
  "/termsandconditions/",
  "/support/",
  "/listing-request/",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/browse/" || path === "/listings/" ? 0.9 : 0.7,
  }));

  let blogEntries: MetadataRoute.Sitemap = [];
  let listingEntries: MetadataRoute.Sitemap = [];

  try {
    const slugs = await fetchAllBlogSlugsForSitemap();
    blogEntries = slugs.map((slug) => ({
      url: absoluteUrl(sitePath(`/blog/${encodeURIComponent(slug)}`)),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    /* public blog API unavailable during build */
  }

  try {
    const ids = await fetchAllListingIdsForSitemap();
    listingEntries = ids.map((id) => ({
      url: absoluteUrl(sitePath(`/listings/${encodeURIComponent(id)}`)),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }));
  } catch {
    /* offerings feed unavailable during build */
  }

  return [...staticEntries, ...blogEntries, ...listingEntries];
}
