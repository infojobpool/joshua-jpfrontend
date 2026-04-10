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

  const publicList = list.filter((o) => o.status === "published");

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

      {publicList.length > 0 && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Preview — public on your profile</p>
          <ul className="space-y-2">
            {publicList.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-700">
                <span className="font-medium text-slate-900">{o.title || "Untitled"}</span>
                <span className="text-emerald-700 font-semibold tabular-nums">
                  Starting from ₹{Math.round(o.startingPriceInr).toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
        <ul className="space-y-3">
          {list.map((o) => (
            <li
              key={o.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {statusBadge(o.status)}
                  <span className="text-xs font-medium uppercase text-slate-400">{o.type}</span>
                </div>
                <p className="mt-1 font-semibold text-slate-900 truncate">{o.title || "Untitled draft"}</p>
                {o.category ? <p className="text-xs text-slate-500 mt-0.5">{o.category}</p> : null}
                <p className="text-sm text-emerald-700 font-semibold mt-1 tabular-nums">
                  Starting from ₹{Math.round(o.startingPriceInr).toLocaleString("en-IN")}
                </p>
                {o.locationText ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{o.locationText}</span>
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button asChild variant="outline" size="sm" className="rounded-lg">
                  <Link href={`/profile/offerings/${o.id}/edit`}>
                    <PencilLine className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Link>
                </Button>
                {o.status === "draft" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
