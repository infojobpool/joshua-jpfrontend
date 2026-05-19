import { CUSTOM_CATEGORY_VALUE } from "@/lib/taskCategories";
import type { Offering } from "./types";

/** Free tier: published + paused listings (drafts do not consume a slot). */
export const OFFERING_SLOTS_FREE = 2;

/** When subscription grants extra slots, use this cap (backend should be source of truth later). */
export const OFFERING_SLOTS_SUBSCRIBED = 25;

/** Lowercase fragments — title, description, category are scanned for matches. */
export const PROHIBITED_OFFERING_KEYWORDS: string[] = [
  "weapon",
  "gun",
  "ammunition",
  "explosive",
  "drug",
  "cocaine",
  "heroin",
  "counterfeit",
  "stolen",
  "human trafficking",
  "escort",
  "prostitut",
  "porn",
  "child porn",
  "minor sex",
  "hacking service",
  "fake id",
  "money laundering",
];

export function getMaxOfferingSlots(hasActiveSubscription: boolean): number {
  return hasActiveSubscription ? OFFERING_SLOTS_SUBSCRIBED : OFFERING_SLOTS_FREE;
}

export function countSlotsUsed(offerings: Offering[]): number {
  return offerings.filter((o) => o.status === "published" || o.status === "paused").length;
}

export function scanProhibitedContent(text: string): string | null {
  const t = text.toLowerCase();
  for (const frag of PROHIBITED_OFFERING_KEYWORDS) {
    if (t.includes(frag)) return frag;
  }
  return null;
}

export function validateForPublish(
  o: Pick<
    Offering,
    | "title"
    | "description"
    | "categoryId"
    | "customCategoryName"
    | "categoryName"
    | "locationText"
    | "startingPriceInr"
    | "attestationAccepted"
  >,
): string | null {
  if (!o.title.trim() || o.title.trim().length < 3) return "Title must be at least 3 characters.";
  if (!o.categoryId.trim()) return "Select a category.";
  if (o.categoryId === CUSTOM_CATEGORY_VALUE && !(o.customCategoryName?.trim())) {
    return "Please type your category name, or select one from the list.";
  }
  if (!o.description.trim() || o.description.trim().length < 10) return "Description must be at least 10 characters.";
  if (!o.locationText.trim()) return "Add a location or service area (text).";
  if (o.startingPriceInr < 0 || Number.isNaN(o.startingPriceInr)) return "Starting price must be zero or more.";
  if (!o.attestationAccepted) return "Confirm the authenticity checkbox to publish.";
  const blob = `${o.title}\n${o.description}\n${o.categoryName ?? ""}\n${o.customCategoryName ?? ""}\n${o.categoryId}`;
  const hit = scanProhibitedContent(blob);
  if (hit) return "This listing may violate our rules. Remove prohibited content and try again.";
  return null;
}
