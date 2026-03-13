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

/** Get user's profile image from store/localStorage user object */
export function getProfileImageFromUser(user: {
  profile_image?: string | null;
  profile_img?: string | null;
} | null): string | null {
  if (!user) return null;
  return user.profile_image || (user as any).profile_img || null;
}
