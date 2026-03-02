"use client";

import { useCallback, useState } from "react";
import { useIsMobile } from "./mobile/MobileWrapper";

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function PullToRefresh({ children, onRefresh, disabled }: PullToRefreshProps) {
  const { isMobile } = useIsMobile();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);

  const maxPull = 80;
  const threshold = 60;

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || disabled || isRefreshing) return;
      if (typeof window !== "undefined" && window.scrollY === 0) {
        setStartY(e.touches[0].clientY);
      }
    },
    [isMobile, disabled, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isMobile || disabled || isRefreshing) return;
      if (window.scrollY > 0) return;
      const currentY = e.touches[0].clientY;
      const diff = Math.max(0, currentY - startY);
      setPullDistance(Math.min(diff * 0.5, maxPull));
    },
    [isMobile, disabled, isRefreshing, startY]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isMobile || disabled || isRefreshing) {
      setPullDistance(0);
      return;
    }
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(0);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
    setStartY(0);
  }, [isMobile, disabled, isRefreshing, pullDistance, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {isMobile && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center pointer-events-none transition-opacity z-10"
          style={{
            top: -48,
            height: 48,
            opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
          }}
        >
          {isRefreshing ? (
            <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-600 animate-spin" />
          ) : (
            <div
              className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-slate-600 transition-transform duration-150"
              style={{ transform: `rotate(${progress * 360}deg)` }}
            />
          )}
        </div>
      )}
      <div style={{ transform: isMobile ? `translateY(${Math.min(pullDistance, maxPull) * 0.3}px)` : undefined }}>
        {children}
      </div>
    </div>
  );
}
