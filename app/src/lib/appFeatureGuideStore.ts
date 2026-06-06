import { create } from "zustand";

type AppFeatureGuideStore = {
  open: boolean;
  openGuide: () => void;
  closeGuide: () => void;
};

export const useAppFeatureGuideStore = create<AppFeatureGuideStore>((set) => ({
  open: false,
  openGuide: () => set({ open: true }),
  closeGuide: () => set({ open: false }),
}));
