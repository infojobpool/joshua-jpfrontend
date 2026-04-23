"use client";

import { cn } from "@/lib/utils";

type AuthFlowShellProps = {
  children: React.ReactNode;
  /** Optional micro-copy under the card (terms, trust line, etc.). */
  footer?: React.ReactNode;
  /** Tighter vertical padding when the card is tall (e.g. signup form). */
  dense?: boolean;
};

/**
 * Gradient auth shell: fills `AppMain` when the mobile tab bar is hidden, centers the card,
 * and keeps optional footer anchored above the safe area.
 *
 * Wrap with `AuthPageViewport` as the page root on those routes.
 */
export function AuthFlowShell({ children, footer, dense }: AuthFlowShellProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-slate-50 via-blue-50/80 to-indigo-50/95">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>
      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6",
          dense ? "sm:py-4" : "sm:py-6",
        )}
      >
        <div className={cn("flex min-h-0 flex-1 flex-col justify-center", dense ? "py-2 sm:py-3" : "py-3 sm:py-4")}>
          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
        {footer ? (
          <div className="relative mx-auto mt-2 w-full max-w-md shrink-0 pb-1 pt-1 text-center text-[11px] leading-relaxed text-slate-500/90 sm:text-xs">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Page root for auth routes that hide the mobile tab bar — pairs with `AuthFlowShell`. */
export function AuthPageViewport({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}
