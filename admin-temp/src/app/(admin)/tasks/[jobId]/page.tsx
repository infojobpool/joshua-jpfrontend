"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/lib/axiosInstance";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

interface Bid {
  bid_id: number;
  task_id: string;
  task_title: string;
  bid_amount: number;
  bid_description?: string;
  status: string;
  created_at: string;
  task_location?: string;
  posted_by?: string;
  bidder_id?: string;
  bidder_name?: string;
}

export default function TaskOffersPage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const jobId = params?.jobId as string;

  const [loading, setLoading] = useState<boolean>(false);
  const [bids, setBids] = useState<Bid[]>([]);

  const fetchBids = async () => {
    if (!jobId) return;
    try {
      setLoading(true);
      // Updated endpoint per docs: GET /api/v1/get-bids/{job_id}/
      const res = await axiosInstance.get(`/get-bids/${jobId}/`);
      const payload = res.data;
      let rows: any[] = [];
      if (Array.isArray(payload?.data?.bids)) rows = payload.data.bids;
      else if (Array.isArray(payload?.data)) rows = payload.data;
      else if (Array.isArray(payload)) rows = payload;
      if (rows.length === 0) {
        setBids([]);
        return;
      }
      const normalized: Bid[] = rows.map((r: any) => ({
        bid_id: r.bid_id ?? r.id ?? 0,
        task_id: r.task_id ?? jobId,
        task_title: r.task_title ?? "",
        bid_amount: Number(r.bid_amount ?? r.amount ?? 0),
        bid_description: r.bid_description ?? r.message ?? "",
        status: r.status ?? "pending",
        created_at: r.created_at ?? r.createdAt ?? new Date().toISOString(),
        task_location: r.task_location,
        posted_by: r.posted_by,
        bidder_id: r.user_id ?? r.bidder_id ?? r.tasker_id,
        bidder_name: r.user_name ?? r.bidder_name ?? r.tasker_name,
      }));
      setBids(normalized);
    } catch (e: any) {
      setBids([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBids();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const acceptBid = async (bid: Bid) => {
    try {
      setLoading(true);
      const userId = bid.bidder_id;
      const res = await axiosInstance.put(`/accept-bid/${jobId}/${userId}/`);
      if (res.data?.status_code === 200) {
        fetchBids();
      }
    } catch (e: any) {
    } finally {
      setLoading(false);
    }
  };

  const rejectBid = async (bid: Bid) => {
    try {
      setLoading(true);
      const res = await axiosInstance.put(`/reject-bid/${bid.bid_id}/`);
      if (res.data?.status_code === 200) {
        toast.success("Bid rejected");
        fetchBids();
      } else {
        toast.error(res.data?.message || "Failed to reject bid");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to reject bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-semibold">Task Offers</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Offers / Bids</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Loading…</div>
          ) : bids.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No bids for this task yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bidder</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bids.map((bid) => (
                  <TableRow key={bid.bid_id}>
                    <TableCell className="font-medium">
                      {bid.bidder_name || bid.posted_by || bid.bidder_id || "—"}
                    </TableCell>
                    <TableCell>₹{Number(bid.bid_amount).toLocaleString()}</TableCell>
                    <TableCell className="max-w-[360px] truncate">{bid.bid_description || "—"}</TableCell>
                    <TableCell>{new Date(bid.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={bid.status === "accepted" ? "secondary" : bid.status === "rejected" ? "destructive" : "outline"}>
                        {bid.status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" disabled={loading} onClick={() => acceptBid(bid)}>Accept</Button>
                      <Button size="sm" variant="outline" disabled={loading} onClick={() => rejectBid(bid)}>Reject</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div>
        <Link href="/tasks">
          <Button variant="ghost">Back to Tasks</Button>
        </Link>
      </div>
    </div>
  );
}
