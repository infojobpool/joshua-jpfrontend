import axiosInstance from "@/lib/axiosInstance";

export type AdminWritingTestRow = {
  id: string;
  student_name: string;
  student_id?: string | null;
  student_email?: string | null;
  topic: string;
  content: string;
  word_count: number;
  char_count: number;
  duration_seconds: number;
  started_at: string;
  submitted_at: string;
  submitted_reason: string;
  resume_filename?: string | null;
  resume_url?: string | null;
};

function normalizeRow(raw: unknown): AdminWritingTestRow | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = String(r.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    student_name: String(r.student_name ?? r.name ?? "—"),
    student_id: (r.student_id as string) ?? null,
    student_email: (r.student_email as string) ?? null,
    topic: String(r.topic ?? ""),
    content: String(r.content ?? ""),
    word_count: Number(r.word_count ?? 0),
    char_count: Number(r.char_count ?? 0),
    duration_seconds: Number(r.duration_seconds ?? 0),
    submitted_at: String(r.submitted_at ?? ""),
    started_at: String(r.started_at ?? ""),
    submitted_reason: String(r.submitted_reason ?? "manual"),
    resume_filename: (r.resume_filename as string) ?? null,
    resume_url: (r.resume_url as string) ?? null,
  };
}

function extractList(payload: unknown): AdminWritingTestRow[] {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const data = root.data ?? root;
  const candidates = [
    root.submissions,
    (data as Record<string, unknown>)?.submissions,
    (data as Record<string, unknown>)?.items,
    Array.isArray(data) ? data : null,
  ];
  for (const c of candidates) {
    if (!Array.isArray(c)) continue;
    const out: AdminWritingTestRow[] = [];
    for (const item of c) {
      const row = normalizeRow(item);
      if (row) out.push(row);
    }
    if (out.length) return out;
  }
  return [];
}

/** Primary: JobPool API GET /admin/writing-test/submissions/ */
export async function fetchAdminWritingTestsFromApi(): Promise<AdminWritingTestRow[]> {
  const res = await axiosInstance.get("admin/writing-test/submissions/");
  return extractList(res.data);
}

/** Fallback: user site Next route (same WRITING_TEST_ADMIN_KEY as app env). */
export async function fetchAdminWritingTestsFromUserSite(): Promise<AdminWritingTestRow[]> {
  const site = process.env.NEXT_PUBLIC_USER_SITE_URL?.replace(/\/+$/, "") || "https://www.jobpool.in";
  const key = process.env.WRITING_TEST_ADMIN_KEY?.trim();
  if (!key) {
    throw new Error("Set WRITING_TEST_ADMIN_KEY on admin Vercel to read submissions from the user site API.");
  }
  const res = await fetch(`${site}/api/writing-test?key=${encodeURIComponent(key)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(err.message || `User site API HTTP ${res.status}`);
  }
  const json = (await res.json()) as { submissions?: unknown[] };
  return extractList(json);
}

export async function fetchAdminWritingTests(): Promise<AdminWritingTestRow[]> {
  try {
    const rows = await fetchAdminWritingTestsFromApi();
    if (rows.length) return rows;
  } catch {
    /* try fallback */
  }
  return fetchAdminWritingTestsFromUserSite();
}
