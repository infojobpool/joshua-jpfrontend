"use client";

import type { ListingBookingRequest } from "./types";

const outKey = (userId: string) => `jp_listing_booking_out_${userId}`;
const inKey = (userId: string) => `jp_listing_booking_in_${userId}`;

function parseList(raw: string | null): ListingBookingRequest[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((x) => x && typeof (x as ListingBookingRequest).id === "string") as ListingBookingRequest[];
  } catch {
    return [];
  }
}

export function loadOutgoingBookings(requesterId: string): ListingBookingRequest[] {
  if (typeof window === "undefined" || !requesterId) return [];
  return parseList(localStorage.getItem(outKey(requesterId)));
}

export function loadIncomingBookings(providerId: string): ListingBookingRequest[] {
  if (typeof window === "undefined" || !providerId) return [];
  return parseList(localStorage.getItem(inKey(providerId))).sort((a, b) => b.createdAt - a.createdAt);
}

export function saveBookingRequest(req: ListingBookingRequest): void {
  if (typeof window === "undefined") return;
  const out = loadOutgoingBookings(req.requesterId).filter((x) => x.id !== req.id);
  out.unshift(req);
  localStorage.setItem(outKey(req.requesterId), JSON.stringify(out));

  const inc = loadIncomingBookings(req.providerId).filter((x) => x.id !== req.id);
  inc.unshift(req);
  localStorage.setItem(inKey(req.providerId), JSON.stringify(inc));
}

export function newBookingId(): string {
  return `lb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
