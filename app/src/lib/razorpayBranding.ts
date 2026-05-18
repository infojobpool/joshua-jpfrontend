/**
 * Razorpay Checkout branding (embedded modal + optional payment-link payload).
 * Logo must be a public HTTPS URL (Razorpay does not accept relative paths).
 */
export const RAZORPAY_CHECKOUT_LOGO_PATH = "/images/new-logo.png";

const DEFAULT_SITE_ORIGIN = "https://www.jobpool.in";

export function getRazorpayCheckoutLogoUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${RAZORPAY_CHECKOUT_LOGO_PATH}`;
  }
  const site =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    DEFAULT_SITE_ORIGIN;
  return `${site}${RAZORPAY_CHECKOUT_LOGO_PATH}`;
}

/** Options passed to `new Razorpay({ ... })` and forwarded to create-payment-link when supported. */
export function getRazorpayCheckoutBranding() {
  return {
    name: "JobPool",
    image: getRazorpayCheckoutLogoUrl(),
    theme: { color: "#2563eb" },
  };
}
