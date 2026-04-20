/**
 * Normalize upload-image API responses (offerings / portfolio) to a single absolute image URL.
 */

function tryPickUrl(o: unknown): string | null {
  if (!o || typeof o !== "object") return null;
  const x = o as Record<string, unknown>;
  for (const k of [
    "url",
    "image_url",
    "photo_url",
    "file_url",
    "hero_image_url",
    "imageUrl",
    "fileUrl",
    "signed_url",
    "secure_url",
    "media_url",
    "asset_url",
    "link",
    "src",
    "path",
  ]) {
    const v = x[k];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  if (Array.isArray(x.urls)) {
    const u = x.urls.find((i): i is string => typeof i === "string" && i.trim().length > 0);
    if (u) return u.trim();
  }
  return null;
}

function unwrapPayload(root: Record<string, unknown>): unknown {
  const sc = root.status_code;
  if (sc != null && Number(sc) !== 200) {
    const msg =
      typeof root.message === "string"
        ? root.message
        : typeof root.detail === "string"
          ? root.detail
          : "Upload failed";
    throw new Error(msg);
  }
  if (root.data !== undefined) return root.data;
  return root;
}

export function parseMediaUploadResponse(res: { data?: unknown }): string {
  const root = res.data;
  if (root == null) {
    throw new Error("Empty upload response");
  }
  if (typeof root === "string") {
    const t = root.trim();
    if (/^https?:\/\//i.test(t)) return normalizeUrl(t);
    throw new Error("Invalid image URL in upload response");
  }
  if (typeof root !== "object") {
    throw new Error("Empty upload response");
  }
  const r = root as Record<string, unknown>;
  let payload: unknown = unwrapPayload(r);
  if (payload && typeof payload === "object") {
    const inner = unwrapPayload(payload as Record<string, unknown>);
    if (inner != null) payload = inner;
  }

  if (typeof payload === "string") {
    const t = payload.trim();
    if (/^https?:\/\//i.test(t)) return normalizeUrl(t);
  }

  let url = tryPickUrl(payload) ?? tryPickUrl(r);
  if (!url) {
    throw new Error("Upload response missing image URL");
  }

  return normalizeUrl(url);
}

function normalizeUrl(url: string): string {
  let u = url.trim();
  if (u.startsWith("//")) {
    u = `https:${u}`;
  } else if (u.startsWith("/")) {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1";
    try {
      u = new URL(u, new URL(base).origin).href;
    } catch {
      /* keep as-is */
    }
  }
  if (!/^https?:\/\//i.test(u)) {
    throw new Error("Invalid image URL in upload response");
  }
  return u;
}
