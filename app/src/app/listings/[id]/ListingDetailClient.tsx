"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, MapPin, Package } from "lucide-react";
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

export default function ListingDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : "";
  const userId = useStore((s) => s.userId);

  const [offering, setOffering] = useState<Offering | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const touchStartX = useRef<number | null>(null);

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
        setActivePhoto(0);
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

  /** Warm browser cache for adjacent gallery images. */
  useEffect(() => {
    if (!offering) return;
    const list = (offering.photoUrls || [])
      .map((u) => resolveApiMediaUrl(u))
      .filter(Boolean);
    if (list.length <= 1) return;
    const safe = Math.min(Math.max(0, activePhoto), list.length - 1);
    const preload = (url: string) => {
      const img = new window.Image();
      img.decoding = "async";
      img.src = url;
    };
    preload(list[(safe + 1) % list.length]);
    preload(list[(safe - 1 + list.length) % list.length]);
  }, [offering, activePhoto]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <ListingDetailChrome />
        <div className="flex flex-1 items-center justify-center px-4 py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
        </div>
      </div>
    );
  }

  if (notFound || !offering) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
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
  const category = o.category?.trim() || (o.type === "product" ? "Product" : "Service");
  const photos = (o.photoUrls || []).map((u) => resolveApiMediaUrl(u)).filter(Boolean);
  const gallery = photos.length ? photos : [PLACEHOLDER];
  const safeIndex = Math.min(Math.max(0, activePhoto), gallery.length - 1);
  const hero = gallery[safeIndex] || PLACEHOLDER;
  const showCarousel = photos.length > 1;
  const priceLabel = `₹${Math.round(o.startingPriceInr || 0).toLocaleString("en-IN")}`;
  const profileLink = o.userId ? `/profilepage/${encodeURIComponent(o.userId)}` : "/listings";
  const typeLabel = o.type === "product" ? "Product" : "Service";

  const goPrev = () =>
    setActivePhoto((i) => {
      const n = photos.length;
      if (n <= 1) return 0;
      return i <= 0 ? n - 1 : i - 1;
    });
  const goNext = () =>
    setActivePhoto((i) => {
      const n = photos.length;
      if (n <= 1) return 0;
      return i >= n - 1 ? 0 : i + 1;
    });

  return (
    <div className="min-h-screen bg-slate-50 pb-28 md:pb-12">
      <ListingDetailChrome listingTitle={o.title} />

      <div className="mx-auto max-w-6xl px-4 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      <article className="mx-auto max-w-6xl px-4 pb-10 pt-4">
        <nav className="mb-3 hidden text-xs text-slate-500 sm:flex sm:flex-wrap sm:items-center sm:gap-1.5">
          <Link href="/listings" className="hover:text-slate-800">
            Listings
          </Link>
          <span aria-hidden className="text-slate-300">
            /
          </span>
          <span className="font-medium text-slate-700">{category}</span>
        </nav>

        <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
          {/* Main column */}
          <div className="min-w-0 flex-1 space-y-6">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
              <div
                className="relative aspect-[16/10] w-full bg-slate-100 touch-pan-y"
                onTouchStart={(e) => {
                  touchStartX.current = e.changedTouches[0]?.clientX ?? null;
                }}
                onTouchEnd={(e) => {
                  if (!showCarousel) return;
                  const start = touchStartX.current;
                  touchStartX.current = null;
                  if (start == null) return;
                  const endX = e.changedTouches[0]?.clientX;
                  if (endX == null) return;
                  const dx = endX - start;
                  if (Math.abs(dx) < 48) return;
                  if (dx < 0) goNext();
                  else goPrev();
                }}
              >
                <img
                  key={hero}
                  src={hero}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                />
                {showCarousel ? (
                  <>
                    <button
                      type="button"
                      onClick={goPrev}
                      className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-800 shadow-sm backdrop-blur hover:bg-white"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={goNext}
                      className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-800 shadow-sm backdrop-blur hover:bg-white"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-slate-900/35 px-2 py-1 backdrop-blur-sm">
                      {photos.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActivePhoto(i)}
                          className={`h-1.5 rounded-full transition-all ${
                            i === safeIndex ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/80"
                          }`}
                          aria-label={`Image ${i + 1}`}
                          aria-current={i === safeIndex ? "true" : undefined}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              {photos.length > 1 ? (
                <div className="flex gap-2 overflow-x-auto border-t border-slate-100 p-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {photos.slice(0, 12).map((src, i) => (
                    <button
                      key={`${src}-${i}`}
                      type="button"
                      onClick={() => setActivePhoto(i)}
                      className={`relative shrink-0 overflow-hidden rounded-lg ring-2 ring-offset-2 ring-offset-white transition-shadow ${
                        i === safeIndex ? "ring-slate-900" : "ring-transparent hover:ring-slate-300"
                      }`}
                    >
                      <img src={src} alt="" className="h-14 w-14 object-cover sm:h-16 sm:w-16" loading="lazy" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{category}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{o.title}</h1>

              <div className="mt-4 border-b border-slate-100 pb-4 md:hidden">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Starting from</p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">{priceLabel}</p>
              </div>

              {o.locationText ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                  {o.locationText}
                </p>
              ) : null}

              <p className="mt-2 text-xs text-slate-500">{typeLabel} on JobPool</p>

              {!isOwnListing && o.userId ? (
                <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 ring-1 ring-slate-200/80"
                    aria-hidden
                  >
                    {(o.providerDisplayName || "Provider").trim().charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {o.providerDisplayName?.trim() || "Provider"}
                    </p>
                    <Link href={profileLink} className="text-sm font-medium text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline">
                      View profile
                    </Link>
                  </div>
                </div>
              ) : null}

              {o.description?.trim() ? (
                <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:p-5">
                  <p className="text-sm font-semibold text-slate-900">About this listing</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{o.description}</p>
                </div>
              ) : null}

              {/* Mobile / tablet CTA — desktop uses sticky card */}
              <div className="mt-8 space-y-3 border-t border-slate-100 pt-6 md:hidden">
                {isOwnListing ? (
                  <>
                    <p className="text-center text-sm text-slate-600">This is your public listing.</p>
                    <Button asChild className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700">
                      <Link href={`/profile/offerings/${encodeURIComponent(o.id)}/edit`}>Edit listing</Link>
                    </Button>
                    <Button asChild variant="outline" className="h-11 w-full rounded-xl border-slate-200">
                      <Link href="/profile?tab=listings">Listings workspace</Link>
                    </Button>
                  </>
                ) : (
                  <Button asChild className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700">
                    <Link href={buildListingRequestHref(o)}>Request booking</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sticky booking card — tablet/desktop */}
          <aside className="hidden w-full shrink-0 md:block md:w-[300px] lg:w-[340px] xl:w-[360px]">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Starting from</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-slate-900">{priceLabel}</p>

                {o.locationText ? (
                  <p className="mt-4 flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{o.locationText}</span>
                  </p>
                ) : null}

                <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    <span>{typeLabel} listing</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
                    <span>Book securely through JobPool</span>
                  </li>
                </ul>

                <div className="mt-6 space-y-3">
                  {isOwnListing ? (
                    <>
                      <p className="text-center text-xs text-slate-500">Your public listing</p>
                      <Button asChild className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700">
                        <Link href={`/profile/offerings/${encodeURIComponent(o.id)}/edit`}>Edit listing</Link>
                      </Button>
                      <Button asChild variant="outline" className="h-11 w-full rounded-xl border-slate-200">
                        <Link href="/profile?tab=listings">Listings workspace</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild className="h-11 w-full rounded-xl bg-blue-600 hover:bg-blue-700">
                        <Link href={buildListingRequestHref(o)}>Request booking</Link>
                      </Button>
                      {o.userId ? (
                        <p className="text-center text-sm">
                          <Link
                            href={profileLink}
                            className="font-medium text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline"
                          >
                            View provider profile
                          </Link>
                        </p>
                      ) : null}
                    </>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </article>
    </div>
  );
}

function ListingDetailChrome({ listingTitle }: { listingTitle?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:px-5">
        <Link
          href="/listings"
          className="inline-flex min-w-0 items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Listings</span>
        </Link>
        <Link href="/" className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900">
          JobPool
        </Link>
      </div>
      {listingTitle ? (
        <p className="mx-auto max-w-6xl truncate px-4 pb-2 text-center text-[11px] text-slate-500 sm:text-xs sm:px-5">
          {listingTitle}
        </p>
      ) : null}
    </header>
  );
}
