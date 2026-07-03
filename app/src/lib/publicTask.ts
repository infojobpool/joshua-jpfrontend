import { canonicalJobId } from "@/lib/jobIdVariants";
import { resolveApiMediaUrl } from "@/lib/profileImage";

export type PublicTaskSeo = {
  id: string;
  title: string;
  description: string;
  budget: number;
  location: string;
  categoryName: string;
  imageUrl?: string;
};

function apiBase(): string {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE_URL?.trim()) ||
    "https://api.jobpool.in/api/v1";
  return raw.replace(/\/+$/, "");
}

function firstJobImageUrl(jobImages: unknown): string | undefined {
  if (jobImages == null) return undefined;
  let parsed: unknown = jobImages;
  if (typeof jobImages === "string") {
    try {
      parsed = JSON.parse(jobImages);
    } catch {
      return resolveApiMediaUrl(jobImages);
    }
  }
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const obj = parsed as Record<string, unknown>;
  const urls = obj.urls ?? obj.images ?? obj.image_urls;
  if (Array.isArray(urls) && urls.length > 0) {
    const first = urls[0];
    if (typeof first === "string" && first.trim()) {
      const abs = resolveApiMediaUrl(first);
      return abs.startsWith("http") ? abs : undefined;
    }
  }
  return undefined;
}

async function fetchJobPayload(taskId: string): Promise<Record<string, unknown> | null> {
  const base = apiBase();
  const raw = String(taskId ?? "").trim();
  if (!raw) return null;

  const tries = [
    canonicalJobId(raw),
    raw.replace(/^task_/, ""),
    raw.startsWith("task_") ? raw : `task_${raw}`,
  ].filter(Boolean);

  for (const jobId of [...new Set(tries)]) {
    try {
      const res = await fetch(`${base}/get-job/${encodeURIComponent(jobId)}/`, {
        next: { revalidate: 300 },
      });
      if (!res.ok) continue;
      const json = (await res.json()) as Record<string, unknown>;
      const sc = json.status_code;
      if (sc != null && Number(sc) !== 200) continue;
      const data = json.data;
      if (data && typeof data === "object") {
        return data as Record<string, unknown>;
      }
    } catch {
      /* try next id shape */
    }
  }
  return null;
}

/** Public task fields for share previews (WhatsApp, Twitter, etc.). */
export async function fetchPublicTaskForSeo(taskId: string): Promise<PublicTaskSeo | null> {
  const data = await fetchJobPayload(taskId);
  if (!data) return null;

  const title = String(data.job_title ?? "").trim();
  if (!title) return null;

  const description = String(data.job_description ?? "").trim();
  const budgetRaw = data.job_budget;
  const budget =
    typeof budgetRaw === "number" && Number.isFinite(budgetRaw)
      ? budgetRaw
      : parseFloat(String(budgetRaw ?? "0")) || 0;

  const location = String(data.job_location ?? "").trim() || "India";
  const categoryName =
    String(data.job_category_name ?? data.job_category ?? "").trim() || "Task";

  const imageUrl = firstJobImageUrl(data.job_images);

  return {
    id: String(data.job_id ?? taskId),
    title,
    description,
    budget,
    location,
    categoryName,
    imageUrl,
  };
}

export function buildTaskShareDescription(task: PublicTaskSeo): string {
  const bits: string[] = [];
  if (task.budget > 0) {
    bits.push(`Budget ₹${Math.round(task.budget).toLocaleString("en-IN")}`);
  }
  if (task.location) bits.push(task.location);
  if (task.categoryName) bits.push(task.categoryName);
  const meta = bits.join(" · ");
  const body = task.description.replace(/\s+/g, " ").trim();
  const lead = body ? `${body.slice(0, 120)}${body.length > 120 ? "…" : ""}` : task.title;
  return meta ? `${lead} — ${meta}` : lead;
}
