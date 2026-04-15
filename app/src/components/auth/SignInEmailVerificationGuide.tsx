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
};

/** Optional thin strip (dismissible) — repeat visitors can hide; card inside still has full guidance. */
export function SignInVerificationOuterTip({
  variant,
  hasEmail,
  onResend,
  isResending,
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
        isMobile
          ? "mb-3 flex items-start gap-2 rounded-xl border border-amber-300/90 bg-amber-50 px-3 py-2.5 shadow-sm ring-1 ring-amber-200/60"
          : "mb-4 flex items-start gap-3 rounded-xl border border-amber-300/90 bg-gradient-to-r from-amber-50 to-orange-50/90 px-4 py-3 shadow-md ring-1 ring-amber-200/70"
      }
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
        <Mail className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className={`font-semibold text-amber-950 ${isMobile ? "text-xs" : "text-sm"}`}>
          Verify your email before you sign in
        </p>
        <p className={`mt-0.5 text-amber-900/90 ${isMobile ? "text-[11px] leading-snug" : "text-xs leading-relaxed"}`}>
          New accounts must open the JobPool email and tap the link (check spam). Sign-in will not work until then.
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
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-amber-900/80 hover:bg-amber-100/80"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
            Hide this tip
          </button>
        </div>
      </div>
    </div>
  );
}

type CardBannerProps = {
  variant: "desktop" | "mobile";
  emphasizeFromSignup?: boolean;
  hasEmail: boolean;
  onResend: () => void;
  isResending: boolean;
  onVerifiedRefresh?: () => void;
};

/** Always-on guidance inside the sign-in card (primary). */
export function SignInVerificationCardBanner({
  variant,
  emphasizeFromSignup,
  hasEmail,
  onResend,
  isResending,
  onVerifiedRefresh,
}: CardBannerProps) {
  const isMobile = variant === "mobile";

  return (
    <div
      className={
        emphasizeFromSignup
          ? isMobile
            ? "rounded-xl border-2 border-amber-400 bg-amber-50/95 p-3 shadow-sm"
            : "rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 p-4 shadow-sm"
          : isMobile
            ? "rounded-xl border border-amber-200/90 bg-amber-50/90 p-3 ring-1 ring-amber-100"
            : "rounded-xl border border-amber-200/90 bg-amber-50/95 p-4 ring-1 ring-amber-100/80"
      }
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-inner">
          <Mail className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-left">
          <div>
            <p className={`font-bold text-amber-950 ${isMobile ? "text-sm" : "text-base"}`}>
              Verify your email first — then sign in
            </p>
            <p className={`mt-1 text-amber-900/95 ${isMobile ? "text-xs leading-relaxed" : "text-sm leading-relaxed"}`}>
              Just created your account? Open the email from <strong>JobPool</strong>, tap{" "}
              <strong>Verify</strong> (or the button in that message). You cannot sign in until that step is done.
            </p>
            <p className={`mt-1.5 text-amber-900/85 ${isMobile ? "text-[11px] leading-relaxed" : "text-xs leading-relaxed"}`}>
              Check <strong>Inbox</strong> and <strong>Spam / Promotions</strong>. Use the same email address below.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              type="button"
              size="sm"
              className="h-9 bg-amber-600 text-white hover:bg-amber-700"
              disabled={!hasEmail || isResending}
              onClick={onResend}
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending verification…
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend verification email
                </>
              )}
            </Button>
            {onVerifiedRefresh ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 border-amber-300 bg-white/80 text-amber-950 hover:bg-white"
                onClick={onVerifiedRefresh}
              >
                I verified — try again
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
