export const WRITING_TEST_DURATION_MINUTES = 10;
export const WRITING_TEST_DURATION_SEC = WRITING_TEST_DURATION_MINUTES * 60;

/** Default pool of 10 prompts — one is chosen at random when the student starts. */
export const DEFAULT_WRITING_TEST_TOPICS: readonly string[] = [
  "Describe a problem in your community and one idea to improve it.",
  "Write about a person who influenced you and what you learned from them.",
  "Explain how technology helps or hurts students today — give examples.",
  "Describe a time you worked with others to finish something difficult.",
  "What does “success” mean to you at this stage of your life?",
  "Write about a place that makes you feel calm or happy, and why.",
  "If you could change one school rule, what would it be and why?",
  "Describe a skill you want to learn in the next year and how you will practice it.",
  "Write about an book, film, or story that changed how you think.",
  "What are the benefits and risks of social media for young people?",
];

/**
 * Override pool via Vercel env (user app):
 * NEXT_PUBLIC_WRITING_TEST_TOPICS — separate prompts with `||` e.g. "Topic A||Topic B||..."
 */
export function getWritingTestTopicPool(): string[] {
  const raw =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_WRITING_TEST_TOPICS?.trim()) || "";
  if (raw) {
    const parts = raw
      .split(/\|\|/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length) return parts;
  }
  return [...DEFAULT_WRITING_TEST_TOPICS];
}

export function pickRandomWritingTestTopic(pool: string[] = getWritingTestTopicPool()): string {
  if (!pool.length) return "Write freely about something important to you.";
  const index = Math.floor(Math.random() * pool.length);
  return pool[index] ?? pool[0];
}
