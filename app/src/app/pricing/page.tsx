"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PosterFeeBreakdown } from "@/components/fee/PosterFeeBreakdown";
import { TaskerFeeBreakdown } from "@/components/fee/TaskerFeeBreakdown";
import { useFeePreview } from "@/hooks/useFeePreview";
import {
  fetchFeePreviewBatch,
  formatFeeRatePercent,
  formatInr,
  getFeeConfigSync,
  warmFeeEngine,
  type FeeConfig,
} from "@/lib/feePreview";

const EXAMPLE_AMOUNTS = [500, 1000, 3000, 5000];

export default function PricingPage() {
  const [amount, setAmount] = useState("1000");
  const [feeConfig, setFeeConfig] = useState<FeeConfig | null>(() => getFeeConfigSync());

  const bid = parseFloat(amount) || 0;
  const {
    data: posterFees,
    isRefreshing: posterRefreshing,
    error: posterError,
  } = useFeePreview(bid, "poster");
  const {
    data: taskerFees,
    isRefreshing: taskerRefreshing,
    error: taskerError,
  } = useFeePreview(bid, "tasker");

  useEffect(() => {
    void warmFeeEngine().then(setFeeConfig);
    void fetchFeePreviewBatch(EXAMPLE_AMOUNTS, "poster");
    void fetchFeePreviewBatch(EXAMPLE_AMOUNTS, "tasker");
  }, []);

  const error = posterError ?? taskerError;
  const loading = bid > 0 && !posterFees && !taskerFees && (posterRefreshing || taskerRefreshing);

  const posterRate = formatFeeRatePercent(feeConfig?.poster_platform_rate);
  const taskerRate = formatFeeRatePercent(feeConfig?.tasker_platform_rate);
  const gstRate = formatFeeRatePercent(feeConfig?.gst_rate);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-4xl px-4 py-10 md:py-16 md:px-6">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Pricing & fees
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Transparent platform fees and GST — rates from JobPool&apos;s fee engine
            {posterRate && taskerRate && gstRate ? (
              <>
                {" "}
                (platform fee {posterRate} for posters and {taskerRate} for taskers; GST {gstRate} on the
                platform fee).
              </>
            ) : (
              ". Amounts below update automatically from live estimates."
            )}
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <Label htmlFor="pricing-amount" className="text-sm font-medium text-slate-800">
            Example task budget (₹)
          </Label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              id="pricing-amount"
              type="number"
              min={1}
              step={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_AMOUNTS.map((n) => (
                <Button
                  key={n}
                  type="button"
                  variant={bid === n ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAmount(String(n))}
                >
                  {formatInr(n)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
        ) : null}

        {bid > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-slate-900">If you post a task</h2>
              <p className="mt-1 text-sm text-slate-600">
                Taskmasters pay the task budget plus platform fee and GST on that fee at checkout.
              </p>
              <div className="mt-4">
                {loading || !posterFees ? (
                  <p className="text-sm text-muted-foreground">Loading estimate…</p>
                ) : (
                  <PosterFeeBreakdown data={posterFees} bidFallback={bid} compact />
                )}
              </div>
              <Button asChild className="mt-6 w-full bg-blue-600 hover:bg-blue-700">
                <Link href="/post-task">Post a task</Link>
              </Button>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-slate-900">If you complete a task</h2>
              <p className="mt-1 text-sm text-slate-600">
                Taskers receive the bid amount minus platform fee and GST on that fee.
              </p>
              <div className="mt-4">
                {loading || !taskerFees ? (
                  <p className="text-sm text-muted-foreground">Loading estimate…</p>
                ) : (
                  <TaskerFeeBreakdown data={taskerFees} bidFallback={bid} />
                )}
              </div>
              <Button asChild variant="outline" className="mt-6 w-full">
                <Link href="/browse">Browse tasks</Link>
              </Button>
            </section>
          </div>
        ) : null}

        <p className="mt-8 text-center text-xs text-slate-500">
          Promotional fee waivers may apply. Final amounts are confirmed at checkout or when you place a bid.
        </p>
      </div>
    </div>
  );
}
