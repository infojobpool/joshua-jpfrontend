/** Tailwind `lg` — tablet and phone use compact shell (bottom nav, filter drawers). */
export const DESKTOP_MIN_WIDTH = 1024;

export function isCompactLayoutWidth(width: number): boolean {
  return width < DESKTOP_MIN_WIDTH;
}
