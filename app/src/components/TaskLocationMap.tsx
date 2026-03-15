"use client";

import { useEffect, useRef } from "react";
import type { Map } from "leaflet";
import "leaflet/dist/leaflet.css";
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

  if (
    latitude == null ||
    longitude == null ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    return null;
  }

  const displayHeight = height ?? (variant === "detail" ? 220 : 120);
  const openInMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

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
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      L.marker([latitude, longitude]).addTo(map);

      // Add zoom control in a corner
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Ensure map tiles render after container is measured
      map.invalidateSize();

      mapInstanceRef.current = map;
    };

    initMap();
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude]);

  const mapBlock = (
    <div
      ref={mapRef}
      className={`overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 shadow-sm ${className}`}
      style={{ height: displayHeight, minHeight: displayHeight }}
    />
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
  return (
    <div className="space-y-1.5">
      {mapBlock}
      {openButton}
    </div>
  );
}
