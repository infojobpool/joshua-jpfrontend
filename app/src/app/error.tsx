"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to monitoring service in production (e.g. Sentry)
    if (process.env.NODE_ENV === "production") {
      console.error("App error:", error.message);
    }
  }, [error]);

  // Detect address/map-related errors to show clearer guidance
  const msg = (error?.message || "").toLowerCase();
  const stack = (error?.stack || "").toLowerCase();
  const isAddressOrMapError =
    msg.includes("leaflet") || msg.includes("geocod") || msg.includes("nominatim") ||
    msg.includes("L is not") || msg.includes("L.map") || msg.includes("tile.openstreetmap") ||
    stack.includes("leaflet") || stack.includes("TaskLocationMap");

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 bg-slate-50">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {isAddressOrMapError ? "Map preview had an issue" : "Something went wrong"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isAddressOrMapError
              ? "There was a problem showing the map. Your address is still saved. Please use a complete address (street, area, city) and try posting your task again. You can also tap Try again to reload."
              : "We encountered an unexpected error. Please try again."}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href={isAddressOrMapError ? "/post-task" : "/"}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
          >
            {isAddressOrMapError ? "Back to post task" : "Go home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
