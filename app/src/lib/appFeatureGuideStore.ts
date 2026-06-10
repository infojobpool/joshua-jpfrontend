import { create } from "zustand";
import { APP_TOUR_RESUME_KEY } from "@/lib/appTourTargets";

type AppFeatureGuideStore = {
  open: boolean;
  openGuide: () => void;
  closeGuide: () => void;
};

export const useAppFeatureGuideStore = create<AppFeatureGuideStore>((set) => ({
  open: false,
  openGuide: () => {
    if (typeof window !== "undefined") {
      const onDesktop = window.matchMedia("(min-width: 768px)").matches;
      const path = (window.location.pathname || "/").replace(/\/$/, "") || "/";
      // Desktop tour anchors live on Dashboard (header hidden on most app routes).
      if (onDesktop && path !== "/dashboard") {
        try {
          sessionStorage.setItem(APP_TOUR_RESUME_KEY, "1");
        } catch {
          /* ignore */
        }
        window.location.assign("/dashboard");
        return;
      }
    }
    set({ open: true });
  },
  closeGuide: () => set({ open: false }),
}));
