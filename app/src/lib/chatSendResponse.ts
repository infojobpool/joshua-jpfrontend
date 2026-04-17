/** Backend sometimes returns numeric or string status codes. */
export function sameChatUserId(a: string | undefined | null, b: string | undefined | null): boolean {
  if (a == null || b == null) return false
  return String(a).trim() === String(b).trim()
}

type LooseSendPayload = Record<string, unknown>

export function isSendMessageSuccess(res: { status?: number; data?: unknown }): boolean {
  const st = res.status ?? 0
  if (st >= 400) return false
  const raw = res.data
  if (raw == null) return st === 200 || st === 201
  if (typeof raw !== "object") return st === 200 || st === 201
  const data = raw as LooseSendPayload
  if (data.reason != null && String(data.reason).trim() !== "") return false
  const sc = data.status_code
  if (Number(sc) === 200 || sc === "200" || sc === 200) return true
  if (data.success === true) return true
  const inner = data.data
  if (inner != null && typeof inner === "object" && (st === 200 || st === 201)) {
    const d = inner as LooseSendPayload
    if (d.message_id != null || d.messageId != null || d.id != null) return true
  }
  if (data.message_id != null || data.messageId != null) return true
  return (st === 200 || st === 201) && data.error == null && data.ok !== false
}

export function extractSentMessageId(data: unknown): string {
  if (data == null || typeof data !== "object") return `local-${Date.now()}`
  const root = data as LooseSendPayload
  const inner = (root.data as LooseSendPayload | undefined) ?? root
  const id =
    inner.message_id ??
    inner.messageId ??
    inner.id ??
    (typeof inner.message === "object" && inner.message != null
      ? (inner.message as LooseSendPayload).id
      : undefined)
  return id != null && String(id).trim() !== "" ? String(id) : `local-${Date.now()}`
}
