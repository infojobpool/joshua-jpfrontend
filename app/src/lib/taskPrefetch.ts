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
  const taskIdFormat = taskId.startsWith("task_") ? taskId : `task_${taskId}`;

  // Fetch task and bids in parallel; try task_X first for both (backend job_id format)
  const jobTryIds = [taskIdFormat, taskId].filter((x, i, arr) => arr.indexOf(x) === i);
  const jobPromise = (async () => {
    for (const tryId of jobTryIds) {
      const r = await fetch(`https://api.jobpool.in/api/v1/get-job/${tryId}/`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        credentials: "omit",
      });
      if (r.ok) return r.json();
    }
    throw new Error("fetch failed");
  })();

  const apiBases = [
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.jobpool.in/api/v1",
    "https://jobpoolbackend.onrender.com/api/v1",
  ].filter((x, i, arr) => arr.indexOf(x) === i);
  const bidsPromise = (async () => {
    let lastData: any = null;
    for (const base of apiBases) {
      for (const tryId of [taskIdFormat, taskId, taskId.replace(/^task_/, "")]) {
        try {
          const r = await fetch(`${base.replace(/\/?$/, "")}/get-bids/${tryId}/`, {
            method: "GET",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            credentials: "omit",
          });
          const ct = r.headers.get("content-type") || "";
          if (!ct.includes("json")) continue;
          const data = await r.json();
          if (data?.status_code === 200) return data;
          if (data?.status_code === 404 && data?.message) lastData = { ...data, data: data?.data ?? [] };
        } catch {}
      }
    }
    return lastData;
  })();

  Promise.all([jobPromise, bidsPromise])
    .then(([jobData, bidsData]) => {
      if (jobData?.status_code === 200 && jobData?.data) {
        const mapped = mapJobToTask(jobData.data);
        const bidsRaw =
          bidsData?.data?.bids ??
          (Array.isArray(bidsData?.data) ? bidsData.data : null) ??
          bidsData?.bids ??
          [];
        const bids = Array.isArray(bidsRaw) ? bidsRaw : [];
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ task: mapped, bids, timestamp: Date.now() })
        );
      }
    })
    .catch(() => {})
    .finally(() => PREFETCH_IN_FLIGHT.delete(taskId));
}
