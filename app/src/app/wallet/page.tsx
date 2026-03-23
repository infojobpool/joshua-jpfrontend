"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Wallet,
  ArrowLeft,
  IndianRupee,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Plus,
  Minus,
  Info,
  Eye,
  EyeOff,
} from "lucide-react";
import useStore from "@/lib/Zustand";
import axiosInstance from "@/lib/axiosInstance";
import Header from "@/components/Header";
import { toast } from "sonner";
import { resolveProfileImageUrl } from "@/lib/profileImage";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  reference?: string;
  created_at: string;
  status?: string;
}

interface WalletData {
  balance: number;
  currency: string;
  transactions: Transaction[];
  upi_vpa?: string;
}

export default function WalletPage() {
  const router = useRouter();
  const userId = useStore((s) => s.userId);
  const user = useStore((s) => s.user);
  const checkAuth = useStore((s) => s.checkAuth);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [upiInput, setUpiInput] = useState("");
  const [addUpiLoading, setAddUpiLoading] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [showUpi, setShowUpi] = useState(false);

  const maskUpi = (upi: string) => {
    if (!upi || upi.length < 5) return upi;
    const atIndex = upi.indexOf("@");
    if (atIndex <= 0) return upi.slice(0, 4) + "***";
    const local = upi.slice(0, atIndex);
    const domain = upi.slice(atIndex); // includes @
    const visible = local.length <= 4 ? local.slice(0, 2) : local.slice(0, 4);
    return visible + "***" + domain;
  };

  useEffect(() => {
    checkAuth();
    const t = setTimeout(() => setAuthReady(true), 150);
    return () => clearTimeout(t);
  }, [checkAuth]);

  const fetchWallet = async (preserveUpi?: string) => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/wallet?user_id=${userId}&limit=30`);
      const data = response.data?.data ?? response.data;
      const fromApi = data?.upi_vpa ?? data?.upi ?? data?.user?.upi_vpa ?? "";
      const upiVpa = (typeof fromApi === "string" && fromApi.trim()) ? fromApi.trim() : (preserveUpi ?? "");
      setWallet({
        balance: data.balance ?? 0,
        currency: data.currency ?? "INR",
        transactions: Array.isArray(data.transactions) ? data.transactions : [],
        upi_vpa: upiVpa,
      });
    } catch (err: any) {
      console.error("Wallet fetch error:", err);
      const msg = err.response?.data?.message ?? "Failed to load wallet";
      toast.error(msg);
      setWallet({
        balance: 0,
        currency: "INR",
        transactions: [],
        upi_vpa: "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authReady || !userId) return;
    fetchWallet();
  }, [authReady, userId]);

  useEffect(() => {
    if (!authReady) return;
    if (!userId) {
      router.push("/signin");
      return;
    }
  }, [authReady, userId, router]);

  const handleAddUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const vpa = upiInput.trim();
    if (!vpa) {
      toast.error("Please enter a valid UPI ID");
      return;
    }
    if (!userId) return;
    try {
      setAddUpiLoading(true);
      const res = await axiosInstance.post(`/wallet/add-upi?user_id=${userId}&upi_vpa=${encodeURIComponent(vpa)}`);
      toast.success("UPI ID added successfully");
      setUpiInput("");
      const addedUpi = (res.data?.data ?? res.data)?.upi_vpa ?? vpa;
      await fetchWallet(addedUpi);
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to add UPI";
      toast.error(msg);
    } finally {
      setAddUpiLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (!wallet || amount > wallet.balance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!wallet.upi_vpa) {
      toast.error("Please add UPI ID first");
      return;
    }
    if (!userId) return;
    try {
      setWithdrawLoading(true);
      await axiosInstance.post(`/wallet/withdraw?user_id=${userId}&amount=${amount}`);
      toast.success("Withdrawal request submitted");
      setWithdrawAmount("");
      fetchWallet();
    } catch (err: any) {
      const msg = err.response?.data?.message ?? "Failed to withdraw";
      toast.error(msg);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const formatAmount = (amount: number, type?: string) => {
    const prefix = type === "credit" || type === "deposit" ? "+" : type === "debit" || type === "withdraw" ? "-" : "";
    return `${prefix}₹${Math.abs(amount).toLocaleString("en-IN")}`;
  };

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 via-slate-100/30 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const headerUser = {
    name: user?.name ?? "User",
    avatar: resolveProfileImageUrl(user?.profile_image) ?? "/images/placeholder.svg",
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 via-slate-100/30 to-white">
      <Header user={headerUser} onSignOut={() => { useStore.getState().logout(); router.push("/"); }} />
      <main className="flex-1 container mx-auto max-w-2xl py-6 px-4 md:px-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-emerald-600 transition-colors mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Wallet className="h-7 w-7 text-emerald-600" />
          Wallet
        </h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <span className="text-slate-500">Loading wallet...</span>
          </div>
        ) : wallet ? (
          <div className="space-y-6">
            {/* Balance card */}
            <Card className="border-0 shadow-xl rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white overflow-hidden">
              <CardHeader>
                <CardDescription className="text-emerald-100/90">Available Balance</CardDescription>
                <CardTitle className="text-3xl font-bold flex items-center gap-2">
                  <IndianRupee className="h-8 w-8" />
                  {wallet.balance.toLocaleString("en-IN")}
                </CardTitle>
                <p className="text-sm text-emerald-100/80">{wallet.currency}</p>
              </CardHeader>
            </Card>

            {/* UPI ID display - shown when UPI is set */}
            {wallet.upi_vpa && wallet.upi_vpa.trim() && (
              <Card className="border-0 shadow-lg rounded-2xl bg-white ring-1 ring-slate-200/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                    Your UPI ID
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-help"
                      title={`Full UPI: ${wallet.upi_vpa}. Withdrawals are sent here.`}
                    >
                      <Info className="h-4 w-4 shrink-0" />
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-semibold text-slate-800 text-lg">
                      {showUpi ? wallet.upi_vpa : maskUpi(wallet.upi_vpa)}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowUpi(!showUpi)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-700 transition-colors"
                      title={showUpi ? "Hide UPI ID" : "Show full UPI ID"}
                      aria-label={showUpi ? "Hide" : "Show"}
                    >
                      {showUpi ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">Withdrawals will be sent to this UPI ID</p>
                </CardContent>
              </Card>
            )}

            {/* Add UPI form - shown when UPI is missing or empty */}
            {(!wallet.upi_vpa || !wallet.upi_vpa.trim()) && (
              <Card className="border-0 shadow-lg rounded-2xl bg-white ring-1 ring-slate-200/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-emerald-600" />
                    Add UPI ID
                  </CardTitle>
                  <CardDescription>
                    Add your UPI ID to receive withdrawals (e.g. user@paytm, user@phonepe)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddUpi} className="flex gap-3">
                    <div className="flex-1">
                      <Label htmlFor="upi" className="sr-only">UPI ID</Label>
                      <Input
                        id="upi"
                        type="text"
                        placeholder="user@paytm"
                        value={upiInput}
                        onChange={(e) => setUpiInput(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={addUpiLoading || !upiInput.trim()}
                      className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                    >
                      {addUpiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Withdraw form */}
            <Card className="border-0 shadow-lg rounded-2xl bg-white ring-1 ring-slate-200/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Minus className="h-5 w-5 text-emerald-600" />
                  Withdraw
                </CardTitle>
                <CardDescription>
                  Withdraw funds to your UPI. {wallet.upi_vpa ? `Current UPI: ${wallet.upi_vpa}` : "Add UPI first."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0"
                      min="1"
                      step="0.01"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="rounded-xl mt-1"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={withdrawLoading || !wallet.upi_vpa || parseFloat(withdrawAmount || "0") <= 0 || parseFloat(withdrawAmount || "0") > wallet.balance}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  >
                    {withdrawLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Withdraw
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Transactions list */}
            <Card className="border-0 shadow-lg rounded-2xl bg-white ring-1 ring-slate-200/50">
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
                <CardDescription>Recent wallet activity</CardDescription>
              </CardHeader>
              <CardContent>
                {wallet.transactions.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Wallet className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <p>No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {wallet.transactions.map((tx) => {
                      const isCredit = ["credit", "deposit"].includes((tx.type || "").toLowerCase());
                      return (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`rounded-full p-2 ${isCredit ? "bg-emerald-100" : "bg-amber-100"}`}>
                              {isCredit ? (
                                <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-amber-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800 capitalize">{tx.type || "Transaction"}</p>
                              <p className="text-xs text-slate-500">
                                {tx.reference || tx.id} • {formatDate(tx.created_at)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`font-semibold ${isCredit ? "text-emerald-700" : "text-slate-700"}`}
                          >
                            {formatAmount(tx.amount, tx.type)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </main>
    </div>
  );
}
