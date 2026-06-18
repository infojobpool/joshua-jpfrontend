import type { Metadata } from "next";
import { getPublicOfferingByIdApi } from "@/lib/offerings/api";
import { resolveApiMediaUrl } from "@/lib/profileImage";
import { sitePath, toAbsoluteMediaUrl, truncateMetaDescription } from "@/lib/seo/site";
import ListingDetailClient from "./ListingDetailClient";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const canonicalPath = sitePath(`/listings/${encodeURIComponent(id)}`);
  const offering = await getPublicOfferingByIdApi(id);
  if (!offering) {
    return {
      title: "Listing not found | JobPool",
      description: "This listing may be unpublished or removed.",
      alternates: { canonical: canonicalPath },
      robots: { index: false, follow: false },
    };
  }

  const title = `${offering.title} | JobPool`;
  const priceBit = `From ₹${Math.round(offering.startingPriceInr || 0).toLocaleString("en-IN")}`;
  const fallbackDesc = `${offering.type === "product" ? "Product" : "Service"} on JobPool. ${priceBit}.`;
  const description = offering.description?.trim()
    ? truncateMetaDescription(`${offering.description.trim()} ${priceBit}`)
    : truncateMetaDescription(`${offering.title}. ${fallbackDesc}`);

  const first = offering.photoUrls?.[0];
  const ogImage = first ? toAbsoluteMediaUrl(resolveApiMediaUrl(first)) : undefined;

  return {
    title,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "website",
      url: canonicalPath,
      siteName: "JobPool",
      title,
      description,
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: offering.title || "JobPool listing image",
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}

export default function ListingDetailPage() {
  return <ListingDetailClient />;
}
