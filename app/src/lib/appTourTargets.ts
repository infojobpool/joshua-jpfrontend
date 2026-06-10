/** Pick the first visible `[data-tour]` element for spotlight positioning. */

export function isTourTargetVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(el);
  if (style.display === "none" || style.visibility === "hidden") return false;
  if (Number(style.opacity) === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width >= 4 && rect.height >= 4;
}

export function findVisibleTourTarget(targets: string[] | undefined): {
  el: Element;
  id: string;
} | null {
  if (!targets?.length) return null;
  for (const id of targets) {
    const nodes = document.querySelectorAll(`[data-tour="${id}"]`);
    for (const el of nodes) {
      if (isTourTargetVisible(el)) return { el, id };
    }
  }
  return null;
}

export const APP_TOUR_RESUME_KEY = "jp_resume_app_tour";
