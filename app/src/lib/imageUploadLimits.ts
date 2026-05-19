/** Server / API limit for listing & portfolio image uploads (multipart). */
export const UPLOAD_IMAGE_MAX_BYTES = 650 * 1024;

export function formatUploadMaxKb(bytes = UPLOAD_IMAGE_MAX_BYTES): number {
  return Math.round(bytes / 1024);
}
