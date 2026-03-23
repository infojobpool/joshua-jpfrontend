"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, Wallet, Check, X, IndianRupee, User } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { toast } from "sonner";

interface Withdrawal {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  amount: number;
  upi_vpa?: string;
  status: string;
  created_at: string;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/admin/wallet/withdrawals");
      const data = response.data?.data ?? response.data;
      setWithdrawals(Array.isArray(data) ? data : data?.withdrawals ?? []);
    } catch (err: any) {
      console.error("Withdrawals fetch error:", err);
      const msg = err.response?.data?.message ?? "Failed to load withdrawals";
      toast.error(msg);
      setWithdrawals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const updateStatus = async (id: string, status: "completed" | "failed") => {
    try {
      setActionLoading(id);
      await axiosInstance.patch(`/admin/wallet-transaction/${id}`, { status });
      toast.success(`Withdrawal marked as ${status}`);
      fetchWithdrawals();
    } catch (err: any) {
      const msg = err.response?.data?.message ?? `Failed to update status`;
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const pendingWithdrawals = withdrawals.filter(
    (w) => (w.status || "").toLowerCase() === "pending"
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin/support-tickets"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Wallet className="h-8 w-8 text-emerald-600" />
            Withdrawal Requests
          </h1>
          <p className="text-gray-600">
            Review and process pending wallet withdrawals
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="ml-2 text-gray-500">Loading withdrawals...</span>
          </div>
        ) : pendingWithdrawals.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pending withdrawals</h3>
                <p className="text-gray-500">
                  All withdrawal requests have been processed.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pendingWithdrawals.map((w) => (
              <Card key={w.id}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <IndianRupee className="h-5 w-5 text-emerald-600" />
                          ₹{w.amount.toLocaleString("en-IN")}
                        </CardTitle>
                        <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                          Pending
                        </Badge>
                      </div>
                      <CardDescription className="flex flex-wrap gap-4 mt-2">
                        {(w.user_name || w.user_id) && (
                          <span className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {w.user_name || w.user_id}
                          </span>
                        )}
                        {w.user_email && (
                          <span>{w.user_email}</span>
                        )}
                        {w.upi_vpa && (
                          <span className="font-medium text-slate-700">UPI: {w.upi_vpa}</span>
                        )}
                        <span>{formatDate(w.created_at)}</span>
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        disabled={actionLoading === w.id}
                        onClick={() => updateStatus(w.id, "completed")}
                      >
                        {actionLoading === w.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-1" />
                            Completed
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={actionLoading === w.id}
                        onClick={() => updateStatus(w.id, "failed")}
                      >
                        {actionLoading === w.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Failed
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
