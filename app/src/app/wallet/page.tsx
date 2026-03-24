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
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawDialogUpi, setWithdrawDialogUpi] = useState("");
  const [upiEditing, setUpiEditing] = useState(false);
  const [upiInline, setUpiInline] = useState("");

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

  const saveUpiId = async (vpa: string, successToast = "UPI ID saved") => {
    const trimmed = vpa.trim();
    if (!trimmed) {
      toast.error("Please enter a valid UPI ID");
      return false;
    }
    if (!userId) return false;
    try {
      setAddUpiLoading(true);
      const res = await axiosInstance.post(
        `/wallet/add-upi?user_id=${userId}&upi_vpa=${encodeURIComponent(trimmed)}`
      );
      toast.success(successToast);
      const addedUpi = (res.data?.data ?? res.data)?.upi_vpa ?? trimmed;
      await fetchWallet(addedUpi);
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to update UPI";
      toast.error(msg);
      return false;
    } finally {
      setAddUpiLoading(false);
    }
  };

  const handleAddUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await saveUpiId(upiInput, "UPI ID added successfully");
    if (ok) setUpiInput("");
  };

  const handleWithdrawForm = (e: React.FormEvent) => {
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
    if (!wallet.upi_vpa?.trim()) {
      toast.error("Please add a UPI ID first");
      return;
    }
    if (!userId) return;
    setWithdrawDialogUpi(wallet.upi_vpa.trim());
    setWithdrawDialogOpen(true);
  };

  const executeWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0 || !wallet || amount > wallet.balance || !userId) return;
    const vpa = withdrawDialogUpi.trim();
    if (!vpa) {
      toast.error("Enter a UPI ID to receive the withdrawal");
      return;
    }
    try {
      setWithdrawLoading(true);
      if (vpa !== (wallet.upi_vpa || "").trim()) {
        await axiosInstance.post(
          `/wallet/add-upi?user_id=${userId}&upi_vpa=${encodeURIComponent(vpa)}`
        );
      }
      await axiosInstance.post(`/wallet/withdraw?user_id=${userId}&amount=${amount}`);
      toast.success("Withdrawal request submitted");
      setWithdrawDialogOpen(false);
      setWithdrawAmount("");
      fetchWallet();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to withdraw";
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
                  <div className="flex items-start justify-between gap-2">
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
                    {!upiEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 rounded-lg gap-1.5 text-xs"
                        onClick={() => {
                          setUpiInline(wallet.upi_vpa || "");
                          setUpiEditing(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Change UPI
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {upiEditing ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="upi-inline">UPI ID</Label>
                        <Input
                          id="upi-inline"
                          type="text"
                          placeholder="user@paytm"
                          value={upiInline}
                          onChange={(e) => setUpiInline(e.target.value)}
                          className="rounded-xl mt-1 font-mono"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          className="rounded-xl bg-emerald-600 hover:bg-emerald-700"
                          disabled={addUpiLoading || !upiInline.trim()}
                          onClick={async () => {
                            const ok = await saveUpiId(upiInline, "UPI ID updated");
                            if (ok) setUpiEditing(false);
                          }}
                        >
                          {addUpiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => {
                            setUpiEditing(false);
                            setUpiInline("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
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
                    </>
                  )}
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
                <form onSubmit={handleWithdrawForm} className="space-y-4">
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
                    disabled={
                      withdrawLoading ||
                      !wallet.upi_vpa ||
                      parseFloat(withdrawAmount || "0") <= 0 ||
                      parseFloat(withdrawAmount || "0") > wallet.balance
                    }
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700"
                  >
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

        <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
          <DialogContent className="sm:max-w-md" showCloseButton={!withdrawLoading}>
            <DialogHeader>
              <DialogTitle>Confirm withdrawal?</DialogTitle>
              <DialogDescription className="sr-only">
                Confirm the withdrawal amount, review the 24 hour credit notice, and edit UPI if needed.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-left text-muted-foreground text-sm">
              <p>
                Are you sure you want to withdraw{" "}
                <span className="font-semibold text-foreground">
                  ₹
                  {parseFloat(withdrawAmount || "0").toLocaleString("en-IN", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </span>
                ?
              </p>
              <p className="rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                Your amount will typically be credited to your linked UPI / bank account within{" "}
                <strong className="text-foreground">24 hours</strong> after approval.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-dialog-upi">UPI ID (you can edit before confirming)</Label>
              <Input
                id="withdraw-dialog-upi"
                type="text"
                className="font-mono"
                placeholder="user@paytm"
                value={withdrawDialogUpi}
                onChange={(e) => setWithdrawDialogUpi(e.target.value)}
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setWithdrawDialogOpen(false)}
                disabled={withdrawLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => void executeWithdraw()}
                disabled={withdrawLoading || !withdrawDialogUpi.trim()}
              >
                {withdrawLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Submitting…
                  </>
                ) : (
                  "Yes, withdraw"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
