/**
 * Prefetch task data when user hovers/touches a task link.
 * Stores in same cache format as TaskPageClient so the page loads instantly.
 */

import { Task } from "../app/types";

const CACHE_KEY = (id: string) => `task_${id}`;
const PREFETCH_IN_FLIGHT = new Set<string>();

function mapJobToTask(job: any): Task {
  const assignedId =
    job.assigned_tasker_id ||
    job.assigned_user_id ||
    job.assigned_to ||
    job.accepted_bidder_id ||
    job.worker_id ||
    null;

  let jobStatus = "open";
  const isCancelled =
    job.cancel_status === true ||
    job.cancel_status === "true" ||
    job.cancel_status === 1 ||
    job.status === "cancelled" ||
    job.status === "Cancelled" ||
    job.status === "canceled" ||
    job.status === "Canceled" ||
    job.cancelled === true ||
    job.cancelled === "true";

  if (isCancelled) jobStatus = "canceled";
  else if (job.job_completion_status === 1) jobStatus = "completed";
  else if (job.deletion_status) jobStatus = "deleted";
  else if (
    job.status === "in_progress" ||
    job.status === "working" ||
    job.status === "assigned" ||
    job.status === "accepted" ||
    job.status === "paid" ||
    job.status === "active" ||
    job.status === true
  )
    jobStatus = "in_progress";
  else if (
    job.bid_accepted === true ||
    job.offer_accepted === true ||
    job.payment_status === "paid" ||
    job.payment_status === "completed" ||
    !!assignedId
  )
    jobStatus = "in_progress";

  const rawPosted =
    job.tstamp ||
    job.timestamp ||
    job.created_at ||
    job.job_tstamp ||
    job.job_due_date;
  const formattedPosted =
    rawPosted && !isNaN(new Date(rawPosted).getTime())
      ? new Date(rawPosted).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        })
      : "N/A";

  return {
    id: job.job_id,
    title: job.job_title,
    description: job.job_description,
    budget: job.job_budget,
    location: job.job_location,
    status: jobStatus,
    job_completion_status: job.job_completion_status ?? 0,
    tasker_completed: Boolean(job.tasker_completed),
    taskmaster_completed: Boolean(job.taskmaster_completed),
    postedAt: formattedPosted,
    dueDate: job.job_due_date
      ? new Date(job.job_due_date).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          timeZone: "UTC",
        })
      : "N/A",
    category: job.job_category_name ?? "",
    images: job.job_images?.urls?.length
      ? job.job_images.urls.map((url: string, i: number) => ({
          id: `img${i + 1}`,
          url:
            typeof url === "string" && url.includes("placeholder.com")
              ? "/images/placeholder.svg"
              : url,
          alt: `Job image ${i + 1}`,
        }))
      : [{ id: "img1", url: "/images/placeholder.svg", alt: "Default job image" }],
    poster: {
      id: job.user_ref_id,
      name: job.posted_by,
      avatar: "/images/placeholder.svg",
      rating: job.rating ?? null,
      taskCount: job.task_count ?? 0,
      joinedDate: job.joined_date ?? null,
    },
    offers: [],
    assignedTasker: assignedId ? ({ id: String(assignedId) } as any) : undefined,
  };
}

export function prefetchTask(taskId: string): void {
  if (typeof window === "undefined") return;
  if (PREFETCH_IN_FLIGHT.has(taskId)) return;

  const cacheKey = CACHE_KEY(taskId);
  const existing = localStorage.getItem(cacheKey);
  if (existing) {
    try {
      const { timestamp } = JSON.parse(existing);
      if (Date.now() - timestamp < 60000) return; // Fresh in last 1 min, skip
    } catch {}
  }

  PREFETCH_IN_FLIGHT.add(taskId);
  const token = localStorage.getItem("token");

  fetch(`https://api.jobpool.in/api/v1/get-job/${taskId}/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "omit",
  })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error("fetch failed"))))
    .then((data) => {
      if (data?.status_code === 200 && data?.data) {
        const mapped = mapJobToTask(data.data);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ task: mapped, timestamp: Date.now() })
        );
      }
    })
    .catch(() => {})
    .finally(() => PREFETCH_IN_FLIGHT.delete(taskId));
}
