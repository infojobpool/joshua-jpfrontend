"use client";

/**
 * JobPool uses a single light appearance only (no dark mode / system toggle).
 * This wrapper remains so imports in layout stay stable; children render as-is.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
