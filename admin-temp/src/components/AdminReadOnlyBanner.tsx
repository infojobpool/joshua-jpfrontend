"use client";

import { Eye } from "lucide-react";
import { useCanAdminWrite } from "@/lib/adminAuth";
import useStore from "@/lib/Zustand";

export function AdminReadOnlyBanner() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const canWrite = useCanAdminWrite();

  if (!isAuthenticated || canWrite) return null;

  return (
    <div
      className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-950"
      role="status"
    >
      <Eye className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <span>
        <span className="font-medium">Read-only access.</span> Your role can browse admin data; create, edit,
        delete, and bulk actions are hidden. Contact a superadmin if you need full access.
      </span>
    </div>
  );
}
