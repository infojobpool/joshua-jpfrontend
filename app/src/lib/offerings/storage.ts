"use client";

import type { Offering, OfferingType } from "./types";

/**
 * Client helpers for new offering drafts (IDs, shell objects, dev subscription mock).
 * Published listings and public profiles load from the API only — do not mirror offerings in localStorage.
 */

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
    categoryId: "",
    customCategoryName: null,
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
