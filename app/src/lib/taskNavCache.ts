/**
 * Store task data before navigation for instant display on task detail page.
 * Reduces perceived loading time when clicking "Make offer" or "View offer".
 */
const NAV_TASK_KEY = "nav_task";
const TTL_MS = 60_000; // 1 minute

export interface NavTaskInput {
  id: string;
  title: string;
  description: string;
  budget: number;
  location?: string;
  status?: string;
  posted_by?: string;
  posted_by_id?: string | number;
  posted_by_profile_image?: string;
  category?: string;
  dueDate?: string;
  postedAt?: string;
  images?: { id?: string; url: string; alt?: string }[];
}

export function storeTaskForNav(task: NavTaskInput) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        budget: typeof task.budget === "number" ? task.budget : Number(task.budget) || 0,
        location: task.location || "",
        status: task.status || "open",
        job_completion_status: 0,
        postedAt: task.postedAt || "N/A",
        dueDate: task.dueDate || "N/A",
        category: task.category || "",
        images: (task.images && task.images.length) ? task.images.map((img, i) => ({
          id: img.id || `img${i + 1}`,
          url: typeof img === "object" && img.url ? img.url : "/images/placeholder.svg",
          alt: (img as any).alt || `Image ${i + 1}`,
        })) : [{ id: "img1", url: "/images/placeholder.svg", alt: "Image" }],
        poster: {
          id: String(task.posted_by_id ?? ""),
          name: task.posted_by || "Unknown",
          avatar: (task as any).posted_by_profile_image || "/images/placeholder.svg",
          rating: null,
          taskCount: null,
          joinedDate: null,
        },
        offers: [],
        assignedTasker: undefined,
      },
      timestamp: Date.now(),
    };
    sessionStorage.setItem(NAV_TASK_KEY, JSON.stringify(payload));
  } catch (_) {}
}

export function getNavTask(taskId: string): { task: any } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(NAV_TASK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.task || String(parsed.task.id) !== String(taskId)) return null;
    const age = Date.now() - (parsed.timestamp || 0);
    if (age > TTL_MS) {
      sessionStorage.removeItem(NAV_TASK_KEY);
      return null;
    }
    sessionStorage.removeItem(NAV_TASK_KEY);
    return { task: parsed.task };
  } catch (_) {
    return null;
  }
}
