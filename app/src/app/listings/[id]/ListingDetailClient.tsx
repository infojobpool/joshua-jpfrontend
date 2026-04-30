"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicOfferingByIdApi } from "@/lib/offerings/api";
import type { Offering } from "@/lib/offerings/types";
import { resolveApiMediaUrl } from "@/lib/profileImage";
import useStore from "@/lib/Zustand";
import { toViewTransitionKey } from "@/lib/viewTransition";

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

function listingIdFromParams(params: ReturnType<typeof useParams>): string {
  const raw = params?.id;
  const segment = Array.isArray(raw) ? raw[0] : typeof raw === "string" ? raw : "";
  if (!segment?.trim()) return "";
  try {
    return decodeURIComponent(segment.trim());
  } catch {
    return segment.trim();
  }
}

export default function ListingDetailClient() {
  const params = useParams();
  const id = listingIdFromParams(params);
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
            It may be unpublished, removed, or the link is incorrect. If you came from the home page, open Home and
            wait for listings to refresh, then try again.
          </p>
          <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl"
              onClick={() => void load()}
            >
              Retry
            </Button>
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
  const vtId = toViewTransitionKey(o.id);

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
    <div className="min-h-screen bg-gradient-to-b from-slate-100/80 via-slate-50 to-white pb-28 md:pb-12">
      <ListingDetailChrome />

      <article className="mx-auto max-w-6xl px-4 pb-12 pt-4 sm:px-5 sm:pt-5">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8 lg:gap-10">
          {/* Main column */}
          <div className="min-w-0 flex-1 space-y-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md ring-1 ring-slate-100/80">
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
                  alt={o.title || "Listing photo"}
                  className="h-full w-full object-cover"
                  loading="eager"
                  decoding="async"
                  style={{
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore viewTransitionName is supported in modern Chromium.
                    viewTransitionName: `listing-image-${vtId}`,
                  }}
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

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm ring-1 ring-slate-100/60 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-blue-800 ring-1 ring-blue-100/80">
                  {category}
                </span>
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  {typeLabel}
                </span>
              </div>
              <h1
                className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                style={{
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore viewTransitionName is supported in modern Chromium.
                  viewTransitionName: `listing-title-${vtId}`,
                }}
              >
                {o.title}
              </h1>

              <div className="mt-4 border-b border-slate-100 pb-4 md:hidden">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Starting from</p>
                <p className="mt-0.5 text-2xl font-semibold tabular-nums text-slate-900">{priceLabel}</p>
              </div>

              {o.locationText ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-slate-700">
                  <MapPin className="h-4 w-4 shrink-0 text-blue-500/90" aria-hidden />
                  <span>{o.locationText}</span>
                </p>
              ) : null}

              {isOwnListing ? (
                <p className="mt-3 text-sm leading-snug text-slate-600">
                  This is how customers see your listing. Update details anytime from your workspace.
                </p>
              ) : (
                <p className="mt-3 text-sm leading-snug text-slate-600">
                  Book this {typeLabel.toLowerCase()} securely on JobPool. Use{" "}
                  <span className="font-medium text-slate-800">Request booking</span> to send dates and budget — the
                  provider will respond in chat.
                </p>
              )}

              {!isOwnListing && o.userId ? (
                <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50/90 p-4 ring-1 ring-slate-100">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200/90 text-sm font-bold text-slate-700 shadow-inner ring-1 ring-white/80"
                    aria-hidden
                  >
                    {(o.providerDisplayName || "Provider").trim().charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Provider</p>
                    <p className="truncate text-base font-semibold text-slate-900">
                      {o.providerDisplayName?.trim() || "Provider"}
                    </p>
                    <Link
                      href={profileLink}
                      className="text-sm font-semibold text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline"
                    >
                      View profile
                    </Link>
                  </div>
                </div>
              ) : null}

              {o.description?.trim() ? (
                <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
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
                  <Button asChild className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold shadow-sm hover:bg-blue-700">
                    <Link href={buildListingRequestHref(o)}>Request booking</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sticky booking card — tablet/desktop (top aligns with hero; sticky clears slim header) */}
          <aside className="hidden w-full shrink-0 md:block md:w-[min(100%,320px)] lg:w-[340px]">
            <div className="sticky top-16 space-y-4 lg:top-[4.5rem]">
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-md ring-1 ring-slate-100/80">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Starting from</p>
                <p className="mt-1.5 text-3xl font-bold tabular-nums tracking-tight text-slate-900">{priceLabel}</p>

                {o.locationText ? (
                  <p className="mt-4 flex items-start gap-2 text-sm text-slate-700">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-500/90" aria-hidden />
                    <span>{o.locationText}</span>
                  </p>
                ) : null}

                <ul className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm text-slate-600">
                  <li className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.25} aria-hidden />
                    <span>Clear pricing before you book</span>
                  </li>
                  <li className="flex gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2.25} aria-hidden />
                    <span>Chat on JobPool after you request</span>
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
                      <Button asChild className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold shadow-sm hover:bg-blue-700">
                        <Link href={buildListingRequestHref(o)}>Request booking</Link>
                      </Button>
                      {o.userId ? (
                        <p className="text-center text-sm text-slate-600">
                          <Link
                            href={profileLink}
                            className="font-semibold text-blue-700 underline-offset-2 hover:text-blue-800 hover:underline"
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

/** One slim bar: back to feed + home — listing title lives only in the page H1 (avoids triple repetition). */
function ListingDetailChrome() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-3 px-4 sm:h-14 sm:px-5">
        <Link
          href="/listings"
          className="inline-flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-1.5 -ml-1 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 hover:text-slate-950"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">All listings</span>
        </Link>
        <Link
          href="/"
          className="shrink-0 rounded-lg px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
        >
          JobPool
        </Link>
      </div>
    </header>
  );
}
