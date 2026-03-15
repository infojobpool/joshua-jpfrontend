"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BrowseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") {
      console.error("Browse error:", error?.message);
    }
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 gap-6">
      <p className="text-muted-foreground text-center max-w-sm">
        We couldn&apos;t load the tasks. This sometimes happens on mobile or with slow connections.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={reset} variant="default" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline">Go home</Button>
        </Link>
      </div>
    </div>
  );
}
