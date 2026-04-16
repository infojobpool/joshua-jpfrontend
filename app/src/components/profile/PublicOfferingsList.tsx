"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MapPin, MessageSquare, Package, CalendarCheck } from "lucide-react";
import type { Offering } from "@/lib/offerings/types";
import { listOfferingsApi } from "@/lib/offerings/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import useStore from "@/lib/Zustand";

type Props = {
  profileUserId: string;
  providerName?: string;
  viewerIsOwner?: boolean;
};

function listingRequestPath(providerId: string, providerName: string, o: Offering): string {
  const q = new URLSearchParams({
    providerId,
    providerName,
    offeringId: o.id,
    title: o.title || "Offering",
    type: o.type,
    price: String(Math.round(o.startingPriceInr)),
    location: o.locationText || "",
  });
  return `/listing-request?${q.toString()}`;
}

function signinNextPath(path: string): string {
  return `/signin?next=${encodeURIComponent(path)}`;
}

export function PublicOfferingsList({ profileUserId, providerName = "Provider", viewerIsOwner }: Props) {
  const [list, setList] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useStore();

  const load = useCallback(async () => {
    if (!profileUserId) return;
    setLoading(true);
    try {
      const data = await listOfferingsApi(profileUserId);
      setList(data.filter((o) => o.status === "published"));
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [profileUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
        <Package className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-2 font-medium text-slate-600">No public listings yet</p>
        <p className="mt-1 text-sm text-slate-500">
          {viewerIsOwner
            ? "Add offerings from your profile to show them here."
            : "This member hasn’t published any services or products."}
        </p>
        {viewerIsOwner ? (
          <Link
            href="/profile"
            className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline"
          >
            Go to Profile → Offerings
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {list.map((o) => (
        <PublicOfferingCard
          key={o.id}
          offering={o}
          providerId={profileUserId}
          providerName={providerName}
          viewerIsOwner={Boolean(viewerIsOwner)}
          viewerId={userId}
        />
      ))}
    </ul>
  );
}

function PublicOfferingCard({
  offering: o,
  providerId,
  providerName,
  viewerIsOwner,
  viewerId,
}: {
  offering: Offering;
  providerId: string;
  providerName: string;
  viewerIsOwner: boolean;
  viewerId: string | null;
}) {
  const cover = o.photoUrls?.[0];
  const requestPath = listingRequestPath(providerId, providerName, o);
  const messagePath = `/messages/new?${new URLSearchParams({
    receiver: providerId,
    receiverName: providerName,
    offering_id: o.id,
    context: `Hi — I'm interested in "${(o.title || "your listing").slice(0, 80)}". `,
  }).toString()}`;

  const showActions = !viewerIsOwner && (!viewerId || viewerId !== providerId);

  return (
    <li className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/[0.04] flex flex-col max-w-full">
      {/* Mobile: short fixed band + contain (no aggressive crop). sm+: wider 16:10 hero + cover. */}
      <div className="relative h-36 w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-blue-50/40 px-2 py-1.5 sm:p-0 sm:h-auto sm:aspect-[16/10] flex items-center justify-center">
        {cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover}
              alt=""
              className="max-h-full max-w-full object-contain sm:absolute sm:inset-0 sm:h-full sm:w-full sm:max-h-none sm:max-w-none sm:object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-slate-950/10 hidden sm:block" />
          </>
        ) : (
          <div className="flex h-full min-h-[5.5rem] w-full items-center justify-center">
            <Package className="h-10 w-10 text-slate-200 sm:h-12 sm:w-12" aria-hidden />
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">{o.type}</span>
            {viewerIsOwner && o.adminHidden ? (
              <Badge className="text-[10px] font-semibold bg-amber-100 text-amber-900 hover:bg-amber-100 border-amber-200/80">
                Hidden by admin
              </Badge>
            ) : null}
          </div>
          <span className="text-sm font-bold tabular-nums text-slate-900 shrink-0">
            From ₹{Math.round(o.startingPriceInr).toLocaleString("en-IN")}
          </span>
        </div>
        <p className="mt-2 font-semibold text-slate-900 line-clamp-2 leading-snug">{o.title || "Offering"}</p>
        {o.category ? <p className="mt-1 text-xs text-slate-500">{o.category}</p> : null}
        {o.locationText ? (
          <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-blue-600/80" />
            <span className="line-clamp-1">{o.locationText}</span>
          </p>
        ) : null}

        {showActions ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button asChild className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 shadow-sm" size="sm">
              <Link href={viewerId ? requestPath : signinNextPath(requestPath)}>
                <CalendarCheck className="mr-2 h-4 w-4 shrink-0" />
                Request booking
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-xl border-slate-200 shadow-sm" size="sm">
              <Link href={viewerId ? messagePath : signinNextPath(messagePath)}>
                <MessageSquare className="mr-2 h-4 w-4 shrink-0" />
                Message
              </Link>
            </Button>
          </div>
        ) : viewerIsOwner ? (
          <p className="mt-4 text-xs text-slate-500">
            {o.adminHidden
              ? "Hidden by admin — visitors do not see this card until support restores visibility."
              : "This is your public listing — visitors see Request booking and Message."}
          </p>
        ) : null}
      </div>
    </li>
  );
}
