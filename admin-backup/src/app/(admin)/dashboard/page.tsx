"use client";

import { useState, useEffect } from "react";
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
}

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  task?: string;
  time: string;
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

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersResponse, jobsResponse] = await Promise.all([
        axiosInstance.get("all-user-details/"),
        axiosInstance.get("get-all-jobs/"),
      ]);

      if (usersResponse.data) {
        setUsers(usersResponse.data);
      } else {
        toast.error("Failed to fetch users");
      }

      if (jobsResponse.data.status_code === 200) {
        setJobs(jobsResponse.data.data.jobs);
      } else {
        toast.error(jobsResponse.data.message || "Failed to fetch jobs");
      }
    } catch {
      toast.error("An error occurred while fetching data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate statistics
  const totalRevenue = jobs.reduce((sum, job) => sum + job.job_budget, 0);
  const activeTasks = jobs.filter((job) => !job.status).length; // status: false = Open/Active
  const totalUsers = users.length;
  const pendingPayouts = 6354.12; // Dummy data
  const pendingPayoutsCount = 24; // Dummy data

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{activeTasks}</div>
                <p className="text-xs text-muted-foreground">+{Math.min(activeTasks, 201)} since last week</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-2xl font-bold">Loading...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">+10.1% from last month</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{pendingPayouts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{pendingPayoutsCount} payouts pending</p>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ActivityList users={users} jobs={jobs} isLoading={isLoading} />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Task Status</CardTitle>
                <CardDescription>Distribution of tasks by status</CardDescription>
              </CardHeader>
              <CardContent>
                <TaskStatusList jobs={jobs} isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>Overview of recently created tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTasksList jobs={jobs} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payouts</CardTitle>
              <CardDescription>Overview of recent payouts to taskers</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentPayoutsList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ActivityList({ users, jobs, isLoading }: { users: User[]; jobs: Job[]; isLoading: boolean }) {
  const activities: ActivityItem[] = [
    ...users.map((user, index) => ({
      id: `user-${user.user_id}`,
      user: user.user_fullname,
      action: "joined as a tasker",
      task: "",
      time: `${index + 1} day${index ? "s" : ""} ago`, // Fallback timestamp
    })),
    ...jobs.map((job, index) => ({
      id: `job-${job.job_id}`,
      user: job.posted_by,
      action: "created a new task",
      task: job.job_title,
      time: `${index + 1} hour${index ? "s" : ""} ago`, // Fallback timestamp
    })),
  ].sort((a, b) => parseInt(b.time) - parseInt(a.time)).slice(0, 5);

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
  const openCount = jobs.filter((job) => !job.status).length;
  const totalCount = jobs.length || 1; // Avoid division by zero
  const statuses: TaskStatus[] = [
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
      count: jobs.filter((job) => job.status).length,
      percentage: Math.round((jobs.filter((job) => job.status).length / totalCount) * 100),
      icon: AlertCircle,
      color: "text-red-500",
    },
  ];

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
                  className={`h-full rounded-full bg-${status.color.replace("text-", "")}`}
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
  const tasks: RecentTask[] = jobs.map((job) => ({
    id: job.job_id,
    title: job.job_title,
    category: job.job_category_name,
    taskmaster: job.posted_by,
    tasker: "Unassigned", // No tasker data in API
    status: job.status ? "Cancelled" : "Open",
    amount: `₹${job.job_budget.toLocaleString()}`,
  })).slice(0, 5); // Limit to 5 tasks

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

function RecentPayoutsList() {
  const payouts = [
    {
      id: 1,
      tasker: "Emily Johnson",
      amount: "₹450.00",
      date: "2023-04-15",
      status: "Completed",
      method: "Bank Transfer",
    },
    {
      id: 2,
      tasker: "Michael Brown",
      amount: "₹150.00",
      date: "2023-04-14",
      status: "Completed",
      method: "PayPal",
    },
    {
      id: 3,
      tasker: "Jessica Davis",
      amount: "₹300.00",
      date: "2023-04-14",
      status: "Pending",
      method: "Bank Transfer",
    },
    {
      id: 4,
      tasker: "Thomas Anderson",
      amount: "₹600.00",
      date: "2023-04-13",
      status: "Completed",
      method: "PayPal",
    },
    {
      id: 5,
      tasker: "Sarah Williams",
      amount: "₹275.00",
      date: "2023-04-12",
      status: "Failed",
      method: "Bank Transfer",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 font-medium text-sm">
        <div>Tasker</div>
        <div>Amount</div>
        <div>Date</div>
        <div>Method</div>
        <div>Status</div>
      </div>
      {payouts.map((payout) => (
        <div key={payout.id} className="grid grid-cols-5 text-sm py-2 border-t">
          <div>{payout.tasker}</div>
          <div>{payout.amount}</div>
          <div>{payout.date}</div>
          <div>{payout.method}</div>
          <div>
            <span
              className={`px-2 py-1 rounded-full text-xs ${
                payout.status === "Completed"
                  ? "bg-green-100 text-green-800"
                  : payout.status === "Pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}
            >
              {payout.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}