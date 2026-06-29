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

export function isExternalPaymentUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return !u.pathname.replace(/\/$/, "").endsWith("/payments");
  } catch {
    return true;
  }
}

/** Same-origin /payments route (Capacitor localhost or www). */
export function isInAppPaymentsUrl(url: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url, typeof window !== "undefined" ? window.location.href : PUBLIC_ORIGIN);
    return u.pathname.replace(/\/$/, "") === "/payments";
  } catch {
    return url.startsWith("/payments");
  }
}

/** True in Capacitor iOS/Android shell (not mobile Safari browsing the website). */
export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const C = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    return Boolean(C?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export function isStandalonePwa(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)")?.matches === true ||
    window.matchMedia?.("(display-mode: fullscreen)")?.matches === true ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Payment links + system browser: Capacitor native app and installed PWA only.
 * iPhone Safari (website) uses embedded Razorpay checkout — redirects via JS handler.
 */
export function shouldUsePaymentLinkFlow(): boolean {
  return isCapacitorNative() || isStandalonePwa();
}

export type OpenCheckoutOptions = {
  router?: { push: (path: string) => void };
  /** Fires when user closes in-app browser (Capacitor Browser plugin). */
  onBrowserClosed?: () => void;
};

/**
 * Open Razorpay checkout. Native iOS uses SFSafariViewController (Capacitor Browser)
 * so Razorpay can redirect to payment-callback after pay.
 */
export async function openExternalCheckout(
  url: string,
  options?: OpenCheckoutOptions,
): Promise<"opened" | "blocked" | "navigated"> {
  if (typeof window === "undefined" || !url) return "blocked";

  if (isInAppPaymentsUrl(url)) {
    const u = new URL(url, window.location.href);
    const path = u.pathname.endsWith("/") ? u.pathname : `${u.pathname}/`;
    const target = `${path}${u.search}`;
    if (options?.router) {
      options.router.push(target);
      return "navigated";
    }
    window.location.href = target;
    return "navigated";
  }

  if (isCapacitorNative()) {
    try {
      const { Browser } = await import("@capacitor/browser");
      try {
        const listener = await Browser.addListener("browserFinished", () => {
          void listener.remove();
          options?.onBrowserClosed?.();
        });
      } catch {
        /* listener optional */
      }
      await Browser.open({ url, presentationStyle: "fullscreen" });
      return "opened";
    } catch (err) {
      console.warn("Capacitor Browser.open failed — rebuild app with npx cap sync ios", err);
      window.location.href = url;
      return "navigated";
    }
  }

  // Installed PWA on iOS: full navigation so Razorpay redirect chain works
  if (isStandalonePwa() && /iPhone|iPad|iPod/i.test(navigator.userAgent || "")) {
    window.location.href = url;
    return "navigated";
  }

  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    window.location.href = url;
    return "navigated";
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
