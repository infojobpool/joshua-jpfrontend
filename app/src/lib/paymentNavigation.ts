/**
 * Payment URLs and in-app / native open helpers.
 * Static export + Capacitor serve `/payments/index.html` — paths must use `/payments/?…`.
 */

const PUBLIC_ORIGIN =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_APP_ORIGIN) ||
  "https://www.jobpool.in";

export type PaymentUrlParams = {
  taskId: string;
  taskerId: string;
  taskPosterId: string;
  amount: number | string;
  taskTitle?: string;
};

function toSearchParams(p: PaymentUrlParams): URLSearchParams {
  const qs = new URLSearchParams({
    taskId: String(p.taskId),
    taskerId: String(p.taskerId),
    taskPosterId: String(p.taskPosterId),
    amount: String(p.amount),
  });
  if (p.taskTitle?.trim()) {
    qs.set("taskTitle", p.taskTitle.trim());
  }
  return qs;
}

/** In-app router path (trailing slash for static export). */
export function buildPaymentsPath(p: PaymentUrlParams): string {
  return `/payments/?${toSearchParams(p).toString()}`;
}

/** In-app router path with autopay — Razorpay opens immediately after accept (no extra taps). */
export function buildPaymentsPathWithAutopay(p: PaymentUrlParams): string {
  const qs = toSearchParams(p);
  qs.set("autopay", "1");
  return `/payments/?${qs.toString()}`;
}

export type PaymentSessionData = PaymentUrlParams & { taskTitle?: string };

/** Write payment context for in-app navigation (survives refresh within same tab). */
export function persistPaymentSession(data: PaymentSessionData): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      "paymentData",
      JSON.stringify({
        taskId: String(data.taskId),
        taskerId: String(data.taskerId),
        taskPosterId: String(data.taskPosterId),
        amount: Number(data.amount),
        ...(data.taskTitle ? { taskTitle: data.taskTitle } : {}),
      }),
    );
    sessionStorage.setItem("payment_page_visited", "true");
  } catch {
    /* quota / private mode */
  }
}

/** Route to payments using session data, or bare /payments/ if missing. */
export function paymentsRouteFromSession(): string {
  if (typeof window === "undefined") return "/payments/";
  try {
    const raw = sessionStorage.getItem("paymentData");
    if (!raw) return "/payments/";
    const d = JSON.parse(raw) as PaymentSessionData;
    if (!d?.taskId || d.amount == null) return "/payments/";
    return buildPaymentsPath({
      taskId: String(d.taskId),
      taskerId: String(d.taskerId ?? ""),
      taskPosterId: String(d.taskPosterId ?? ""),
      amount: d.amount,
      taskTitle: d.taskTitle,
    });
  } catch {
    return "/payments/";
  }
}

export function clearPaymentSession(taskId?: string): void {
  if (typeof window === "undefined") return;
  try {
    if (taskId) {
      const raw = sessionStorage.getItem("paymentData");
      if (raw) {
        const d = JSON.parse(raw) as { taskId?: string };
        if (String(d?.taskId) !== String(taskId)) return;
      }
    }
    sessionStorage.removeItem("paymentData");
    sessionStorage.removeItem("payment_page_visited");
  } catch {
    /* ignore */
  }
}

/** Full HTTPS URL for Copy / Share / Safari (always www, not capacitor://localhost). */
export function buildPublicPaymentsUrl(p: PaymentUrlParams): string {
  const origin = PUBLIC_ORIGIN.replace(/\/$/, "");
  return `${origin}/payments/?${toSearchParams(p).toString()}`;
}

/** Safari checkout: public payments page with autopay so Razorpay opens immediately in mobile Safari. */
export function buildSafariPaymentsCheckoutUrl(p: PaymentUrlParams): string {
  const qs = toSearchParams(p);
  qs.set("autopay", "1");
  const origin = PUBLIC_ORIGIN.replace(/\/$/, "");
  return `${origin}/payments/?${qs.toString()}`;
}

export function isPublicPaymentsUrl(url: string): boolean {
  try {
    const u = new URL(url.trim(), PUBLIC_ORIGIN);
    return u.pathname.replace(/\/$/, "") === "/payments";
  } catch {
    return false;
  }
}

/** iPhone app/PWA must pay in Safari — embedded Razorpay fails in the home-screen WebView. */
export function needsIosSafariCheckout(): boolean {
  return isIosStandalonePwa() || (isCapacitorNative() && isIosDevice());
}

/** Where Razorpay / backend should redirect after payment (public site). */
export function paymentReturnCallbackUrl(): string {
  return `${PUBLIC_ORIGIN.replace(/\/$/, "")}/payment-callback/`;
}

/** Extra fields for create-payment-link / create-order when backend supports them. */
export function paymentLinkRedirectFields(): Record<string, string> {
  const url = paymentReturnCallbackUrl();
  return {
    callback_url: url,
    redirect_url: url,
    return_url: url,
  };
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

/** True in Capacitor iOS/Android shell (not mobile Safari browsing the website). */
export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const C = (window as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } })
      .Capacitor;
    if (C?.isNativePlatform?.()) return true;
    const platform = C?.getPlatform?.();
    if (platform === "ios" || platform === "android") return true;
  } catch {
    /* ignore */
  }
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    window.matchMedia?.("(display-mode: fullscreen)")?.matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone/iPad “Add to Home Screen” app — cannot open Razorpay inside the WebView. */
export function isIosStandalonePwa(): boolean {
  return isIosDevice() && isStandalonePwa() && !isCapacitorNative();
}

/**
 * Payment links only where embedded Razorpay modal fails (Android PWA / native).
 * iOS uses embedded Razorpay overlay — same simple flow as mobile Safari website.
 */
export function shouldUsePaymentLinkFlow(): boolean {
  if (isIosDevice()) return false;
  return isCapacitorNative() || isStandalonePwa();
}

/** Same-origin /payments route (relative or current app origin only). */
export function isLocalPaymentsRoute(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.startsWith("/payments")) return true;
  try {
    const u = new URL(trimmed, typeof window !== "undefined" ? window.location.href : PUBLIC_ORIGIN);
    if (u.pathname.replace(/\/$/, "") !== "/payments") return false;
    if (typeof window === "undefined") return true;
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
}

/** Razorpay or other external HTTPS checkout (not our /payments page). */
export function isExternalCheckoutUrl(url: string): boolean {
  const trimmed = url?.trim() ?? "";
  if (!/^https:\/\//i.test(trimmed)) return false;
  return !isLocalPaymentsRoute(trimmed);
}

export type OpenCheckoutOptions = {
  router?: { push: (path: string) => void };
  onBrowserClosed?: () => void;
  onNeedSafariCopy?: () => void;
};

async function copyCheckoutUrl(url: string, onCopied?: () => void): Promise<boolean> {
  try {
    await navigator.clipboard?.writeText(url);
    onCopied?.();
    return true;
  } catch {
    return false;
  }
}

async function shareCheckoutUrl(url: string): Promise<"opened" | "blocked"> {
  try {
    if (navigator.share) {
      await navigator.share({
        url,
        title: "JobPool Payment",
        text: "Open in Safari to pay with Razorpay",
      });
      return "opened";
    }
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return "blocked";
  }
  return "blocked";
}

/** Share / Browser.open the Safari payments page (Razorpay works there without Xcode rebuild). */
export async function openSafariPaymentsCheckout(
  params: PaymentUrlParams,
  options?: OpenCheckoutOptions,
): Promise<"opened" | "blocked"> {
  const url = buildSafariPaymentsCheckoutUrl(params);
  return openExternalCheckout(url, options).then((r) => (r === "navigated" ? "opened" : r));
}

/**
 * Open Razorpay checkout safely on iOS.
 * Never uses window.location for external URLs on iOS (causes blue error screen + app reset).
 */
export async function openExternalCheckout(
  url: string,
  options?: OpenCheckoutOptions,
): Promise<"opened" | "blocked" | "navigated"> {
  if (typeof window === "undefined" || !url?.trim()) return "blocked";

  const clean = url.trim();
  const iosSafari = needsIosSafariCheckout();
  const publicPayments = isPublicPaymentsUrl(clean);

  if (isLocalPaymentsRoute(clean) && !iosSafari) {
    const u = new URL(clean, window.location.href);
    const path = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
    const target = `${path}${u.search}`;
    if (options?.router) {
      options.router.push(target);
      return "navigated";
    }
    window.location.href = target;
    return "navigated";
  }

  if (!/^https:\/\//i.test(clean)) {
    return "blocked";
  }

  // Capacitor iOS: in-app Browser when available; otherwise Share to Safari (works without Xcode rebuild)
  if (isCapacitorNative()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      try {
        const listener = await Browser.addListener("browserFinished", () => {
          void listener.remove();
          options?.onBrowserClosed?.();
        });
      } catch {
        /* optional */
      }
      await Browser.open({ url: clean, presentationStyle: "fullscreen" });
      return "opened";
    } catch (err) {
      console.warn("Capacitor Browser.open failed", err);
      if (isIosDevice()) {
        const shared = await shareCheckoutUrl(clean);
        if (shared === "opened") return "opened";
      }
      await copyCheckoutUrl(clean, options?.onNeedSafariCopy);
      return "blocked";
    }
  }

  // iOS home-screen PWA: Share → Safari (never navigate in-app — Razorpay breaks + blue screen)
  if (iosSafari && (isExternalCheckoutUrl(clean) || publicPayments || isLocalPaymentsRoute(clean))) {
    const shared = await shareCheckoutUrl(clean);
    if (shared === "opened") return "opened";
    await copyCheckoutUrl(clean, options?.onNeedSafariCopy);
    return "blocked";
  }

  if (isIosDevice() && isExternalCheckoutUrl(clean)) {
    const shared = await shareCheckoutUrl(clean);
    if (shared === "opened") return "opened";
    await copyCheckoutUrl(clean, options?.onNeedSafariCopy);
    return "blocked";
  }

  const opened = window.open(clean, "_blank", "noopener,noreferrer");
  if (!opened) {
    await copyCheckoutUrl(clean, options?.onNeedSafariCopy);
    return "blocked";
  }
  return "opened";
}

/** @deprecated Use openExternalCheckout */
export async function openPaymentUrl(
  url: string,
  router?: { push: (path: string) => void },
): Promise<"opened" | "blocked" | "navigated"> {
  return openExternalCheckout(url, { router });
}
