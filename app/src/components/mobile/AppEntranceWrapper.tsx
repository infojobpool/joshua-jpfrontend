"use client";

interface AppEntranceWrapperProps {
  children: React.ReactNode;
}

/** Wraps app content; on mobile (via CSS media query) applies slide-up entrance animation */
export function AppEntranceWrapper({ children }: AppEntranceWrapperProps) {
  return <div className="mobile-app-open">{children}</div>;
}
