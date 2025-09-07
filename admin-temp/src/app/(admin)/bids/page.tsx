"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MoreHorizontal,
  Calendar,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  TrendingUp,
  Eye,
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
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";

interface Bid {
  bid_id: number;
  job_id: string;
  job_title: string;
  job_description: string;
  job_category: string;
  job_budget: number;
  job_location: string;
  job_due_date: string;
  bidder_id: string;
  bidder_name: string;
  bidder_email: string;
  bid_amount: number;
  bid_description: string;
  bid_timestamp: string;
  job_status: "pending" | "accepted" | "other";
  job_completion_status: number;
  is_completed: boolean;
  is_cancelled: boolean;
  posted_by: string;
  posted_by_id: string;
  is_confirmed: boolean;
}

interface BidStatistics {
  total_count: number;
  total_amount: number;
  accepted_count: number;
  accepted_amount: number;
  pending_count: number;
  completed_count: number;
  cancelled_count: number;
}

export default function BidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [statistics, setStatistics] = useState<BidStatistics>({
    total_count: 0,
    total_amount: 0,
    accepted_count: 0,
    accepted_amount: 0,
    pending_count: 0,
    completed_count: 0,
    cancelled_count: 0,
  });
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Fetch bids from API by aggregating across jobs
  const fetchBids = async () => {
    try {
      setIsLoading(true);
      const jobsRes = await axiosInstance.get("/get-all-jobs-admin/");
      const jobs = jobsRes.data?.data?.jobs || [];
      const openJobs = jobs; // include all; filter by status if needed

      const all: Bid[] = [];
      for (const job of openJobs) {
        const jId = job.job_id ?? job.id;
        if (!jId) continue;
        const bidsRes = await axiosInstance.get(`/get-bids/${jId}/`);
        const rows: any[] = bidsRes.data?.data?.bids || bidsRes.data?.data || [];
        rows.forEach((r: any) =>
          all.push({
            bid_id: r.bid_id ?? r.id ?? 0,
            job_id: jId,
            job_title: job.job_title || r.task_title || "",
            job_description: job.job_description || "",
            job_category: job.job_category_name || job.job_category || "",
            job_budget: Number(job.job_budget ?? 0),
            job_location: job.job_location || "",
            job_due_date: job.job_due_date || new Date().toISOString(),
            bidder_id: r.user_id ?? r.tasker_id ?? r.bidder_id ?? "",
            bidder_name: r.user_name ?? r.tasker_name ?? r.bidder_name ?? "",
            bidder_email: r.user_email ?? "",
            bid_amount: Number(r.bid_amount ?? r.amount ?? 0),
            bid_description: r.bid_description ?? r.message ?? "",
            bid_timestamp: r.created_at ?? r.createdAt ?? new Date().toISOString(),
            job_status: (r.status ?? "pending") as Bid["job_status"],
            job_completion_status: job.job_completion_status ?? 0,
            is_completed: job.job_completion_status === 1,
            is_cancelled: job.deletion_status === true,
            posted_by: job.posted_by ?? "",
            posted_by_id: job.user_ref_id ?? "",
            is_confirmed: r.is_confirmed ?? false,
          })
        );
      }
      setBids(all);
      // Simple statistics
      setStatistics({
        total_count: all.length,
        total_amount: all.reduce((s, b) => s + (b.bid_amount || 0), 0),
        accepted_count: all.filter((b) => b.job_status === "accepted").length,
        accepted_amount: all
          .filter((b) => b.job_status === "accepted")
          .reduce((s, b) => s + (b.bid_amount || 0), 0),
        pending_count: all.filter((b) => b.job_status === "pending").length,
        completed_count: all.filter((b) => b.is_completed).length,
        cancelled_count: all.filter((b) => b.is_cancelled).length,
      });
    } catch (error) {
      toast.error("Failed to load bids");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
  }, []);

  // Get unique categories for filter
  const categories = Array.from(new Set(bids.map((bid) => bid.job_category)));

  // Filter bids based on search term and filters
  const filteredBids = bids.filter((bid: Bid) => {
    const matchesSearch =
      bid.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.bidder_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bid.bid_description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || bid.job_status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || bid.job_category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadgeVariant = (
    status: Bid["job_status"]
  ): "outline" | "secondary" | "default" | "destructive" => {
    switch (status) {
      case "pending":
        return "outline";
      case "accepted":
        return "default";
      case "other":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (bid: Bid) => {
    if (bid.is_completed) {
      return <CheckCircle className="h-4 w-4 mr-1 text-green-500" />;
    }
    if (bid.is_cancelled) {
      return <AlertCircle className="h-4 w-4 mr-1 text-red-500" />;
    }
    if (bid.is_confirmed) {
      return <Clock className="h-4 w-4 mr-1 text-blue-500" />;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bids Management</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bids</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.total_count}</div>
            <p className="text-xs text-muted-foreground">
              ₹{statistics.total_amount.toLocaleString()} total value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted Bids</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.accepted_count}</div>
            <p className="text-xs text-muted-foreground">
              ₹{statistics.accepted_amount.toLocaleString()} total value
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bids</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.pending_count}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting acceptance
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completed_count}</div>
            <p className="text-xs text-muted-foreground">
              With accepted bids
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search bids by job title, bidder name, or description..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job & Bidder</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Posted By</TableHead>
              <TableHead className="hidden md:table-cell">Due Date</TableHead>
              <TableHead>Bid Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredBids.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-8 text-muted-foreground"
                >
                  No bids found
                </TableCell>
              </TableRow>
            ) : (
              filteredBids.map((bid) => (
                <TableRow key={bid.bid_id}>
                  <TableCell>
                    <div className="font-medium">{bid.job_title}</div>
                    <div className="text-sm text-muted-foreground">
                      by {bid.bidder_name}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-1 md:hidden">
                      {bid.posted_by} • {formatDate(bid.job_due_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{bid.job_category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(bid.job_status)}
                      className="flex items-center w-fit"
                    >
                      {getStatusIcon(bid)}
                      {bid.job_status === "pending" && "Pending"}
                      {bid.job_status === "accepted" && "Accepted"}
                      {bid.job_status === "other" && "Other"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>
                          {bid.posted_by
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{bid.posted_by}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(bid.job_due_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">₹{bid.bid_amount}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Budget: ₹{bid.job_budget}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isLoading}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              setIsLoading(true)
                              await axiosInstance.put(`/accept-bid/${bid.job_id}/${bid.bidder_id}/`)
                              toast.success("Bid accepted")
                              fetchBids()
                            } catch {
                              toast.error("Failed to accept bid")
                            } finally {
                              setIsLoading(false)
                            }
                          }}
                        >
                          Accept Bid
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedBid(bid);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <Dialog
                      open={isDetailsDialogOpen && selectedBid?.bid_id === bid.bid_id}
                      onOpenChange={(open) => {
                        setIsDetailsDialogOpen(open);
                        if (!open) setSelectedBid(null);
                      }}
                    >
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Bid Details</DialogTitle>
                          <DialogDescription>
                            Complete information about this bid.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedBid && (
                          <div className="grid gap-6 py-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h2 className="text-xl font-semibold mb-1">
                                  {selectedBid.job_title}
                                </h2>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    {selectedBid.job_category}
                                  </Badge>
                                  <Badge
                                    variant={getStatusBadgeVariant(
                                      selectedBid.job_status
                                    )}
                                  >
                                    {selectedBid.job_status}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-lg">
                                  ₹{selectedBid.bid_amount}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Budget: ₹{selectedBid.job_budget}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Job Description</Label>
                              <div className="p-4 bg-muted rounded-md">
                                {selectedBid.job_description}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Bid Description</Label>
                              <div className="p-4 bg-muted rounded-md">
                                {selectedBid.bid_description || "No description provided"}
                              </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <Label>Bidder</Label>
                                  <div className="flex items-center gap-3 mt-2">
                                    <Avatar>
                                      <AvatarFallback>
                                        {selectedBid.bidder_name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">
                                        {selectedBid.bidder_name}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {selectedBid.bidder_email}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        ID: {selectedBid.bidder_id}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label>Posted By</Label>
                                  <div className="flex items-center gap-3 mt-2">
                                    <Avatar>
                                      <AvatarFallback>
                                        {selectedBid.posted_by
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium">
                                        {selectedBid.posted_by}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        ID: {selectedBid.posted_by_id}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <Label>Location</Label>
                                  <div className="flex items-center gap-2 mt-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{selectedBid.job_location}</span>
                                  </div>
                                </div>

                                <div>
                                  <Label>Due Date</Label>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDate(selectedBid.job_due_date)}</span>
                                  </div>
                                </div>

                                <div>
                                  <Label>Bid Submitted</Label>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDate(selectedBid.bid_timestamp)}</span>
                                  </div>
                                </div>

                                <div>
                                  <Label>Status</Label>
                                  <div className="mt-2">
                                    <Badge
                                      variant={getStatusBadgeVariant(selectedBid.job_status)}
                                      className="flex items-center w-fit"
                                    >
                                      {getStatusIcon(selectedBid)}
                                      {selectedBid.job_status === "pending" && "Pending"}
                                      {selectedBid.job_status === "accepted" && "Accepted"}
                                      {selectedBid.job_status === "other" && "Other"}
                                    </Badge>
                                    {selectedBid.is_completed && (
                                      <div className="text-sm text-green-600 mt-1">
                                        Task completed
                                      </div>
                                    )}
                                    {selectedBid.is_cancelled && (
                                      <div className="text-sm text-red-600 mt-1">
                                        Task cancelled
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsDetailsDialogOpen(false)}
                            disabled={isLoading}
                          >
                            Close
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
