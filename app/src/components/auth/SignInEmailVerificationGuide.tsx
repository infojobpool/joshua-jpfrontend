"use client";

import { useEffect, useState } from "react";
import { Mail, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const OUTER_DISMISS_KEY = "jobpool_signin_verify_outer_dismissed_v1";

type OuterBannerProps = {
  variant: "desktop" | "mobile";
  hasEmail: boolean;
  onResend: () => void;
  isResending: boolean;
  /** Slightly stronger frame when user arrives from signup success. */
  emphasize?: boolean;
  /** Optional: refresh page after user taps the link in their inbox. */
  onVerifiedRefresh?: () => void;
};

/**
 * Single dismissible strip — main email-verification guidance (keep copy short).
 */
export function SignInVerificationOuterTip({
  variant,
  hasEmail,
  onResend,
  isResending,
  emphasize = false,
  onVerifiedRefresh,
}: OuterBannerProps) {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    try {
      setHidden(localStorage.getItem(OUTER_DISMISS_KEY) === "1");
    } catch {
      setHidden(false);
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(OUTER_DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  };

  if (hidden) return null;

  const isMobile = variant === "mobile";

  return (
    <div
      className={
        emphasize
          ? isMobile
            ? "mb-3 flex items-start gap-2 rounded-xl border-2 border-amber-400 bg-amber-50 px-3 py-2.5 shadow-sm"
            : "mb-4 flex items-start gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 shadow-md"
          : isMobile
            ? "mb-3 flex items-start gap-2 rounded-xl border border-amber-300/90 bg-amber-50 px-3 py-2.5 shadow-sm ring-1 ring-amber-200/60"
            : "mb-4 flex items-start gap-3 rounded-xl border border-amber-300/90 bg-gradient-to-r from-amber-50 to-orange-50/90 px-4 py-3 shadow-md ring-1 ring-amber-200/70"
      }
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
        <Mail className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className={`font-semibold text-amber-950 ${isMobile ? "text-xs" : "text-sm"}`}>
          Verify your email, then sign in
        </p>
        <p className={`mt-0.5 text-amber-900/90 ${isMobile ? "text-[11px] leading-snug" : "text-xs leading-snug"}`}>
          After sign-up, open the email from JobPool and tap the verification link (check spam). Same email as below.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-8 border-amber-300 bg-white/90 text-amber-950 hover:bg-white"
            disabled={!hasEmail || isResending}
            onClick={onResend}
          >
            {isResending ? (
              <>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Resend email
              </>
            )}
          </Button>
          {onVerifiedRefresh ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 border-amber-300 bg-white/80 text-amber-950 hover:bg-white"
              onClick={onVerifiedRefresh}
            >
              I verified — try again
            </Button>
          ) : null}
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-900/80 hover:bg-amber-100/80"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Hide
          </button>
        </div>
      </div>
    </div>
  );
}
