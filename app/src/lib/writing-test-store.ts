/**
 * In-memory store for local/dev and single-server demos.
 * On Vercel serverless, use WRITING_TEST_WEBHOOK_URL and/or backend API for durable storage.
 */
import type { WritingTestSubmission } from "./types";

let store: WritingTestSubmission[] = [];

export function addWritingTestSubmission(row: WritingTestSubmission): WritingTestSubmission {
  store.push(row);
  return row;
}

export function listWritingTestSubmissions(): WritingTestSubmission[] {
  return [...store].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
  );
}

export function getWritingTestSubmission(id: string): WritingTestSubmission | undefined {
  return store.find((s) => s.id === id);
}
