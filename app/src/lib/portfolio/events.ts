"use client";

export const PORTFOLIO_UPDATE_EVENT = "jp-portfolio-updated";

export function notifyPortfolioUpdated(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PORTFOLIO_UPDATE_EVENT));
}
