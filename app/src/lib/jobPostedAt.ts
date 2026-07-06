/** Posted-on timestamp fields — never use job_due_date (that is the task deadline, not post date). */

export function getJobPostedTimestampRaw(job: Record<string, unknown>): unknown {
  const inner =
    job.job != null && typeof job.job === "object"
      ? (job.job as Record<string, unknown>)
      : job;

  return (
    inner.created_at ??
    inner.job_created_at ??
    inner.created_date ??
    inner.date_created ??
    inner.timestamp ??
    inner.tstamp ??
    inner.job_tstamp ??
    inner.posted_at ??
    inner.postedAt ??
    inner.date ??
    inner.updated_at ??
    job.created_at ??
    job.job_created_at ??
    job.created_date ??
    job.date_created ??
    job.timestamp ??
    job.tstamp ??
    job.job_tstamp ??
    job.posted_at ??
    job.postedAt ??
    job.date ??
    job.updated_at
  );
}

function parsePostedDate(raw: unknown): Date | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).trim();
  if (!s) return null;

  const dmY = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
  if (dmY) {
    const [, d, m, y] = dmY;
    const parsed = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  let normalized = s;
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s) && !s.includes("T")) {
    normalized = s.replace(" ", "T");
    if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalized)) normalized += "Z";
  }

  const yMd = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(normalized);
  if (yMd && !normalized.includes("T")) {
    const [, y, m, d] = yMd;
    const parsed = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const num = Number(raw);
  if (!Number.isNaN(num) && num > 0) {
    const parsed = num > 1e12 ? new Date(num) : new Date(num * 1000);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Display + sort values for "Posted …" labels (local calendar date). */
export function formatJobPostedTimestamp(raw: unknown): {
  formatted: string;
  sortValue: number;
  iso: string;
} {
  const date = parsePostedDate(raw);
  if (!date) {
    return { formatted: "—", sortValue: 0, iso: "" };
  }
  return {
    formatted: date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    sortValue: date.getTime(),
    iso: date.toISOString(),
  };
}
