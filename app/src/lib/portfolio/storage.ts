"use client";

import type { PortfolioSlide } from "./types";

const storageKey = (userId: string) => `jp_portfolio_v1_${userId}`;

function coerceSlide(x: unknown): PortfolioSlide | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.url !== "string" || !o.url) return null;
  return {
    id: o.id,
    url: o.url,
    caption: typeof o.caption === "string" ? o.caption.slice(0, 120) : "",
    createdAt: typeof o.createdAt === "number" ? o.createdAt : Date.now(),
  };
}

function parseList(raw: string | null): PortfolioSlide[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.map(coerceSlide).filter((s): s is PortfolioSlide => s !== null);
  } catch {
    return [];
  }
}

export function loadPortfolio(userId: string): PortfolioSlide[] {
  if (typeof window === "undefined" || !userId) return [];
  return parseList(localStorage.getItem(storageKey(userId)));
}

export function savePortfolio(userId: string, slides: PortfolioSlide[]): void {
  if (typeof window === "undefined" || !userId) return;
  localStorage.setItem(storageKey(userId), JSON.stringify(slides.slice(0, 24)));
}

export function newSlideId(): string {
  return `pf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export const PORTFOLIO_MAX_SLIDES = 16;
export const PORTFOLIO_MAX_IMAGE_BYTES = 650 * 1024;
