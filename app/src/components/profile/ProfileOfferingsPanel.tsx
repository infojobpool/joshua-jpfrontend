"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Offering } from "@/lib/offerings/types";
import {
  countSlotsUsed,
  getMaxOfferingSlots,
} from "@/lib/offerings/policy";
import {
  deleteOffering,
  loadOfferings,
  readOfferingSubscriptionMock,
} from "@/lib/offerings/storage";
import { Package, Plus, PencilLine, MapPin } from "lucide-react";

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
  const maxSlots = getMaxOfferingSlots(readOfferingSubscriptionMock());
  const used = countSlotsUsed(list);

  const refresh = useCallback(() => {
    setList(loadOfferings(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-600">
            Public listings: <span className="font-semibold text-slate-800">{used}</span> / {maxSlots}
            {readOfferingSubscriptionMock() ? " (subscription)" : " (free)"}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Drafts don&apos;t use a slot. Paused listings stay on your plan limit.
          </p>
        </div>
        <Button asChild className="rounded-xl bg-emerald-600 hover:bg-emerald-700 shrink-0">
          <Link href="/profile/offerings/new">
            <Plus className="mr-2 h-4 w-4" />
            Add offering
          </Link>
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-3 font-medium text-slate-700">No offerings yet</p>
          <p className="mt-1 text-sm text-slate-500">Advertise a service or product — separate from tasks.</p>
          <Button asChild className="mt-4 rounded-xl bg-emerald-600 hover:bg-emerald-700">
            <Link href="/profile/offerings/new">Add your first offering</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-4">
          {list.map((o) => {
            const cover = o.photoUrls?.[0];
            return (
              <li
                key={o.id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/[0.04] sm:flex sm:min-h-[148px]"
              >
                <div className="relative aspect-[16/10] sm:aspect-auto sm:w-44 sm:max-w-[40%] sm:shrink-0 bg-gradient-to-br from-slate-100 via-slate-50 to-emerald-50/40">
                  {cover ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover} alt="" className="h-full w-full min-h-[120px] sm:min-h-0 object-cover" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/25 to-transparent sm:bg-gradient-to-r" />
                    </>
                  ) : (
                    <div className="flex h-full min-h-[120px] sm:min-h-full items-center justify-center">
                      <Package className="h-11 w-11 text-slate-200" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:pl-5">
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
                        onClick={() => {
                          deleteOffering(userId, o.id);
                          refresh();
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
