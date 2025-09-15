"use client";

import React from "react";
import { useIsMobile } from "./MobileWrapper";

interface MobileLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileLayout({ children, className = "" }: MobileLayoutProps) {
  const { isMobile } = useIsMobile();

  return (
    <div className={`${isMobile ? 'mobile-content' : ''} ${className}`}>
      {children}
    </div>
  );
}

// Mobile-specific page wrapper
export function MobilePageWrapper({ 
  children, 
  title, 
  showBackButton = false,
  onBackClick 
}: {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
}) {
  const { isMobile } = useIsMobile();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      {title && (
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="px-4 py-3">
            <div className="flex items-center">
              {showBackButton && (
                <button
                  onClick={onBackClick}
                  className="mr-3 p-2 -ml-2 rounded-full hover:bg-gray-100"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            </div>
          </div>
        </div>
      )}
      
      {/* Mobile Content */}
      <div className="px-4 py-4">
        {children}
      </div>
    </div>
  );
}
