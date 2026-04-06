"use client";

import useStore from "@/lib/Zustand";

/** Matches backend default `ADMIN_FULL_ACCESS_ROLE_IDS` (comma-separated). Build-time env. */
const DEFAULT_FULL_ACCESS_ROLE_IDS = ["role_1"];

export function getAdminFullAccessRoleIds(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_FULL_ACCESS_ROLE_IDS;
  if (typeof raw === "string" && raw.trim()) {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return DEFAULT_FULL_ACCESS_ROLE_IDS;
}

/** True if this admin JWT role may call writer-only APIs (e.g. superadmin). Viewers (role_2) → false. */
export function canAdminWrite(role: string | null | undefined): boolean {
  if (!role || typeof role !== "string") return false;
  return getAdminFullAccessRoleIds().includes(role);
}

export function useCanAdminWrite(): boolean {
  const role = useStore((s) => s.role);
  return canAdminWrite(role);
}
