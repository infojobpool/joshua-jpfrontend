"use client";

import type { Offering, OfferingType } from "./types";

const storageKey = (userId: string) => `jp_offerings_v1_${userId}`;

function coerceOffering(x: unknown): Offering | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string") return null;
  const now = Date.now();
  const status =
    o.status === "published" || o.status === "paused" || o.status === "draft" ? o.status : "draft";
  const photoUrls = Array.isArray(o.photoUrls)
    ? (o.photoUrls as unknown[]).filter((u): u is string => typeof u === "string" && u.length > 0).slice(0, 8)
    : [];
  return {
    id: o.id,
    userId: typeof o.userId === "string" ? o.userId : "",
    type: o.type === "product" ? "product" : "service",
    title: typeof o.title === "string" ? o.title : "",
    category: typeof o.category === "string" ? o.category : "",
    description: typeof o.description === "string" ? o.description : "",
    locationText: typeof o.locationText === "string" ? o.locationText : "",
    startingPriceInr:
      typeof o.startingPriceInr === "number" && !Number.isNaN(o.startingPriceInr) ? o.startingPriceInr : 0,
    photoUrls,
    status,
    createdAt: typeof o.createdAt === "number" ? o.createdAt : now,
    updatedAt: typeof o.updatedAt === "number" ? o.updatedAt : now,
    attestationAccepted: Boolean(o.attestationAccepted),
  };
}

function parseList(raw: string | null): Offering[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.map(coerceOffering).filter((x): x is Offering => x !== null);
  } catch {
    return [];
  }
}

export function loadOfferings(userId: string): Offering[] {
  if (typeof window === "undefined" || !userId) return [];
  return parseList(localStorage.getItem(storageKey(userId)));
}

export function saveOfferings(userId: string, list: Offering[]): void {
  if (typeof window === "undefined" || !userId) return;
  localStorage.setItem(storageKey(userId), JSON.stringify(list));
}

export function upsertOffering(userId: string, offering: Offering): void {
  const list = loadOfferings(userId);
  const i = list.findIndex((x) => x.id === offering.id);
  if (i >= 0) list[i] = offering;
  else list.push(offering);
  saveOfferings(userId, list);
}

export function deleteOffering(userId: string, id: string): void {
  const list = loadOfferings(userId).filter((x) => x.id !== id);
  saveOfferings(userId, list);
}

export function newOfferingId(): string {
  return `of_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function createDraftShell(userId: string, type: OfferingType = "service"): Offering {
  const now = Date.now();
  return {
    id: newOfferingId(),
    userId,
    type,
    title: "",
    category: "",
    description: "",
    locationText: "",
    startingPriceInr: 0,
    photoUrls: [],
    status: "draft",
    createdAt: now,
    updatedAt: now,
    attestationAccepted: false,
  };
}

/** Dev / future: read subscription flag from localStorage until API exists */
export function readOfferingSubscriptionMock(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("jp_offering_subscription_active") === "1";
}

/** Dev / QA: treat user as subscribed for offering slot limits. */
export function setOfferingSubscriptionMock(active: boolean): void {
  if (typeof window === "undefined") return;
  if (active) localStorage.setItem("jp_offering_subscription_active", "1");
  else localStorage.removeItem("jp_offering_subscription_active");
}
