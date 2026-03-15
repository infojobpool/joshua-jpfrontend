"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Load Browse client-only to avoid mobile hydration crashes (useSearchParams, Radix, etc.)
const BrowseContentClient = dynamic(() => import("./BrowseContentClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  ),
})

export default function BrowsePage() {
  return <BrowseContentClient />
}
