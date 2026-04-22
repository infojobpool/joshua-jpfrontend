"use client";

import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ChevronDown,
  HelpCircle,
  Home,
  LogOut,
  MessageSquare,
  User,
  Wallet,
} from "lucide-react";
import useStore from "@/lib/Zustand";
import { resolveProfileImageUrl } from "@/lib/profileImage";
import { VerifiedBadge } from "@/components/VerifiedBadge";

/**
 * Mobile home hero: account control + full-bleed band + task title → post-task with ?title= prefilled.
 */
export function MobileHeroSection() {
  const router = useRouter();
  const [taskTitle, setTaskTitle] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileWrapRef = useRef<HTMLDivElement>(null);
  const checkAuth = useStore((s) => s.checkAuth);
  const logout = useStore((s) => s.logout);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const user = useStore((s) => s.user);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!profileOpen) return;
    const onDown = (e: MouseEvent) => {
      const el = profileWrapRef.current;
      if (el && !el.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [profileOpen]);

  const handleSignOut = useCallback(() => {
    logout();
    setProfileOpen(false);
  }, [logout]);

  const firstName =
    user?.name?.trim().split(/\s+/)[0] || (isAuthenticated ? "there" : "");

  const goToPostTask = () => {
    const t = taskTitle.trim();
    if (t) {
      router.push(`/post-task?title=${encodeURIComponent(t)}`);
    } else {
      router.push("/post-task");
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    goToPostTask();
  };

  const profileImg = user
    ? resolveProfileImageUrl(user.profile_image || (user as { profile_img?: string }).profile_img || "") ||
      user.profile_image ||
      (user as { profile_img?: string }).profile_img ||
      ""
    : "";
  const displayName = user?.name || "User";

  return (
    <section className="md:hidden w-full bg-white -mt-px">
      <div className="relative w-full overflow-hidden rounded-none bg-gradient-to-b from-blue-500 via-blue-700 to-[#0c1e4a] text-white shadow-[0_16px_48px_-12px_rgba(30,64,175,0.55)] ring-1 ring-white/10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-30%,rgba(255,255,255,0.22),transparent_50%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,rgba(0,0,0,0.35),transparent_45%)]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-lg px-4 pb-5 pt-2 sm:px-5 sm:pb-6 sm:pt-3">
          {isAuthenticated && user ? (
            <div ref={profileWrapRef} className="mb-2 flex justify-end">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-xl border border-white/35 bg-white/15 px-2 py-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.2)] backdrop-blur-md transition hover:bg-white/25 active:scale-[0.98]"
                  aria-label="Account menu"
                  aria-expanded={profileOpen}
                >
                  <div className="relative shrink-0">
                    {profileImg ? (
                      <img
                        src={profileImg}
                        alt={displayName}
                        className="h-8 w-8 rounded-full border-2 border-white/80 object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white/80 bg-white/20 text-sm font-semibold text-white">
                        {displayName.charAt(0) || "U"}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0c1e4a] bg-emerald-400" />
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-white/90 transition-transform ${profileOpen ? "rotate-180" : ""}`}
                    aria-hidden
                  />
                </button>
                {profileOpen ? (
                  <div className="absolute right-0 z-[60] mt-2 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-2xl ring-1 ring-black/5">
                    <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white px-4 py-3">
                      <div className="flex items-center gap-3">
                        {profileImg ? (
                          <img
                            src={profileImg}
                            alt={displayName}
                            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white shadow"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-lg font-semibold text-white shadow">
                            {displayName.charAt(0) || "U"}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                            {user.verification_status != null && Number(user.verification_status) >= 3 ? (
                              <VerifiedBadge size="sm" />
                            ) : null}
                          </div>
                          {user.email ? (
                            <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-slate-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <Home className="h-4 w-4" />
                        </span>
                        Home
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-slate-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <Briefcase className="h-4 w-4" />
                        </span>
                        Tasks
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-slate-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                          <User className="h-4 w-4" />
                        </span>
                        My profile
                      </Link>
                      <Link
                        href="/messages"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-slate-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                          <MessageSquare className="h-4 w-4" />
                        </span>
                        Messages
                      </Link>
                      <Link
                        href="/wallet"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-slate-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Wallet className="h-4 w-4" />
                        </span>
                        Wallet
                      </Link>
                      <Link
                        href="/supportpage"
                        className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium hover:bg-slate-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <HelpCircle className="h-4 w-4" />
                        </span>
                        Support
                      </Link>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                          <LogOut className="h-4 w-4" />
                        </span>
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {isAuthenticated && firstName ? (
            <div
              className="mb-3 border-l-[3px] border-white/40 pl-3.5 text-left sm:mb-4 sm:pl-4"
              style={{ fontFamily: "var(--font-archivo), var(--font-geist-sans), system-ui, sans-serif" }}
            >
              <p className="text-[0.625rem] font-semibold uppercase tracking-[0.22em] text-white/70">Welcome back</p>
              <p
                className="mt-1 text-[1.25rem] font-bold leading-snug tracking-[-0.02em] text-white [text-shadow:0_1px_20px_rgba(0,0,0,0.35)] sm:text-[1.5rem]"
              >
                {firstName}
              </p>
            </div>
          ) : null}

          <div className="text-center">
            <h1
              className="font-hero-display px-0.5 text-center text-[2.15rem] uppercase text-white sm:text-[2.75rem]"
              style={{
                textShadow:
                  "0 1px 0 rgba(0,0,0,0.45), 0 4px 24px rgba(0,0,0,0.38), 0 0 56px rgba(147,197,253,0.2)",
              }}
            >
              Get Everything Done
            </h1>
          </div>

          <form
            onSubmit={onFormSubmit}
            className="mt-4 space-y-2.5 sm:mt-5 sm:space-y-3"
            aria-label="Start posting a task"
          >
            <input
              type="text"
              enterKeyHint="go"
              autoComplete="off"
              placeholder="e.g. title of the job you need done"
              className="w-full min-h-[3.125rem] rounded-2xl border-0 bg-white/95 px-4 py-3.5 text-[0.9375rem] text-slate-900 shadow-[0_10px_32px_-12px_rgba(0,0,0,0.45)] outline-none ring-1 ring-white/40 backdrop-blur-sm transition-shadow placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:ring-2 focus:ring-white/80"
              style={{ fontFamily: "var(--font-geist-sans), system-ui, sans-serif" }}
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
            />
            <div className="flex justify-center pt-0.5">
              <button
                type="submit"
                className="relative min-h-[2.875rem] min-w-[11rem] overflow-hidden rounded-full border border-white/55 bg-gradient-to-b from-white/[0.22] to-white/[0.06] px-8 text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_8px_28px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.45)] backdrop-blur-md transition-[transform,box-shadow,border-color,background-color] duration-300 hover:border-white/75 hover:from-white/[0.3] hover:shadow-[0_12px_36px_rgba(0,0,0,0.32)] active:scale-[0.98]"
                style={{ fontFamily: "var(--font-archivo), var(--font-geist-sans), system-ui, sans-serif" }}
              >
                <span className="relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">Post Now</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
