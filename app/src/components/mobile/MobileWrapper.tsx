"use client";

import React, { useState, useEffect } from "react";

interface MobileWrapperProps {
  children: React.ReactNode;
  mobileComponent?: React.ReactNode;
  desktopComponent?: React.ReactNode;
  breakpoint?: number;
}

export function MobileWrapper({ 
  children, 
  mobileComponent, 
  desktopComponent, 
  breakpoint = 768 
}: MobileWrapperProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    setIsHydrated(true);

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  if (!isHydrated) {
    return <div className="animate-pulse bg-gray-200 rounded h-8 w-full"></div>;
  }

  if (isMobile && mobileComponent) {
    return <>{mobileComponent}</>;
  }

  if (!isMobile && desktopComponent) {
    return <>{desktopComponent}</>;
  }

  return <>{children}</>;
}

// Hook for mobile detection
export function useIsMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkMobile();
    setIsHydrated(true);

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return { isMobile, isHydrated };
}
