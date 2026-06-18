import type { ReactNode } from "react";
import { staticPageMetadata } from "./staticPageMetadata";
import { fallbackForPath } from "./publicStaticPages";

/** Create a layout.tsx `generateMetadata` export for a static marketing route. */
export function createStaticPageLayoutMetadata(path: string) {
  const fb = fallbackForPath(path);
  return staticPageMetadata(path, {
    title: fb?.title ?? "JobPool",
    description:
      fb?.description ??
      "Post tasks and hire skilled help for home services, repairs, and more on JobPool.",
  });
}

export function StaticPagePassthroughLayout({ children }: { children: ReactNode }) {
  return children;
}
