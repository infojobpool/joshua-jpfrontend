/** Resolve profile image URL - handles relative paths from API */
export function resolveProfileImageUrl(url: string | undefined | null): string | undefined {
  if (!url || typeof url !== "string" || url.trim() === "" || url.includes("placeholder")) {
    return undefined;
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/api\/v1\/?$/, "") || "https://api.jobpool.in";
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}
