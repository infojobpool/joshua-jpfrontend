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
        hideNav
          ? "flex min-h-screen flex-col pb-[env(safe-area-inset-bottom)]"
          : "min-h-0 pb-[calc(env(safe-area-inset-bottom)+5.25rem)] md:min-h-screen md:pb-0",
      )}
    >
      {children}
    </main>
  );
}
