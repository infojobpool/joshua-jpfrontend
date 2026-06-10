/** First-time / replayable walkthrough for core JobPool app areas. */

export const APP_GUIDE_STORAGE_KEY = "jp_app_feature_guide_v1_done";

export type TourPlacement = "above" | "below" | "center";

export type AppGuideStep = {
  id: string;
  title: string;
  body: string;
  /** `data-tour` on a real UI element; first match wins. */
  tourTargets?: string[];
  placement?: TourPlacement;
  /** Extra line for desktop layout (header / dashboard actions). */
  desktopTip?: string;
};

export const APP_GUIDE_STEPS: AppGuideStep[] = [
  {
    id: "welcome",
    title: "Welcome to JobPool",
    body:
      "We'll point to each part of the app so you know where to post tasks, browse jobs, chat, and manage listings.",
    placement: "center",
  },
  {
    id: "home",
    title: "Home",
    body:
      "Discover featured tasks and service listings. Great for browsing before you dive into your dashboard.",
    tourTargets: ["tour-desktop-home", "tour-header-home", "tour-nav-home"],
    placement: "below",
    desktopTip: "JobPool logo or Home in the dashboard header.",
  },
  {
    id: "tasks",
    title: "Tasks (Dashboard)",
    body:
      "Your task hub: browse available jobs, see tasks you posted, track bids, and manage work in progress.",
    tourTargets: ["tour-desktop-tasks", "tour-header-tasks", "tour-nav-tasks"],
    placement: "below",
    desktopTip: "Available tab on Dashboard — browse open tasks to bid on.",
  },
  {
    id: "post",
    title: "Post a task",
    body:
      "Need something done? Tap the blue + button to post a task with title, budget, location, and photos.",
    tourTargets: ["tour-desktop-post-task", "tour-header-post-task", "tour-nav-post"],
    placement: "below",
    desktopTip: "Post a Task button on the dashboard.",
  },
  {
    id: "chat",
    title: "Chat",
    body:
      "All conversations with posters and taskers live here — coordinate details, timing, and delivery.",
    tourTargets: ["tour-desktop-messages", "tour-header-messages", "tour-nav-chat"],
    placement: "below",
    desktopTip: "Messages in the dashboard header.",
  },
  {
    id: "listings",
    title: "Listings",
    body:
      "Offer services like tutoring, repairs, or design. Add photos, pricing, and categories so customers can find you.",
    tourTargets: ["tour-desktop-create-listing", "tour-nav-listings"],
    placement: "below",
    desktopTip: "Create listing on the dashboard header.",
  },
  {
    id: "profile",
    title: "Profile & wallet",
    body:
      "Edit your details, verify PAN & Aadhaar, check Wallet & ₹100 bonus, and manage listings from your profile.",
    tourTargets: ["tour-dashboard-profile"],
    placement: "below",
    desktopTip: "Profile avatar → My Profile, Wallet, and My listings.",
  },
  {
    id: "done",
    title: "You're all set",
    body:
      "Explore tasks, post when you need help, or publish listings to earn. Replay this tour anytime from your profile menu or Settings.",
    placement: "center",
  },
];

export function hasCompletedAppGuide(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(APP_GUIDE_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export function markAppGuideCompleted(): void {
  try {
    localStorage.setItem(APP_GUIDE_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function resetAppGuideCompleted(): void {
  try {
    localStorage.removeItem(APP_GUIDE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
