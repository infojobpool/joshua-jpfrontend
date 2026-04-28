export function toViewTransitionKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export function canUseViewTransitions(): boolean {
  if (typeof document === "undefined") return false;
  return typeof (document as Document & { startViewTransition?: unknown }).startViewTransition === "function";
}
