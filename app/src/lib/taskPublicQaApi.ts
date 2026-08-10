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

export type AskerNameHints = Record<string, string>;

const GENERIC_ASKER_LABELS = new Set(["member", "user", "anonymous", "unknown", ""]);

function qaAskerCacheKey(taskId: string): string {
  return `jp_task_qa_askers_${taskId}`;
}

function readQaAskerCache(taskId: string): Record<string, { id: string; name: string }> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(qaAskerCacheKey(taskId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, { id: string; name: string }>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function cacheTaskQaAsker(
  taskId: string,
  qaId: string,
  askerId: string,
  askerName: string,
): void {
  if (typeof window === "undefined" || !taskId || !qaId || !askerId || !askerName) return;
  if (isGenericAskerName(askerName)) return;
  const cache = readQaAskerCache(taskId);
  cache[qaId] = { id: askerId, name: askerName };
  try {
    sessionStorage.setItem(qaAskerCacheKey(taskId), JSON.stringify(cache));
  } catch {
    /* quota / private mode */
  }
}

function isGenericAskerName(name: string | null | undefined): boolean {
  return GENERIC_ASKER_LABELS.has(String(name ?? "").trim().toLowerCase());
}

function pick(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && String(v).trim() !== "") return String(v).trim();
  }
  return "";
}

function pickNestedName(obj: unknown): string {
  if (!obj || typeof obj !== "object") return "";
  const o = obj as Record<string, unknown>;
  return pick(
    o,
    "name",
    "user_name",
    "user_fullname",
    "full_name",
    "display_name",
    "member_name",
    "question_user_name",
    "asker_name",
  );
}

function pickNestedId(obj: unknown): string {
  if (!obj || typeof obj !== "object") return "";
  const o = obj as Record<string, unknown>;
  return pick(
    o,
    "user_id",
    "id",
    "profile_id",
    "user_ref_id",
    "member_id",
    "question_user_id",
    "asker_id",
  );
}

function flattenQaRaw(raw: Record<string, unknown>): Record<string, unknown> {
  const nested = raw.question ?? raw.public_qa ?? raw.qa;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return { ...raw, ...(nested as Record<string, unknown>) };
  }
  return raw;
}

function pickAskerId(raw: Record<string, unknown>): string {
  const nestedKeys = [
    "asker",
    "user",
    "question_author",
    "author",
    "member",
    "question_user",
    "created_by",
    "profile",
  ];
  for (const key of nestedKeys) {
    const id = pickNestedId(raw[key]);
    if (id) return id;
  }

  const flat = pick(
    raw,
    "asker_id",
    "question_user_id",
    "question_author_id",
    "author_id",
    "author_user_id",
    "user_id",
    "member_id",
    "member_user_id",
    "created_by_user_id",
    "created_by",
    "profile_user_id",
    "userId",
    "user_ref_id",
    "question_user_ref_id",
  );
  if (flat) return flat;

  for (const [key, value] of Object.entries(raw)) {
    if (!key.endsWith("_user_id") && key !== "user_id") continue;
    if (key === "poster_user_id" || key === "taskmaster_user_id") continue;
    const id = pick({ v: value }, "v");
    if (id) return id;
  }

  return "";
}

function pickAskerName(raw: Record<string, unknown>): string {
  const nestedKeys = [
    "asker",
    "user",
    "question_author",
    "author",
    "member",
    "question_user",
    "created_by",
    "profile",
  ];
  for (const key of nestedKeys) {
    const name = pickNestedName(raw[key]);
    if (name && !isGenericAskerName(name)) return name;
  }

  const flat = pick(
    raw,
    "asker_name",
    "question_user_name",
    "question_author_name",
    "author_name",
    "user_name",
    "member_name",
    "name",
    "full_name",
    "display_name",
    "posted_by",
  );
  if (flat && !isGenericAskerName(flat)) return flat;

  return "";
}

function normalizeQaItem(raw: Record<string, unknown>): TaskPublicQAItem {
  const flat = flattenQaRaw(raw);
  const askerId = pickAskerId(flat);
  const askerName = pickAskerName(flat) || "Member";
  return {
    id: String(flat.qa_id ?? flat.id ?? ""),
    questionBody: String(
      flat.question_body ?? flat.question ?? flat.body ?? "",
    ),
    answerBody:
      flat.answer_body != null && String(flat.answer_body).trim() !== ""
        ? String(flat.answer_body)
        : null,
    askerId,
    askerName,
    createdAt: String(flat.created_at ?? flat.asked_at ?? flat.createdAt ?? ""),
    answeredAt:
      flat.answered_at != null && String(flat.answered_at).trim() !== ""
        ? String(flat.answered_at)
        : null,
    questionEditedAt:
      flat.question_edited_at != null
        ? String(flat.question_edited_at)
        : null,
    answerEditedAt:
      flat.answer_edited_at != null ? String(flat.answer_edited_at) : null,
  };
}

export function applyAskerNameHints(
  items: TaskPublicQAItem[],
  hints: AskerNameHints | undefined,
  taskId?: string,
): TaskPublicQAItem[] {
  const cache = taskId ? readQaAskerCache(taskId) : {};
  const hintMap = hints ?? {};

  return items.map((q) => {
    const cached = cache[q.id];
    if (cached?.name && !isGenericAskerName(cached.name)) {
      return {
        ...q,
        askerId: q.askerId || cached.id,
        askerName: cached.name,
      };
    }

    if (q.askerId) {
      const hinted = hintMap[q.askerId];
      if (hinted && !isGenericAskerName(hinted) && isGenericAskerName(q.askerName)) {
        return { ...q, askerName: hinted };
      }
    }

    if (isGenericAskerName(q.askerName) && q.askerId) {
      const hinted = hintMap[q.askerId];
      if (hinted && !isGenericAskerName(hinted)) {
        return { ...q, askerName: hinted };
      }
    }

    return q;
  });
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
        const name = String(payload?.name ?? payload?.user_fullname ?? "").trim();
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

function parseListPayload(data: unknown): TaskPublicQAListMeta {
  const root = data as Record<string, unknown>;
  const d = (root?.data as Record<string, unknown>) ?? root;
  const rawItems =
    (d?.items as unknown[]) ??
    (d?.results as unknown[]) ??
    (d?.questions as unknown[]) ??
    [];
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

function parseSingleQaPayload(data: unknown): TaskPublicQAItem | null {
  const root = data as Record<string, unknown>;
  const d = (root?.data as Record<string, unknown>) ?? root;
  const raw =
    (d?.item as Record<string, unknown>) ??
    (d?.question as Record<string, unknown>) ??
    d;
  if (!raw || typeof raw !== "object") return null;
  const item = normalizeQaItem(raw as Record<string, unknown>);
  return item.id ? item : null;
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
  nameHints?: AskerNameHints,
): Promise<TaskPublicQAListMeta> {
  return withJobIdVariants(jobId, async (jid) => {
    const res = await axiosInstance.get(
      `/tasks/${jid}/public-questions/`,
      { params: { limit, offset } },
    );
    const parsed = parseListPayload(res.data);
    parsed.items = applyAskerNameHints(parsed.items, nameHints, jid);
    parsed.items = await enrichAskerNames(parsed.items);
    parsed.items = applyAskerNameHints(parsed.items, nameHints, jid);
    return parsed;
  });
}

export async function postTaskPublicQuestion(
  jobId: string,
  body: string,
): Promise<TaskPublicQAItem | null> {
  return withJobIdVariants(jobId, async (jid) => {
    const res = await axiosInstance.post(`/tasks/${jid}/public-questions/`, { body });
    const item = parseSingleQaPayload(res.data);
    if (item?.id && item.askerId && !isGenericAskerName(item.askerName)) {
      cacheTaskQaAsker(jid, item.id, item.askerId, item.askerName);
    }
    return item;
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
