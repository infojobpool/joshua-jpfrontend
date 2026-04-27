"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, MapPin, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listOfferingFeedApi } from "@/lib/offerings/api";
import type { Offering } from "@/lib/offerings/types";
import { resolveApiMediaUrl } from "@/lib/profileImage";

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
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/90 pb-28 md:pb-16">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between gap-3 px-3 sm:px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-blue-700"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            Home
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Browse</span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pb-8 pt-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Service listings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Book services from JobPool providers. Open a listing for details, then request a booking or send a message.
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
                    <Link
                      href={`/listings/${encodeURIComponent(o.id)}`}
                      className="group flex overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-100"
                    >
                      <div className="relative h-28 w-28 shrink-0 bg-slate-100 sm:h-32 sm:w-32">
                        <img
                          src={img}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3 sm:p-4">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-blue-700">{cat}</p>
                        <p className="line-clamp-2 text-sm font-semibold text-slate-900 sm:text-base">{o.title}</p>
                        {o.locationText ? (
                          <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {o.locationText}
                          </p>
                        ) : null}
                        <p className="text-sm font-bold tabular-nums text-blue-800">From {price}</p>
                      </div>
                    </Link>
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
