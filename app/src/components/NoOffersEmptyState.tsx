"use client";

interface NoOffersEmptyStateProps {
  /** poster = task owner waiting for offers; tasker = can make first offer; processing = offer submitted */
  variant: "poster" | "tasker" | "processing";
}

export function NoOffersEmptyState({ variant }: NoOffersEmptyStateProps) {
  const isPoster = variant === "poster";
  const isProcessing = variant === "processing";

  const config = isProcessing
    ? {
        title: "Your offer is being processed",
        subtext: "The task owner will review your offer soon. You'll be notified when they respond.",
        showMagnifyingGlass: false,
      }
    : isPoster
    ? {
        title: "No offers yet",
        subtext: "Taskers are reviewing your task. Share it to get more offers!",
        showMagnifyingGlass: true,
      }
    : {
        title: "No offers submitted yet",
        subtext: "Make the first offer and get ahead of the competition!",
        showMagnifyingGlass: true,
      };

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {config.showMagnifyingGlass ? (
        <div className="relative w-40 h-32 mb-6 flex items-center justify-center">
          <svg
            viewBox="0 0 160 128"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            {/* Profile cards stack */}
            <g transform="translate(20, 40)">
              <rect x="0" y="8" width="80" height="56" rx="8" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1.5" />
              <rect x="4" y="4" width="80" height="56" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
              <rect x="8" y="0" width="80" height="56" rx="8" fill="white" stroke="#e2e8f0" strokeWidth="1.5" />
              <circle cx="28" cy="22" r="12" fill="#2563eb" opacity="0.9" />
              <circle cx="28" cy="22" r="8" fill="#3b82f6" />
              {/* Stars row */}
              {[0, 1, 2, 3, 4].map((i) => (
                <path
                  key={i}
                  d="M2 0L2.4 1.5L4 1.6L2.8 2.8L3.2 4.4L2 3.5L.8 4.4L1.2 2.8L0 1.6L1.6 1.5L2 0z"
                  transform={`translate(${48 + i * 6}, 14)`}
                  fill="#2563eb"
                />
              ))}
            </g>
            {/* Magnifying glass */}
            <g transform="translate(70, 0)">
              <circle cx="40" cy="40" r="28" fill="none" stroke="#2563eb" strokeWidth="4" />
              <circle cx="40" cy="40" r="22" fill="none" stroke="#3b82f6" strokeWidth="2" opacity="0.6" />
              <rect x="56" y="56" width="12" height="36" rx="4" transform="rotate(45 62 74)" fill="#2563eb" />
            </g>
          </svg>
        </div>
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mb-6">
          <svg viewBox="0 0 24 24" className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">
        {config.title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[280px]">
        {config.subtext}
      </p>
    </div>
  );
}
