"use client";

interface AppEntranceWrapperProps {
  children: React.ReactNode;
}

/**
 * Column flex + min dynamic viewport height so `AppMain` can use `flex-1` and fill the area
 * **below** the header (avoids a full 100vh main stacked under the header on sign-in, etc.).
 */
export function AppEntranceWrapper({ children }: AppEntranceWrapperProps) {
  return (
    <div className="mobile-app-open flex min-h-[100dvh] min-w-0 w-full flex-col">{children}</div>
  );
}
