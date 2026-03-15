"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearServiceWorkerCache, unregisterServiceWorkers } from "@/lib/cacheUtils";

export default function BrowseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.error("Browse error:", error?.message);
    }
  }, [error]);

  const handleClearCacheAndReload = async () => {
    setClearing(true);
    try {
      await clearServiceWorkerCache();
      await unregisterServiceWorkers();
      window.location.href = "/browse"; // Hard reload to get fresh code
    } catch {
      window.location.reload();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 gap-6">
      <p className="text-muted-foreground text-center max-w-sm">
        We couldn&apos;t load the tasks. This sometimes happens on mobile, with the PWA app, or with cached data.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={reset} variant="default" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button
          onClick={handleClearCacheAndReload}
          variant="outline"
          className="gap-2"
          disabled={clearing}
        >
          <Trash2 className="h-4 w-4" />
          {clearing ? "Clearing..." : "Clear cache & reload"}
        </Button>
        <Link href="/">
          <Button variant="ghost">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
