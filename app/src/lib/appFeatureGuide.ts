/** First-time / replayable walkthrough for core JobPool app areas. */

export const APP_GUIDE_STORAGE_KEY = "jp_app_feature_guide_v1_done";

export type GuideNavKey = "home" | "tasks" | "post" | "chat" | "listings";

export type AppGuideStep = {
  id: string;
  title: string;
  body: string;
  /** Which bottom-tab to highlight in the preview (mobile). */
  highlightNav?: GuideNavKey;
  /** Extra line for desktop layout (header / dashboard actions). */
  desktopTip?: string;
};

export const APP_GUIDE_STEPS: AppGuideStep[] = [
  {
    id: "welcome",
    title: "Welcome to JobPool",
    body:
      "This quick tour shows where to find tasks, post jobs, list your skills, chat, and manage your profile & wallet.",
  },
  {
    id: "home",
    title: "Home",
    body:
      "Discover featured tasks and service listings. Great for browsing before you dive into your dashboard.",
    highlightNav: "home",
    desktopTip: "Tap the JobPool logo or Home in the menu to return here.",
  },
  {
    id: "tasks",
    title: "Tasks (Dashboard)",
    body:
      "Your task hub: browse available jobs, see tasks you posted, track bids, and manage work in progress.",
    highlightNav: "tasks",
    desktopTip: "Open Dashboard from the header or go to /dashboard.",
  },
  {
    id: "post",
    title: "Post a task",
    body:
      "Need something done? Tap the blue + button to post a task with title, budget, location, and photos.",
    highlightNav: "post",
    desktopTip: "Use Post a Task on the dashboard or the + button in the bottom bar.",
  },
  {
    id: "chat",
    title: "Chat",
    body:
      "All conversations with posters and taskers live here — coordinate details, timing, and delivery.",
    highlightNav: "chat",
    desktopTip: "Messages in the header or Chat in the bottom bar.",
  },
  {
    id: "listings",
    title: "Listings",
    body:
      "Offer services like tutoring, repairs, or design. Add photos, pricing, and categories so customers can find you.",
    highlightNav: "listings",
    desktopTip: "Listings tab opens My listings on your profile — or Create listing on desktop dashboard.",
  },
  {
    id: "profile",
    title: "Profile & wallet",
    body:
      "Open your profile menu (top right on dashboard) to edit details, verify PAN & Aadhaar, check Wallet & ₹100 bonus, and manage listings.",
    desktopTip: "Profile avatar → My Profile, Wallet, and My listings.",
  },
  {
    id: "done",
    title: "You're all set",
    body:
      "Explore tasks, post when you need help, or publish listings to earn. Replay this tour anytime from your profile menu or Settings.",
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
