export type OfferingType = "service" | "product";

/** draft = incomplete / saved; published = public; paused = hidden from public but keeps slot */
export type OfferingStatus = "draft" | "published" | "paused";

export interface Offering {
  id: string;
  userId: string;
  type: OfferingType;
  title: string;
  /** Tasker-defined category label (separate from job categories). */
  category: string;
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
}

export type OfferingInput = Omit<Offering, "id" | "createdAt" | "updatedAt"> & {
  id?: string;
};
