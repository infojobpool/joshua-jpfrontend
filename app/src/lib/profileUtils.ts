/**
 * Profile completeness check for JobPool.
 * Profile is considered "complete" when user has a real profile image (not placeholder).
 */

const PLACEHOLDER_INDICATORS = ["placeholder", "default-avatar", "gravatar"];

export function isProfileComplete(
  profileImage?: string | null,
  jobTitle?: string | null
): boolean {
  const img = (profileImage || "").trim();
  if (!img) return false;
  const lower = img.toLowerCase();
  const isPlaceholder = PLACEHOLDER_INDICATORS.some((p) => lower.includes(p));
  if (isPlaceholder) return false;
  // Has real profile image
  return true;
}

/** Get user's profile image from store/localStorage user object (login often stores `avatar` only). */
export function getProfileImageFromUser(user: {
  profile_image?: string | null;
  profile_img?: string | null;
  avatar?: string | null;
} | null): string | null {
  if (!user) return null;
  const u = user as Record<string, unknown>;
  const pick = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
  return (
    pick(user.profile_image) ||
    pick(user.profile_img) ||
    pick(user.avatar) ||
    pick(u.profile_photo) ||
    pick(u.photo_url) ||
    null
  );
}
