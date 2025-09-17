"use client";

import React from "react";

interface LoadingProps {
  label?: string;
  fullScreen?: boolean;
}

export default function Loading({ label = "Loading...", fullScreen = false }: LoadingProps) {
  return (
    <div className={`${fullScreen ? "flex h-screen" : "flex h-full"} items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100`}> 
      <div className="text-center">
        {/* Minimal premium spinner (desktop) */}
        <div className="hidden md:block relative w-14 h-14 mx-auto mb-5">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"></div>
        </div>

        {/* Subtle bouncing dots (mobile) */}
        <div className="md:hidden flex items-center justify-center space-x-2 mb-4">
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
        </div>

        <p className="text-sm md:text-base text-gray-700 font-medium animate-pulse">{label}</p>
      </div>
    </div>
  );
}


