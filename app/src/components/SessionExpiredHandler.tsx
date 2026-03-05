"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import useStore from "@/lib/Zustand";

/**
 * Listens for 'session-expired' event dispatched when token refresh fails.
 * Clears auth state and redirects to signin with a toast.
 */
export function SessionExpiredHandler() {
  const router = useRouter();
  const { logout } = useStore();

  useEffect(() => {
    const handle = () => {
      logout();
      toast.info("Session expired. Please sign in again.");
      router.push("/signin");
    };
    window.addEventListener("session-expired", handle);
    return () => window.removeEventListener("session-expired", handle);
  }, [logout, router]);

  return null;
}
