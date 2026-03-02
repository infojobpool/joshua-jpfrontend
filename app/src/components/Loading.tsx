"use client";

import React from "react";

interface LoadingProps {
  label?: string;
  fullScreen?: boolean;
}

export default function Loading({ label = "Loading...", fullScreen = false }: LoadingProps) {
  return (
    <div className={`${fullScreen ? "flex h-screen" : "flex h-full"} items-center justify-center bg-white`}> 
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border border-slate-200 border-t-blue-500 animate-spin" style={{ animationDuration: "0.85s" }} />
        </div>
        {label && (
          <p className="text-sm text-slate-500 font-medium">{label}</p>
        )}
      </div>
    </div>
  );
}


