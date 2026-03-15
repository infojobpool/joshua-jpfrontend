"use client";

import { useEffect, useRef, useState } from "react";
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

  if (effectiveLat == null || effectiveLng == null || isNaN(effectiveLat) || isNaN(effectiveLng)) {
    if (geocodeLoading && location?.trim().length >= 4) {
      return (
        <div className={`rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 flex items-center justify-center ${className}`} style={{ height: height ?? 120, minHeight: height ?? 120 }}>
          <span className="text-sm text-gray-500">Loading map…</span>
        </div>
      );
    }
    return null;
  }

  const displayHeight = height ?? (variant === "detail" ? 220 : 120);
  const openInMapsUrl = `https://www.google.com/maps?q=${effectiveLat},${effectiveLng}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${effectiveLat},${effectiveLng}`;

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    setMapError(false);

    const initMap = async () => {
      try {
        const L = (await import("leaflet")).default;

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

        const map = L.map(mapRef.current, {
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

        // Ensure map tiles render after container is measured
        map.invalidateSize();

        mapInstanceRef.current = map;
      } catch (err) {
        console.warn("Map failed to load:", err);
        setMapError(true);
      }
    };

    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [effectiveLat, effectiveLng]);

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
          <div className="mb-3 px-3 py-2 rounded-lg bg-white/80 dark:bg-slate-700/50 border border-blue-100/50 dark:border-slate-600 flex items-center justify-between gap-2">
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed flex-1 min-w-0">
              {location}
            </p>
            <button
              type="button"
              onClick={copyAddress}
              className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy address"}
            </button>
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
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
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
