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
    tourTargets: ["tour-nav-home"],
    placement: "above",
    desktopTip: "Tap the JobPool logo or Home in the menu to return here.",
  },
  {
    id: "tasks",
    title: "Tasks (Dashboard)",
    body:
      "Your task hub: browse available jobs, see tasks you posted, track bids, and manage work in progress.",
    tourTargets: ["tour-nav-tasks"],
    placement: "above",
    desktopTip: "Open Dashboard from the header or go to /dashboard.",
  },
  {
    id: "post",
    title: "Post a task",
    body:
      "Need something done? Tap the blue + button to post a task with title, budget, location, and photos.",
    tourTargets: ["tour-nav-post"],
    placement: "above",
    desktopTip: "Use Post a Task on the dashboard or the + button in the bottom bar.",
  },
  {
    id: "chat",
    title: "Chat",
    body:
      "All conversations with posters and taskers live here — coordinate details, timing, and delivery.",
    tourTargets: ["tour-nav-chat"],
    placement: "above",
    desktopTip: "Messages in the header or Chat in the bottom bar.",
  },
  {
    id: "listings",
    title: "Listings",
    body:
      "Offer services like tutoring, repairs, or design. Add photos, pricing, and categories so customers can find you.",
    tourTargets: ["tour-nav-listings"],
    placement: "above",
    desktopTip: "Listings tab opens My listings on your profile — or Create listing on desktop dashboard.",
  },
  {
    id: "profile",
    title: "Profile & wallet",
    body:
      "Edit your details, verify PAN & Aadhaar, check Wallet & ₹100 bonus, and manage listings from your profile.",
    tourTargets: ["tour-dashboard-profile", "tour-nav-listings"],
    placement: "above",
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
