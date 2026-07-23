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
        "flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-y-auto overflow-x-hidden",
        hideNav
          ? "pb-[env(safe-area-inset-bottom)]"
          : "pb-[calc(env(safe-area-inset-bottom)+8.75rem)] max-lg:pr-14 lg:pb-0 lg:pr-0",
      )}
    >
      {children}
    </main>
  );
}
