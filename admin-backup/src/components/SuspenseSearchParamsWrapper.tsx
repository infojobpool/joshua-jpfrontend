
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface SuspenseSearchParamsWrapperProps {
  onParamsFetch: (params: Record<string, string>) => void;
  children: React.ReactNode;
}

export default function SuspenseSearchParamsWrapper({
  onParamsFetch,
  children,
}: SuspenseSearchParamsWrapperProps) {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Log searchParams for debugging
    console.log("Search params:", searchParams?.toString() ?? "No params");

    // Get email from searchParams, default to empty string if null
    const email = searchParams?.get("email") ?? "";
    
    // Log raw and decoded email for debugging
    console.log("Raw email:", email);
    console.log("Decoded email:", email ? decodeURIComponent(email) : "");

    // Pass email to parent component
    onParamsFetch({
      email: email ? decodeURIComponent(email) : "",
    });
  }, [searchParams, onParamsFetch]);

  return <>{children}</>;
}