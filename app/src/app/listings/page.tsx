"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listOfferingFeedApi } from "@/lib/offerings/api";
import type { Offering } from "@/lib/offerings/types";
import { resolveApiMediaUrl } from "@/lib/profileImage";
import { TransitionLink } from "@/components/TransitionLink";
import { toViewTransitionKey } from "@/lib/viewTransition";

const PAGE = 24;
const PLACEHOLDER = "/images/placeholder.svg";

export default function ListingsBrowsePage() {
  const [rows, setRows] = useState<Offering[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (start: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    try {
      const { offerings, total: t } = await listOfferingFeedApi(PAGE, start);
      setTotal(t);
      setOffset(start + offerings.length);
      if (append) {
        setRows((prev) => [...prev, ...offerings]);
      } else {
        setRows(offerings);
      }
    } catch {
      if (!append) setRows([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage(0, false);
  }, [fetchPage]);

  const canLoadMore = rows.length > 0 && rows.length < total;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100/80 via-slate-50 to-white pb-28 md:pb-16">
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between gap-3 px-4 sm:h-14 sm:px-5">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1.5 -ml-1 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            Home
          </Link>
          <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Browse listings</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pb-10 pt-6 sm:px-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Service listings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
          Explore services from JobPool providers. Tap a card for photos, pricing, and location — then request a booking to agree on timing and details in chat.
        </p>

        {loading ? (
          <div className="mt-12 flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          </div>
        ) : rows.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-14 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 font-medium text-slate-800">No listings yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600">
              When providers publish services to the feed, they will show up here.
            </p>
            <Button asChild variant="outline" className="mt-6 rounded-xl">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {rows.map((o) => {
                const img = resolveApiMediaUrl(o.photoUrls?.[0]) || PLACEHOLDER;
                const price = `₹${Math.round(o.startingPriceInr || 0).toLocaleString("en-IN")}`;
                const cat = o.category || (o.type === "product" ? "Product" : "Service");
                return (
                  <li key={o.id}>
                    <TransitionLink
                      href={`/listings/${encodeURIComponent(o.id)}`}
                      className="group flex overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-100"
                    >
                      <div
                        className="relative h-28 w-28 shrink-0 bg-slate-100 sm:h-32 sm:w-32"
                        style={{
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore viewTransitionName is supported in modern Chromium.
                          viewTransitionName: `listing-image-${toViewTransitionKey(o.id)}`,
                        }}
                      >
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3 sm:p-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-700">{cat}</p>
                        <p
                          className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base"
                          style={{
                            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                            // @ts-ignore viewTransitionName is supported in modern Chromium.
                            viewTransitionName: `listing-title-${toViewTransitionKey(o.id)}`,
                          }}
                        >
                          {o.title}
                        </p>
                        {o.locationText ? (
                          <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {o.locationText}
                          </p>
                        ) : null}
                        <p className="text-sm font-bold tabular-nums text-blue-800">From {price}</p>
                      </div>
                    </TransitionLink>
                  </li>
                );
              })}
            </ul>
            {canLoadMore ? (
              <div className="mt-8 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  disabled={loadingMore}
                  onClick={() => void fetchPage(offset, true)}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
