"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axiosInstance";

interface Tasker {
  id: number;
  name: string;
  email: string;
}

interface Poster {
  id: number;
  name: string;
  email: string;
}

interface BankDetails {
  accountHolder?: string;
  accountNumber?: string;
  ifsc?: string;
  bankName?: string;
  branchName?: string;
  upiId?: string;
}

interface Payout {
  id: number;
  tasker: Tasker;
  poster: Poster;
  jobId?: number;
  taskTitle?: string;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  method: string;
  reference: string;
  date: string;
  completedDate: string | null;
  processingDate?: string | null;
  deadlineDate?: string | null;
  taskerBankInfo?: BankDetails | null;
  posterBankInfo?: BankDetails | null;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("processing");
  const [methodFilter, setMethodFilter] = useState("all");
  const [deadlineFilter, setDeadlineFilter] = useState("all");
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskerBank, setTaskerBank] = useState<BankDetails | null>(null);
  const [posterBank, setPosterBank] = useState<BankDetails | null>(null);
  const [isBankLoading, setIsBankLoading] = useState(false);

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const statusMap: { [key: number]: string } = {
    "-1": "Pending",
    0: "Processing",
    1: "Completed",
    2: "Failed",
  };

  const addDays = (isoString: string, days: number): string => {
    const d = new Date(isoString);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const getDeadlineInfo = (payout: Payout) => {
    if (!payout.deadlineDate) return { label: "N/A", variant: "outline" as const, overdue: false, dueSoon: false };
    const now = new Date();
    const deadline = new Date(payout.deadlineDate);

    // Completed / Failed: just show date, no warning
    if (payout.status === "Completed" || payout.status === "Failed") {
      return {
        label: formatDate(payout.deadlineDate),
        variant: "outline" as const,
        overdue: false,
        dueSoon: false,
      };
    }

    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays < 0) {
      return {
        label: `${formatDate(payout.deadlineDate)} (Overdue)`,
        variant: "destructive" as const,
        overdue: true,
        dueSoon: false,
      };
    }

    if (diffDays <= 1) {
      return {
        label: `${formatDate(payout.deadlineDate)} (Due soon)`,
        variant: "secondary" as const,
        overdue: false,
        dueSoon: true,
      };
    }

    return {
      label: formatDate(payout.deadlineDate),
      variant: "outline" as const,
      overdue: false,
      dueSoon: false,
    };
  };

  const normalizeBankInfo = (raw: any | undefined | null): BankDetails | null => {
    if (!raw || typeof raw !== "object") return null;
    return {
      accountHolder:
        raw.account_holder_name ||
        raw.accountHolderName ||
        raw.account_name ||
        raw.name ||
        "",
      accountNumber:
        raw.bank_account_number ||
        raw.account_number ||
        raw.accountNumber ||
        "",
      ifsc: raw.ifsc_code || raw.ifsc || "",
      bankName: raw.bank_name || raw.bank || "",
      branchName:
        raw.branch_name ||
        raw.bank_branch ||
        raw.branch ||
        "",
      upiId: raw.upi_id || raw.upi || "",
    };
  };

  const loadBankDetails = (payout: Payout) => {
    // Bank info is now provided directly on each task_order from backend
    setIsBankLoading(true);
    setTaskerBank(payout.taskerBankInfo || null);
    setPosterBank(payout.posterBankInfo || null);
    setIsBankLoading(false);
  };

  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axiosInstance.get("/get-all-task-orders/");
        if (response.data.status_code !== 200) {
          throw new Error(response.data.message || "Failed to fetch payouts");
        }
        const fetched: Payout[] = response.data.data.task_orders.map(
          (order: any) => {
            const baseDate = order.created_at || new Date().toISOString();
            // If backend provides a specific timestamp for when it entered processing, prefer that.
            const processingDate =
              order.processing_date ||
              order.status_updated_at ||
              order.updated_at ||
              baseDate;
            const deadlineDate =
              processingDate && typeof processingDate === "string"
                ? addDays(processingDate, 3)
                : null;

            const taskerBankInfo = normalizeBankInfo(
              order.tasker_bank_info || order.taskerBankInfo
            );
            const posterBankInfo = normalizeBankInfo(
              order.poster_bank_info || order.posterBankInfo
            );

            return {
              id: order.order_id,
              tasker: {
                id: Number(order.tasker_id),
                name: order.tasker_name || `Tasker ${order.tasker_id}`,
                email: order.tasker_email || "",
              },
              poster: {
                id: Number(order.poster_id),
                name: order.poster_name || `Poster ${order.poster_id}`,
                email: order.poster_email || "",
              },
              jobId: order.job_id,
              taskTitle: order.job_title || order.task_title || "",
              amount: Number(order.bid_amount) || 0,
              fee:
                (Number(order.gst) || 0) + (Number(order.commission) || 0),
              netAmount: Number(order.payable_amount) || 0,
              status: statusMap[order.status] || "Unknown",
              method: order.method || "Bank Transfer",
              reference: order.payment_id || `REF-${order.order_id}`,
              date: baseDate,
              completedDate: order.completed_at || null,
              processingDate,
              deadlineDate,
              taskerBankInfo,
              posterBankInfo,
            };
          }
        );
        setPayouts(fetched);
      } catch (err) {
        console.error("Payouts fetch error:", err);
        setError("Failed to fetch payouts. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayouts();
  }, []);

  const handleStatusChange = async (payoutId: number, newStatus: string) => {
    try {
      const reverseStatusMap: { [key: string]: number } = {
        Pending: -1,
        Processing: 0,
        Completed: 1,
        Failed: 2,
      };
      const statusCode = reverseStatusMap[newStatus];
      // Backend expects status as query param (?status=1), not JSON body.
      await axiosInstance.patch(
        `/task-order/${payoutId}/status`,
        null,
        {
          params: { status: statusCode },
        }
      );
      setPayouts((prev) =>
        prev.map((p) => (p.id === payoutId ? { ...p, status: newStatus } : p))
      );
    } catch {
      setError("Failed to update payout status");
    }
  };

  const filteredPayouts = payouts.filter((payout) => {
    const matchesSearch =
      `${payout.tasker.name} ${payout.poster.name} ${payout.taskTitle || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      payout.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      payout.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesMethod =
      methodFilter === "all" ||
      payout.method.toLowerCase() === methodFilter.toLowerCase();

    const deadlineInfo = getDeadlineInfo(payout);
    const matchesDeadline =
      deadlineFilter === "all" ||
      (deadlineFilter === "overdue" && deadlineInfo.overdue) ||
      (deadlineFilter === "dueSoon" && deadlineInfo.dueSoon);

    return matchesSearch && matchesStatus && matchesMethod && matchesDeadline;
  });

  const totalPending = payouts
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0)
    .toFixed(2);
  const totalProcessing = payouts
    .filter((p) => p.status === "Processing")
    .reduce((sum, p) => sum + p.amount, 0)
    .toFixed(2);
  const totalCompleted = payouts
    .filter((p) => p.status === "Completed")
    .reduce((sum, p) => sum + p.amount, 0)
    .toFixed(2);
  const totalFailed = payouts
    .filter((p) => p.status === "Failed")
    .reduce((sum, p) => sum + p.amount, 0)
    .toFixed(2);

  const taskerSummary = useMemo(() => {
    const map: Record<
      string,
      { id: number; name: string; totalAmount: number; totalNet: number; count: number }
    > = {};
    payouts.forEach((p) => {
      const key = String(p.tasker.id);
      if (!map[key]) {
        map[key] = {
          id: p.tasker.id,
          name: p.tasker.name,
          totalAmount: 0,
          totalNet: 0,
          count: 0,
        };
      }
      map[key].totalAmount += p.amount;
      map[key].totalNet += p.netAmount;
      map[key].count += 1;
    });
    return Object.values(map).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [payouts]);

  const sortedPayouts = useMemo(() => {
    const copy = [...filteredPayouts];
    // Sort by date descending (latest first). If same date, newest ID first.
    copy.sort((a, b) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      if (bDate !== aDate) return bDate - aDate;
      return b.id - a.id;
    });
    return copy;
  }, [filteredPayouts]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Payouts Management</h1>
        <Button
          disabled={isLoading}
          onClick={() => {
            // simple CSV of visible rows
            const headers = [
              "Tasker",
              "Poster",
              "Task",
              "Amount",
              "NetAmount",
              "Status",
              "Method",
              "Date",
            ];
            const rows = sortedPayouts.map((p) => [
              p.tasker.name,
              p.poster.name,
              p.taskTitle || "",
              p.amount.toFixed(2),
              p.netAmount.toFixed(2),
              p.status,
              p.method,
              formatDate(p.date),
            ]);
            const csv = [headers, ...rows]
              .map((r) =>
                r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
              )
              .join("\n");
            const blob = new Blob(["\uFEFF" + csv], {
              type: "text/csv;charset=utf-8;",
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "payouts.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">{error}</div>
      ) : (
        <>
          {taskerSummary.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Payouts by Tasker
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-muted-foreground">
                      <th className="text-left py-1 pr-4 font-normal">
                        Tasker
                      </th>
                      <th className="text-right py-1 pr-4 font-normal">
                        Payouts
                      </th>
                      <th className="text-right py-1 pr-4 font-normal">
                        Total Amount
                      </th>
                      <th className="text-right py-1 font-normal">Total Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taskerSummary.map((t) => (
                      <tr key={t.id} className="border-t">
                        <td className="py-1 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {t.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </div>
                            <span className="font-medium">{t.name}</span>
                          </div>
                        </td>
                        <td className="py-1 pr-4 text-right">{t.count}</td>
                        <td className="py-1 pr-4 text-right">
                          INR {t.totalAmount.toFixed(2)}
                        </td>
                        <td className="py-1 text-right">
                          INR {t.totalNet.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">INR {totalPending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Processing
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">INR {totalProcessing}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">INR {totalCompleted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">INR {totalFailed}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search payouts..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by deadline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Deadlines</SelectItem>
                  <SelectItem value="dueSoon">Due in &lt;= 1 day</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="bank transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tasker</TableHead>
                  <TableHead>Poster</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Method</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Deadline</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayouts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No payouts found
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedPayouts.map((payout) => {
                    const deadlineInfo = getDeadlineInfo(payout);
                    return (
                    <TableRow
                      key={payout.id}
                      className={
                        deadlineInfo.overdue
                          ? "bg-red-50"
                          : deadlineInfo.dueSoon
                          ? "bg-amber-50"
                          : undefined
                      }
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {payout.tasker.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {payout.tasker.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {payout.poster.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {payout.poster.name}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium line-clamp-1">
                            {payout.taskTitle || "Task"}
                          </span>
                          {payout.jobId && (
                            <span className="text-xs text-muted-foreground">
                              Job #{payout.jobId}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          INR {payout.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Net: INR {payout.netAmount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payout.status === "Completed"
                              ? "default"
                              : payout.status === "Pending"
                              ? "outline"
                              : payout.status === "Processing"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {payout.method}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(payout.date)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {payout.deadlineDate ? (
                          <Badge variant={deadlineInfo.variant}>
                            {deadlineInfo.label}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            N/A
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={
                            isDetailsDialogOpen &&
                            selectedPayout?.id === payout.id
                          }
                          onOpenChange={(open) => {
                            setIsDetailsDialogOpen(open);
                            if (!open) setSelectedPayout(null);
                          }}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPayout(payout);
                                  setIsDetailsDialogOpen(true);
                                  loadBankDetails(payout);
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              {payout.status === "Pending" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(
                                        payout.id,
                                        "Processing"
                                      )
                                    }
                                  >
                                    Process Payout
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      handleStatusChange(payout.id, "Failed")
                                    }
                                  >
                                    Cancel Payout
                                  </DropdownMenuItem>
                                </>
                              )}
                              {payout.status === "Processing" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(
                                        payout.id,
                                        "Completed"
                                      )
                                    }
                                  >
                                    Mark as Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      handleStatusChange(payout.id, "Failed")
                                    }
                                  >
                                    Mark as Failed
                                  </DropdownMenuItem>
                                </>
                              )}
                              {payout.status === "Failed" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(payout.id, "Pending")
                                    }
                                  >
                                    Retry Payout
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={async () => {
                                  if (
                                    confirm(
                                      "Are you sure you want to delete this payout record?"
                                    )
                                  ) {
                                    try {
                                      await axiosInstance.delete(
                                        `/task-order/${payout.id}`
                                      );
                                      setPayouts((prev) =>
                                        prev.filter((p) => p.id !== payout.id)
                                      );
                                    } catch (err) {
                                      console.error(
                                        "Failed to delete payout:",
                                        err
                                      );
                                      setError(
                                        "Failed to delete payout. Please try again."
                                      );
                                    }
                                  }
                                }}
                              >
                                Delete Payout
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                              <DialogTitle>Payout Details</DialogTitle>
                              <DialogDescription>
                                Complete information about this payout.
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPayout && (
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Tasker</Label>
                                    <div className="mt-1">
                                      {selectedPayout.tasker.name}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Poster</Label>
                                    <div className="mt-1">
                                      {selectedPayout.poster.name}
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Amount</Label>
                                    <div className="font-medium">
                                      INR {selectedPayout.amount.toFixed(2)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <Badge
                                      variant={
                                        selectedPayout.status === "Completed"
                                          ? "default"
                                          : selectedPayout.status === "Pending"
                                          ? "outline"
                                          : selectedPayout.status ===
                                            "Processing"
                                          ? "secondary"
                                          : "destructive"
                                      }
                                    >
                                      {selectedPayout.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Method</Label>
                                    <div>{selectedPayout.method}</div>
                                  </div>
                                  <div>
                                    <Label>Reference</Label>
                                    <div className="font-mono text-sm">
                                      {selectedPayout.reference}
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Request Date</Label>
                                    <div>{formatDate(selectedPayout.date)}</div>
                                  </div>
                                  <div>
                                    <Label>Completed Date</Label>
                                    <div>
                                      {selectedPayout.completedDate
                                        ? formatDate(
                                            selectedPayout.completedDate
                                          )
                                        : "N/A"}
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <Label>Tasker Bank / UPI</Label>
                                      {taskerBank?.accountNumber && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <button
                                            type="button"
                                            className="inline-flex items-center rounded px-1 py-0.5 hover:bg-muted"
                                            onClick={() => {
                                              const el = document.getElementById(
                                                "tasker-account-display"
                                              );
                                              if (!el) return;
                                              const isMasked =
                                                el.getAttribute("data-masked") ===
                                                "true";
                                              el.setAttribute(
                                                "data-masked",
                                                (!isMasked).toString()
                                              );
                                              const acct = taskerBank.accountNumber || "";
                                              el.textContent = isMasked
                                                ? acct
                                                : `****${acct.slice(-4)}`;
                                            }}
                                          >
                                            <Eye className="h-3 w-3 mr-0.5" />
                                            Show
                                          </button>
                                          <button
                                            type="button"
                                            className="inline-flex items-center rounded px-1 py-0.5 hover:bg-muted"
                                            onClick={() => {
                                              navigator.clipboard.writeText(
                                                taskerBank.accountNumber || ""
                                              );
                                            }}
                                          >
                                            <Copy className="h-3 w-3 mr-0.5" />
                                            Copy
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground space-y-1">
                                      {isBankLoading && <div>Loading...</div>}
                                      {!isBankLoading && taskerBank && (
                                        <>
                                          {taskerBank.bankName && (
                                            <div>Bank: {taskerBank.bankName}</div>
                                          )}
                                          {taskerBank.branchName && (
                                            <div>Branch: {taskerBank.branchName}</div>
                                          )}
                                          {taskerBank.accountNumber && (
                                            <div
                                              id="tasker-account-display"
                                              data-masked="true"
                                            >
                                              A/C: ****
                                              {taskerBank.accountNumber.slice(-4)}
                                            </div>
                                          )}
                                          {taskerBank.ifsc && (
                                            <div className="flex items-center gap-2">
                                              <span>IFSC: {taskerBank.ifsc}</span>
                                              <button
                                                type="button"
                                                className="inline-flex items-center rounded px-1 py-0.5 hover:bg-muted text-xs"
                                                onClick={() =>
                                                  navigator.clipboard.writeText(
                                                    taskerBank.ifsc || ""
                                                  )
                                                }
                                              >
                                                <Copy className="h-3 w-3 mr-0.5" />
                                                Copy
                                              </button>
                                            </div>
                                          )}
                                          {taskerBank.upiId && (
                                            <div className="flex items-center gap-2">
                                              <span>UPI: {taskerBank.upiId}</span>
                                              <button
                                                type="button"
                                                className="inline-flex items-center rounded px-1 py-0.5 hover:bg-muted text-xs"
                                                onClick={() =>
                                                  navigator.clipboard.writeText(
                                                    taskerBank.upiId || ""
                                                  )
                                                }
                                              >
                                                <Copy className="h-3 w-3 mr-0.5" />
                                                Copy
                                              </button>
                                            </div>
                                          )}
                                          {!taskerBank.bankName &&
                                            !taskerBank.accountNumber &&
                                            !taskerBank.ifsc &&
                                            !taskerBank.upiId && (
                                              <div>No bank details available.</div>
                                            )}
                                        </>
                                      )}
                                      {!isBankLoading && !taskerBank && (
                                        <div>No bank details available.</div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="flex items-center justify-between">
                                      <Label>Poster Bank / UPI</Label>
                                      {posterBank?.accountNumber && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <button
                                            type="button"
                                            className="inline-flex items-center rounded px-1 py-0.5 hover:bg-muted"
                                            onClick={() => {
                                              const el = document.getElementById(
                                                "poster-account-display"
                                              );
                                              if (!el) return;
                                              const isMasked =
                                                el.getAttribute("data-masked") ===
                                                "true";
                                              el.setAttribute(
                                                "data-masked",
                                                (!isMasked).toString()
                                              );
                                              const acct = posterBank.accountNumber || "";
                                              el.textContent = isMasked
                                                ? acct
                                                : `****${acct.slice(-4)}`;
                                            }}
                                          >
                                            <Eye className="h-3 w-3 mr-0.5" />
                                            Show
                                          </button>
                                          <button
                                            type="button"
                                            className="inline-flex items-center rounded px-1 py-0.5 hover:bg-muted"
                                            onClick={() => {
                                              navigator.clipboard.writeText(
                                                posterBank.accountNumber || ""
                                              );
                                            }}
                                          >
                                            <Copy className="h-3 w-3 mr-0.5" />
                                            Copy
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-1 text-sm text-muted-foreground space-y-1">
                                      {isBankLoading && <div>Loading...</div>}
                                      {!isBankLoading && posterBank && (
                                        <>
                                          {posterBank.bankName && (
                                            <div>Bank: {posterBank.bankName}</div>
                                          )}
                                          {posterBank.branchName && (
                                            <div>Branch: {posterBank.branchName}</div>
                                          )}
                                          {posterBank.accountNumber && (
                                            <div
                                              id="poster-account-display"
                                              data-masked="true"
                                            >
                                              A/C: ****
                                              {posterBank.accountNumber.slice(-4)}
                                            </div>
                                          )}
                                          {posterBank.ifsc && (
                                            <div className="flex items-center gap-2">
                                              <span>IFSC: {posterBank.ifsc}</span>
                                              <button
                                                type="button"
                                                className="inline-flex items-center rounded px-1 py-0.5 hover:bg-muted text-xs"
                                                onClick={() =>
                                                  navigator.clipboard.writeText(
                                                    posterBank.ifsc || ""
                                                  )
                                                }
                                              >
                                                <Copy className="h-3 w-3 mr-0.5" />
                                                Copy
                                              </button>
                                            </div>
                                          )}
                                          {posterBank.upiId && (
                                            <div className="flex items-center gap-2">
                                              <span>UPI: {posterBank.upiId}</span>
                                              <button
                                                type="button"
                                                className="inline-flex items-center rounded px-1 py-0.5 hover:bg-muted text-xs"
                                                onClick={() =>
                                                  navigator.clipboard.writeText(
                                                    posterBank.upiId || ""
                                                  )
                                                }
                                              >
                                                <Copy className="h-3 w-3 mr-0.5" />
                                                Copy
                                              </button>
                                            </div>
                                          )}
                                          {!posterBank.bankName &&
                                            !posterBank.accountNumber &&
                                            !posterBank.ifsc &&
                                            !posterBank.upiId && (
                                              <div>No bank details available.</div>
                                            )}
                                        </>
                                      )}
                                      {!isBankLoading && !posterBank && (
                                        <div>No bank details available.</div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsDetailsDialogOpen(false)}
                              >
                                Close
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  )})
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}


