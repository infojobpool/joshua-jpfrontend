/**
 * Redirect to dashboard (or path) - preferring PWA/TWA app when coming from browser
 * after Razorpay payment. Used when user is in external browser and clicks "Back to Dashboard".
 *
 * PWA Builder TWA: Uses Android Intent to open URL in the installed PWA app.
 * Set NEXT_PUBLIC_PWA_PACKAGE if your TWA uses a different package ID.
 */
const APP_PACKAGE = process.env.NEXT_PUBLIC_PWA_PACKAGE || "com.jobpool.app";
const WEB_ORIGIN = typeof window !== "undefined" ? window.location.origin : "https://www.jobpool.in";

export function openInAppOrWeb(path = "/dashboard") {
  const webUrl = `${WEB_ORIGIN}${path}`;

  if (typeof window === "undefined") return;

  const isAndroid = /Android/i.test(navigator.userAgent);

  if (isAndroid) {
    const intentPath = path.startsWith("/") ? path : `/${path}`;
    const host = typeof window !== "undefined" ? window.location.host : "www.jobpool.in";
    const intentUrl = `intent://${host}${intentPath}#Intent;scheme=https;package=${APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(webUrl)};end`;

    window.location.href = intentUrl;
    setTimeout(() => {
      window.location.href = webUrl;
    }, 2500);
    return;
  }

  window.location.href = webUrl;
}
