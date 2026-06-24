import type { MetadataRoute } from "next";
import { absoluteUrl, sitePath } from "@/lib/seo/site";
import { fetchAllBlogSlugsForSitemap, fetchAllListingIdsForSitemap } from "@/lib/seo/sitemapData";
import { fetchPublicCategoriesServer } from "@/lib/taskCategoriesServer";
import { categoryLandingPath } from "@/lib/seo/categoryLandingSeo";

const STATIC_PATHS = [
  "/",
  "/browse/",
  "/listings/",
  "/how-it-works/",
  "/pricing/",
  "/for-posters/",
  "/for-taskers/",
  "/categories/",
  "/contact/",
  "/faq/",
  "/careers/",
  "/safety/",
  "/privacy-policy/",
  "/termsandconditions/",
  "/support/",
  "/supportpage/",
  "/aboutus/",
  "/listing-request/",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1 : path === "/browse/" || path === "/listings/" ? 0.9 : path === "/pricing/" || path === "/for-posters/" || path === "/for-taskers/" || path === "/how-it-works/" ? 0.85 : 0.7,
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

  const blogIndexEntry: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/blog/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

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

  let categoryEntries: MetadataRoute.Sitemap = [];

  try {
    const categories = await fetchPublicCategoriesServer();
    categoryEntries = categories.map((c) => ({
      url: absoluteUrl(categoryLandingPath(c.slug)),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));
  } catch {
    /* categories API unavailable during build */
  }

  return [...staticEntries, ...blogIndexEntry, ...blogEntries, ...listingEntries, ...categoryEntries];
}
