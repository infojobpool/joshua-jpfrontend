export type OfferingType = "service" | "product";

/** draft = incomplete / saved; published = public; paused = hidden from public but keeps slot */
export type OfferingStatus = "draft" | "published" | "paused";

export interface Offering {
  id: string;
  userId: string;
  /** From offerings/feed; optional on owner list / editor payloads */
  providerDisplayName?: string;
  type: OfferingType;
  title: string;
  /** Task category id from get-categories-list (e.g. category_12) — sent as `category` on API. */
  categoryId: string;
  /** Display label from feed (`category_name`). */
  categoryName?: string;
  /** When user picks “type your own” (same as post task). */
  customCategoryName?: string | null;
  description: string;
  /** Plain text service/product area */
  locationText: string;
  /** Shown as "Starting from ₹…" */
  startingPriceInr: number;
  /** Portfolio / catalogue images (data URLs or https), shown in listing cards and profile hero */
  photoUrls: string[];
  status: OfferingStatus;
  createdAt: number;
  updatedAt: number;
  /** User attested honest listing (impersonation / authenticity) */
  attestationAccepted: boolean;
  /** When true, admins removed this listing from public feed / non-owner profile views */
  adminHidden?: boolean;
}

export type OfferingInput = Omit<Offering, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};

/** Label for cards and detail (prefer API category_name). */
export function offeringCategoryLabel(
  o: Pick<Offering, "categoryName" | "customCategoryName" | "categoryId" | "type">,
): string {
  const name = o.categoryName?.trim();
  if (name) return name;
  const custom = o.customCategoryName?.trim();
  if (custom) return custom;
  if (o.categoryId?.trim()) return "";
  return o.type === "product" ? "Product" : "Service";
}
