"use client";

import Script from "next/script";

// GA4 Web stream — env optional; fallback for production JobPool property
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-VCZSRDN393";

/**
 * Google Ads “Google tag” (conversion linker / remarketing).
 * Matches Google’s snippet for www.jobpool.in — override via env or set
 * NEXT_PUBLIC_GOOGLE_ADS_ID= (empty) to disable only the Ads config.
 */
function getGoogleAdsId(): string | null {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
  if (raw === "") return null;
  if (raw !== undefined && raw.trim()) return raw.trim();
  return "AW-18065599786";
}

const GOOGLE_ADS_ID = getGoogleAdsId();

/** One gtag.js load: prefer GA id in URL (supports multiple gtag('config', …)). */
const GTAG_LOADER_ID = GA_MEASUREMENT_ID || GOOGLE_ADS_ID || "";

/**
 * GA4 + optional Google Ads (AW-) on one gtag.js load (Next.js Script, afterInteractive ≈ before </body>).
 * Same behavior as pasting Google’s tag in <head> for SPA/PWA.
 */
export function GoogleAnalytics() {
  if (!GTAG_LOADER_ID) {
    return null;
  }

  const gaConfig =
    GA_MEASUREMENT_ID &&
    `gtag('config', '${GA_MEASUREMENT_ID}', {
            page_location: typeof window !== 'undefined' ? window.location.href : undefined
          });`;

  const adsConfig = GOOGLE_ADS_ID && `gtag('config', '${GOOGLE_ADS_ID}');`;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_LOADER_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          ${gaConfig || ""}
          ${adsConfig || ""}
        `}
      </Script>
    </>
  );
}
