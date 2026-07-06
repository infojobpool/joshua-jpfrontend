const JOB_ID_KEYS = ["job_id", "jobId", "id", "task_id", "taskId"] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Pull task/job id from nested post-a-job response bodies. */
export function extractPostJobId(data: unknown): string | null {
  const seen = new Set<unknown>();

  const walk = (node: unknown): string | null => {
    const record = asRecord(node);
    if (!record || seen.has(node)) return null;
    seen.add(node);

    for (const key of JOB_ID_KEYS) {
      const raw = record[key];
      if (raw == null) continue;
      const id = String(raw).trim();
      if (!id) continue;
      if (id.startsWith("task_") || /^\d+$/.test(id)) return id;
    }

    for (const nested of [record.data, record.job, record.result]) {
      const found = walk(nested);
      if (found) return found;
    }
    return null;
  };

  return walk(data);
}

function isVerificationBlocked(data: Record<string, unknown>): boolean {
  const sc = data.status_code;
  return Number(sc) === 403 || sc === "403";
}

/** True when POST /post-a-job/ created a job (handles varied API shapes on mobile). */
export function isPostJobCreated(response: {
  status?: number;
  data?: unknown;
}): boolean {
  const http = response.status ?? 0;
  if (http === 201) return true;

  const root = asRecord(response.data);
  if (!root) return false;
  if (isVerificationBlocked(root)) return false;

  const sc = root.status_code;
  if (Number(sc) === 201 || sc === "201") return true;

  const jobId = extractPostJobId(root);
  if (jobId) return true;

  const message = String(root.message ?? "").toLowerCase();
  const okStatus =
    Number(sc) === 200 ||
    sc === "200" ||
    sc == null ||
    (http >= 200 && http < 300);
  if (
    okStatus &&
    (message.includes("success") ||
      message.includes("posted") ||
      message.includes("created"))
  ) {
    return true;
  }

  return false;
}
