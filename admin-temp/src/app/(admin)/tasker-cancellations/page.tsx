"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageSquare, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
        console.log("📋 Local cancellations loaded:", localData);
        console.log("📋 Total local cancellations:", localData.length);
        console.log("📋 localStorage keys:", Object.keys(localStorage));
        
        const res = await axiosInstance.get("/get-all-jobs-admin/");
        const jobs: any[] = res.data?.data?.jobs || [];
        
        // Create combined list: cancelled jobs from API + local cancellations
        const apiCancelledJobs = jobs
          .filter((j: any) => j?.cancel_status === true)
          .map((j: any) => {
            // Find matching local cancellation reason
            const localCancellation = localData.find((lc: any) => lc.taskId === j.job_id);
            
            return {
              job_id: j.job_id,
              job_title: j.job_title,
              job_category_name: j.job_category_name,
              job_location: j.job_location,
              job_due_date: j.job_due_date,
              job_budget: j.job_budget,
              user_ref_id: j.user_ref_id,
              posted_by: j.posted_by,
              tasker_id: j.tasker_id,
              tasker_name: j.tasker_name || localCancellation?.taskerName,
              cancellation_reason: j.cancellation_reason || localCancellation?.reason,
              cancelled_at: j.cancelled_at || j.updated_at || j.created_at || localCancellation?.cancelledAt,
            };
          })
          .filter((j: any) => j.cancellation_reason); // Only show jobs with cancellation reasons

        // Add local cancellations that don't have matching API jobs
        const localOnlyCancellations = localData
          .filter((lc: any) => !jobs.some((j: any) => j.job_id === lc.taskId))
          .map((lc: any) => ({
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

        // Combine and sort
        const cancelledJobs = [...apiCancelledJobs, ...localOnlyCancellations]
          .sort((a: any, b: any) => {
            const ta = new Date(a.cancelled_at || 0).getTime();
            const tb = new Date(b.cancelled_at || 0).getTime();
            return tb - ta; // newest first
          });
        
        setRows(cancelledJobs);
      } catch (error) {
        console.error("Failed to load tasker cancellations:", error);
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
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Tasker Cancellations
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            View cancellation reasons provided by taskers for assigned tasks
          </p>
          <div className="flex gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const localData = JSON.parse(localStorage.getItem('taskerCancellations') || '[]');
                console.log("🔍 Manual localStorage check:", localData);
                alert(`Found ${localData.length} cancellations in localStorage:\n${JSON.stringify(localData, null, 2)}`);
              }}
            >
              Check localStorage
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Add a test cancellation
                const testData = {
                  taskId: "test_task_" + Date.now(),
                  reason: "Test cancellation reason - " + new Date().toLocaleString(),
                  taskerName: "Test Tasker",
                  cancelledAt: new Date().toISOString(),
                  timestamp: Date.now()
                };
                const existing = JSON.parse(localStorage.getItem('taskerCancellations') || '[]');
                existing.push(testData);
                localStorage.setItem('taskerCancellations', JSON.stringify(existing));
                alert("Test cancellation added! Refresh the page to see it.");
              }}
            >
              Add Test Data
            </Button>
          </div>
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
