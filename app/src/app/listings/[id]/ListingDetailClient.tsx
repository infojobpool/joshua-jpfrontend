"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, MapPin, MessageSquare, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicOfferingByIdApi } from "@/lib/offerings/api";
import type { Offering } from "@/lib/offerings/types";
import { resolveApiMediaUrl } from "@/lib/profileImage";
import useStore from "@/lib/Zustand";

const PLACEHOLDER = "/images/placeholder.svg";

function buildListingRequestHref(o: Offering): string {
  const q = new URLSearchParams();
  q.set("providerId", o.userId);
  q.set("providerName", (o.providerDisplayName || "Provider").trim() || "Provider");
  q.set("offeringId", o.id);
  q.set("title", o.title || "Service");
  q.set("price", String(Math.max(0, Math.round(o.startingPriceInr ?? 0))));
  if (o.locationText?.trim()) q.set("location", o.locationText.trim());
  q.set("type", o.type === "product" ? "product" : "service");
  return `/listing-request?${q.toString()}`;
}

function buildMessageHrefWhenSignedOut(o: Offering): string {
  const q = new URLSearchParams({
    receiver: o.userId,
    receiverName: (o.providerDisplayName || "Provider").trim() || "Provider",
  });
  q.set("offering_id", o.id);
  q.set("context", `Hi — I'm interested in "${(o.title || "your listing").slice(0, 80)}". `);
  const dest = `/messages/new?${q.toString()}`;
  return `/signin?next=${encodeURIComponent(dest)}`;
}

function buildMessageHrefSignedIn(o: Offering): string {
  const q = new URLSearchParams({
    receiver: o.userId,
    receiverName: (o.providerDisplayName || "Provider").trim() || "Provider",
  });
  q.set("offering_id", o.id);
  q.set("context", `Hi — I'm interested in "${(o.title || "your listing").slice(0, 80)}". `);
  return `/messages/new?${q.toString()}`;
}

export default function ListingDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";
  const userId = useStore((s) => s.userId);

  const [offering, setOffering] = useState<Offering | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    try {
      const o = await getPublicOfferingByIdApi(id);
      if (!o) {
        setOffering(null);
        setNotFound(true);
      } else {
        setOffering(o);
      }
    } catch {
      setOffering(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
        <ListingDetailChrome />
        <div className="flex flex-1 items-center justify-center px-4 py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
        </div>
      </div>
    );
  }

  if (notFound || !offering) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
        <ListingDetailChrome />
        <div className="mx-auto max-w-md flex-1 px-4 py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <h1 className="mt-4 text-lg font-semibold text-slate-900">Listing not found</h1>
          <p className="mt-2 text-sm text-slate-600">
            It may be unpublished, removed, or the link is incorrect.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/listings">Browse listings</Link>
            </Button>
            <Button asChild className="rounded-xl bg-blue-600 hover:bg-blue-700">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const o = offering;
  const isOwnListing = Boolean(userId && String(userId) === String(o.userId));
  const category = o.category || (o.type === "product" ? "Product" : "Service");
  const photos = (o.photoUrls || []).map((u) => resolveApiMediaUrl(u)).filter(Boolean);
  const hero = photos[0] || PLACEHOLDER;
  const priceLabel = `₹${Math.round(o.startingPriceInr || 0).toLocaleString("en-IN")}`;
  const profileLink = o.userId ? `/profilepage/${encodeURIComponent(o.userId)}` : "/listings";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/90 pb-28 md:pb-12">
      <ListingDetailChrome listingTitle={o.title} />

      <div className="mx-auto max-w-2xl px-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-blue-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <article className="mx-auto max-w-2xl px-4 pb-8 pt-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80">
          <div className="relative aspect-[16/10] w-full bg-slate-100">
            <img src={hero} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-4 pb-4 pt-10">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90">
                From
              </span>
              <span className="text-xl font-bold tabular-nums text-white drop-shadow-md">{priceLabel}</span>
            </div>
          </div>

          <div className="space-y-4 p-5 sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">{category}</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{o.title}</h1>
              {o.locationText ? (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-blue-600/70" />
                  {o.locationText}
                </p>
              ) : null}
            </div>

            {o.description?.trim() ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-sm font-medium text-slate-800">About this listing</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{o.description}</p>
              </div>
            ) : null}

            {photos.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {photos.slice(0, 8).map((src, i) => (
                  <img
                    key={`${src}-${i}`}
                    src={src}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                    loading="lazy"
                  />
                ))}
              </div>
            ) : null}

            {isOwnListing ? (
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <p className="text-center text-sm text-slate-600">This is your public listing.</p>
                <Button asChild className="w-full rounded-xl bg-blue-600 hover:bg-blue-700">
                  <Link href={`/profile/offerings/${encodeURIComponent(o.id)}/edit`}>Edit listing</Link>
                </Button>
                <Button asChild variant="outline" className="w-full rounded-xl">
                  <Link href="/profile?tab=listings">Listings workspace</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 border-t border-slate-100 pt-5 sm:flex-row">
                  <Button asChild className="w-full rounded-xl bg-blue-600 hover:bg-blue-700">
                    <Link href={buildListingRequestHref(o)}>Request booking</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link
                      href={userId ? buildMessageHrefSignedIn(o) : buildMessageHrefWhenSignedOut(o)}
                      className="inline-flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Message provider
                    </Link>
                  </Button>
                </div>

                <Link
                  href={profileLink}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
                >
                  <User className="h-4 w-4 text-blue-600" />
                  View provider profile
                </Link>
              </>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

function ListingDetailChrome({ listingTitle }: { listingTitle?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-2xl items-center justify-between gap-3 px-3 sm:px-4">
        <Link
          href="/listings"
          className="inline-flex min-w-0 items-center gap-1 text-sm font-medium text-slate-700 hover:text-blue-700"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Listings</span>
        </Link>
        <Link href="/" className="shrink-0 text-xs font-semibold uppercase tracking-wide text-blue-700 hover:underline">
          JobPool
        </Link>
      </div>
      {listingTitle ? (
        <p className="mx-auto max-w-2xl truncate px-4 pb-2 text-center text-[11px] text-slate-500 sm:text-xs">
          {listingTitle}
        </p>
      ) : null}
    </header>
  );
}
