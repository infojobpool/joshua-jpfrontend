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
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-slate-900">{used}</span>
            <span className="text-slate-500"> / {maxSlots} live slots</span>
            {readOfferingSubscriptionMock() ? (
              <span className="text-slate-500"> · subscription</span>
            ) : null}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">
            Drafts don&apos;t use a slot. Limits are enforced on the server.
          </p>
        </div>
        {list.length > 0 ? (
          <Button asChild size="sm" className="rounded-lg bg-emerald-600 hover:bg-emerald-700 shrink-0 w-full sm:w-auto">
            <Link href="/profile/offerings/new">
              <Plus className="mr-2 h-4 w-4" />
              Add listing
            </Link>
          </Button>
        ) : null}
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200/90 bg-slate-50/40 px-4 py-6 sm:p-8 text-center">
          <Package className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-800">No listings yet</p>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Add a service or product clients can book from your public profile.
          </p>
          <Button asChild size="sm" className="mt-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 w-full max-w-xs mx-auto">
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
