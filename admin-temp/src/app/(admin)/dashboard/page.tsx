"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  CreditCard,
  Users,
  AlertCircle,
  IndianRupee,
  RefreshCw,
  BellRing,
  ChevronRight,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import axiosInstance from "@/lib/axiosInstance";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface TaskStatus {
  id: number;
  name: string;
  count: number;
  percentage: number;
  icon: typeof AlertCircle;
  color: string;
}

interface User {
  user_id: string;
  user_fullname: string;
  user_email: string;
  phone_number?: string;
  tasker: boolean;
  task_manager: boolean;
  status: boolean;
  verification_status?: number;
  created_at?: string;
  joined_at?: string;
  date_joined?: string;
}

interface Job {
  job_id: string;
  posted_by: string;
  user_ref_id: string;
  job_title: string;
  job_description: string;
  job_category: string;
  job_category_name: string;
  job_budget: number;
  job_location: string;
  job_due_date: string;
  job_images: { urls: string[] };
  status: boolean;
  created_at?: string;
  timestamp?: string;
  job_tstamp?: string;
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  task?: string;
  time: string;
  sortTime: number;
  kind: "signup" | "task";
}

function trimStr(s?: string) {
  return (s || "").trim();
}

/** Same rules as Verification reminders: incomplete KYC (below Aadhaar) or missing profile fields. */
function userNeedsVerificationAttention(u: User): boolean {
  const v = Number(u.verification_status ?? 0);
  const incompleteKyc = v < 2;
  const incompleteProfile =
    !trimStr(u.user_fullname) || !trimStr(u.user_email) || !trimStr(u.phone_number);
  return incompleteKyc || incompleteProfile;
}

/** Format ISO date to "X days/hours ago"; fallback for missing/invalid dates */
function formatTimeAgo(isoDate: string | undefined, fallback: string = "Recently"): string {
  if (!isoDate) return fallback;
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return fallback;
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
    if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
    if (days < 365) return `${Math.floor(days / 30)} month${days < 60 ? "" : "s"} ago`;
    return `${Math.floor(days / 365)} year${days < 730 ? "" : "s"} ago`;
  } catch {
    return fallback;
  }
}



interface RecentTask {
  id: string;
  title: string;
  category: string;
  taskmaster: string;
  tasker: string;
  status: string;
  amount: string;
}

interface TaskOrder {
  order_id: number;
  status: number;
  bid_amount: number;
  tasker_name?: string;
  created_at?: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [taskOrders, setTaskOrders] = useState<TaskOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Check cache first
      const cacheKey = "admin_dashboard_data";
      const cachedData = localStorage.getItem(cacheKey);
      const cacheTimestamp = localStorage.getItem(`${cacheKey}_timestamp`);
      
      // Use cache if less than 2 minutes old
      if (cachedData && cacheTimestamp) {
        const age = Date.now() - parseInt(cacheTimestamp);
        if (age < 120000) { // 2 minutes
          console.log("Dashboard: Using cached data");
          const data = JSON.parse(cachedData);
          setUsers(data.users || []);
          setJobs(data.jobs || []);
          setTaskOrders(data.taskOrders || []);
          setIsLoading(false);
          return;
        }
      }
      
      console.log("Dashboard: Fetching fresh data...");
      
      // Add timeouts to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      const [usersResponse, jobsResponse, taskOrdersResponse] = await Promise.all([
        axiosInstance.get("all-user-details/", { signal: controller.signal }),
        axiosInstance.get("get-all-jobs-admin/", { signal: controller.signal }),
        axiosInstance.get("get-all-task-orders/", { signal: controller.signal }).catch(() => ({ data: { data: { task_orders: [] } } })),
      ]);
      
      clearTimeout(timeoutId);

      const users = usersResponse.data?.data || usersResponse.data || [];
      const jobs = jobsResponse.data?.data?.jobs || [];
      const rawOrders = taskOrdersResponse?.data?.data?.task_orders || [];
      const orders: TaskOrder[] = rawOrders.map((o: any) => ({
        order_id: o.order_id,
        status: typeof o.status === "number" ? o.status : parseInt(o.status, 10),
        bid_amount: Number(o.bid_amount) || 0,
        tasker_name: o.tasker_name,
        created_at: o.created_at || o.updated_at,
      }));

      setUsers(users);
      setJobs(jobs);
      setTaskOrders(orders);
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify({ users, jobs, taskOrders: orders }));
      localStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
      
      console.log(`Dashboard: Loaded ${users.length} users and ${jobs.length} jobs`);
      
    } catch (error: any) {
      console.error("Dashboard fetch error:", error);
      if (error.name === 'AbortError') {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("An error occurred while fetching data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    localStorage.removeItem("admin_dashboard_data");
    localStorage.removeItem("admin_dashboard_data_timestamp");
    fetchData();
  };

  // Calculate statistics with memoization for better performance
  const statistics = useMemo(() => {
    const totalRevenue = jobs.reduce((sum, job) => sum + (job.job_budget || 0), 0);
    const activeTasks = jobs.filter((job) => !job.status).length; // status: false = Open/Active
    const totalUsers = users.length;
    // Real data from get-all-task-orders: status -1 = Pending
    const pendingOrders = taskOrders.filter((o) => o.status === -1);
    const pendingPayouts = pendingOrders.reduce((sum, o) => sum + o.bid_amount, 0);
    const pendingPayoutsCount = pendingOrders.length;
    const needsVerificationCount = users.filter(userNeedsVerificationAttention).length;

    return {
      totalRevenue,
      activeTasks,
      totalUsers,
      pendingPayouts,
      pendingPayoutsCount,
      needsVerificationCount,
    };
  }, [jobs, users, taskOrders]);

  const { totalRevenue, activeTasks, totalUsers, pendingPayouts, pendingPayoutsCount, needsVerificationCount } =
    statistics;

  const KpiSkeleton = () => (
    <div className="h-9 w-28 max-w-full animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/50" aria-hidden />
  );

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Overview of users, tasks, and payouts — data from your latest admin sync.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
          className="gap-2 shrink-0 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {!isLoading && needsVerificationCount > 0 && (
        <Link
          href="/verification-reminders"
          className="group flex items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm shadow-sm transition-colors hover:bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 dark:hover:bg-amber-950/40"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
              <BellRing className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="font-medium text-amber-950 dark:text-amber-100">
                {needsVerificationCount} user{needsVerificationCount === 1 ? "" : "s"} need KYC or profile details
              </p>
              <p className="text-xs text-amber-900/70 dark:text-amber-200/70">
                Send email &amp; WhatsApp reminders from Verification reminders.
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-amber-700/80 transition-transform group-hover:translate-x-0.5 dark:text-amber-300/80" />
        </Link>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950/40">
          <div className="h-1 bg-emerald-500/90" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <KpiSkeleton />
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                  ₹{totalRevenue.toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Sum of task budgets in the admin job list</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950/40">
          <div className="h-1 bg-blue-500/90" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">Open tasks</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <KpiSkeleton />
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                  {activeTasks}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Jobs not marked cancelled in admin feed</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950/40">
          <div className="h-1 bg-indigo-500/90" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">Total users</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <KpiSkeleton />
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                  {totalUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Accounts returned by all-user-details</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950/40">
          <div className="h-1 bg-amber-500/90" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-200">Pending payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <KpiSkeleton />
            ) : (
              <>
                <div className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
                  ₹{pendingPayouts.toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pendingPayoutsCount} order{pendingPayoutsCount === 1 ? "" : "s"} awaiting payout
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white/90 border border-slate-200/80 rounded-xl p-1 dark:bg-slate-950/40 dark:border-slate-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">Overview</TabsTrigger>
          <TabsTrigger value="tasks" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">Tasks</TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 rounded-2xl border border-slate-200/80 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950/40">
              <CardHeader>
                <CardTitle className="font-semibold">Recent activity</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Latest signups and new tasks from your loaded admin data.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ActivityList users={users} jobs={jobs} isLoading={isLoading} />
              </CardContent>
            </Card>
            <Card className="col-span-3 rounded-2xl border border-slate-200/80 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950/40">
              <CardHeader>
                <CardTitle className="font-semibold">Task status</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Open vs cancelled from the admin job list. Other states are not split here yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <TaskStatusList jobs={jobs} isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950/40">
            <CardHeader>
              <CardTitle className="font-semibold">Recent tasks</CardTitle>
              <CardDescription className="text-muted-foreground">Newest tasks from the admin job list</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTasksList jobs={jobs} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payouts" className="space-y-4">
          <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-md dark:border-slate-800 dark:bg-slate-950/40">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="font-semibold">Recent payouts</CardTitle>
                <CardDescription className="text-muted-foreground">Latest task orders from the payout feed</CardDescription>
              </div>
              <Link
                href="/payouts"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                View all →
              </Link>
            </CardHeader>
            <CardContent>
              <RecentPayoutsList taskOrders={taskOrders} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActivityList({ users, jobs, isLoading }: { users: User[]; jobs: Job[]; isLoading: boolean }) {
  const userJoinedAt = (u: User) => u.created_at ?? u.joined_at ?? u.date_joined;
  const jobCreatedAt = (j: Job) => j.created_at ?? j.timestamp ?? j.job_tstamp;

  const signupAction = (user: User) => {
    const roles: string[] = [];
    if (user.tasker) roles.push("tasker");
    if (user.task_manager) roles.push("task poster");
    const suffix = roles.length ? ` · ${roles.join(" & ")}` : "";
    return `Joined JobPool${suffix}`;
  };

  const activities: ActivityItem[] = [
    ...users.map((user) => {
      const iso = userJoinedAt(user);
      return {
        id: `user-${user.user_id}`,
        user: user.user_fullname || user.user_email || user.user_id,
        action: signupAction(user),
        task: "",
        time: formatTimeAgo(iso),
        sortTime: iso ? new Date(iso).getTime() : 0,
        kind: "signup" as const,
      };
    }),
    ...jobs.map((job) => {
      const iso = jobCreatedAt(job);
      return {
        id: `job-${job.job_id}`,
        user: job.posted_by,
        action: "posted a new task",
        task: job.job_title,
        time: formatTimeAgo(iso),
        sortTime: iso ? new Date(iso).getTime() : 0,
        kind: "task" as const,
      };
    }),
  ]
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 6);

  return (
    <div className="space-y-0">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading activities…</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity</p>
      ) : (
        <ul className="space-y-0">
          {activities.map((activity) => (
            <li key={activity.id} className="flex gap-3 py-3 border-b border-slate-100 last:border-0 dark:border-slate-800">
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  activity.kind === "signup"
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"
                }`}
              >
                {activity.kind === "signup" ? (
                  <Users className="h-4 w-4" />
                ) : (
                  <Briefcase className="h-4 w-4" />
                )}
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm leading-snug text-slate-900 dark:text-slate-100">
                  <span className="font-semibold">{activity.user}</span>{" "}
                  <span className="text-slate-700 dark:text-slate-300">{activity.action}</span>
                  {activity.task ? (
                    <>
                      {" "}
                      <span className="font-medium text-slate-800 dark:text-slate-200">&ldquo;{activity.task}&rdquo;</span>
                    </>
                  ) : null}
                </p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TaskStatusList({ jobs, isLoading }: { jobs: Job[]; isLoading: boolean }) {
  const statuses: TaskStatus[] = useMemo(() => {
    const openCount = jobs.filter((job) => !job.status).length;
    const cancelledCount = jobs.filter((job) => job.status).length;
    const total = jobs.length;
    const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

    return [
      {
        id: 1,
        name: "Open",
        count: openCount,
        percentage: pct(openCount),
        icon: AlertCircle,
        color: "text-amber-600 dark:text-amber-400",
      },
      {
        id: 2,
        name: "Cancelled",
        count: cancelledCount,
        percentage: pct(cancelledCount),
        icon: AlertCircle,
        color: "text-slate-500 dark:text-slate-400",
      },
    ];
  }, [jobs]);

  return (
    <div className="space-y-6">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading task status…</p>
      ) : jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No jobs in the loaded list</p>
      ) : (
        statuses.map((status) => (
          <div key={status.id} className="flex items-center gap-3">
            <status.icon className={`h-4 w-4 shrink-0 ${status.color}`} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">{status.name}</span>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {status.count} ({status.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full ${
                    status.id === 1 ? "bg-amber-500" : "bg-slate-400 dark:bg-slate-500"
                  }`}
                  style={{ width: `${Math.min(100, status.percentage)}%` }}
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function RecentTasksList({ jobs, isLoading }: { jobs: Job[]; isLoading: boolean }) {
  const tasks: RecentTask[] = useMemo(() => {
    const jobCreatedAt = (j: Job) => j.created_at ?? j.timestamp ?? j.job_tstamp;
    const sorted = [...jobs]
      .sort((a, b) => {
        const ta = jobCreatedAt(a) ? new Date(jobCreatedAt(a)!).getTime() : 0;
        const tb = jobCreatedAt(b) ? new Date(jobCreatedAt(b)!).getTime() : 0;
        return tb - ta; // newest first
      })
      .slice(0, 5);
    return sorted.map((job) => ({
      id: job.job_id,
      title: job.job_title || "Untitled",
      category: job.job_category_name || "General",
      taskmaster: job.posted_by || "Unknown",
      tasker: "Unassigned", // No tasker data in API
      status: job.status ? "Cancelled" : "Open",
      amount: `₹${(job.job_budget || 0).toLocaleString()}`,
    }));
  }, [jobs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 font-medium text-sm">
        <div>Title</div>
        <div>Category</div>
        <div>Taskmaster</div>
        <div>Tasker</div>
        <div>Status</div>
        <div className="text-right">Amount</div>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tasks...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent tasks</p>
      ) : (
        tasks.map((task) => (
          <div key={task.id} className="grid grid-cols-6 text-sm py-2 border-t">
            <div>{task.title}</div>
            <div>{task.category}</div>
            <div>{task.taskmaster}</div>
            <div>{task.tasker}</div>
            <div>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  task.status === "Open"
                    ? "bg-amber-100 text-amber-800"
                    : task.status === "Cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {task.status}
              </span>
            </div>
            <div className="text-right">{task.amount}</div>
          </div>
        ))
      )}
    </div>
  );
}

const PAYOUT_STATUS_MAP: Record<number, string> = {
  [-1]: "Pending",
  0: "Processing",
  1: "Completed",
  2: "Failed",
};

function RecentPayoutsList({ taskOrders, isLoading }: { taskOrders: TaskOrder[]; isLoading: boolean }) {
  const recentPayouts = useMemo(() => {
    return [...taskOrders]
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
      .slice(0, 5);
  }, [taskOrders]);

  const formatPayoutDate = (iso: string | undefined) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return "—";
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 font-medium text-sm">
        <div>Tasker</div>
        <div>Amount</div>
        <div>Date</div>
        <div>Status</div>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading payouts...</p>
      ) : recentPayouts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent payouts</p>
      ) : (
        recentPayouts.map((order) => {
          const statusLabel = PAYOUT_STATUS_MAP[order.status] ?? "Unknown";
          return (
            <div key={order.order_id} className="grid grid-cols-4 text-sm py-2 border-t">
              <div>{order.tasker_name || `Order #${order.order_id}`}</div>
              <div>₹{(order.bid_amount || 0).toLocaleString()}</div>
              <div>{formatPayoutDate(order.created_at)}</div>
              <div>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    statusLabel === "Completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : statusLabel === "Pending" || statusLabel === "Processing"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}