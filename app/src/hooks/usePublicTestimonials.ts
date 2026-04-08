"use client";

import { useEffect, useState } from "react";
import {
  fetchPublicTestimonials,
  resolveTestimonialsForHome,
  FALLBACK_PUBLIC_TESTIMONIALS,
  type MarketingTestimonial,
} from "@/lib/publicTestimonials";

export function usePublicTestimonials() {
  const [items, setItems] = useState<MarketingTestimonial[]>(FALLBACK_PUBLIC_TESTIMONIALS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const api = await fetchPublicTestimonials();
        if (!cancelled) setItems(resolveTestimonialsForHome(api));
      } catch {
        if (!cancelled) setItems(resolveTestimonialsForHome([]));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { items, loading };
}

export type { MarketingTestimonial };
