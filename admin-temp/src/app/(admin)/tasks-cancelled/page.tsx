"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, AlertCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Job {
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
  job_completion_status: number;
  status: boolean;
  updated_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
}

export default function CancelledTasksPage() {
  const [rows, setRows] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [localCancellations, setLocalCancellations] = useState<any[]>([]);

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString || "—";
      return d.toLocaleString();
    } catch {
      return isoString || "—";
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        
        // Load local cancellations from localStorage
        const localData = JSON.parse(localStorage.getItem('taskerCancellations') || '[]');
        setLocalCancellations(localData);
        console.log("📋 Local cancellations loaded for cancelled tasks:", localData);
        
        const res = await axiosInstance.get("/get-all-jobs-admin/");
        const jobs: Job[] = res.data?.data?.jobs || [];
        const cancelled = jobs
          .filter((j: any) => j?.status === true || j?.cancel_status === true)
          .map((j: any) => {
            // Find matching local cancellation reason
            const localCancellation = localData.find((lc: any) => lc.taskId === j.job_id);
            
            return {
              ...j,
              // prefer explicit cancelled_at; fallback to updated_at or created timestamp
              cancelled_at: j.cancelled_at || j.updated_at || j.timestamp || j.created_at || j.job_due_date,
              // Add local cancellation reason if available
              cancellation_reason: j.cancellation_reason || localCancellation?.reason,
            };
          })
          .sort((a: any, b: any) => {
            const ta = new Date(a.cancelled_at || 0).getTime();
            const tb = new Date(b.cancelled_at || 0).getTime();
            return tb - ta; // newest first
          });
        setRows(cancelled as any);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Cancelled Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
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
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No cancelled tasks</TableCell>
                </TableRow>
              ) : (
                rows.map((t) => (
                  <TableRow key={t.job_id}>
                    <TableCell>{t.job_title}</TableCell>
                    <TableCell><Badge variant="outline">{t.job_category_name}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="destructive" className="flex items-center w-fit">
                        <AlertCircle className="h-4 w-4 mr-1" /> Cancelled
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{t.posted_by}</TableCell>
                    <TableCell className="hidden md:table-cell">{t.tasker_name || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(t.job_due_date)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate((t as any).cancelled_at)}</TableCell>
                    <TableCell>₹{t.job_budget}</TableCell>
                    <TableCell>
                      {t.cancellation_reason ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
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
                                Reason provided for task cancellation
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Task:</h4>
                                <p className="font-medium">{t.job_title}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Reason:</h4>
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                                  <p className="text-sm leading-relaxed">{t.cancellation_reason}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-muted-foreground text-sm">No reason provided</span>
                      )}
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


