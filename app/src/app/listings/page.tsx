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
    <div className="min-h-screen min-w-0 w-full max-w-full overflow-x-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50/90 pb-[calc(env(safe-area-inset-bottom)+6.5rem))] md:pb-16">
      <header className="sticky top-0 z-30 min-w-0 border-b border-slate-200/70 bg-white/90 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex h-12 max-w-4xl min-w-0 items-center justify-between gap-2 px-4 sm:h-14 sm:gap-3 sm:px-5">
          <Link
            href="/"
            className="inline-flex min-w-0 shrink items-center gap-1 rounded-lg px-1.5 py-1.5 -ml-1 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">Home</span>
          </Link>
          <span className="shrink-0 truncate text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 sm:text-[11px]">
            Browse listings
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl min-w-0 px-4 pb-10 pt-6 sm:px-5">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl sm:font-bold">
          Service listings
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 [text-wrap:pretty] sm:text-[15px]">
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
            <ul className="mt-8 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              {rows.map((o) => {
                const img = resolveApiMediaUrl(o.photoUrls?.[0]) || PLACEHOLDER;
                const price = `₹${Math.round(o.startingPriceInr || 0).toLocaleString("en-IN")}`;
                const cat = o.category || (o.type === "product" ? "Product" : "Service");
                return (
                  <li key={o.id} className="min-w-0">
                    <TransitionLink
                      href={`/listings/${encodeURIComponent(o.id)}`}
                      className="group flex min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-8px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/[0.03] transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(15,23,42,0.04),0_16px_40px_-10px_rgba(37,99,235,0.12)] hover:ring-blue-500/10 active:scale-[0.99]"
                    >
                      <div
                        className="relative aspect-square h-[6.75rem] w-[6.75rem] shrink-0 overflow-hidden rounded-l-2xl bg-slate-100 sm:h-[7.5rem] sm:w-[7.5rem]"
                        style={{
                          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                          // @ts-ignore viewTransitionName is supported in modern Chromium.
                          viewTransitionName: `listing-image-${toViewTransitionKey(o.id)}`,
                        }}
                      >
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex min-h-[6.75rem] min-w-0 flex-1 flex-col justify-between gap-1.5 p-3 sm:min-h-[7.5rem] sm:p-4">
                        <div className="min-w-0 space-y-1">
                          <p className="line-clamp-1 break-all text-[9px] font-semibold uppercase tracking-[0.12em] text-blue-600/90 sm:text-[10px]">
                            {cat}
                          </p>
                          <p
                            className="line-clamp-2 break-words text-[0.9375rem] font-semibold leading-snug tracking-tight text-slate-900 sm:text-base"
                            style={{
                              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                              // @ts-ignore viewTransitionName is supported in modern Chromium.
                              viewTransitionName: `listing-title-${toViewTransitionKey(o.id)}`,
                            }}
                          >
                            {o.title}
                          </p>
                          {o.locationText ? (
                            <p className="flex min-w-0 items-start gap-1.5 text-xs leading-snug text-slate-500">
                              <MapPin
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                                aria-hidden
                              />
                              <span className="line-clamp-2 min-w-0 break-words">{o.locationText}</span>
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 pt-0.5 text-sm font-semibold tabular-nums tracking-tight text-blue-700">
                          From {price}
                        </p>
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
