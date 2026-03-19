"use client";

import Script from "next/script";

// Use env var; fallback to JobPool Web stream ID when Vercel doesn't pass it at build time
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-VCZSRDN393";

/**
 * Google Analytics 4 (GA4) component.
 * Loads gtag.js for JobPool Web stream.
 * Works on web, PWA, and Capacitor mobile (WebView loads same app).
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_location: typeof window !== 'undefined' ? window.location.href : undefined
          });
        `}
      </Script>
    </>
  );
}
