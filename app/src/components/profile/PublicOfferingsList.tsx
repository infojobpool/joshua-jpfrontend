"use client";

import Link from "next/link";
import { MapPin, Package } from "lucide-react";
import type { Offering } from "@/lib/offerings/types";
import { loadOfferings } from "@/lib/offerings/storage";

type Props = {
  profileUserId: string;
  viewerIsOwner?: boolean;
};

export function PublicOfferingsList({ profileUserId, viewerIsOwner }: Props) {
  const list = loadOfferings(profileUserId).filter((o) => o.status === "published");

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
            className="mt-4 inline-block text-sm font-semibold text-emerald-700 hover:underline"
          >
            Go to Profile → Offerings
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {list.map((o) => (
        <PublicOfferingCard key={o.id} offering={o} />
      ))}
    </ul>
  );
}

function PublicOfferingCard({ offering: o }: { offering: Offering }) {
  return (
    <li className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-4 shadow-sm ring-1 ring-slate-100/80">
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{o.type}</span>
        <span className="text-sm font-bold tabular-nums text-slate-900">
          From ₹{Math.round(o.startingPriceInr).toLocaleString("en-IN")}
        </span>
      </div>
      <p className="mt-2 font-semibold text-slate-900 line-clamp-2">{o.title || "Offering"}</p>
      {o.category ? <p className="mt-0.5 text-xs text-slate-500">{o.category}</p> : null}
      {o.locationText ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{o.locationText}</span>
        </p>
      ) : null}
    </li>
  );
}
