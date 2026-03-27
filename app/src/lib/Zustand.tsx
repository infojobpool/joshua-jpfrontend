"use client";

import { create } from "zustand";
import jwt from "jsonwebtoken";
import { playNotificationSound } from "./notificationSound";
import { notifyTokenUpdated, stopTokenRefreshCycle } from "./tokenRefresh";

// 🔹 Types
interface UserData {
  id: string;
  name: string;
  email: string;
  accountType: string;
  isLoggedIn: boolean;
  verification_status: number;
  profile_image?: string;
}

interface JwtPayload {
  userId: string;
  exp: number;
}

interface AuthState {
   userId: string | null;
  exp: number | null;
  isAuthenticated: boolean;
  user: UserData | null;
  login: (token: string, user: UserData) => void;
  logout: () => void;
  updateUserProfileImage: (url: string) => void;
  checkAuth: () => void;
  clearAllStorage: () => void;
}

interface FormData {
  [key: string]: any;
}

interface FormState {
  formData: FormData | null;
  setFormData: (data: FormData) => void;
  resetFormData: () => void;
}

interface NotificationItem {
  id: string;
  type: "message" | "bid" | "system";
  title: string;
  description?: string;
  createdAt: string; // ISO date string
  read: boolean;
  link?: string;
  direction?: "received" | "sent"; // for bid differentiation
  // Optional bid metadata to enable filtering/deduplication
  taskId?: string;
  bidId?: string;
  status?: string; // e.g., active | withdrawn | deleted | canceled
  deleted?: boolean;
}

interface NotificationState {
  notifications: number; // backward compatibility for existing badge usage
  unreadCount: number;
  items: NotificationItem[];
  notificationOpen: boolean;
  setNotifications: (items: NotificationItem[]) => void;
  addNotifications: (items: NotificationItem[]) => void;
  markAllRead: () => void;
  clearOldKeepLatest: (keepCount?: number) => void;
  incrementNotifications: () => void;
  resetNotifications: () => void;
  setNotificationOpen: (open: boolean) => void;
}

interface ThemeColors {
  topBarColor: string;
  sidebarColor: string;
  sidebarBackground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
}

interface ThemeState {
  themeColors: ThemeColors;
  updateThemeColor: (colorType: keyof ThemeColors, colorValue: string) => void;
  resetTheme: () => void;
}

interface ValidationState {
  validateName: (name: string) => { isValid: boolean; error?: string };
  validateEmail: (email: string) => { isValid: boolean; error?: string };
  validatePassword: (password: string) => { isValid: boolean; error?: string };
}

interface StoreState
  extends AuthState,
    FormState,
    NotificationState,
    ThemeState,
    ValidationState {}

// 🔹 Store
const useStore = create<StoreState>((set) => ({
  // 🔸 Auth
  userId: null,
  exp: null,
  isAuthenticated: false,
  user: null,

  login: (token: string, user: UserData) => {
    if (!token || !user) {
      console.error("No token or user data received");
      return;
    }

    try {
      const decoded = jwt.decode(token) as JwtPayload | null;
      if (decoded && decoded.userId !== undefined) {
        set({
          userId: decoded.userId,
          exp: decoded.exp,
          isAuthenticated: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            accountType: user.accountType,
            isLoggedIn: user.isLoggedIn,
            verification_status: user.verification_status,
            profile_image: user.profile_image || (user as any).profile_img,
          },
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
          notifyTokenUpdated();
        }
      } else {
        console.error("Invalid token payload", decoded);
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  },

  updateUserProfileImage: (url: string) => {
    set((state) => {
      const updatedUser = state.user ? { ...state.user, profile_image: url } : null;
      if (typeof window !== "undefined" && updatedUser) {
        const stored = localStorage.getItem("user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.profile_image = url;
            localStorage.setItem("user", JSON.stringify(parsed));
          } catch {}
        }
      }
      return { user: updatedUser };
    });
  },

  logout: () => {
    if (typeof window !== "undefined") {
      stopTokenRefreshCycle();
    }
    set({
      userId: null,
      exp: null,
      isAuthenticated: false,
      user: null,
    });
    if (typeof window !== "undefined") {
      // Clear all localStorage items
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("userId");
      localStorage.removeItem("bids");
      localStorage.removeItem("userChats");
      localStorage.removeItem("postedTasks");
      localStorage.removeItem("availableTasks");
      localStorage.removeItem("availableTasksTimestamp");
      localStorage.removeItem("poster_reviews");
      
      // Clear all cached task data
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith("all_jobs_data_") || key.startsWith("task_") || key.startsWith("cache_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      // Also clear sessionStorage
      sessionStorage.clear();
    }
  },

  // Clear all localStorage data (useful for debugging or forcing fresh data)
  clearAllStorage: () => {
    if (typeof window !== "undefined") {
      stopTokenRefreshCycle();
      localStorage.clear();
      sessionStorage.clear();
      set({
        userId: null,
        exp: null,
        isAuthenticated: false,
        user: null,
      });
    }
  },

  checkAuth: () => {
    if (typeof window === "undefined") return;
    
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    
    if (token && user) {
      try {
        const decoded = jwt.decode(token) as JwtPayload | null;
        const parsedUser = JSON.parse(user) as UserData;
        
        if (decoded && decoded.userId !== undefined && parsedUser) {
          // Get current state to avoid unnecessary updates
          const currentState = useStore.getState();
          
          // Only update if the state is different
          if (
            currentState.userId !== decoded.userId ||
            currentState.isAuthenticated !== true ||
            currentState.user?.id !== parsedUser.id
          ) {
            set({
              userId: decoded.userId,
              exp: decoded.exp,
              isAuthenticated: true,
              user: {
                id: parsedUser.id,
                name: parsedUser.name,
                email: parsedUser.email,
                accountType: parsedUser.accountType,
                isLoggedIn: parsedUser.isLoggedIn,
                verification_status: parsedUser.verification_status,
                profile_image: parsedUser.profile_image || (parsedUser as any).profile_img,
              },
            });
          }
          notifyTokenUpdated();
        } else {
          // Only clear if not already cleared
          const currentState = useStore.getState();
          if (currentState.isAuthenticated) {
            set({
              userId: null,
              exp: null,
              isAuthenticated: false,
              user: null,
            });
          }
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Token or user data decode failed:", error);
        // Only clear if not already cleared
        const currentState = useStore.getState();
        if (currentState.isAuthenticated) {
          set({
            userId: null,
            exp: null,
            isAuthenticated: false,
            user: null,
          });
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } else {
      // Only clear if not already cleared
      const currentState = useStore.getState();
      if (currentState.isAuthenticated) {
        set({
          userId: null,
          exp: null,
          isAuthenticated: false,
          user: null,
        });
      }
    }
  },

  // 🔸 Theme
  themeColors: {
    topBarColor: "",
    sidebarColor: "",
    sidebarBackground: "",
    primary: "240 5.9% 10%",
    primaryForeground: "0 0% 98%",
    secondary: "240 4.8% 95.9%",
    secondaryForeground: "240 5.9% 10%",
  },

  updateThemeColor: (colorType, colorValue) =>
    set((state) => ({
      themeColors: {
        ...state.themeColors,
        [colorType]: colorValue,
      },
    })),

  resetTheme: () =>
    set(() => ({
      themeColors: {
        topBarColor: "",
        sidebarColor: "",
        sidebarBackground: "",
        primary: "240 5.9% 10%",
        primaryForeground: "0 0% 98%",
        secondary: "240 4.8% 95.9%",
        secondaryForeground: "240 5.9% 10%",
      },
    })),

  // 🔸 Form
  formData: null,
  setFormData: (data: FormData) =>
    set((state) => ({
      formData: state.formData ? { ...state.formData, ...data } : { ...data },
    })),
  resetFormData: () => set(() => ({ formData: null })),

  // 🔸 Notifications
  notifications: 0,
  unreadCount: 0,
  items: [],
  notificationOpen: false,
  setNotifications: (items: NotificationItem[]) =>
    set(() => {
      const filtered = items.filter((n) => {
        if (n.type === "message" || n.type === "system") return true;
        const isBid = n.type === "bid";
        const isReceived = n.direction === "received";
        const notDeleted = !n.deleted && n.status !== "deleted" && n.status !== "withdrawn" && n.status !== "canceled";
        return isBid && isReceived && notDeleted;
      });
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const pruned = filtered.filter((n) => now - Date.parse(n.createdAt) < maxAge);
      const compact = pruned
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 20);
      const unread = compact.filter((n) => !n.read).length;
      return {
        items: compact,
        unreadCount: unread,
        notifications: unread,
      };
    }),
  addNotifications: (items: NotificationItem[]) =>
    set((state) => {
      const prevIds = new Set(state.items.map((n) => n.id));
      const hasNew = items.some((n) => !prevIds.has(n.id));
      const byId: Record<string, NotificationItem> = {};
      [...items, ...state.items].forEach((n) => {
        byId[n.id] = n;
      });
      // Same filter: bid (received, not deleted), message, system
      const merged = Object.values(byId).filter((n) => {
        if (n.type === "message" || n.type === "system") return true;
        const isBid = n.type === "bid";
        const isReceived = n.direction === "received";
        const notDeleted = !n.deleted && n.status !== "deleted" && n.status !== "withdrawn" && n.status !== "canceled";
        return isBid && isReceived && notDeleted;
      });
      // Auto-erase: drop notifications older than 7 days (keeps list lightweight, no perf impact)
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      const pruned = merged.filter((n) => now - Date.parse(n.createdAt) < maxAge);
      const compact = pruned
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 20);
      const unread = compact.filter((n) => !n.read).length;
      if (hasNew && unread > state.unreadCount && typeof window !== "undefined") {
        try {
          playNotificationSound();
          window.dispatchEvent(new CustomEvent("notification-arrived"));
        } catch {}
      }
      return {
        items: compact,
        unreadCount: unread,
        notifications: unread,
      };
    }),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  clearOldKeepLatest: (keepCount = 10) =>
    set((state) => {
      const sorted = [...state.items].sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      );
      const kept = sorted.slice(0, keepCount);
      const unread = kept.filter((n) => !n.read).length;
      return { items: kept, unreadCount: unread, notifications: unread };
    }),
  incrementNotifications: () =>
    set((state) => ({ notifications: state.notifications + 1, unreadCount: state.unreadCount + 1 })),
  resetNotifications: () => set(() => ({ notifications: 0, unreadCount: 0 })),
  setNotificationOpen: (open: boolean) => set(() => ({ notificationOpen: open })),

  // 🔸 Validation
  validateName: (name: string) => {
    if (!name) return { isValid: false, error: "Name is required" };
    if (name.length < 2)
      return { isValid: false, error: "Name must be at least 2 characters" };
    if (!/^[a-zA-Z\s-]+$/.test(name))
      return {
        isValid: false,
        error: "Name can only contain letters, spaces, or hyphens",
      };
    return { isValid: true };
  },

  validateEmail: (email: string) => {
    if (!email) return { isValid: false, error: "Email is required" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return { isValid: false, error: "Invalid email format" };
    return { isValid: true };
  },

  validatePassword: (password: string) => {
    if (!password) return { isValid: false, error: "Password is required" };
    if (password.length < 8)
      return {
        isValid: false,
        error: "Password must be at least 8 characters",
      };
    if (!/[A-Z]/.test(password))
      return {
        isValid: false,
        error: "Password must contain at least one uppercase letter",
      };
    if (!/[0-9]/.test(password))
      return {
        isValid: false,
        error: "Password must contain at least one number",
      };
    return { isValid: true };
  },
}));

// 🔹 Immediately check auth status on load
if (typeof window !== "undefined") {
  useStore.getState().checkAuth();
}

export default useStore;

