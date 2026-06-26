"use client";

import { useEffect, useState } from "react";
import {
  cancelFeePreviewBatchRefresh,
  getCachedFeePreview,
  resolveFeePreviewInstant,
  scheduleFeePreviewBatchRefresh,
  warmFeeEngine,
  type FeePreviewRole,
  type PosterFeeData,
  type TaskerFeeData,
} from "@/lib/feePreview";

type FeePreviewData = PosterFeeData | TaskerFeeData;

/**
 * Instant local estimate from fee-config; debounced batch/API refresh after typing stops.
 * Avoids POST /fee-preview/ on every keystroke.
 */
export function useFeePreview(bidAmount: number, role: FeePreviewRole) {
  const rounded = Math.round(bidAmount) || 0;
  const [configReady, setConfigReady] = useState(false);
  const [data, setData] = useState<FeePreviewData | null>(() =>
    rounded > 0 ? resolveFeePreviewInstant(rounded, role) : null,
  );
  const [isEstimate, setIsEstimate] = useState(() =>
    rounded > 0 ? !getCachedFeePreview(rounded, role) : false,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void warmFeeEngine().then((c) => {
      if (c) setConfigReady(true);
    });
  }, []);

  useEffect(() => {
    if (rounded <= 0) {
      setData(null);
      setIsEstimate(false);
      setIsRefreshing(false);
      setError(null);
      cancelFeePreviewBatchRefresh(role);
      return;
    }

    const instant = resolveFeePreviewInstant(rounded, role);
    if (instant) {
      setData(instant);
      setIsEstimate(!getCachedFeePreview(rounded, role));
      setError(null);
    }

    const cached = getCachedFeePreview(rounded, role);
    setIsRefreshing(!cached);

    scheduleFeePreviewBatchRefresh(rounded, role, (updated) => {
      setData(updated);
      setIsEstimate(false);
      setIsRefreshing(false);
      setError(null);
    });
  }, [rounded, role, configReady]);

  useEffect(() => {
    return () => cancelFeePreviewBatchRefresh(role);
  }, [role]);

  return { data, isEstimate, isRefreshing, error };
}
