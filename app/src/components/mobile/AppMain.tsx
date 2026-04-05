"use client";

import { usePathname } from "next/navigation";
import { isMobileBottomNavHidden } from "@/lib/mobileNavVisibility";
import { cn } from "@/lib/utils";

/**
 * Root main wrapper: bottom padding matches whether the mobile tab bar is visible.
 */
export function AppMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = isMobileBottomNavHidden(pathname);

  return (
    <main
      className={cn(
        "min-h-screen md:pb-0",
        hideNav
          ? "pb-[env(safe-area-inset-bottom)]"
          : "pb-[calc(env(safe-area-inset-bottom)+96px)]",
      )}
    >
      {children}
    </main>
  );
}
