/** Shared task status rules for admin dashboard + Tasks Management. */

export type AdminTaskStatus =
  | "Open"
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Cancelled"
  | "Taskmaster confirmed"
  | "Tasker confirmed";

export interface AdminJobStatusFields {
  job_completion_status?: number;
  cancel_status?: boolean;
  tasker_completed?: boolean;
  taskmaster_completed?: boolean;
  tasker_id?: string | null;
}

export function getAdminTaskStatus(job: AdminJobStatusFields): AdminTaskStatus {
  if (job.job_completion_status === 1) return "Completed";
  if (job.cancel_status === true) return "Cancelled";
  const taskerDone = Boolean(job.tasker_completed);
  const taskmasterDone = Boolean(job.taskmaster_completed);
  if (taskmasterDone && !taskerDone) return "Taskmaster confirmed";
  if (taskerDone && !taskmasterDone) return "Tasker confirmed";
  if (job.tasker_id) return "Assigned";
  return "Open";
}

export function isInProgressAdminStatus(status: AdminTaskStatus): boolean {
  return ["In Progress", "Taskmaster confirmed", "Tasker confirmed"].includes(status);
}

export function countAdminTaskStatuses(jobs: AdminJobStatusFields[]) {
  const statuses = jobs.map(getAdminTaskStatus);
  return {
    open: statuses.filter((s) => s === "Open").length,
    assigned: statuses.filter((s) => s === "Assigned").length,
    inProgress: statuses.filter((s) => isInProgressAdminStatus(s)).length,
    completed: statuses.filter((s) => s === "Completed").length,
    cancelled: statuses.filter((s) => s === "Cancelled").length,
  };
}
