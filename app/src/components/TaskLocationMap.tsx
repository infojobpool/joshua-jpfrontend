"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import type { Map } from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Renders a map for a task location with a clear pin.
 * Uses Leaflet + OpenStreetMap tiles (no iframe – works in all browsers/apps).
 * Does NOT auto-open external links – user taps buttons to open.
 */
interface TaskLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  location?: string;
  className?: string;
  height?: number;
  /** "detail" = premium section with address, helper text, buttons; "card" = compact for task cards; "embedded" = map + actions only (no title/address block) */
  variant?: "card" | "detail" | "embedded";
  /** When false with variant detail, hides the address row (use when parent shows address). */
  showAddressBar?: boolean;
}

export function TaskLocationMap({
  latitude,
  longitude,
  location,
  className = "",
  height,
  variant = "card",
  showAddressBar = true,
}: TaskLocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<Map | null>(null);
  const [copied, setCopied] = useState(false);
  const [geocoded, setGeocoded] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);
  const [mapError, setMapError] = useState(false);

  const copyAddress = () => {
    if (location && typeof navigator?.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(location).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  // Geocode fallback: when backend has no lat/lng, try to geocode the address string
  useEffect(() => {
    const hasCoords = latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude);
    if (hasCoords || !location || location.trim().length < 4) {
      setGeocoded(null);
      return;
    }
    let cancelled = false;
    setGeocodeLoading(true);
    setGeocoded(null);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location.trim())}&limit=1`;
    fetch(url, {
      headers: { "User-Agent": "jobpool/1.0 (+https://jobpool.in)" },
    })
      .then((res) => res.json())
      .then((data: Array<{ lat: string; lon: string }>) => {
        if (cancelled || !data?.[0]) return;
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (!isNaN(lat) && !isNaN(lng)) setGeocoded({ lat, lng });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setGeocodeLoading(false);
      });
    return () => { cancelled = true; };
  }, [latitude, longitude, location]);

  const effectiveLat = latitude != null && !isNaN(latitude) ? latitude : geocoded?.lat ?? null;
  const effectiveLng = longitude != null && !isNaN(longitude) ? longitude : geocoded?.lng ?? null;

  const hasValidCoords =
    effectiveLat != null &&
    effectiveLng != null &&
    !isNaN(effectiveLat) &&
    !isNaN(effectiveLng);

  // Map init effect - MUST run before any return (Rules of Hooks)
  useEffect(() => {
    if (!hasValidCoords || typeof window === "undefined") return;
    setMapError(false);

    const el = mapRef.current;
    if (!el) return; // Div not mounted yet (we return early from render when no coords)

    let cancelled = false;
    let resizeTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleInvalidate = (map: import("leaflet").Map) => {
      map.invalidateSize();
      requestAnimationFrame(() => {
        if (cancelled) return;
        map.invalidateSize();
        requestAnimationFrame(() => {
          if (cancelled) return;
          map.invalidateSize();
        });
      });
      resizeTimer = window.setTimeout(() => {
        if (cancelled) return;
        map.invalidateSize();
      }, 320);
    };

    const initMap = async () => {
      if (!mapRef.current) return; // Re-check after async import
      try {
        const L = (await import("leaflet")).default;
        if (!L?.Icon?.Default?.prototype) return;

        // Fix default marker icon path (Leaflet issue with bundlers)
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const container = mapRef.current;
        if (!container) return;

        const map = L.map(container, {
          center: [effectiveLat, effectiveLng],
          zoom: 15,
          zoomControl: false,
          scrollWheelZoom: false,
          dragging: false,
          doubleClickZoom: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        L.marker([effectiveLat, effectiveLng]).addTo(map);

        // Add zoom control in a corner
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // Tiles/layout after expand or async mount (esp. mobile accordions)
        scheduleInvalidate(map);

        if (cancelled) {
          map.remove();
          return;
        }
        mapInstanceRef.current = map;
      } catch (err) {
        console.warn("Map failed to load:", err);
        setMapError(true);
      }
    };

    initMap();
    return () => {
      cancelled = true;
      if (resizeTimer !== undefined) window.clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [effectiveLat, effectiveLng, hasValidCoords]);

  // Early returns for rendering - after all hooks
  if (!hasValidCoords) {
    if (geocodeLoading && location?.trim().length >= 4) {
      return (
        <div className={`rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${className}`} style={{ height: height ?? 120, minHeight: height ?? 120 }}>
          <span className="text-sm text-gray-500">Loading map…</span>
        </div>
      );
    }
    return null;
  }

  const displayHeight = height ?? (variant === "detail" || variant === "embedded" ? 240 : 120);
  const openInMapsUrl = `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${effectiveLat},${effectiveLng}`;

  // When map fails to load, show a helpful message instead of crashing
  if (mapError) {
    return (
      <div
        className={`rounded-xl border border-amber-200/80 dark:border-amber-700/60 bg-amber-50/80 dark:bg-amber-900/20 p-4 ${className}`}
        style={{ minHeight: height ?? 120 }}
      >
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
          Map preview unavailable
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
          Your address is saved. Use a full address (street, area, city) so taskers can find the location. You can still post your task.
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location || "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          <span>📍</span> Open in Google Maps
        </a>
      </div>
    );
  }

  const mapBlock = (
    <div
      ref={mapRef}
      className={`overflow-hidden rounded-xl border border-slate-200/60 dark:border-slate-600/60 bg-slate-100 dark:bg-slate-800/80 shadow-inner ${className}`}
      style={{ height: displayHeight, minHeight: displayHeight }}
    />
  );

  const openButton = (
    <a
      href={openInMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-50/80 dark:bg-slate-700/60 hover:bg-blue-100/80 dark:hover:bg-slate-600/60 border border-blue-200/50 dark:border-slate-600/60 transition-colors"
    >
      <span className="text-base">📍</span>
      <span>Open in Google Maps</span>
    </a>
  );

  const detailActions = (
    <div className="flex flex-wrap gap-2 mt-3">
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
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
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-slate-700 border border-emerald-200 dark:border-slate-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-600 transition-colors"
      >
        <span>📍</span>
        View on map
      </a>
    </div>
  );

  if (variant === "embedded") {
    return (
      <div className={`${className}`}>
        {mapBlock}
        {detailActions}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="rounded-2xl border border-emerald-100/80 dark:border-slate-600 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50/80 dark:from-slate-800 dark:to-slate-800/80 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-emerald-600" aria-hidden />
              Exact task location
            </h4>
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-0.5">
              This is where you&apos;ll need to go
            </p>
          </div>
        </div>
        {showAddressBar && location && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-white/90 dark:bg-slate-700/50 border border-emerald-100/60 dark:border-slate-600 flex items-center justify-between gap-2">
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed flex-1 min-w-0">
              {location}
            </p>
            <button
              type="button"
              onClick={copyAddress}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy address"}
            </button>
          </div>
        )}
        {mapBlock}
        {detailActions}
      </div>
    );
  }

  // Card variant: compact
  const mapOrFallback = mapError ? (
    <div
      className={`rounded-xl border border-amber-200/80 dark:border-amber-700/50 bg-amber-50/80 dark:bg-slate-800/80 flex flex-col items-center justify-center gap-2 py-4 px-3 ${className}`}
      style={{ minHeight: displayHeight }}
    >
      <p className="text-sm text-amber-800 dark:text-amber-200 text-center font-medium">
        Map preview unavailable
      </p>
      <p className="text-xs text-amber-700/90 dark:text-amber-300/90 text-center max-w-[240px]">
        Your address is saved. Use a full address (street, area, city) so taskers can find the location.
      </p>
    </div>
  ) : (
    mapBlock
  );

  return (
    <div className="space-y-1.5">
      {mapOrFallback}
      {openButton}
    </div>
  );
}

type ExpandableTaskLocationSectionProps = {
  latitude: number;
  longitude: number;
  location?: string;
  className?: string;
};

/** Collapsed by default; expands to show the interactive map (better for mobile). */
export function ExpandableTaskLocationSection({
  latitude,
  longitude,
  location = "",
  className = "",
}: ExpandableTaskLocationSectionProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (location && typeof navigator?.clipboard?.writeText === "function") {
      navigator.clipboard.writeText(location).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 shadow-sm overflow-hidden ${className}`}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50/90 active:bg-slate-100/80"
        aria-expanded={open}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <MapPin className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800/90">Task location</p>
          <p className="text-sm font-medium text-slate-900 mt-0.5 line-clamp-2">
            {location?.trim() || "Open for map & directions"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {open ? "Tap to hide map" : "Tap to expand map & get directions"}
          </p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 mt-1 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <div className="border-t border-slate-200/60 bg-white px-3 pb-4 pt-3 space-y-3">
          {location?.trim() ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/90 px-3 py-2.5">
              <p className="text-sm text-slate-700 leading-snug flex-1 min-w-0">{location}</p>
              <button
                type="button"
                onClick={copyAddress}
                className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200/80 hover:bg-emerald-50 transition-colors"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          ) : null}
          <TaskLocationMap
            latitude={latitude}
            longitude={longitude}
            location={location}
            height={260}
            variant="embedded"
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
