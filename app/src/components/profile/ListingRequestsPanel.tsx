"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, IndianRupee, Inbox } from "lucide-react";
import { loadIncomingBookings } from "@/lib/listingBookings/storage";
import type { ListingBookingRequest } from "@/lib/listingBookings/types";

type Props = {
  userId: string;
};

function formatWhen(createdAt: number) {
  try {
    return new Date(createdAt).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export function ListingRequestsPanel({ userId }: Props) {
  const [list, setList] = useState<ListingBookingRequest[]>([]);

  const refresh = useCallback(() => {
    setList(loadIncomingBookings(userId));
  }, [userId]);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <Inbox className="mx-auto h-10 w-10 text-slate-300" aria-hidden />
        <p className="mt-2 text-sm font-medium text-slate-700">No listing requests yet</p>
        <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
          When someone completes &quot;Request a listing&quot; from your public profile (same device / demo storage),
          it appears here. A server API will sync these across devices later.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {list.map((r) => (
        <li
          key={r.id}
          className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm ring-1 ring-slate-900/[0.03]"
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">{r.listingType}</p>
          <p className="mt-1 font-semibold text-slate-900">{r.offeringTitle}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              {r.preferredDate} · {r.timeWindow}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
              <IndianRupee className="h-3.5 w-3.5 shrink-0" />
              {Math.round(r.proposedBudgetInr).toLocaleString("en-IN")}
            </span>
          </div>
          {r.notes ? <p className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{r.notes}</p> : null}
          <p className="mt-2 text-[11px] text-slate-400">Recorded {formatWhen(r.createdAt)}</p>
          <p className="mt-3 text-xs text-slate-500">
            Reply in{" "}
            <Link href="/messages" className="font-semibold text-emerald-700 hover:underline">
              Messages
            </Link>{" "}
            — booking checkout on platform is coming later.
          </p>
        </li>
      ))}
    </ul>
  );
}
