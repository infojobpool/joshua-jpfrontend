"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Link2, MessageCircle, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://www.jobpool.in";

interface ShareTaskButtonProps {
  taskId: string;
  title: string;
  description?: string;
  budget?: number | string;
  variant?: "icon" | "button" | "ghost";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function ShareTaskButton({
  taskId,
  title,
  description = "",
  budget,
  variant = "icon",
  size = "sm",
  className,
}: ShareTaskButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const url = `${BASE_URL}/tasks/${taskId}`;
  const shareText = `Check out this task on JobPool: ${title}${budget ? ` – ₹${budget}` : ""}\n${url}`;
  const whatsappText = encodeURIComponent(shareText);
  const emailSubject = encodeURIComponent(`JobPool Task: ${title}`);
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
          title: `JobPool: ${title}`,
          text: shareText,
          url,
        });
        toast.success("Shared!");
        setOpen(false);
      } catch (e) {
        if ((e as Error)?.name !== "AbortError") {
          toast.error("Share cancelled");
        }
      }
      return true;
    }
    return false;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${whatsappText}`, "_blank", "noopener,noreferrer");
    toast.success("Opening WhatsApp...");
    setOpen(false);
  };

  const handleEmail = () => {
    window.location.href = `mailto:?subject=${emailSubject}&body=${emailBody}`;
    setOpen(false);
  };

  const handleClick = async () => {
    const usedNative = await handleNativeShare();
    if (!usedNative) setOpen((o) => !o);
  };

  const TriggerButton = (
    <Button
      variant={variant === "ghost" ? "ghost" : variant === "button" ? "outline" : "ghost"}
      size={size}
      onClick={handleClick}
      className={cn(
        "shrink-0 transition-all duration-200",
        variant === "icon" && "h-9 w-9 p-0 rounded-full hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-800",
        variant === "button" && "rounded-lg border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50",
        className
      )}
      aria-label="Share task"
    >
      <Share2 className="h-4 w-4" />
      {variant === "button" && <span className="ml-2">Share</span>}
    </Button>
  );

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {TriggerButton}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 min-w-[220px] rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden backdrop-blur-sm"
          role="menu"
        >
          <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 px-3 pt-3 pb-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Share task
            </p>
          </div>
          <div className="py-1">
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/80 dark:hover:bg-blue-950/30 transition-colors text-left rounded-lg mx-1 my-0.5"
            >
              {copied ? (
                <Check className="h-5 w-5 text-emerald-500 shrink-0" />
              ) : (
                <Link2 className="h-5 w-5 text-slate-400 shrink-0" />
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{copied ? "Copied!" : "Copy link"}</span>
            </button>
            <button
              onClick={handleWhatsApp}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#25D366]/10 dark:hover:bg-[#25D366]/20 transition-colors text-left rounded-lg mx-1 my-0.5"
            >
              <MessageCircle className="h-5 w-5 text-[#25D366] shrink-0" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">WhatsApp</span>
            </button>
            <button
              onClick={handleEmail}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/80 dark:hover:bg-blue-950/30 transition-colors text-left rounded-lg mx-1 my-0.5"
            >
              <Mail className="h-5 w-5 text-blue-500 shrink-0" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
