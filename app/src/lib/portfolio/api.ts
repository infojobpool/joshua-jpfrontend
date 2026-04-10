import axiosInstance from "@/lib/axiosInstance";
import type { PortfolioSlide } from "./types";
import { newSlideId } from "./storage";

function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

function unwrapData(res: { data?: unknown }): unknown {
  const d = res.data as Record<string, unknown> | undefined;
  if (!d) return undefined;
  if (d.status_code != null && Number(d.status_code) !== 200) return undefined;
  return d.data !== undefined ? d.data : d;
}

function mapSlide(raw: unknown): PortfolioSlide | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const url = String(pick(r, "image_url", "url") ?? "");
  if (!url) return null;
  return {
    id: String(pick(r, "id") ?? newSlideId()),
    url,
    caption: String(pick(r, "caption") ?? "").slice(0, 120),
    createdAt:
      typeof r.created_at === "string"
        ? Date.parse(r.created_at) || Date.now()
        : typeof r.createdAt === "number"
          ? r.createdAt
          : Date.now(),
  };
}

export async function fetchPortfolioApi(userId: string): Promise<PortfolioSlide[]> {
  const res = await axiosInstance.get(`users/${encodeURIComponent(userId)}/portfolio/`);
  const raw = unwrapData(res) ?? res.data;
  let rows: unknown[] = [];
  if (Array.isArray(raw)) rows = raw;
  else if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.slides)) rows = o.slides;
    else if (Array.isArray(o.portfolio)) rows = o.portfolio;
  }
  return rows.map(mapSlide).filter((s): s is PortfolioSlide => s !== null);
}

export async function putMyPortfolioApi(slides: PortfolioSlide[]): Promise<void> {
  await axiosInstance.put("me/portfolio/", {
    slides: slides.map((s, i) => ({
      id: s.id,
      image_url: s.url,
      caption: s.caption,
      sort_order: i,
    })),
  });
}
