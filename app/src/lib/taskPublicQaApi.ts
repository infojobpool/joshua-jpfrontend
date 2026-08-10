import axiosInstance from "@/lib/axiosInstance";
import { jobIdVariants } from "@/lib/jobIdVariants";
import { fetchUserSummary } from "@/lib/userSummary";

export type TaskPublicQAItem = {
  id: string;
  questionBody: string;
  answerBody: string | null;
  askerId: string;
  askerName: string;
  createdAt: string;
  answeredAt: string | null;
  questionEditedAt: string | null;
  answerEditedAt: string | null;
};

export type TaskPublicQAListMeta = {
  items: TaskPublicQAItem[];
  total: number;
  qaOpenForNewPosts: boolean;
};

const GENERIC_ASKER_LABELS = new Set(["member", "user", "anonymous", "unknown", ""]);

function isGenericAskerName(name: string | null | undefined): boolean {
  return GENERIC_ASKER_LABELS.has(String(name ?? "").trim().toLowerCase());
}

function pickNestedName(obj: unknown): string {
  if (!obj || typeof obj !== "object") return "";
  const o = obj as Record<string, unknown>;
  return String(o.name ?? o.user_name ?? o.full_name ?? o.display_name ?? "").trim();
}

function pickAskerId(raw: Record<string, unknown>): string {
  const nested = [raw.asker, raw.user, raw.question_author, raw.author];
  for (const n of nested) {
    if (n && typeof n === "object") {
      const o = n as Record<string, unknown>;
      const id = String(o.user_id ?? o.id ?? o.profile_id ?? "").trim();
      if (id) return id;
    }
  }
  return String(
    raw.asker_id ??
      raw.question_author_id ??
      raw.author_id ??
      raw.user_id ??
      "",
  ).trim();
}

function pickAskerName(raw: Record<string, unknown>): string {
  for (const n of [raw.asker, raw.user, raw.question_author, raw.author]) {
    const name = pickNestedName(n);
    if (name && !isGenericAskerName(name)) return name;
  }
  const flat = String(
    raw.asker_name ??
      raw.question_author_name ??
      raw.author_name ??
      raw.user_name ??
      raw.name ??
      raw.full_name ??
      raw.display_name ??
      "",
  ).trim();
  if (flat && !isGenericAskerName(flat)) return flat;
  return "";
}

async function enrichAskerNames(items: TaskPublicQAItem[]): Promise<TaskPublicQAItem[]> {
  const ids = [
    ...new Set(
      items
        .filter((q) => q.askerId && isGenericAskerName(q.askerName))
        .map((q) => q.askerId),
    ),
  ];
  if (!ids.length) return items;

  const nameById = new Map<string, string>();
  await Promise.all(
    ids.map(async (id) => {
      const summary = await fetchUserSummary(id);
      if (summary?.name && !isGenericAskerName(summary.name)) {
        nameById.set(id, summary.name);
        return;
      }
      try {
        const res = await axiosInstance.get(`/profile?user_id=${encodeURIComponent(id)}`);
        const payload = (res.data?.data ?? res.data) as Record<string, unknown>;
        const name = String(payload?.name ?? "").trim();
        if (name && !isGenericAskerName(name)) {
          nameById.set(id, name);
        }
      } catch {
        /* keep fallback label */
      }
    }),
  );

  if (!nameById.size) return items;

  return items.map((q) => {
    const resolved = nameById.get(q.askerId);
    if (!resolved || !isGenericAskerName(q.askerName)) return q;
    return { ...q, askerName: resolved };
  });
}

function normalizeQaItem(raw: Record<string, unknown>): TaskPublicQAItem {
  const askerId = pickAskerId(raw);
  const askerName = pickAskerName(raw) || "Member";
  return {
    id: String(raw.qa_id ?? raw.id ?? ""),
    questionBody: String(
      raw.question_body ?? raw.question ?? raw.body ?? "",
    ),
    answerBody:
      raw.answer_body != null && String(raw.answer_body).trim() !== ""
        ? String(raw.answer_body)
        : null,
    askerId,
    askerName,
    createdAt: String(raw.created_at ?? raw.asked_at ?? raw.createdAt ?? ""),
    answeredAt:
      raw.answered_at != null && String(raw.answered_at).trim() !== ""
        ? String(raw.answered_at)
        : null,
    questionEditedAt:
      raw.question_edited_at != null
        ? String(raw.question_edited_at)
        : null,
    answerEditedAt:
      raw.answer_edited_at != null ? String(raw.answer_edited_at) : null,
  };
}

function parseListPayload(data: unknown): TaskPublicQAListMeta {
  const root = data as Record<string, unknown>;
  const d = (root?.data as Record<string, unknown>) ?? root;
  const rawItems = (d?.items as unknown[]) ?? (d?.results as unknown[]) ?? [];
  const items = rawItems
    .map((x) => normalizeQaItem(x as Record<string, unknown>))
    .filter((x) => x.id);
  const total =
    typeof d?.total === "number" ? d.total : items.length;
  const qaOpenForNewPosts =
    d?.qa_open_for_new_posts === false || d?.qa_open_for_new_posts === "false"
      ? false
      : true;
  return { items, total, qaOpenForNewPosts };
}

async function withJobIdVariants<T>(
  jobId: string,
  fn: (jid: string) => Promise<T>,
): Promise<T> {
  const variants = jobIdVariants(jobId);
  let lastErr: unknown;
  for (let i = 0; i < variants.length; i++) {
    const jid = variants[i];
    try {
      return await fn(jid);
    } catch (e: unknown) {
      lastErr = e;
      const st = (e as { response?: { status?: number } })?.response?.status;
      if (st === 404 && i < variants.length - 1) continue;
      throw e;
    }
  }
  throw lastErr;
}

export async function fetchTaskPublicQuestions(
  jobId: string,
  limit = 20,
  offset = 0,
): Promise<TaskPublicQAListMeta> {
  return withJobIdVariants(jobId, async (jid) => {
    const res = await axiosInstance.get(
      `/tasks/${jid}/public-questions/`,
      { params: { limit, offset } },
    );
    const parsed = parseListPayload(res.data);
    parsed.items = await enrichAskerNames(parsed.items);
    return parsed;
  });
}

export async function postTaskPublicQuestion(
  jobId: string,
  body: string,
): Promise<void> {
  await withJobIdVariants(jobId, async (jid) => {
    await axiosInstance.post(`/tasks/${jid}/public-questions/`, { body });
  });
}

export async function patchTaskPublicQuestion(
  jobId: string,
  qaId: string,
  body: string,
): Promise<void> {
  await withJobIdVariants(jobId, async (jid) => {
    await axiosInstance.patch(`/tasks/${jid}/public-questions/${qaId}/`, {
      body,
    });
  });
}

export async function putTaskPublicAnswer(
  jobId: string,
  qaId: string,
  body: string,
): Promise<void> {
  await withJobIdVariants(jobId, async (jid) => {
    await axiosInstance.put(
      `/tasks/${jid}/public-questions/${qaId}/answer/`,
      { body },
    );
  });
}

export async function patchTaskPublicAnswer(
  jobId: string,
  qaId: string,
  body: string,
): Promise<void> {
  await withJobIdVariants(jobId, async (jid) => {
    await axiosInstance.patch(
      `/tasks/${jid}/public-questions/${qaId}/answer/`,
      { body },
    );
  });
}

export async function reportTaskPublicQuestion(
  jobId: string,
  qaId: string,
  reason?: string,
): Promise<void> {
  await withJobIdVariants(jobId, async (jid) => {
    await axiosInstance.post(
      `/tasks/${jid}/public-questions/${qaId}/report/`,
      { reason: reason?.trim() || undefined },
    );
  });
}

export function extractApiErrorMessage(e: unknown): string {
  const err = e as {
    response?: { data?: { message?: string; detail?: string } };
  };
  return (
    err.response?.data?.message ||
    err.response?.data?.detail ||
    "Something went wrong"
  );
}
