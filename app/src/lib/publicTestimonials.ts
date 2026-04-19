/**
 * Homepage testimonials from GET /public-testimonials/ (no auth).
 * Falls back to bundled copy if the API fails or returns no published rows.
 */

export type MarketingTestimonial = {
  id: string;
  name: string;
  role: string;
  text: string;
  rating: number;
  category: string | null;
  avatarUrl: string | null;
};

function apiBase(): string {
  const raw = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1").replace(
    /\/+$/,
    "",
  );
  return raw;
}

/** Matches backend public testimonial JSON (snake_case avatar_url → camelCase). */
function cleanLabel(s: string): string {
  return s.replace(/^[\s.,\-_:;]+/, "").replace(/\s+/g, " ").trim();
}

function mapPublicRow(row: Record<string, unknown>, index: number): MarketingTestimonial | null {
  const id = typeof row.id === "string" ? row.id : `fallback-${index}`;
  const name = typeof row.name === "string" ? cleanLabel(row.name) : "";
  const role = typeof row.role === "string" ? cleanLabel(row.role) : "";
  const text = typeof row.text === "string" ? row.text.trim() : "";
  const rating =
    typeof row.rating === "number" && Number.isFinite(row.rating)
      ? Math.min(5, Math.max(0, row.rating))
      : 5;
  const category =
    row.category === null || row.category === undefined
      ? null
      : typeof row.category === "string"
        ? row.category
        : null;
  const avatarUrl =
    typeof row.avatar_url === "string" && row.avatar_url.trim()
      ? row.avatar_url.trim()
      : null;
  if (!name || !text) return null;
  return { id, name, role, text, rating, category, avatarUrl };
}

export const FALLBACK_PUBLIC_TESTIMONIALS: MarketingTestimonial[] = [
  {
    id: "fb-1",
    name: "Priya Sharma",
    role: "Homeowner & Customer",
    text: "JobPool has been incredible! I found a reliable handyman who fixed my kitchen sink in just 2 hours. The quality of work was outstanding and the price was fair. Highly recommend!",
    rating: 5,
    category: "Home Services",
    avatarUrl: null,
  },
  {
    id: "fb-2",
    name: "Rajesh Kumar",
    role: "Small Business Owner",
    text: "As a restaurant owner, I use JobPool for all my delivery needs. The Taskers are punctual, professional, and always handle our food with care.",
    rating: 5,
    category: "Food Delivery",
    avatarUrl: null,
  },
  {
    id: "fb-3",
    name: "Anjali Patel",
    role: "Busy Professional",
    text: "JobPool is a lifesaver! I can outsource household tasks and focus on my career. The caregivers I found for my elderly parents are compassionate and reliable.",
    rating: 5,
    category: "Caregiving",
    avatarUrl: null,
  },
  {
    id: "fb-4",
    name: "Vikram Singh",
    role: "Tasker & Service Provider",
    text: "Being a Tasker on JobPool has given me financial freedom! I can work on my own schedule, choose my clients, and earn a good income.",
    rating: 5,
    category: "Professional Tasker",
    avatarUrl: null,
  },
];

export async function fetchPublicTestimonials(): Promise<MarketingTestimonial[]> {
  const url = `${apiBase()}/public-testimonials/`;
  const isServer = typeof window === "undefined";
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    ...(isServer ? { next: { revalidate: 120 } as const } : {}),
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { status_code?: number; data?: unknown };
  if (json?.status_code !== undefined && json.status_code !== 200) return [];
  const raw = json?.data;
  if (!Array.isArray(raw)) return [];
  const out: MarketingTestimonial[] = [];
  raw.forEach((row, i) => {
    if (row && typeof row === "object") {
      const m = mapPublicRow(row as Record<string, unknown>, i);
      if (m) out.push(m);
    }
  });
  return out;
}

export function resolveTestimonialsForHome(apiList: MarketingTestimonial[]): MarketingTestimonial[] {
  return apiList.length > 0 ? apiList : FALLBACK_PUBLIC_TESTIMONIALS;
}
