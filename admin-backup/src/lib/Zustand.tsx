"use client";

import { create } from "zustand";
import jwt from "jsonwebtoken";

// 🔹 Interfaces
interface ThemeColors {
  topBarColor: string;
  sidebarColor: string;
  sidebarBackground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
}

interface JwtPayload {
  userId: string;
  role: string;
  exp: number;
}

interface UserData {
  status: boolean;
  user_fullname: string;
  user_email: string;
}

interface NormalizedUser {
  name: string;
  status: boolean;
  email: string
  
}

interface AuthState {
  userId: string | null;
  role: string | null;
  exp: number | null;
  isAuthenticated: boolean;
  user: NormalizedUser | null;
  login: (token: string, user: UserData) => void;
  logout: () => void;
  checkAuth: () => void;
}

type FormData = Record<string, string | number | boolean | null>;

interface FormState {
  formData: FormData | null;
  setFormData: (data: FormData) => void;
  resetFormData: () => void;
}

interface NotificationState {
  notifications: number;
  incrementNotifications: () => void;
  resetNotifications: () => void;
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
    ValidationState {
  themeColors: ThemeColors;
  updateThemeColor: (colorType: keyof ThemeColors, colorValue: string) => void;
  resetTheme: () => void;
}

// 🔹 Store
const useStore = create<StoreState>((set) => ({
  // 🔸 Auth
  userId: null,
  role: null,
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
      if (decoded && decoded.userId !== undefined && decoded.role !== undefined) {
        const normalizedUser = {
          name: user.user_fullname,
          status: user.status,
          email: user.user_email,
        };

        set({
          userId: decoded.userId,
          role: decoded.role,
          exp: decoded.exp,
          isAuthenticated: true,
          user: normalizedUser,
        });

        if (typeof window !== "undefined") {
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(user));
        }
      } else {
        console.error("Invalid token payload", decoded);
      }
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  },

  logout: () => {
    set({
      userId: null,
      role: null,
      exp: null,
      isAuthenticated: false,
      user: null,
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
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
          set({
            userId: decoded.userId,
            role: decoded.role,
            exp: decoded.exp,
            isAuthenticated: true,
            user: {
              name: parsedUser.user_fullname,
              status: parsedUser.status,
              email: parsedUser.user_email,
            },
          });
        } else {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Token or user data decode failed:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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
  incrementNotifications: () =>
    set((state) => ({ notifications: state.notifications + 1 })),
  resetNotifications: () => set(() => ({ notifications: 0 })),

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
