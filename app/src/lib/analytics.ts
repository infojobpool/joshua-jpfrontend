/**
 * Google Analytics 4 helper for custom events.
 * Use trackEvent() from any component to send events to GA4.
 * Only sends when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", eventName, params);
}

/** JobPool-specific event helpers */
export const analytics = {
  taskViewed: (taskId: string, title?: string) =>
    trackEvent("view_task", { task_id: taskId, task_title: title || "" }),

  taskShared: (taskId: string, method?: string) =>
    trackEvent("task_shared", { task_id: taskId, share_method: method || "unknown" }),

  bidPlaced: (taskId: string, amount?: number) =>
    trackEvent("bid_placed", { task_id: taskId, bid_amount: amount || 0 }),

  taskPosted: (taskId: string, budget?: number) =>
    trackEvent("task_posted", { task_id: taskId, budget: budget || 0 }),

  signUp: () => trackEvent("sign_up"),
  login: () => trackEvent("login"),
  search: (query: string) => trackEvent("search", { search_term: query }),

  /** Page view events for funnels */
  viewTask: (taskId: string, title?: string) =>
    trackEvent("view_task", { task_id: taskId, task_title: title || "", page_path: "/tasks/[id]" }),
  viewSignup: () => trackEvent("view_signup", { page_path: "/signup" }),
  viewDashboard: () => trackEvent("view_dashboard", { page_path: "/dashboard" }),

  /** App download button clicks (from website) */
  appDownloadClick: (store: "play_store" | "app_store") =>
    trackEvent("app_download_click", { store, link_placement: "footer" }),

  /** PWA installed (Add to Home Screen) */
  pwaInstalled: () => trackEvent("pwa_installed", { platform: "web" }),
};
