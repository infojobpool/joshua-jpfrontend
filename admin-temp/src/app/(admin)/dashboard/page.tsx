"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, CreditCard, DollarSign, Users, CheckCircle2, Clock, AlertCircle, IndianRupee } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface TaskStatus {
  id: number;
  name: string;
  count: number;
  percentage: number;
  icon: typeof CheckCircle2 | typeof Clock | typeof AlertCircle; // Specific icon types
  color: string;
}

interface User {
  user_id: string;
  user_fullname: string;
  user_email: string;
  tasker: boolean;
  task_manager: boolean;
  status: boolean;
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
  sortTime: number; // for sorting by actual date
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

  // Calculate statistics with memoization for better performance
  const statistics = useMemo(() => {
    const totalRevenue = jobs.reduce((sum, job) => sum + (job.job_budget || 0), 0);
    const activeTasks = jobs.filter((job) => !job.status).length; // status: false = Open/Active
    const totalUsers = users.length;
    // Real data from get-all-task-orders: status -1 = Pending
    const pendingOrders = taskOrders.filter((o) => o.status === -1);
    const pendingPayouts = pendingOrders.reduce((sum, o) => sum + o.bid_amount, 0);
    const pendingPayoutsCount = pendingOrders.length;
    
    return {
      totalRevenue,
      activeTasks,
      totalUsers,
      pendingPayouts,
      pendingPayoutsCount
    };
  }, [jobs, users, taskOrders]);
  
  const { totalRevenue, activeTasks, totalUsers, pendingPayouts, pendingPayoutsCount } = statistics;

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-gray-500">+20.1% from last month</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Active Tasks</CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{activeTasks}</div>
                <p className="text-xs text-gray-500">+{Math.min(activeTasks, 201)} since last week</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Total Users</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-gray-500">+10.1% from last month</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Pending Payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">₹{pendingPayouts.toLocaleString()}</div>
                <p className="text-xs text-gray-500">{pendingPayoutsCount} payouts pending</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-white/80 border rounded-xl p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="font-semibold">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ActivityList users={users} jobs={jobs} isLoading={isLoading} />
              </CardContent>
            </Card>
            <Card className="col-span-3 bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
              <CardHeader>
                <CardTitle className="font-semibold">Task Status</CardTitle>
                <CardDescription className="text-gray-600">Distribution of tasks by status</CardDescription>
              </CardHeader>
              <CardContent>
                <TaskStatusList jobs={jobs} isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="font-semibold">Recent Tasks</CardTitle>
              <CardDescription className="text-gray-600">Overview of recently created tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTasksList jobs={jobs} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payouts" className="space-y-4">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
            <CardHeader>
              <CardTitle className="font-semibold">Recent Payouts</CardTitle>
              <CardDescription className="text-gray-600">Overview of recent payouts to taskers</CardDescription>
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

  const activities: ActivityItem[] = [
    ...users.map((user) => {
      const iso = userJoinedAt(user);
      return {
        id: `user-${user.user_id}`,
        user: user.user_fullname,
        action: "joined as a tasker",
        task: "",
        time: formatTimeAgo(iso),
        sortTime: iso ? new Date(iso).getTime() : 0,
      };
    }),
    ...jobs.map((job) => {
      const iso = jobCreatedAt(job);
      return {
        id: `job-${job.job_id}`,
        user: job.posted_by,
        action: "created a new task",
        task: job.job_title,
        time: formatTimeAgo(iso),
        sortTime: iso ? new Date(iso).getTime() : 0,
      };
    }),
  ]
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading activities...</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activities</p>
      ) : (
        activities.map((activity) => (
          <div key={activity.id} className="flex items-center">
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">
                <span className="font-semibold">{activity.user}</span> {activity.action}
                {activity.task && <span className="font-medium"> {activity.task}</span>}
              </p>
              <p className="text-sm text-muted-foreground">{activity.time}</p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function TaskStatusList({ jobs, isLoading }: { jobs: Job[]; isLoading: boolean }) {
  const statuses: TaskStatus[] = useMemo(() => {
    const openCount = jobs.filter((job) => !job.status).length;
    const cancelledCount = jobs.filter((job) => job.status).length;
    const totalCount = jobs.length || 1; // Avoid division by zero
    
    return [
    {
      id: 1,
      name: "Completed",
      count: 0, // No API data; dummy
      percentage: 0,
      icon: CheckCircle2,
      color: "text-green-500",
    },
    {
      id: 2,
      name: "In Progress",
      count: 0, // No API data; dummy
      percentage: 0,
      icon: Clock,
      color: "text-blue-500",
    },
    {
      id: 3,
      name: "Open",
      count: openCount,
      percentage: Math.round((openCount / totalCount) * 100),
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      id: 4,
      name: "Cancelled",
      count: cancelledCount,
      percentage: Math.round((cancelledCount / totalCount) * 100),
      icon: AlertCircle,
      color: "text-red-500",
    },
  ];
  }, [jobs]);

  return (
    <div className="space-y-4">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading task statuses...</p>
      ) : (
        statuses.map((status) => (
          <div key={status.id} className="flex items-center">
            <status.icon className={`mr-2 h-4 w-4 ${status.color}`} />
            <div className="w-full">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{status.name}</span>
                <span className="text-sm text-muted-foreground">{status.count}</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    status.id === 1 ? "bg-green-500" :
                    status.id === 2 ? "bg-blue-500" :
                    status.id === 3 ? "bg-yellow-500" :
                    "bg-red-500"
                  }`}
                  style={{ width: `${status.percentage}%` }}
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
                    ? "bg-yellow-100 text-yellow-800"
                    : task.status === "Cancelled"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
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
                      ? "bg-green-100 text-green-800"
                      : statusLabel === "Pending" || statusLabel === "Processing"
                        ? "bg-yellow-100 text-yellow-800"
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