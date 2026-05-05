"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, Mail, MessageCircle, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BASE_URL =
  typeof window !== "undefined" ? window.location.origin : "https://www.jobpool.in";

interface ShareListingButtonProps {
  listingId: string;
  title: string;
  price?: number | string;
  variant?: "icon" | "button" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function ShareListingButton({
  listingId,
  title,
  price,
  variant = "icon",
  size = "sm",
  className,
}: ShareListingButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const url = `${BASE_URL}/listings/${encodeURIComponent(listingId)}`;
  const shareText = `Check this listing on JobPool: ${title}${price ? ` – ₹${price}` : ""}\n${url}`;
  const whatsappText = encodeURIComponent(shareText);
  const emailSubject = encodeURIComponent(`JobPool Listing: ${title}`);
  const emailBody = encodeURIComponent(shareText);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `JobPool Listing: ${title}`,
          text: shareText,
          url,
        });
        toast.success("Listing shared");
        setOpen(false);
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") toast.error("Share cancelled");
      }
      return true;
    }
    return false;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      toast.success("Listing link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${whatsappText}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
    setOpen(false);
  };

  const handleClick = async () => {
    const usedNative = await handleNativeShare();
    if (!usedNative) setOpen((v) => !v);
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <Button
        variant={variant === "ghost" ? "ghost" : variant === "button" ? "outline" : "ghost"}
        size={size}
        onClick={handleClick}
        className={cn(
          "shrink-0 transition-all duration-200",
          variant === "icon" &&
            "h-9 w-9 rounded-full border border-slate-200/80 p-0 text-slate-700 hover:bg-blue-50 hover:text-blue-700",
          variant === "button" &&
            "rounded-lg border-slate-200/80 hover:border-blue-200 hover:bg-blue-50/70",
          className,
        )}
        aria-label="Share listing"
      >
        <Share2 className="h-4 w-4" />
        {variant === "button" ? <span className="ml-2">Share</span> : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl">
          <div className="bg-slate-50 px-3 pb-1 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Share listing</p>
          </div>
          <div className="py-1">
            <button
              onClick={handleCopy}
              className="mx-1 my-0.5 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-blue-50/80"
            >
              {copied ? (
                <Check className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <Link2 className="h-5 w-5 shrink-0 text-slate-400" />
              )}
              <span className="text-sm font-medium text-slate-700">{copied ? "Copied!" : "Copy link"}</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="mx-1 my-0.5 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-emerald-50"
            >
              <MessageCircle className="h-5 w-5 shrink-0 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">WhatsApp</span>
            </button>
            <button
              onClick={handleEmail}
              className="mx-1 my-0.5 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-blue-50/80"
            >
              <Mail className="h-5 w-5 shrink-0 text-blue-500" />
              <span className="text-sm font-medium text-slate-700">Email</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

