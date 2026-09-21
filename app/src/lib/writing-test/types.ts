export type WritingTestSubmission = {
  id: string;
  student_name: string;
  student_id?: string;
  student_email?: string;
  topic: string;
  content: string;
  word_count: number;
  char_count: number;
  duration_seconds: number;
  started_at: string;
  submitted_at: string;
  submitted_reason: "manual" | "timer" | "auto";
};

export type WritingTestSubmitPayload = {
  student_name: string;
  student_id?: string;
  student_email?: string;
  topic: string;
  content: string;
  started_at: string;
  submitted_at: string;
  submitted_reason: "manual" | "timer" | "auto";
};
