"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, FileText } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isWithdrawals = pathname?.includes("/admin/withdrawals");
  const isSupportTickets = pathname?.includes("/admin/support-tickets");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-6">
            <Link
              href="/admin/withdrawals"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isWithdrawals
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Wallet className="h-4 w-4" />
              Wallet Withdrawals
            </Link>
            <Link
              href="/admin/support-tickets"
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isSupportTickets
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <FileText className="h-4 w-4" />
              Support Tickets
            </Link>
          </div>
        </div>
      </nav>
      {children}
    </div>
  );
}
