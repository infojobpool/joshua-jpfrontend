"use client";

/**
 * Renders a small static map thumbnail for a task location.
 * Uses OpenStreetMap (free, no API key).
 * Only renders when latitude and longitude are available.
 */
interface TaskLocationMapProps {
  latitude?: number | null;
  longitude?: number | null;
  location?: string;
  className?: string;
  height?: number;
}

export function TaskLocationMap({
  latitude,
  longitude,
  location,
  className = "",
  height = 120,
}: TaskLocationMapProps) {
  if (
    latitude == null ||
    longitude == null ||
    isNaN(latitude) ||
    isNaN(longitude)
  ) {
    return null;
  }

  // OpenStreetMap embed: bbox is minLon,minLat,maxLon,maxLat
  const padding = 0.008; // ~1km
  const bbox = [
    longitude - padding,
    latitude - padding,
    longitude + padding,
    latitude + padding,
  ].join(",");

  const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  const openInMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <a
      href={openInMapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`block overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600 ${className}`}
      title={location ? `View ${location} on map` : "View on map"}
    >
      <iframe
        src={embedUrl}
        width="100%"
        height={height}
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Task location map"
        className="pointer-events-none"
      />
    </a>
  );
}
