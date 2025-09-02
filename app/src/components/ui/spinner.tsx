"use client";

import type React from "react";
import { Loader2 } from "lucide-react";

type SpinnerSize = "sm" | "md" | "lg";

interface SpinnerProps {
  label?: string;
  className?: string;
  size?: SpinnerSize;
}

export const Spinner: React.FC<SpinnerProps> = ({
  label = "Loading...",
  className = "",
  size = "md",
}) => {
  const sizeClasses =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-14 w-14" : "h-10 w-10";

  return (
    <div className={`flex h-screen items-center justify-center ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div
            className={`rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin ${sizeClasses}`}
          />
          <Loader2
            className={`absolute inset-0 m-auto text-blue-600 opacity-80 ${size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-6 w-6" : "h-5 w-5"}`}
          />
        </div>
        {label && (
          <span className="text-sm text-muted-foreground animate-pulse">{label}</span>
        )}
      </div>
    </div>
  );
};

export default Spinner;


