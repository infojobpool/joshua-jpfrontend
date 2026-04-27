"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Offering } from "@/lib/offerings/types";
import { countSlotsUsed, getMaxOfferingSlots } from "@/lib/offerings/policy";
import { deleteOfferingApi, listOfferingsApi } from "@/lib/offerings/api";
import { readOfferingSubscriptionMock } from "@/lib/offerings/storage";
import { Package, Plus, PencilLine, MapPin } from "lucide-react";
import { toast } from "sonner";

type Props = {
  userId: string;
};

function statusBadge(status: Offering["status"]) {
  switch (status) {
    case "published":
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Live</Badge>;
    case "paused":
      return <Badge variant="secondary">Paused</Badge>;
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
}

export function ProfileOfferingsPanel({ userId }: Props) {
  const [list, setList] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const maxSlots = getMaxOfferingSlots(readOfferingSubscriptionMock());
  const used = countSlotsUsed(list);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await listOfferingsApi(userId);
      setList(data);
    } catch {
      toast.error("Could not load listings from the server.");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0 rounded-lg bg-slate-50/90 px-3 py-2 ring-1 ring-slate-100 sm:px-3.5 sm:py-2.5">
          <p className="text-sm text-slate-800">
            <span className="font-bold tabular-nums text-emerald-800">{used}</span>
            <span className="font-medium text-slate-500"> / {maxSlots}</span>
            <span className="text-slate-500"> live slots</span>
            {readOfferingSubscriptionMock() ? (
              <span className="text-slate-500"> · subscription</span>
            ) : null}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-slate-500 sm:text-xs">
            Drafts don&apos;t use a slot. Limits are enforced on the server.
          </p>
        </div>
        {list.length > 0 ? (
          <Button asChild size="sm" className="h-10 w-full shrink-0 rounded-xl bg-emerald-600 text-sm font-semibold hover:bg-emerald-700 sm:h-9 sm:w-auto">
            <Link href="/profile/offerings/new">
              <Plus className="mr-2 h-4 w-4" />
              Add listing
            </Link>
          </Button>
        ) : null}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-emerald-200/60 bg-gradient-to-b from-emerald-50/40 to-white px-4 py-5 text-center sm:py-6">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100/80 text-emerald-700 ring-4 ring-white">
            <Package className="h-5 w-5" aria-hidden />
          </div>
          <p className="mt-3 text-sm font-bold text-slate-900">Nothing live yet</p>
          <p className="mx-auto mt-1 max-w-xs text-xs leading-relaxed text-slate-600 sm:text-sm">
            Add your first service or product so clients can book you from your public profile and the listings feed.
          </p>
          <Button
            asChild
            size="sm"
            className="mx-auto mt-4 h-11 w-full max-w-xs rounded-xl bg-emerald-600 text-sm font-semibold shadow-sm hover:bg-emerald-700"
          >
            <Link href="/profile/offerings/new">
              <Plus className="mr-2 h-4 w-4" />
              Add listing
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const cover = o.photoUrls?.[0];
            return (
              <li
                key={o.id}
                className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/[0.03] sm:flex sm:min-h-[132px]"
              >
                <div className="relative h-32 w-full sm:h-auto sm:min-h-[132px] sm:aspect-[4/3] sm:w-36 sm:max-w-[38%] sm:shrink-0 bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/40 flex items-center justify-center overflow-hidden">
                  {cover ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cover}
                        alt=""
                        className="max-h-full max-w-full object-contain sm:absolute sm:inset-0 sm:h-full sm:w-full sm:max-h-none sm:max-w-none sm:object-cover"
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/20 to-transparent opacity-80 sm:opacity-100 sm:bg-gradient-to-r" />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center py-6 sm:py-0">
                      <Package className="h-9 w-9 text-slate-200" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-3 sm:gap-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between sm:pl-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {statusBadge(o.status)}
                      {o.adminHidden ? (
                        <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-200/80">
                          Hidden by admin
                        </Badge>
                      ) : null}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{o.type}</span>
                    </div>
                    <p className="mt-1.5 font-semibold text-slate-900 text-base leading-snug line-clamp-2">
                      {o.title || "Untitled draft"}
                    </p>
                    {o.category ? <p className="text-xs text-slate-500 mt-0.5">{o.category}</p> : null}
                    <p className="text-sm text-emerald-700 font-bold mt-1.5 tabular-nums tracking-tight">
                      Starting from ₹{Math.round(o.startingPriceInr).toLocaleString("en-IN")}
                    </p>
                    {o.locationText ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600/80" />
                        <span className="truncate">{o.locationText}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button asChild variant="outline" size="sm" className="rounded-xl border-slate-200 shadow-sm">
                      <Link href={`/profile/offerings/${o.id}/edit`}>
                        <PencilLine className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Link>
                    </Button>
                    {o.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50"
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteOfferingApi(o.id);
                            toast.success("Draft deleted");
                            await refresh();
                          } catch {
                            toast.error("Could not delete listing.");
                          }
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
