import type { OfferingType } from "@/lib/offerings/types";

/** Saved locally until a listing-booking API exists; enables inbox UI on same device. */
export type ListingBookingRequest = {
  id: string;
  providerId: string;
  providerName: string;
  requesterId: string;
  offeringId?: string;
  offeringTitle: string;
  listingType: OfferingType;
  listingStartingInr: number;
  proposedBudgetInr: number;
  preferredDate: string;
  timeWindow: string;
  notes: string;
  policyAccepted: boolean;
  status: "pending" | "withdrawn";
  createdAt: number;
};
