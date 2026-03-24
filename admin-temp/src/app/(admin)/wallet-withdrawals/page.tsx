"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, Check, X, IndianRupee, User, LogIn } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { getApiErrorMessage } from "@/lib/apiError";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

interface Withdrawal {
  id?: string;
  transaction_id?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  amount: number;
  upi_vpa?: string;
  status: string;
  created_at: string;
}

export default function WalletWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  /** null = ok or not loaded; 'auth' = 401 / invalid token; 'other' = other error */
  const [loadError, setLoadError] = useState<null | "auth" | "other">(null);

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await axiosInstance.get("/admin/wallet/withdrawals");
      const wrapped = response.data?.data ?? response.data;
      const list = Array.isArray(wrapped?.withdrawals)
        ? wrapped.withdrawals
        : Array.isArray(wrapped)
          ? wrapped
          : Array.isArray(response.data?.withdrawals)
            ? response.data.withdrawals
            : [];
      setWithdrawals(list);
    } catch (err: any) {
      console.error("Withdrawals fetch error:", err);
      const status = err.response?.status;
      const detail = getApiErrorMessage(err).toLowerCase();
      const isAuth =
        status === 401 ||
        status === 403 ||
        detail.includes("invalid") ||
        detail.includes("expired") ||
        detail.includes("unauthorized") ||
        detail.includes("not enough permissions") ||
        detail.includes("forbidden");
      setLoadError(isAuth ? "auth" : "other");
      const msg = isAuth
        ? status === 403
          ? "Admin access required. Sign in via the admin portal (admin-login), not the regular user login."
          : "Admin session expired or invalid. Log in again."
        : getApiErrorMessage(err) || "Failed to load withdrawals";
      toast.error(msg);
      setWithdrawals([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const getTxId = (w: Withdrawal) => w.transaction_id ?? w.id ?? "";

  const updateStatus = async (w: Withdrawal, status: "completed" | "failed") => {
    const id = getTxId(w);
    if (!id) return;
    try {
      setActionLoading(id);
      await axiosInstance.patch(`/admin/wallet-transaction/${id}`, { status });
      toast.success(`Withdrawal marked as ${status}`);
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(getApiErrorMessage(err) || "Failed to update status");
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
    <div className="space-y-6">
      <Toaster />
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="h-7 w-7 text-emerald-600" />
          Wallet Withdrawals
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and process pending UPI withdrawal requests
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <span className="ml-2 text-muted-foreground">Loading withdrawals...</span>
        </div>
      ) : loadError === "auth" ? (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900/50">
          <CardContent className="pt-6">
            <div className="text-center py-10 px-4 max-w-md mx-auto space-y-4">
              <LogIn className="h-12 w-12 mx-auto text-amber-600 dark:text-amber-500" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">Admin sign-in required</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Use the <strong>admin</strong> login page (same JWT as <code className="text-xs bg-muted px-1 rounded">POST /admin-login/</code>), not the regular app login.
                  If your token expired and refresh did not return a new token, sign in again.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild className="bg-[#2563eb] hover:bg-[#1d4ed8]">
                  <Link href="/">Go to admin login</Link>
                </Button>
                <Button variant="outline" onClick={() => fetchWithdrawals()}>
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : loadError === "other" ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">Could not load withdrawals.</p>
              <Button onClick={() => fetchWithdrawals()}>Try again</Button>
            </div>
          </CardContent>
        </Card>
      ) : pendingWithdrawals.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pending withdrawals</h3>
              <p className="text-muted-foreground">
                All withdrawal requests have been processed.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingWithdrawals.map((w) => (
            <Card key={getTxId(w) || w.created_at}>
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
                        <span className="font-medium text-foreground">UPI: {w.upi_vpa}</span>
                      )}
                      <span>{formatDate(w.created_at)}</span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      disabled={actionLoading === getTxId(w)}
                      onClick={() => updateStatus(w, "completed")}
                    >
                      {actionLoading === getTxId(w) ? (
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
                      disabled={actionLoading === getTxId(w)}
                      onClick={() => updateStatus(w, "failed")}
                    >
                      {actionLoading === getTxId(w) ? (
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
  );
}
