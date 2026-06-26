"use client";

import { useEffect } from "react";
import { warmFeeEngine } from "@/lib/feePreview";

/** Loads GET /fee-config/ once per session so bid/post-task UIs can use instant local estimates. */
export function FeeConfigWarmup() {
  useEffect(() => {
    void warmFeeEngine();
  }, []);
  return null;
}
