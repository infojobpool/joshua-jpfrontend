"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TrustBadges } from "@/components/TrustBadges";
import { PosterFeeBreakdown } from "@/components/fee/PosterFeeBreakdown";
import {
  fetchFeePreview,
  posterPayableAmount,
  type PosterFeeData,
} from "@/lib/feePreview";

interface Task {
  id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  status: boolean;
  postedAt: string;
  dueDate: string;
  category: string;
  images: Image[];
  poster: User;
  offers: Offer[];
  assignedTasker?: User;
}

interface Image {
  id: string;
  url: string;
  alt: string;
}

interface Offer {
  id: string;
  tasker: User;
  amount: number;
  message: string;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
  rating: number;
  taskCount: number;
  joinedDate: string;
}

/** When provided, the modal uses this preview instead of calling /fee-preview/ again (e.g. payments page). */
export type ExternalPosterFeePreview = {
  data: PosterFeeData | null;
  loading: boolean;
  error: string | null;
};

interface PaymentModalProps {
  show: boolean;
  task: Task;
  handlePayment: () => void;
  closeModal: () => void;
  isSubmitting: boolean;
  bidAmount: number;
  razorpayReady?: boolean;
  externalFeePreview?: ExternalPosterFeePreview | null;
}

export function PaymentModal({
  show,
  task,
  handlePayment,
  closeModal,
  isSubmitting,
  bidAmount,
  razorpayReady = true,
  externalFeePreview,
}: PaymentModalProps) {
  const [fees, setFees] = useState<PosterFeeData | null>(null);
  const [loadingFees, setLoadingFees] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  useEffect(() => {
    if (externalFeePreview != null) {
      setFees(externalFeePreview.data);
      setLoadingFees(externalFeePreview.loading);
      setFeeError(externalFeePreview.error);
      return;
    }
    if (!show || bidAmount <= 0) {
      setFees(null);
      setFeeError(null);
      setLoadingFees(false);
      return;
    }
    let cancelled = false;
    setLoadingFees(true);
    setFeeError(null);
    void (async () => {
      try {
        const data = (await fetchFeePreview(bidAmount, "poster")) as PosterFeeData;
        if (!cancelled) {
          setFees(data);
          setFeeError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setFees(null);
          setFeeError(e instanceof Error ? e.message : "Unable to load fees");
        }
      } finally {
        if (!cancelled) setLoadingFees(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [show, bidAmount, externalFeePreview]);

  if (!show) return null;

  const youPay = fees ? posterPayableAmount(fees, bidAmount) : undefined;
  const payDisabled =
    isSubmitting || !razorpayReady || loadingFees || !fees || !!feeError || bidAmount <= 0 || youPay == null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>You pay the task budget. Fees are deducted from that amount, not added on top.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {feeError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{feeError}</div>
          ) : null}

          <div className="space-y-3 rounded-lg border p-4">
            {loadingFees || !fees ? (
              <p className="text-sm text-muted-foreground">Loading fee breakdown…</p>
            ) : (
              <PosterFeeBreakdown data={fees} bidFallback={bidAmount} />
            )}
          </div>

          <TrustBadges heading="Secure payment" subtext="Encrypted & protected" variant="compact" />
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={payDisabled}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Processing…" : !razorpayReady ? "Loading…" : loadingFees ? "Loading fees…" : "Proceed to Pay"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
