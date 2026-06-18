import type { Metadata } from "next";
import { privatePageMetadata } from "@/lib/seo/metadata";
import AdminShell from "./AdminShell";

export const metadata: Metadata = privatePageMetadata;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
