"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RefreshCw } from "lucide-react";

interface TaskerCancellation {
  job_id: string;
  job_title: string;
  job_category_name: string;
  job_location: string;
  job_due_date: string;
  job_budget: number;
  user_ref_id: string;
  posted_by: string;
  tasker_id?: string;
  tasker_name?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  updated_at?: string;
  created_at?: string;
}

export default function TaskerCancellationsPage() {
  const [rows, setRows] = useState<TaskerCancellation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCancellation, setSelectedCancellation] = useState<TaskerCancellation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString || "—";
      return d.toLocaleString();
    } catch {
      return isoString || "—";
    }
  };

  const loadCancellations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch cancelled jobs directly from backend API
      const res = await axiosInstance.get("/get-all-jobs-admin/");
      const jobs: any[] = res.data?.data?.jobs || [];
      
      // Filter for cancelled jobs and map to cancellation format
      const cancelledJobs = jobs
        .filter((j: any) => j?.cancel_status === true || j?.status === 'Cancelled' || j?.status === 'cancelled')
        .map((j: any) => ({
          job_id: j.job_id,
          job_title: j.job_title || `Task ${j.job_id}`,
          job_category_name: j.job_category_name || j.job_category || "Unknown",
          job_location: j.job_location || "Unknown",
          job_due_date: j.job_due_date || j.created_at,
          job_budget: j.job_budget || 0,
          user_ref_id: j.user_ref_id,
          posted_by: j.posted_by || "Unknown",
          tasker_id: j.tasker_id,
          tasker_name: j.tasker_name || "Unknown",
          cancellation_reason: j.cancellation_reason || j.cancel_reason || "No reason provided",
          cancelled_at: j.cancelled_at || j.updated_at || j.created_at,
        }))
        .sort((a: any, b: any) => {
          const ta = new Date(a.cancelled_at || 0).getTime();
          const tb = new Date(b.cancelled_at || 0).getTime();
          return tb - ta; // newest first
        });
      
      console.log(`📋 Found ${cancelledJobs.length} cancelled jobs from backend`);
      setRows(cancelledJobs);
      
    } catch (error) {
      console.error("Failed to load tasker cancellations:", error);
      setError("Failed to load cancellations from backend. Please try again.");
      
      // Fallback to localStorage if API fails
      try {
        const localData = JSON.parse(localStorage.getItem('taskerCancellations') || '[]');
        if (localData.length > 0) {
          const localCancellations = localData.map((lc: any) => ({
            job_id: lc.taskId,
            job_title: `Task ${lc.taskId} (Local Only)`,
            job_category_name: "Unknown",
            job_location: "Unknown",
            job_due_date: lc.cancelledAt,
            job_budget: 0,
            user_ref_id: "Unknown",
            posted_by: "Unknown",
            tasker_id: "Unknown",
            tasker_name: lc.taskerName,
            cancellation_reason: lc.reason,
            cancelled_at: lc.cancelledAt,
          }));
          setRows(localCancellations);
          console.log("📋 Using localStorage fallback:", localCancellations.length);
        }
      } catch (localError) {
        console.error("Failed to load from localStorage:", localError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCancellations();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Tasker Cancellations
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                View cancellation reasons provided by taskers for assigned tasks. Data is fetched directly from the backend.
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadCancellations}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden md:table-cell">Taskmaster</TableHead>
                <TableHead className="hidden md:table-cell">Tasker</TableHead>
                <TableHead className="hidden md:table-cell">Due Date</TableHead>
                <TableHead className="hidden md:table-cell">Cancelled On</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No tasker cancellations found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((t) => (
                  <TableRow key={t.job_id}>
                    <TableCell className="font-medium">{t.job_title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.job_category_name}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{t.posted_by}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {t.tasker_name || "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(t.job_due_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatDate(t.cancelled_at || "")}
                    </TableCell>
                    <TableCell>₹{t.job_budget}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedCancellation(t)}
                            className="flex items-center gap-1"
                          >
                            <MessageSquare className="h-3 w-3" />
                            View Reason
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <AlertCircle className="h-5 w-5 text-orange-500" />
                              Cancellation Reason
                            </DialogTitle>
                            <DialogDescription>
                              Task cancellation reason provided by the tasker
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Task:</h4>
                              <p className="font-medium">{t.job_title}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Tasker:</h4>
                              <p>{t.tasker_name || "Unknown"}</p>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Cancellation Reason:</h4>
                              <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                                <p className="text-sm leading-relaxed">
                                  {t.cancellation_reason || "No reason provided"}
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Budget: ₹{t.job_budget}</span>
                              <span>Cancelled: {formatDate(t.cancelled_at || "")}</span>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
