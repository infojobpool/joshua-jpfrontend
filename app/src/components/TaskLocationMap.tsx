"use client";

/**
 * Renders a map for a task location with a clear pin.
 * Uses OpenStreetMap (free, no API key).
 * Does NOT auto-open external links – user taps buttons to open.
 */
interface TaskLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  location?: string;
  className?: string;
  height?: number;
  /** "detail" = premium section with address, helper text, buttons; "card" = compact for task cards */
  variant?: "card" | "detail";
}

export function TaskLocationMap({
  latitude,
  longitude,
  location,
  className = "",
  height,
  variant = "card",
}: TaskLocationMapProps) {
  if (
    latitude == null ||
    longitude == null ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    return null;
  }

  // Tighter bbox = more zoomed in, marker more prominent
  const padding = variant === "detail" ? 0.004 : 0.008;
  const bbox = [
    longitude - padding,
    latitude - padding,
    longitude + padding,
    latitude + padding,
  ].join(",");

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const openInMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  const displayHeight = height ?? (variant === "detail" ? 220 : 120);

  const mapBlock = (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 shadow-sm ${className}`}
    >
      <iframe
        src={embedUrl}
        width="100%"
        height={displayHeight}
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Task location map"
        className="pointer-events-none block"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );

  const openButton = (
    <a
      href={openInMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline-offset-2 hover:underline"
    >
      <span>📍</span>
      Open in Google Maps
    </a>
  );

  if (variant === "detail") {
    return (
      <div className="rounded-2xl border border-blue-100 dark:border-slate-600 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-slate-800 dark:to-slate-800/80 p-4 shadow-md">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
              <span className="text-base">📍</span>
              Exact task location
            </h4>
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
              This is where you&apos;ll need to go
            </p>
          </div>
        </div>
        {location && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-700/50 border border-blue-100/50 dark:border-slate-600">
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
              {location}
            </p>
          </div>
        )}
        {mapBlock}
        <div className="flex flex-wrap gap-2 mt-3">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Get directions
          </a>
          <a
            href={openInMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-slate-700 border border-blue-200 dark:border-slate-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors"
          >
            <span>📍</span>
            View on map
          </a>
        </div>
      </div>
    );
  }

  // Card variant: compact
  return (
    <div className="space-y-1.5">
      {mapBlock}
      {openButton}
    </div>
  );
}
